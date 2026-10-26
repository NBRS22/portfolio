"""OpenAI Realtime speech-to-speech agent."""

from pipecat.services.llm_service import LLMService
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from voice_backend.agents.realtime import RealtimeAgent
from voice_backend.agents.registry import register_agent
from voice_backend.session_config import SessionConfig


class OpenAIRealtimeConfig(BaseSettings):
    """OpenAI Realtime settings. Unset optional values fall back to Pipecat's defaults."""

    model_config = SettingsConfigDict(
        env_prefix="OPENAI_REALTIME_", env_file=".env", extra="ignore"
    )

    api_key: SecretStr = Field(validation_alias="OPENAI_API_KEY")
    model: str | None = None
    voice: str = "alloy"


@register_agent("openai-realtime")
class OpenAIRealtimeAgent(RealtimeAgent):
    """Speech-to-speech conversation with the OpenAI Realtime API."""

    def __init__(self, session: SessionConfig | None = None) -> None:
        super().__init__(session)
        self.config = OpenAIRealtimeConfig()

    def create_llm(self) -> LLMService:
        # Imported here so the provider SDK only loads when this agent is selected.
        from pipecat.services.openai.realtime.events import (
            AudioConfiguration,
            AudioInput,
            AudioOutput,
            InputAudioNoiseReduction,
            InputAudioTranscription,
            SemanticTurnDetection,
            SessionProperties,
        )
        from pipecat.services.openai.realtime.llm import OpenAIRealtimeLLMService

        session = SessionProperties(
            audio=AudioConfiguration(
                input=AudioInput(
                    transcription=InputAudioTranscription(),
                    turn_detection=SemanticTurnDetection(),
                    noise_reduction=InputAudioNoiseReduction(type="near_field"),
                ),
                output=AudioOutput(voice=self.config.voice),
            ),
        )
        options: dict[str, object] = {
            "system_instruction": self.system_instruction,
            "session_properties": session,
        }
        if self.config.model:
            options["model"] = self.config.model

        return OpenAIRealtimeLLMService(
            api_key=self.config.api_key.get_secret_value(),
            settings=OpenAIRealtimeLLMService.Settings(**options),
        )
