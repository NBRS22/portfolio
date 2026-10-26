import pytest

from voice_backend.agents import UnknownAgentError, available_agents, resolve_agent
from voice_backend.agents.catalog.echo import EchoAgent
from voice_backend.agents.catalog.gemini_live import GeminiLiveAgent


def test_catalog_agents_are_discovered() -> None:
    agents = available_agents()

    assert {"echo", "gemini-live", "openai-realtime"} <= agents.keys()
    assert all(agents.values()), "every agent needs a docstring description"


def test_resolves_by_name_and_by_import_path() -> None:
    assert resolve_agent("echo") is EchoAgent
    assert resolve_agent("voice_backend.agents.catalog.gemini_live:GeminiLiveAgent") is (
        GeminiLiveAgent
    )


def test_unknown_agent_lists_the_available_ones() -> None:
    with pytest.raises(UnknownAgentError, match="echo"):
        resolve_agent("does-not-exist")


def test_import_path_must_point_to_a_voice_agent() -> None:
    with pytest.raises(UnknownAgentError):
        resolve_agent("voice_backend.config:Settings")


def test_missing_api_key_fails_at_construction(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.chdir("/")  # No .env to read from.

    with pytest.raises(ValueError, match="GOOGLE_API_KEY"):
        GeminiLiveAgent()
