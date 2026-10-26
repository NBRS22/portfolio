"""Gemini Live speech-to-speech agent (Google AI Studio API key)."""

from pipecat.services.llm_service import LLMService
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from voice_backend.agents.realtime import RealtimeAgent
from voice_backend.agents.registry import register_agent
from voice_backend.session_config import SessionConfig


class GeminiLiveConfig(BaseSettings):
    """Gemini Live settings. Unset optional values fall back to Pipecat's defaults."""

    model_config = SettingsConfigDict(env_prefix="GEMINI_", env_file=".env", extra="ignore")

    api_key: SecretStr = Field(validation_alias="GOOGLE_API_KEY")
    model: str | None = None
    voice: str = "Aoede"
    language: str | None = Field(default=None, description="Locale such as 'fr-FR' or 'en-US'.")


@register_agent("gemini-live")
class GeminiLiveAgent(RealtimeAgent):
    """Speech-to-speech conversation with Google Gemini Live."""

    def __init__(self, session: SessionConfig | None = None) -> None:
        super().__init__(session)
        self.config = GeminiLiveConfig()

    def create_llm(self) -> LLMService:
        # Imported here so the provider SDK only loads when this agent is selected.
        from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService

        options: dict[str, str] = {
            "system_instruction": self.system_instruction,
            "voice": self.config.voice,
        }
        if self.config.model:
            options["model"] = self.config.model
        if self.config.language:
            options["language"] = self.config.language

        return GeminiLiveLLMService(
            api_key=self.config.api_key.get_secret_value(),
            settings=GeminiLiveLLMService.Settings(**options),
        )
