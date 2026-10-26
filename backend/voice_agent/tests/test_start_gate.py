import asyncio

import httpx
import pytest
from fastapi import FastAPI, Request

from voice_backend.guards import SessionGuard, SlidingWindowRateLimiter, StartGateMiddleware
from voice_backend.guards.start_gate import MAX_START_BODY_BYTES, client_ip
from voice_backend.session_config import SessionConfigStore


def make_app(
    guard: SessionGuard,
    limiter: SlidingWindowRateLimiter,
    configs: SessionConfigStore | None = None,
) -> FastAPI:
    """Stand-in for the runner: same /start response shape, bind-address wsUrl included."""
    app = FastAPI()
    app.state.received = []

    @app.post("/start")
    async def start(request: Request) -> dict[str, str]:
        # The runner parses the body itself: it must still be readable after the middleware.
        app.state.received.append(await request.body())
        return {"wsUrl": "ws://0.0.0.0:8080/ws-client", "sessionId": "s1", "token": "t1"}

    @app.get("/status")
    async def status() -> dict[str, str]:
        return {"status": "ready"}

    app.add_middleware(
        StartGateMiddleware,
        guard=guard,
        limiter=limiter,
        configs=configs,
        trusted_proxy_hops=1,
    )
    return app


@pytest.fixture
def guard() -> SessionGuard:
    return SessionGuard(max_duration_secs=120, grace_secs=10)


def client(app: FastAPI, base_url: str = "http://localhost:7860") -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=base_url)


async def test_returns_the_token_and_keeps_a_local_ws_url(guard: SessionGuard) -> None:
    app = make_app(guard, SlidingWindowRateLimiter(5, 86_400))
    async with client(app) as http:
        response = await http.post("/start")

    assert response.status_code == 200
    assert response.json() == {
        "wsUrl": "ws://localhost:7860/ws-client",
        "sessionId": "s1",
        "token": "t1",
    }


async def test_rewrites_ws_url_with_the_public_https_host(guard: SessionGuard) -> None:
    app = make_app(guard, SlidingWindowRateLimiter(5, 86_400))
    async with client(app, base_url="http://voice-agent-abc.a.run.app") as http:
        response = await http.post("/start", headers={"X-Forwarded-Proto": "https"})

    assert response.json()["wsUrl"] == "wss://voice-agent-abc.a.run.app/ws-client"
    assert response.headers["content-length"] == str(len(response.content))


async def test_limits_sessions_per_ip(guard: SessionGuard) -> None:
    app = make_app(guard, SlidingWindowRateLimiter(5, 86_400))
    async with client(app) as http:
        codes = [
            (await http.post("/start", headers={"X-Forwarded-For": "9.9.9.9"})).status_code
            for _ in range(6)
        ]
        other_ip = await http.post("/start", headers={"X-Forwarded-For": "8.8.8.8"})

    assert codes == [200] * 5 + [429]
    assert other_ip.status_code == 200


async def test_answers_busy_while_a_session_runs(guard: SessionGuard) -> None:
    limiter = SlidingWindowRateLimiter(1, 86_400)
    app = make_app(guard, limiter)
    release = asyncio.Event()
    session = asyncio.create_task(guard.run(release.wait))
    await asyncio.sleep(0)

    async with client(app) as http:
        busy = await http.post("/start")
        status = await http.get("/status")
    release.set()
    await session

    assert busy.status_code == 503
    assert busy.json()["error"] == "busy"
    assert status.status_code == 200
    # A busy answer must not consume the visitor's quota.
    assert limiter.try_acquire("127.0.0.1")


def test_client_ip_uses_the_entry_added_by_the_trusted_proxy() -> None:
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"6.6.6.6, 203.0.113.7")],
        "client": ("10.0.0.1", 1234),
    }

    assert client_ip(scope, trusted_proxy_hops=1) == "203.0.113.7"
    assert client_ip(scope, trusted_proxy_hops=0) == "10.0.0.1"


async def test_stores_the_session_config_under_the_returned_token(guard: SessionGuard) -> None:
    configs = SessionConfigStore()
    app = make_app(guard, SlidingWindowRateLimiter(5, 86_400), configs)
    payload = {"transport": "websocket", "body": {"version": 1, "personality": "A pirate."}}
    async with client(app) as http:
        response = await http.post("/start", json=payload)

    assert response.status_code == 200
    assert app.state.received == [response.request.content]
    config = configs.pop("t1")
    assert config is not None
    assert config.personality == "A pirate."


async def test_start_without_body_still_works(guard: SessionGuard) -> None:
    configs = SessionConfigStore()
    app = make_app(guard, SlidingWindowRateLimiter(5, 86_400), configs)
    async with client(app) as http:
        response = await http.post("/start", json={"transport": "websocket"})

    assert response.status_code == 200
    assert configs.pop("t1") is not None


@pytest.mark.parametrize(
    ("content", "code"),
    [
        (b'{"transport": "websocket", "body": {"version": 2}}', "unsupported_version"),
        (b'{"body": {"version": 1, "architecture": "cascade"}}', "unsupported_architecture"),
        (b"{not json", "invalid_config"),
        (b'{"body": "' + b"x" * MAX_START_BODY_BYTES + b'"}', "invalid_config"),
    ],
    ids=["version", "cascade", "not-json", "too-large"],
)
async def test_refused_config_answers_400_without_using_the_quota(
    guard: SessionGuard, content: bytes, code: str
) -> None:
    limiter = SlidingWindowRateLimiter(1, 86_400)
    app = make_app(guard, limiter, SessionConfigStore())
    async with client(app) as http:
        response = await http.post(
            "/start", content=content, headers={"Content-Type": "application/json"}
        )

    assert response.status_code == 400
    assert response.json()["error"] == code
    assert app.state.received == []
    assert limiter.try_acquire("127.0.0.1")
