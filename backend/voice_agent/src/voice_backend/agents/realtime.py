"""Base class for speech-to-speech agents.

A realtime (speech-to-speech) model replaces the STT → LLM → TTS chain: audio goes in, audio
comes out. Pipecat exposes these models as ``LLMService`` subclasses, so every provider shares
the same pipeline and only :meth:`RealtimeAgent.create_llm` differs.
"""

from abc import abstractmethod

from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    AssistantTurnStoppedMessage,
    LLMAssistantAggregator,
    LLMContextAggregatorPair,
    LLMUserAggregator,
    LLMUserAggregatorParams,
    UserTurnMessageAddedMessage,
)
from pipecat.services.llm_service import LLMService
from pipecat.transports.base_transport import BaseTransport

from voice_backend.agents.base import VoiceAgent
from voice_backend.agents.prompts import DEFAULT_GREETING, build_system_instruction


class RealtimeAgent(VoiceAgent):
    """Speech-to-speech agent: ``input → user context → realtime model → output → assistant``.

    Subclasses implement :meth:`create_llm`. Set :attr:`greeting` to ``None`` to wait for the
    user to speak first.
    """

    greeting: str | None = DEFAULT_GREETING

    @property
    def system_instruction(self) -> str:
        """The visitor's personality from the session config, followed by the guardrails."""
        return build_system_instruction(self.session.personality)

    @abstractmethod
    def create_llm(self) -> LLMService:
        """Return the provider's realtime service, configured with :attr:`system_instruction`."""

    def build_pipeline(self, transport: BaseTransport) -> Pipeline:
        # The realtime model still decides turns server-side. Realtime services such as Gemini
        # Live do not report when the visitor starts or stops speaking, so a local VAD
        # produces those events for the client (RTVI user-started/stopped-speaking) and cuts
        # the bot's audio as soon as the visitor talks over it.
        self.context = LLMContext()
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            self.context, user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer())
        )
        self._log_transcript(user_aggregator, assistant_aggregator)
        return Pipeline(
            [
                transport.input(),
                user_aggregator,
                self.create_llm(),
                transport.output(),
                assistant_aggregator,
            ]
        )

    async def on_client_connected(self, worker: PipelineWorker) -> None:
        if self.greeting:
            self.context.add_message({"role": "developer", "content": self.greeting})
            await worker.queue_frames([LLMRunFrame()])

    def _log_transcript(self, user: LLMUserAggregator, assistant: LLMAssistantAggregator) -> None:
        """Log each finished turn, which is handy when testing locally."""

        @user.event_handler("on_user_turn_message_added")
        async def on_user_turn(_aggregator: object, message: UserTurnMessageAddedMessage) -> None:
            logger.info("[{}] user: {}", self.name, message.content)

        @assistant.event_handler("on_assistant_turn_stopped")
        async def on_assistant_turn(
            _aggregator: object, message: AssistantTurnStoppedMessage
        ) -> None:
            logger.info("[{}] assistant: {}", self.name, message.content)
