# Portfolio voice agent backend

Backend for the voice demo of the portfolio, in `backend/voice_agent/`. It serves [Pipecat](https://docs.pipecat.ai)
voice agents to the browser over WebSocket, and is designed for Google Cloud Run.

- **Pipecat 1.13** development runner, extended with production guards
- **Pluggable agents**: Gemini Live and OpenAI Realtime (speech-to-speech), plus an echo agent
- **Per-session personality**: the frontend sends the system prompt in `POST /start`
- **Guards**: one session at a time, 5-minute sessions, 5 sessions per IP per 24 h,
  allowed origins, one-time connection tokens
- Python 3.12, `uv`, FastAPI/Uvicorn, pydantic-settings, pytest, Ruff, Docker

## How it works

```
Browser (Next.js)                         voice_backend (Cloud Run, 1 instance)
─────────────────                         ─────────────────────────────────────────────
POST /start {transport, body} ─────────▶  CORS → StartGateMiddleware
                                           ├─ session running?    → 503 {"error": "busy"}
                                           ├─ body refused?       → 400 {"error": "unsupported_…"}
                                           ├─ IP over its quota?  → 429 {"error": "rate_limited"}
                                           └─ Pipecat runner      → {wsUrl, sessionId, token}
                                              body stored under token (SessionConfigStore)
WebSocket wsUrl?token=… ───────────────▶  runner: token (one-time, 5 min) ✓ · Origin ✓
                                           └─ VoiceServer.bot() → SessionGuard (1 slot, hard limit)
                                                └─ VoiceAgent(config).run() → Pipecat pipeline
◀──────── audio (Protobuf frames) ───────  ends after MAX_SESSION_SECONDS, on disconnect or error
```

The Pipecat runner (`pipecat.runner.run`) provides the FastAPI app, `POST /start`, token
authentication, Origin checks and the `/ws-client` WebSocket. This project adds what a public
deployment needs on top of it, without patching Pipecat:

| Module | Role |
|---|---|
| `server.py` | Wires everything into the runner and replaces its development defaults (WebSocket only, token auth, `HOST`/`PORT`). |
| `guards/start_gate.py` | ASGI middleware on `POST /start`: busy check, session config validation, per-IP quota, and a public `wsUrl` (the runner builds it from its bind address, unreachable behind Cloud Run). |
| `session_config.py` | `SessionConfig` (the frontend's `body`), its validation, and the store that hands it to the session opened with the token. |
| `guards/session.py` | One session at a time, force-cancelled `SESSION_GRACE_SECONDS` after the limit. |
| `guards/rate_limit.py` | In-memory sliding-window rate limiter. |
| `agents/base.py` | `VoiceAgent`: transport creation, `PipelineWorker`, connect/disconnect events, graceful end at the time limit. |
| `agents/realtime.py` | `RealtimeAgent`: shared pipeline for speech-to-speech models, system instruction built from the session's personality. |
| `agents/prompts.py` | Default persona, fixed guardrails appended to every personality, greeting. |
| `agents/registry.py` | `@register_agent` and auto-discovery of `agents/catalog/`. |
| `agents/catalog/` | One file per agent: `echo`, `gemini-live`, `openai-realtime`. |

## Run locally

Requirements: [uv](https://docs.astral.sh/uv/) (it installs Python 3.12 if needed).

```bash
cd backend/voice_agent        # from the portfolio root
uv sync
cp .env.example .env        # then set GOOGLE_API_KEY (or OPENAI_API_KEY)
uv run python -m voice_backend
```

The server listens on `http://localhost:7860`:

```bash
curl http://localhost:7860/health
# {"status":"ok","version":"0.1.0","agent":"gemini-live","session_active":false}

curl -X POST http://localhost:7860/start -H "Content-Type: application/json" \
     -d '{"transport": "websocket"}'
# {"wsUrl":"ws://localhost:7860/ws-client","sessionId":"…","token":"…"}
```

To talk to the agent, run the frontend on `http://localhost:3000` (allowed by default) and
wire `start()` as described in [Connect the frontend](#connect-the-frontend).

Useful variations:

```bash
AGENT=echo uv run python -m voice_backend              # no API key; use headphones
AGENT=openai-realtime uv run python -m voice_backend
uv run python -m voice_backend --port 9000             # runner CLI flags still work
```

> Get a Gemini key from [Google AI Studio](https://aistudio.google.com/apikey). Set a spending
> limit with your provider: it is the real cap on cost.

## Configuration

Every setting is an environment variable (see [`.env.example`](.env.example)).

| Variable | Default | Description |
|---|---|---|
| `AGENT` | `gemini-live` | `echo`, `gemini-live`, `openai-realtime`, or an import path `package.module:Class`. |
| `HOST` / `PORT` | `localhost` / `7860` | Bind address. The Docker image uses `0.0.0.0` / `8080`; Cloud Run injects `PORT`. |
| `MAX_SESSION_SECONDS` | `300` | Session length. The agent ends the session gracefully at this point. |
| `SESSION_GRACE_SECONDS` | `10` | Extra time before the session is force-cancelled. |
| `RATE_LIMIT_MAX_SESSIONS` | `5` | Sessions per IP per window (counted on `POST /start`). |
| `RATE_LIMIT_WINDOW_SECONDS` | `86400` | Rolling window (24 h). |
| `TRUSTED_PROXY_HOPS` | `1` | Proxies appending to `X-Forwarded-For` (Cloud Run: 1). `0` uses the TCP peer. |
| `LOG_LEVEL` | `INFO` | Log level once the server is up. |
| `PIPECAT_ALLOWED_ORIGINS` | – | Allowed origins, comma-separated. Read by Pipecat for CORS and WebSocket upgrades. |
| `GOOGLE_API_KEY`, `GEMINI_MODEL`, `GEMINI_VOICE`, `GEMINI_LANGUAGE` | – | `gemini-live` agent. Unset values use Pipecat's defaults. |
| `OPENAI_API_KEY`, `OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_VOICE` | – | `openai-realtime` agent. |

The server refuses to start if the selected agent is missing its API key.

## Add an agent

Create a module in `src/voice_backend/agents/catalog/`. It is discovered automatically.

**Speech-to-speech model** (one service replaces STT + LLM + TTS):

```python
from pipecat.services.llm_service import LLMService

from voice_backend.agents import RealtimeAgent, register_agent


@register_agent("my-realtime")
class MyRealtimeAgent(RealtimeAgent):
    """One-line description, shown in logs."""

    # system_instruction comes from the visitor's personality (self.session) + guardrails
    greeting = "Say hello in one sentence."   # None to wait for the user

    def create_llm(self) -> LLMService:
        from pipecat.services.… import SomeRealtimeLLMService
        return SomeRealtimeLLMService(...)
```

**Any other pipeline** (e.g. STT → LLM → TTS), subclass `VoiceAgent`:

```python
@register_agent("my-pipeline")
class MyPipelineAgent(VoiceAgent):
    """Cascaded STT → LLM → TTS agent."""

    def build_pipeline(self, transport: BaseTransport) -> Pipeline:
        return Pipeline(
            [
                transport.input(),
                stt,
                user_aggregator,
                llm,
                tts,
                transport.output(),
                assistant_aggregator,
            ]
        )

    async def on_client_connected(self, worker: PipelineWorker) -> None: ...
    async def on_session_timeout(self, worker: PipelineWorker) -> None: ...  # e.g. say goodbye
```

Then start with `AGENT=my-pipeline`. An agent living in another package is selected with
`AGENT=my_package.bot:MyAgent`. Agents read their own settings (keys, model, voice) with a
small `BaseSettings` class next to their code, as in `catalog/gemini_live.py`.

## Tests and linting

```bash
uv run pytest
uv run ruff check . && uv run ruff format --check .
```

The tests cover the rate limiter, the session guard (busy slot, forced cancellation), the
`/start` middleware (429, 503, `wsUrl` rewrite, CORS-friendly errors), the agent registry and
the runner CLI defaults.

## Docker

```bash
docker build -t voice-backend .
docker run --rm -p 8080:8080 --env-file .env -e HOST=0.0.0.0 -e PORT=8080 voice-backend
```

Two-stage build: `uv` installs the locked dependencies, then only the virtual environment is
copied into `python:3.12-slim` and run as a non-root user. `.env` is excluded from the image:
the Pipecat runner loads `.env` with `override=True`, which would override Cloud Run settings.

## Deploy to Cloud Run

```bash
PROJECT_ID=your-project-id
REGION=europe-west1
SA=voice-agent-sa@$PROJECT_ID.iam.gserviceaccount.com

gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
    artifactregistry.googleapis.com secretmanager.googleapis.com

# Dedicated service account that can only read its secret
gcloud iam service-accounts create voice-agent-sa --display-name "Voice agent"
printf '%s' "YOUR_GOOGLE_API_KEY" | gcloud secrets create google-api-key --data-file=-
gcloud secrets add-iam-policy-binding google-api-key \
    --member "serviceAccount:$SA" --role roles/secretmanager.secretAccessor

# Build with Cloud Build (from the Dockerfile) and deploy; run from backend/voice_agent
gcloud run deploy voice-agent \
    --source . \
    --region $REGION \
    --service-account $SA \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 1 \
    --concurrency 10 \
    --timeout 360 \
    --cpu 1 --memory 1Gi \
    --set-env-vars "^@^AGENT=gemini-live@MAX_SESSION_SECONDS=300@PIPECAT_ALLOWED_ORIGINS=http://localhost:3000,https://YOUR-SITE.vercel.app" \
    --set-secrets GOOGLE_API_KEY=google-api-key:latest
```

Why these flags:

- `--max-instances 1`: the session slot and the rate limiter live in memory, so they hold only
  with a single instance. It also caps the cost.
- `--concurrency 10`: one voice session at a time is enforced in code; the extra slots let
  `/start` (and its 503 answer) and `/health` respond during a session.
- `--timeout 360`: Cloud Run closes WebSockets at the request timeout. It must stay above
  `MAX_SESSION_SECONDS + SESSION_GRACE_SECONDS` and acts as a last-resort cap.
- `^@^`: changes the list separator so the comma-separated origins stay in one variable.
  This works in bash only. On Windows, `gcloud.cmd` goes through `cmd`, which strips the `^`
  and creates a variable named `@AGENT`. Use `--env-vars-file` there (see below).

When your Vercel domain is known, update the origins (no trailing slash):

```bash
gcloud run services update voice-agent --region $REGION \
    --update-env-vars "^@^PIPECAT_ALLOWED_ORIGINS=http://localhost:3000,https://your-site.vercel.app"
```

On Windows (PowerShell), put the variables in a YAML file instead:

```powershell
'PIPECAT_ALLOWED_ORIGINS: "http://localhost:3000,https://your-site.vercel.app"' | Set-Content origins.yaml
gcloud run services update voice-agent --region $REGION --env-vars-file origins.yaml
Remove-Item origins.yaml
```

`--env-vars-file` replaces all existing variables, so list every one you set in the file
(`AGENT`, `MAX_SESSION_SECONDS`, ...) and pass `--set-secrets GOOGLE_API_KEY=google-api-key:latest`
again in the same command.

Also create a [budget alert](https://console.cloud.google.com/billing/budgets) on the project.

## Session config (`POST /start` body)

The frontend (`buildSessionConfig()` in `frontend/src/data/voice-agent-demo.ts`) sends:

```json
{
  "transport": "websocket",
  "body": {
    "version": 1,
    "personality": "You are Miroka, the reception robot of a hospital…",
    "architecture": null,
    "providers": null,
    "actions": [],
    "knowledge": [],
    "flow": null
  }
}
```

- Only `personality` is used today. It becomes the agent's system instruction, followed by fixed
  guardrails (`agents/prompts.py`): short spoken answers, stay in character, no harmful content,
  never reveal the instructions. It is trimmed and cut to 800 characters; empty means the
  default persona.
- The other fields are accepted and ignored, so filling them later does not break the contract.
- Refusals answer `400` without using the visitor's quota: `unsupported_version` (version ≠ 1),
  `unsupported_architecture` (`"cascade"`), `invalid_config` (malformed JSON or fields).
- A request without `body` (`{"transport": "websocket"}`) gets the defaults.

The runner does not forward the body to WebSocket sessions, so the middleware stores the
validated config under the returned token and `bot()` picks it up when the client connects
with that token (once; it expires with the token after 5 minutes).

## Connect the frontend

The demo widget is `frontend/src/components/voice-agent/voice-demo.tsx`, with
`@pipecat-ai/client-js` and `@pipecat-ai/websocket-transport`. Set
`NEXT_PUBLIC_VOICE_API_URL=http://localhost:7860` in `frontend/.env.local` (the Cloud Run URL in
Vercel). On the microphone button it:

1. posts `{ transport: "websocket", body: config }` to `/start` and maps `503`, `429`, `400` and
   network errors to a message;
2. connects a `PipecatClient` (`WebSocketTransport` + `ProtobufFrameSerializer`, microphone
   only) with the returned `{ wsUrl, token }`;
3. follows the RTVI events:

| Event | UI |
|---|---|
| `onBotReady`, `onUserStartedSpeaking` | listening, curious face |
| `onUserStoppedSpeaking` | thinking |
| `onBotStartedSpeaking` / `onBotStoppedSpeaking` | speaking / listening, reply line finalized |
| `onUserTranscript` | visitor line (Gemini Live sends it once the reply has started) |
| `onBotOutput` | robot line, chunks concatenated, one message per `segment_id` |
| `onDisconnected` | back to idle (time limit or stop button) |

Gemini Live does not report when the visitor starts or stops speaking, so `RealtimeAgent` runs a
local Silero VAD only to emit those events; the model still decides turns server-side.

## Known limitations

- **In-memory state**: the per-IP counters and the token secret reset when the instance
  restarts or scales to zero (after ~15 min idle). The quota is best-effort; a persistent one
  would need Firestore or Redis.
- **Client IP**: `TRUSTED_PROXY_HOPS=1` takes the last `X-Forwarded-For` entry, the one added by
  Cloud Run. Check it once deployed (429 responses are logged per IP).
- **Invalid API key**: Pipecat's Gemini service logs `API key not valid` but does not end the
  pipeline, so the session stays silent until the visitor leaves or the time limit is reached.
- **Development runner**: `pipecat.runner.run` is Pipecat's development server. Its behaviour
  can change between releases; read the changelog before upgrading (`pipecat-ai<2` is pinned).
  It also mounts its prebuilt test UI on `/client`; that page cannot open sessions because its
  own origin is not in `PIPECAT_ALLOWED_ORIGINS`.
- **WebSocket transport**: Pipecat recommends WebRTC for production audio. WebSocket needs no
  TURN server on Cloud Run and is fine for short demo sessions; another transport only
  requires a new key in `VoiceAgent.transport_params()`.
