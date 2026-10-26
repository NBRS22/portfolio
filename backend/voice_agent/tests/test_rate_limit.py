import pytest

from voice_backend.guards import SlidingWindowRateLimiter


class FakeClock:
    def __init__(self) -> None:
        self.now = 1_000.0

    def __call__(self) -> float:
        return self.now


def test_allows_up_to_the_limit_then_blocks() -> None:
    limiter = SlidingWindowRateLimiter(5, 86_400, clock=FakeClock())

    assert all(limiter.try_acquire("1.2.3.4") for _ in range(5))
    assert not limiter.try_acquire("1.2.3.4")


def test_keys_are_independent() -> None:
    limiter = SlidingWindowRateLimiter(1, 60, clock=FakeClock())

    assert limiter.try_acquire("a")
    assert limiter.try_acquire("b")
    assert not limiter.try_acquire("a")


def test_events_expire_after_the_window() -> None:
    clock = FakeClock()
    limiter = SlidingWindowRateLimiter(2, 60, clock=clock)
    limiter.try_acquire("ip")
    clock.now += 30
    limiter.try_acquire("ip")

    assert not limiter.try_acquire("ip")
    assert limiter.retry_after("ip") == pytest.approx(30)

    clock.now += 30
    assert limiter.try_acquire("ip")


def test_rejects_invalid_configuration() -> None:
    with pytest.raises(ValueError):
        SlidingWindowRateLimiter(0, 60)
    with pytest.raises(ValueError):
        SlidingWindowRateLimiter(1, 0)
