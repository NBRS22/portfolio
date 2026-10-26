# Nour El Bachari — Portfolio

Personal portfolio of a Robotics & AI engineer, with a **live voice demo**: visitors configure a voice agent in
the browser and talk to it in real time, through Nourito, an animated robot whose mouth follows the agent's voice.

- **Frontend** (`frontend/`): Next.js 16 single-page site, one detail page per project, deployed on **Vercel**.
- **Voice backend** (`backend/voice_agent/`): [Pipecat](https://docs.pipecat.ai) voice agents (Gemini Live by default)
  served over WebSocket, deployed on **Google Cloud Run**.

```
┌──────────────── Browser ────────────────┐            ┌────────── Cloud Run ──────────┐
│ Next.js site (Vercel)                   │            │ voice_backend (Pipecat)       │
│                                         │  POST      │                               │
│ Live Demo ── session config (JSON) ─────┼──/start──▶ │ guards: origin, 1 session,    │
│   personality, architecture, …          │            │ 5 min, rate limit per IP      │
│                                         │            │                               │
│ PipecatClient ◀═══ audio + transcripts ═╪═WebSocket═▶│ Gemini Live (speech-to-speech)│
│   └─ robot face: mouth ← audio level    │            │                               │
└─────────────────────────────────────────┘            └───────────────────────────────┘
```

No API key ever reaches the browser: the frontend only knows the backend's public URL, and the model key is a
Cloud Run secret.

## Repository layout

```
portfolio/
├── frontend/                 # Next.js site (see frontend/README.md)
│   ├── src/app/              # Home page, /projects/[slug], 404, social preview image
│   ├── src/components/       # Sections, project page blocks, voice demo, robot face, UI kit
│   ├── src/config/site.ts    # Identity, contact, links, navigation
│   ├── src/data/             # All content: projects, about, experience, education, skills
│   └── public/               # CV, photos, project pictures
└── backend/voice_agent/      # Pipecat voice backend (see backend/voice_agent/README.md)
    ├── src/voice_backend/    # Server, guards, session config, pluggable agents
    ├── tests/                # pytest
    └── Dockerfile            # Image built by Cloud Build for Cloud Run
```

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, Motion, shadcn/ui + Magic UI, next-themes, Vercel Analytics |
| Voice client | `@pipecat-ai/client-js`, `@pipecat-ai/websocket-transport` (Protobuf frames) |
| Backend | Python 3.12, uv, Pipecat 1.13, FastAPI/Uvicorn, pydantic-settings, pytest, Ruff |
| Models | Gemini Live (default), OpenAI Realtime, echo agent for tests |
| Hosting | Vercel (frontend), Google Cloud Run + Secret Manager (backend) |

## Run locally

Requirements: Node.js 20+ and [uv](https://docs.astral.sh/uv/).

**1. Backend** (only needed for the live demo)

```bash
cd backend/voice_agent
uv sync
cp .env.example .env          # set GOOGLE_API_KEY (Google AI Studio)
uv run python -m voice_backend # http://localhost:7860
```

**2. Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local    # NEXT_PUBLIC_VOICE_API_URL=http://localhost:7860
npm run dev                   # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint` (frontend); `uv run pytest`, `uv run ruff check` (backend).

## Deployment

### Backend on Cloud Run

The full procedure (service account, secret, flags) is in
[`backend/voice_agent/README.md`](backend/voice_agent/README.md#deploy-to-cloud-run). In short, from
`backend/voice_agent/`:

```bash
gcloud run deploy voice-agent --source . --region europe-west1 \
    --service-account voice-agent-sa@<PROJECT_ID>.iam.gserviceaccount.com \
    --allow-unauthenticated --min-instances 0 --max-instances 1 --concurrency 10 --timeout 360 \
    --set-secrets GOOGLE_API_KEY=google-api-key:latest
```

Settings are environment variables on the service, for example:

```bash
gcloud run services update voice-agent --region europe-west1 --update-env-vars GEMINI_VOICE=Leda
```

### Frontend on Vercel

1. Import the GitHub repository in Vercel and set **Root Directory** to `frontend` (framework: Next.js).
2. Add the environment variable `NEXT_PUBLIC_VOICE_API_URL` = the Cloud Run service URL.
3. Deploy. The site URL used for social previews is detected from Vercel; set `NEXT_PUBLIC_SITE_URL` for a
   custom domain.
4. Allow the site's origin on the backend: add the Vercel domain to `PIPECAT_ALLOWED_ORIGINS` on Cloud Run
   (comma-separated, no trailing slash).

## Editing content

Everything shown on the site lives in data files, no component changes needed:

| What | Where |
|---|---|
| Name, role, email, phone, links | `frontend/src/config/site.ts` |
| Bio, languages, soft skills, interests | `frontend/src/data/about.ts` |
| Experience / education | `frontend/src/data/experience.ts`, `education.ts` |
| Skills | `frontend/src/data/skills.ts` |
| Projects and their detail pages | `frontend/src/data/projects.ts` |
| CV and photos | `frontend/public/home/`, `frontend/public/projects/` |
| Voice demo presets | `frontend/src/data/voice-agent-demo.ts` |

## Security

- The frontend sends a strict Content Security Policy and security headers (`frontend/next.config.ts`).
- The backend accepts only allowed origins, one-time connection tokens, one session at a time, 5-minute sessions
  and a per-IP daily quota, to keep the public demo cheap and abuse-resistant.
- `.env` files are never committed; use the `.env.example` files as templates.

## License

© Nour El Bachari. All rights reserved. The code is public for reading; please ask before reusing it.
