import pytest

from voice_backend.agents.catalog.echo import EchoAgent
from voice_backend.agents.catalog.gemini_live import GeminiLiveAgent
from voice_backend.agents.prompts import DEFAULT_PERSONALITY, GUARDRAILS
from voice_backend.server import ws_token
from voice_backend.session_config import (
    PERSONALITY_MAX_LENGTH,
    InvalidSessionConfigError,
    SessionConfig,
    SessionConfigStore,
    parse_session_config,
)

# Exactly what the frontend's buildSessionConfig() sends today.
FRONTEND_BODY = {
    "version": 1,
    "personality": "You are Miroka, the reception robot of a hospital.",
    "architecture": None,
    "providers": None,
    "actions": [],
    "knowledge": [],
    "flow": None,
}


def start_request(body: object) -> dict[str, object]:
    return {"transport": "websocket", "body": body}


def test_accepts_the_frontend_body() -> None:
    config = parse_session_config(start_request(FRONTEND_BODY))

    assert config.personality == FRONTEND_BODY["personality"]
    assert config.architecture is None


def test_future_fields_are_accepted() -> None:
    body = {
        **FRONTEND_BODY,
        "architecture": "end-to-end",
        "providers": {"s2s": "gemini-live"},
        "actions": [{"name": "wave", "description": "Wave a hand"}],
        "knowledge": [{"title": "Hours", "content": "9 to 5"}],
        "flow": {"nodes": [{"id": "a", "instructions": "..."}], "start": "a"},
        "unknown_field": True,
    }

    assert parse_session_config(start_request(body)).actions[0].name == "wave"


@pytest.mark.parametrize("request_json", [None, {"transport": "websocket"}, start_request(None)])
def test_missing_body_uses_defaults(request_json: object) -> None:
    assert parse_session_config(request_json) == SessionConfig()


@pytest.mark.parametrize(
    ("request_json", "code"),
    [
        (start_request({**FRONTEND_BODY, "version": 2}), "unsupported_version"),
        (start_request({**FRONTEND_BODY, "architecture": "cascade"}), "unsupported_architecture"),
        (start_request({**FRONTEND_BODY, "architecture": "telepathy"}), "invalid_config"),
        (start_request({**FRONTEND_BODY, "personality": 42}), "invalid_config"),
        (start_request("not an object"), "invalid_config"),
        (["not", "an", "object"], "invalid_config"),
    ],
)
def test_refused_bodies(request_json: object, code: str) -> None:
    with pytest.raises(InvalidSessionConfigError) as error:
        parse_session_config(request_json)

    assert error.value.code == code


def test_long_personality_is_truncated() -> None:
    body = {**FRONTEND_BODY, "personality": "  " + "x" * (PERSONALITY_MAX_LENGTH + 100)}

    assert parse_session_config(start_request(body)).personality == "x" * PERSONALITY_MAX_LENGTH


@pytest.mark.parametrize("personality", ["", "   \n ", None])
def test_empty_personality_falls_back_to_the_default_persona(
    personality: str | None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    config = parse_session_config(start_request({**FRONTEND_BODY, "personality": personality}))

    instruction = GeminiLiveAgent(config).system_instruction

    assert instruction.startswith(DEFAULT_PERSONALITY)


def test_personality_is_followed_by_the_guardrails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    config = parse_session_config(start_request(FRONTEND_BODY))

    instruction = GeminiLiveAgent(config).system_instruction

    assert instruction.startswith(FRONTEND_BODY["personality"])
    assert instruction.endswith(GUARDRAILS)


def test_agents_default_to_an_empty_session_config() -> None:
    assert EchoAgent().session == SessionConfig()


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_store_hands_a_config_out_once() -> None:
    store = SessionConfigStore(ttl_secs=300)
    config = SessionConfig(personality="pirate")
    store.put("t1", config)

    assert store.pop("t1") is config
    assert store.pop("t1") is None
    assert store.pop(None) is None


def test_store_entries_expire_and_are_purged() -> None:
    clock = FakeClock()
    store = SessionConfigStore(ttl_secs=300, clock=clock)
    store.put("old", SessionConfig())
    clock.now = 301
    store.put("new", SessionConfig())

    assert store.pop("old") is None
    assert len(store) == 1


class FakeWebSocket:
    def __init__(self, headers=None, query=None, path=None) -> None:
        self.headers = headers or {}
        self.query_params = query or {}
        self.path_params = path or {}


@pytest.mark.parametrize(
    "websocket",
    [
        FakeWebSocket(headers={"authorization": "Bearer abc"}),
        FakeWebSocket(query={"token": "abc"}),
        FakeWebSocket(path={"token": "abc"}),
    ],
)
def test_ws_token_is_read_where_the_runner_accepts_it(websocket: FakeWebSocket) -> None:
    assert ws_token(websocket) == "abc"  # type: ignore[arg-type]


def test_ws_token_without_websocket() -> None:
    assert ws_token(None) is None
    assert ws_token(FakeWebSocket()) is None  # type: ignore[arg-type]
