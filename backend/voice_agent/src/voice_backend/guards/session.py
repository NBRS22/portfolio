"""Single-session slot with a hard duration limit."""

import asyncio
from collections.abc import Awaitable, Callable

from loguru import logger


class SessionBusyError(RuntimeError):
    """Raised when a session is requested while another one is running."""


class SessionGuard:
    """Run at most one voice session at a time and force-stop it after a hard deadline.

    The agent itself is expected to wind down at ``max_duration_secs`` (see
    ``VoiceAgent.on_session_timeout``). The guard is the safety net: if the agent is still
    running ``grace_secs`` later, its task is cancelled and the slot is released anyway.
    """

    def __init__(self, max_duration_secs: float, grace_secs: float) -> None:
        self.max_duration_secs = max_duration_secs
        self.grace_secs = grace_secs
        self._lock = asyncio.Lock()

    @property
    def busy(self) -> bool:
        """Whether a session currently holds the slot."""
        return self._lock.locked()

    async def run(self, session: Callable[[], Awaitable[None]]) -> None:
        """Run ``session`` in the slot.

        Raises:
            SessionBusyError: If another session already holds the slot.
        """
        if self._lock.locked():
            raise SessionBusyError("A voice session is already running")

        async with self._lock:
            try:
                async with asyncio.timeout(self.max_duration_secs + self.grace_secs):
                    await session()
            except TimeoutError:
                logger.warning(
                    "Session exceeded {:.0f}s (+{:.0f}s grace), force-cancelled",
                    self.max_duration_secs,
                    self.grace_secs,
                )
