"""Per-session configuration sent by the frontend in ``POST /start``.

The frontend posts ``{"transport": "websocket", "body": <SessionConfig>}``. The schema is
final: only ``personality`` is used today, the other fields are accepted (and ignored) so the
contract does not break when the frontend starts filling them.

The Pipecat runner does not forward the ``/start`` body to WebSocket sessions, so the
validated config is kept in a :class:`SessionConfigStore`, keyed by the one-time token the
runner returns, and picked up by ``bot()`` when the client connects with that token.
"""

import time
from collections.abc import Callable
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

PERSONALITY_MAX_LENGTH = 800


class InvalidSessionConfigError(ValueError):
    """The ``/start`` body was refused. ``code`` is returned to the client as ``error``."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


class SessionAction(BaseModel):
    name: str
    description: str = ""


class KnowledgeEntry(BaseModel):
    title: str
    content: str


class SessionConfig(BaseModel):
    """What the visitor configured in the Playground (``DemoSessionConfig`` in the frontend)."""

    model_config = ConfigDict(extra="ignore", frozen=True)

    version: Literal[1] = 1
    # System prompt written by the visitor. Empty means "use the default persona".
    personality: str = ""
    # Accepted for forward compatibility; only end-to-end (speech-to-speech) is served today.
    architecture: Literal["end-to-end", "cascade"] | None = None
    providers: dict[str, str] | None = None
    actions: list[SessionAction] = Field(default_factory=list)
    knowledge: list[KnowledgeEntry] = Field(default_factory=list)
    flow: dict[str, Any] | None = None

    @field_validator("personality", mode="before")
    @classmethod
    def _clean_personality(cls, value: object) -> object:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()[:PERSONALITY_MAX_LENGTH].strip()
        return value


def parse_session_config(start_request: object) -> SessionConfig:
    """Validate the JSON of a ``POST /start`` request and return its session config.

    A request without ``body`` (e.g. ``{"transport": "websocket"}``) gets the defaults.

    Raises:
        InvalidSessionConfigError: If the body is malformed or asks for something unsupported.
    """
    if start_request is None:
        return SessionConfig()
    if not isinstance(start_request, dict):
        raise InvalidSessionConfigError("invalid_config", "The request must be a JSON object.")
    body = start_request.get("body")
    if body is None:
        return SessionConfig()
    if not isinstance(body, dict):
        raise InvalidSessionConfigError("invalid_config", "'body' must be a JSON object.")
    if body.get("version", 1) != 1:
        raise InvalidSessionConfigError(
            "unsupported_version", "Only version 1 of the session config is supported."
        )
    try:
        config = SessionConfig.model_validate(body)
    except ValidationError as e:
        fields = ", ".join(".".join(map(str, err["loc"])) for err in e.errors())
        raise InvalidSessionConfigError("invalid_config", f"Invalid fields: {fields}.") from e
    if config.architecture == "cascade":
        raise InvalidSessionConfigError(
            "unsupported_architecture", "Only the end-to-end architecture is available."
        )
    return config


class SessionConfigStore:
    """Session configs waiting for their WebSocket connection, keyed by one-time token.

    Entries expire after ``ttl_secs`` (the runner's token lifetime) and are removed when
    read, so a config is used by at most one session.
    """

    def __init__(self, ttl_secs: float = 300, clock: Callable[[], float] = time.monotonic) -> None:
        self._ttl = ttl_secs
        self._clock = clock
        self._entries: dict[str, tuple[float, SessionConfig]] = {}

    def __len__(self) -> int:
        return len(self._entries)

    def put(self, token: str, config: SessionConfig) -> None:
        now = self._clock()
        self._entries = {t: e for t, e in self._entries.items() if e[0] > now}
        self._entries[token] = (now + self._ttl, config)

    def pop(self, token: str | None) -> SessionConfig | None:
        """Return and forget the config of ``token``, or ``None`` if unknown or expired."""
        if not token:
            return None
        entry = self._entries.pop(token, None)
        if entry is None or entry[0] <= self._clock():
            return None
        return entry[1]
