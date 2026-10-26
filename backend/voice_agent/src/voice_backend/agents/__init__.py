"""Voice agents and the registry used to select one at startup.

To add an agent, create a module in :mod:`voice_backend.agents.catalog`::

    @register_agent("my-agent")
    class MyAgent(RealtimeAgent):
        \"\"\"One-line description shown in logs and /health.\"\"\"

        def create_llm(self) -> LLMService: ...

then start the server with ``AGENT=my-agent``.
"""

from voice_backend.agents.base import VoiceAgent
from voice_backend.agents.realtime import RealtimeAgent
from voice_backend.agents.registry import (
    UnknownAgentError,
    available_agents,
    register_agent,
    resolve_agent,
)

__all__ = [
    "RealtimeAgent",
    "UnknownAgentError",
    "VoiceAgent",
    "available_agents",
    "register_agent",
    "resolve_agent",
]
