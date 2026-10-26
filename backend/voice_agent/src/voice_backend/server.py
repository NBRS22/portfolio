"""Voice server: the Pipecat development runner, extended with the backend's guards.

The runner provides the FastAPI app, ``POST /start``, the one-time WebSocket tokens, the
Origin checks and the ``/ws-client`` endpoint. This module adds, before handing over to the
runner's ``main()``:

- ``StartGateMiddleware`` on ``POST /start`` (one session at a time, session config
  validation, per-IP quota);
- ``GET /health``;
- a ``bot()`` entry point that runs the configured agent, with the visitor's session config,
  inside the ``SessionGuard``;
- production-friendly defaults for the runner's CLI (WebSocket only, token auth, PORT).
"""

import argparse
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger
from pipecat.runner.types import RunnerArguments
from starlette.websockets import WebSocket, WebSocketState

from voice_backend.agents import VoiceAgent, resolve_agent
from voice_backend.config import Settings, get_settings
from voice_backend.guards import (
    SessionBusyError,
    SessionGuard,
    SlidingWindowRateLimiter,
    StartGateMiddleware,
)
from voice_backend.routes import create_health_router
from voice_backend.session_config import SessionConfigStore

# WebSocket close code 1013 means "try again later".
WS_CLOSE_TRY_AGAIN_LATER = 1013
# Lifetime of the runner's one-time WebSocket tokens, hence of a stored session config.
WS_TOKEN_TTL_SECS = 300


def ws_token(websocket: WebSocket | None) -> str | None:
    """The one-time token a client connected with, read where the runner accepts it.

    The runner has already verified it: ``Authorization: Bearer``, ``?token=`` or
    ``/ws-client/{token}``.
    """
    if websocket is None:
        return None
    authorization = websocket.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return websocket.query_params.get("token") or websocket.path_params.get("token")


class RunnerArgumentParser(argparse.ArgumentParser):
    """Argument parser that overrides the defaults of the arguments the runner declares.

    The runner's ``main()`` adds its own arguments with explicit defaults, and argparse
    ignores ``set_defaults()`` for those, so defaults are replaced as arguments are added.
    """

    def __init__(self, *, default_overrides: dict[str, object], **kwargs: object) -> None:
        # Set first: ArgumentParser.__init__ already calls add_argument() for --help.
        self._default_overrides = default_overrides
        super().__init__(**kwargs)  # type: ignore[arg-type]

    def add_argument(self, *args: object, **kwargs: object) -> argparse.Action:  # type: ignore[override]
        action = super().add_argument(*args, **kwargs)  # type: ignore[arg-type]
        if action.dest in self._default_overrides:
            action.default = self._default_overrides[action.dest]
        return action


class VoiceServer:
    """Wires one agent, the session guard and the rate limiter into the Pipecat runner."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.agent_cls: type[VoiceAgent] = resolve_agent(settings.agent)
        self.guard = SessionGuard(settings.max_session_seconds, settings.session_grace_seconds)
        self.limiter = SlidingWindowRateLimiter(
            settings.rate_limit_max_sessions, settings.rate_limit_window_seconds
        )
        self.configs = SessionConfigStore(ttl_secs=WS_TOKEN_TTL_SECS)

    @classmethod
    def from_env(cls) -> "VoiceServer":
        return cls(get_settings())

    async def bot(self, runner_args: RunnerArguments) -> None:
        """Runner entry point, called for every accepted ``/ws-client`` connection."""
        websocket = getattr(runner_args, "websocket", None)
        # None (unknown token, or WS_AUTH=none) falls back to the default session config.
        config = self.configs.pop(ws_token(websocket))
        agent = self.agent_cls(config)
        try:
            await self.guard.run(lambda: agent.run(runner_args, self.settings.max_session_seconds))
        except SessionBusyError:
            # Two clients can both get a token before either connects; only one gets the slot.
            logger.info("Rejected a connection: a session is already running")
            if websocket is not None:
                await websocket.close(code=WS_CLOSE_TRY_AGAIN_LATER, reason="busy")
            return
        except Exception:
            logger.exception("[{}] Session failed", self.agent_cls.name)
        # The transport closes the socket on a normal end; close it only if it was left open,
        # e.g. after the guard force-cancelled the agent.
        if (
            websocket is not None
            and websocket.application_state == WebSocketState.CONNECTED
            and websocket.client_state == WebSocketState.CONNECTED
        ):
            await websocket.close()

    def configure(self, app: FastAPI) -> None:
        """Add the backend's routes, middleware and startup hook to the runner's app."""
        app.include_router(create_health_router(self.guard, self.agent_cls.name))
        app.add_middleware(
            StartGateMiddleware,
            guard=self.guard,
            limiter=self.limiter,
            configs=self.configs,
            trusted_proxy_hops=self.settings.trusted_proxy_hops,
        )
        app.router.lifespan_context = self._lifespan

    @asynccontextmanager
    async def _lifespan(self, _app: FastAPI) -> AsyncIterator[None]:
        # The runner forces DEBUG logging in main(); this runs afterwards, at server startup.
        logger.remove()
        logger.add(sys.stderr, level=self.settings.log_level.upper())
        logger.info(
            "Voice server ready: agent={!r}, max {:.0f}s per session, {} sessions/IP per {:.0f}h",
            self.agent_cls.name,
            self.settings.max_session_seconds,
            self.settings.rate_limit_max_sessions,
            self.settings.rate_limit_window_seconds / 3600,
        )
        yield

    def runner_parser(self) -> argparse.ArgumentParser:
        """CLI parser that swaps the runner's development defaults for this backend's.

        Explicit CLI flags still win, e.g. ``python -m voice_backend --port 9000``.
        """
        return RunnerArgumentParser(
            default_overrides={
                "host": self.settings.host,
                "port": self.settings.port,
                "transport": "websocket",
                "ws_auth": "token",
            },
            description="Portfolio voice backend (Pipecat runner)",
        )

    def serve(self) -> None:
        """Validate the agent configuration, then start the runner (blocking)."""
        from pipecat.runner.run import app, main

        self.agent_cls()  # Fail fast on missing API keys instead of at the first session.
        self.configure(app)
        main(self.runner_parser())
