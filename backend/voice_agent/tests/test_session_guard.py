import asyncio

import pytest

from voice_backend.guards import SessionBusyError, SessionGuard


async def test_rejects_a_second_session_while_busy() -> None:
    guard = SessionGuard(max_duration_secs=5, grace_secs=0)
    started = asyncio.Event()
    release = asyncio.Event()

    async def session() -> None:
        started.set()
        await release.wait()

    first = asyncio.create_task(guard.run(session))
    await started.wait()

    assert guard.busy
    with pytest.raises(SessionBusyError):
        await guard.run(session)

    release.set()
    await first
    assert not guard.busy


async def test_force_cancels_after_deadline_and_releases_the_slot() -> None:
    guard = SessionGuard(max_duration_secs=0.05, grace_secs=0.05)
    cancelled = False

    async def never_ending() -> None:
        nonlocal cancelled
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            cancelled = True
            raise

    await asyncio.wait_for(guard.run(never_ending), timeout=2)

    assert cancelled
    assert not guard.busy


async def test_releases_the_slot_when_the_session_fails() -> None:
    guard = SessionGuard(max_duration_secs=5, grace_secs=0)

    async def failing() -> None:
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        await guard.run(failing)
    assert not guard.busy
