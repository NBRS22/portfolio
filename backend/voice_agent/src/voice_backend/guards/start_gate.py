"""ASGI middleware guarding the runner's ``POST /start`` endpoint.

``/start`` is the only way to obtain the one-time token required by ``/ws-client``
(``--ws-auth token``), so gating it gates every session. The middleware:

1. answers ``503`` while a session is running (one session per instance);
2. answers ``400`` when the session config in ``body`` is refused (see ``session_config``);
3. answers ``429`` once an IP has used its quota (sliding window);
4. rewrites the ``wsUrl`` the runner returns. The runner builds it from its bind address
   (``ws://0.0.0.0:8080/...``), which is unreachable behind Cloud Run, so it is rebuilt
   from the public ``Host`` and ``X-Forwarded-Proto`` headers;
5. stores the validated session config under the returned token, since the runner does
   not forward ``body`` to WebSocket sessions.

It is added before the runner installs its CORS middleware, so CORS wraps it and the error
responses still carry CORS headers.
"""

import json
from urllib.parse import urlsplit

from loguru import logger
from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from voice_backend.guards.rate_limit import SlidingWindowRateLimiter
from voice_backend.guards.session import SessionGuard
from voice_backend.session_config import (
    InvalidSessionConfigError,
    SessionConfig,
    SessionConfigStore,
    parse_session_config,
)

# Largest accepted /start body. The real one is a few kB (personality capped at 800 chars).
MAX_START_BODY_BYTES = 64 * 1024


def client_ip(scope: Scope, trusted_proxy_hops: int) -> str:
    """Return the client IP, read from ``X-Forwarded-For`` when behind trusted proxies.

    Each trusted proxy appends the address it received the request from, so the client is the
    ``trusted_proxy_hops``-th entry from the right. Entries further left are client-supplied
    and can be forged.
    """
    if trusted_proxy_hops > 0:
        forwarded = Headers(scope=scope).get("x-forwarded-for")
        if forwarded:
            hops = [hop.strip() for hop in forwarded.split(",") if hop.strip()]
            if hops:
                return hops[-min(trusted_proxy_hops, len(hops))]
    client = scope.get("client")
    return client[0] if client else "unknown"


def public_ws_url(scope: Scope, runner_ws_url: str) -> str:
    """Rebuild ``runner_ws_url`` with the scheme and host the client actually used."""
    headers = Headers(scope=scope)
    proto = headers.get("x-forwarded-proto", scope.get("scheme", "http")).split(",")[0].strip()
    host = headers.get("host")
    if not host:
        return runner_ws_url
    ws_scheme = "wss" if proto in ("https", "wss") else "ws"
    path = urlsplit(runner_ws_url).path or "/ws-client"
    return f"{ws_scheme}://{host}{path}"


class StartGateMiddleware:
    """Enforce the session slot and the per-IP quota on ``POST /start``."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        guard: SessionGuard,
        limiter: SlidingWindowRateLimiter,
        configs: SessionConfigStore | None = None,
        trusted_proxy_hops: int = 1,
        path: str = "/start",
    ) -> None:
        self.app = app
        self._guard = guard
        self._limiter = limiter
        self._configs = configs
        self._trusted_proxy_hops = trusted_proxy_hops
        self._path = path

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] != self._path:
            await self.app(scope, receive, send)
            return

        # Checked before the quota so a refused attempt does not cost the visitor a session.
        if self._guard.busy:
            response = JSONResponse(
                {"error": "busy", "detail": "Another conversation is in progress."},
                status_code=503,
                headers={"Retry-After": str(int(self._guard.max_duration_secs))},
            )
            await response(scope, receive, send)
            return

        # Validated before the quota too: a refused config does not cost a session.
        try:
            body = await _read_body(receive)
            config = parse_session_config(_parse_json(body))
        except InvalidSessionConfigError as e:
            logger.info("Refused /start: {} ({})", e.code, e.detail)
            response = JSONResponse({"error": e.code, "detail": e.detail}, status_code=400)
            await response(scope, receive, send)
            return

        ip = client_ip(scope, self._trusted_proxy_hops)
        if not self._limiter.try_acquire(ip):
            logger.info("Rate limit reached for {}", ip)
            response = JSONResponse(
                {"error": "rate_limited", "detail": "Session limit reached, try again later."},
                status_code=429,
                headers={"Retry-After": str(int(self._limiter.retry_after(ip)) + 1)},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, _replay(body, receive), self._rewrite_response(scope, send, config))

    def _rewrite_response(self, scope: Scope, send: Send, config: SessionConfig) -> Send:
        """Wrap ``send`` to patch ``wsUrl`` and remember ``config`` for the returned token."""
        start_message: Message | None = None
        body = bytearray()

        async def wrapped_send(message: Message) -> None:
            nonlocal start_message
            if message["type"] == "http.response.start":
                if message["status"] != 200:
                    await send(message)
                    return
                start_message = message
                return
            if message["type"] != "http.response.body" or start_message is None:
                await send(message)
                return

            body.extend(message.get("body", b""))
            if message.get("more_body", False):
                return

            payload = bytes(body)
            try:
                data = json.loads(payload)
            except ValueError:
                data = None
            if isinstance(data, dict) and isinstance(data.get("wsUrl"), str):
                data["wsUrl"] = public_ws_url(scope, data["wsUrl"])
                payload = json.dumps(data).encode()
            if self._configs is not None and isinstance(data, dict):
                if isinstance(token := data.get("token"), str):
                    self._configs.put(token, config)

            headers = MutableHeaders(raw=list(start_message["headers"]))
            headers["content-length"] = str(len(payload))
            await send({**start_message, "headers": headers.raw})
            await send({"type": "http.response.body", "body": payload, "more_body": False})

        return wrapped_send


async def _read_body(receive: Receive) -> bytes:
    """Read the whole request body, refusing bodies over ``MAX_START_BODY_BYTES``."""
    body = bytearray()
    while True:
        message = await receive()
        if message["type"] != "http.request":
            break
        body.extend(message.get("body", b""))
        if len(body) > MAX_START_BODY_BYTES:
            raise InvalidSessionConfigError("invalid_config", "The request body is too large.")
        if not message.get("more_body", False):
            break
    return bytes(body)


def _parse_json(body: bytes) -> object:
    """Decode the request JSON; an empty body counts as no body."""
    if not body.strip():
        return None
    try:
        return json.loads(body)
    except ValueError as e:
        raise InvalidSessionConfigError("invalid_config", "The request is not valid JSON.") from e


def _replay(body: bytes, receive: Receive) -> Receive:
    """A ``receive`` that hands the already-read body to the app, then defers to the client."""
    sent = False

    async def replay() -> Message:
        nonlocal sent
        if not sent:
            sent = True
            return {"type": "http.request", "body": body, "more_body": False}
        return await receive()

    return replay
