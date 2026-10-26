"""Server configuration, read from environment variables (and `.env` in local development).

Only the backend's own settings live here. Two settings are read directly by the Pipecat
runner and transport, so they are not duplicated:

- ``PIPECAT_ALLOWED_ORIGINS``: comma-separated origins allowed for CORS and WebSocket upgrades.
- ``PIPECAT_WEBSOCKET_AUTH``: overridden to ``token`` by the server unless passed on the CLI.

Each agent declares its own settings (API key, model, voice) next to its code.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend settings. Every field maps to the upper-case environment variable of its name."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = Field(default="localhost", description="Bind address (0.0.0.0 in a container).")
    port: int = Field(default=7860, description="Listening port. Cloud Run injects PORT.")

    agent: str = Field(
        default="gemini-live",
        description="Registered agent name (e.g. 'echo') or an import path 'package.module:Class'.",
    )

    max_session_seconds: float = Field(default=300, gt=0, description="Session length limit.")
    session_grace_seconds: float = Field(
        default=10,
        ge=0,
        description="Time the agent gets to shut down gracefully before it is force-cancelled.",
    )

    rate_limit_max_sessions: int = Field(default=5, ge=1, description="Sessions per IP per window.")
    rate_limit_window_seconds: float = Field(default=86_400, gt=0, description="Window length.")
    trusted_proxy_hops: int = Field(
        default=1,
        ge=0,
        description=(
            "Proxies in front of the app that append to X-Forwarded-For. Cloud Run adds one. "
            "Use 0 to ignore the header and trust the TCP peer address."
        ),
    )

    log_level: str = Field(default="INFO", description="Loguru level once the server is up.")


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings, loaded once."""
    return Settings()
