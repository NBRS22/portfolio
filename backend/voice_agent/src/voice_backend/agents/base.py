"""Base class shared by every voice agent.

An agent only describes *its* pipeline. Everything around it is done once here: creating the
transport from the runner arguments, running the ``PipelineWorker``, reacting to connects and
disconnects, and ending the session when its time is up.
"""

import asyncio
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import ClassVar

from loguru import logger
from pipecat.frames.frames import EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker, ProcessorUnusablePolicy
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.websocket.fastapi import FastAPIWebsocketParams
from pipecat.workers.runner import WorkerRunner

from voice_backend.session_config import SessionConfig

TransportParamsFactories = dict[str, Callable[[], TransportParams]]


class VoiceAgent(ABC):
    """A Pipecat voice agent the backend can serve.

    Subclasses implement :meth:`build_pipeline` and may override the hooks below. A new
    instance is created for every session, with the visitor's :class:`SessionConfig`, so
    per-session state can live on ``self``.

    The agent is registered under :attr:`name` with
    :func:`voice_backend.agents.registry.register_agent`.
    """

    name: ClassVar[str] = ""
    description: ClassVar[str] = ""

    def __init__(self, session: SessionConfig | None = None) -> None:
        self.session = session or SessionConfig()

    @abstractmethod
    def build_pipeline(self, transport: BaseTransport) -> Pipeline:
        """Return the pipeline for one session, wired to ``transport.input()``/``output()``."""

    def transport_params(self) -> TransportParamsFactories:
        """Transport parameters per runner transport type, as used by ``create_transport``.

        The default serves browser clients over the plain WebSocket transport with the
        Protobuf serializer expected by ``@pipecat-ai/websocket-transport``. Add keys
        (``"webrtc"``, ``"daily"``, ...) to support more transports.
        """
        return {
            "websocket": lambda: FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                serializer=ProtobufFrameSerializer(),
            ),
        }

    def pipeline_params(self) -> PipelineParams:
        """Parameters for the ``PipelineWorker``."""
        return PipelineParams(enable_metrics=True, enable_usage_metrics=True)

    async def on_client_connected(self, worker: PipelineWorker) -> None:  # noqa: B027
        """Called once the client is connected and the pipeline is running. No-op by default."""

    async def on_session_timeout(self, worker: PipelineWorker) -> None:
        """Called when the session reaches its time limit.

        The default ends the pipeline gracefully: pending frames are flushed, then the
        transport closes the connection. Override it to say goodbye first, e.g. by queuing a
        ``TTSSpeakFrame`` before the ``EndFrame``.
        """
        await worker.queue_frame(EndFrame())

    async def run(self, runner_args: RunnerArguments, max_duration_secs: float) -> None:
        """Run one session until the client leaves, the pipeline ends, or time runs out."""
        transport = await create_transport(runner_args, self.transport_params())
        worker = PipelineWorker(
            self.build_pipeline(transport),
            params=self.pipeline_params(),
            idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
            processor_unusable_policy=ProcessorUnusablePolicy.END,
        )
        runner = WorkerRunner(handle_sigint=runner_args.handle_sigint)
        await runner.add_workers(worker)
        timers: set[asyncio.Task[None]] = set()

        async def end_when_time_is_up() -> None:
            await asyncio.sleep(max_duration_secs)
            logger.info("[{}] Session reached {:.0f}s, ending it", self.name, max_duration_secs)
            await self.on_session_timeout(worker)

        @transport.event_handler("on_client_connected")
        async def on_client_connected(_transport: BaseTransport, _client: object) -> None:
            logger.info("[{}] Client connected", self.name)
            timer = asyncio.create_task(end_when_time_is_up())
            timers.add(timer)
            timer.add_done_callback(timers.discard)
            await self.on_client_connected(worker)

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(_transport: BaseTransport, _client: object) -> None:
            logger.info("[{}] Client disconnected", self.name)
            await runner.cancel()

        try:
            await runner.run()
        finally:
            for timer in list(timers):
                timer.cancel()
