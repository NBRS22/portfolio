"""Echo agent: plays the microphone back. Tests the audio path without any API key."""

from pipecat.frames.frames import Frame, InputAudioRawFrame, OutputAudioRawFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.transports.base_transport import BaseTransport

from voice_backend.agents.base import VoiceAgent
from voice_backend.agents.registry import register_agent


class AudioEchoProcessor(FrameProcessor):
    """Turn every incoming audio chunk into an outgoing one.

    The output transport resamples to its own rate, so input and output rates may differ.
    """

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)
        if isinstance(frame, InputAudioRawFrame):
            await self.push_frame(
                OutputAudioRawFrame(
                    audio=frame.audio,
                    sample_rate=frame.sample_rate,
                    num_channels=frame.num_channels,
                )
            )
        await self.push_frame(frame, direction)


@register_agent("echo")
class EchoAgent(VoiceAgent):
    """Echoes the visitor's voice back (no API key needed, use headphones)."""

    def build_pipeline(self, transport: BaseTransport) -> Pipeline:
        return Pipeline([transport.input(), AudioEchoProcessor(), transport.output()])
