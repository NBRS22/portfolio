"""HTTP routes the backend adds next to the runner's own (``/start``, ``/status``, ...)."""

from fastapi import APIRouter

from voice_backend import __version__
from voice_backend.guards import SessionGuard


def create_health_router(guard: SessionGuard, agent_name: str) -> APIRouter:
    """Return a router exposing ``GET /health`` for uptime checks and local debugging."""
    router = APIRouter()

    @router.get("/health", tags=["monitoring"])
    async def health() -> dict[str, object]:
        return {
            "status": "ok",
            "version": __version__,
            "agent": agent_name,
            "session_active": guard.busy,
        }

    return router
