"""Start the voice server: ``uv run python -m voice_backend``.

The Pipecat runner looks for a ``bot`` callable in the ``__main__`` module, so it is exposed here.
"""

from voice_backend.server import VoiceServer

server = VoiceServer.from_env()
bot = server.bot

if __name__ == "__main__":
    server.serve()
