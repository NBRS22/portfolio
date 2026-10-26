"""In-memory sliding-window rate limiter.

State lives in the process, which is enough with ``--max-instances 1``. It is lost when
Cloud Run scales the instance down to zero, so the limit is best-effort, not a quota.
"""

import time
from collections import deque
from collections.abc import Callable


class SlidingWindowRateLimiter:
    """Allow at most ``max_events`` per key within any rolling ``window_secs`` period."""

    def __init__(
        self,
        max_events: int,
        window_secs: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_events < 1:
            raise ValueError("max_events must be at least 1")
        if window_secs <= 0:
            raise ValueError("window_secs must be positive")
        self._max_events = max_events
        self._window_secs = window_secs
        self._clock = clock
        self._events: dict[str, deque[float]] = {}

    def try_acquire(self, key: str) -> bool:
        """Record an event for ``key`` and return True, or return False if over the limit."""
        now = self._clock()
        events = self._prune(key, now)
        if len(events) >= self._max_events:
            return False
        events.append(now)
        self._events[key] = events
        return True

    def retry_after(self, key: str) -> float:
        """Seconds until ``key`` can acquire again (0 when it already can)."""
        now = self._clock()
        events = self._prune(key, now)
        if len(events) < self._max_events:
            return 0.0
        return max(0.0, events[0] + self._window_secs - now)

    def _prune(self, key: str, now: float) -> deque[float]:
        """Drop events older than the window; forget keys with no recent events."""
        events = self._events.get(key, deque())
        cutoff = now - self._window_secs
        while events and events[0] <= cutoff:
            events.popleft()
        if not events:
            self._events.pop(key, None)
        return events
