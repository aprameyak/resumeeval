# ResumeScore

A production-quality SaaS web application that evaluates resumes using the **[interviewstreet/hiring-agent](https://github.com/interviewstreet/hiring-agent)** as its evaluation engine.

> **Important:** This application does NOT rewrite any evaluation logic. All scoring, prompts, weights, bonuses, deductions, and GitHub analysis remain in the upstream `hiring-agent` repository. This codebase is a UI and platform layer around that engine.

## Architecture

```
resumeeval/
├── apps/
│   ├── web/          # Next.js 15 (App Router) — frontend SaaS UI
│   └── api/          # FastAPI — REST API wrapping the hiring-agent
├── packages/
│   └── shared/       # Shared TypeScript types
├── hiring-agent/     # Cloned separately: github.com/interviewstreet/hiring-agent
├── docker-compose.yml
└── Makefile
```

```
Browser → Next.js 15 → FastAPI → HiringAgentAdapter → hiring-agent engine
                          ↓              ↓
                      PostgreSQL      Celery Worker
                      Redis           (background eval)
```

## Hiring-Agent Scoring (upstream, unmodified)

| Category          | Max Points |
|-------------------|-----------|
| Open Source       | 35        |
| Self Projects     | 30        |
| Production        | 25        |
| Technical Skills  | 10        |
| **Bonus Points**  | **+20**   |
| **Total**         | **120**   |

## Features

- **Dashboard** — Score overview, radar chart, category breakdown, timeline
- **Resume Upload** — Drag-and-drop PDF/DOCX with progress indicator
- **History** — All evaluations with expandable details and PDF download
- **Compare** — Side-by-side evaluation diff with score deltas
- **Job Match** — Evaluate resume against job description
- **GitHub Analysis** — Enriched from candidate's GitHub profile
- **PDF Reports** — Downloadable evaluation reports
- **Authentication** — JWT-based auth with refresh tokens, password reset
- **Dark Mode** — Full dark/light theme support

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Docker & Docker Compose**
- **PostgreSQL** 16 (via Docker)
- **Redis** 7 (via Docker)
- **Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)
- **GitHub Token** — Optional, for higher rate limits

## Quick Start

### 1. Clone and setup

```bash
git clone https://github.com/aprameyak/resumeeval
cd resumeeval

# For local dev only — clone the hiring-agent engine locally
# (In production Docker builds, it is cloned automatically inside the image)
git clone https://github.com/interviewstreet/hiring-agent ./hiring-agent

# Copy environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start with Docker (recommended)

```bash
# Build images (clones hiring-agent inside the API image automatically)
docker compose build

# Start all services
docker compose up -d

# Run migrations
docker compose exec api alembic upgrade head

# Seed demo user (demo@resumescore.app / demo12345)
docker compose exec api python scripts/seed.py

# Open the app
open http://localhost:3000
```

### 3. Local development

```bash
# Install all dependencies
make setup

# Start Postgres + Redis via Docker
docker compose -f docker-compose.dev.yml up -d postgres redis

# Terminal 1: API
make dev-api

# Terminal 2: Celery worker
make dev-worker

# Terminal 3: Frontend
make dev-web
```

## Environment Variables

See `.env.example` for all variables. Required ones:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for the hiring-agent |
| `SECRET_KEY` | JWT signing secret (min 32 chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `HIRING_AGENT_PATH` | Path to cloned hiring-agent repo |

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, get JWT tokens |
| `POST` | `/resumes/upload` | Upload PDF/DOCX resume |
| `GET` | `/resumes` | List user's resumes |
| `GET` | `/evaluations` | List all evaluations |
| `GET` | `/evaluations/{id}` | Get evaluation result |
| `POST` | `/evaluations/compare` | Compare two evaluations |
| `POST` | `/evaluations/job-match` | Resume vs job description |
| `GET` | `/reports/{id}/download` | Download PDF report |
| `GET` | `/health` | Health check |

## Deployment (Free Hosting)

The hiring-agent is cloned **inside the Docker image at build time** — no separate setup needed on any host.

### Frontend → Vercel (free)

```bash
cd apps/web
npx vercel --prod
# Set env var: NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### Backend + Worker + DB → Railway (free tier)

1. Create a new Railway project
2. Add a PostgreSQL service and a Redis service from the Railway dashboard
3. Deploy the API:
```bash
railway login
cd apps/api
railway up
# Set env vars in Railway dashboard:
# DATABASE_URL, REDIS_URL, SECRET_KEY, GEMINI_API_KEY, GITHUB_TOKEN
```
4. Add a second Railway service for the Celery worker with start command:
   `celery -A app.workers.tasks worker --loglevel=info --concurrency=1`

### Alternative: Render (free)

- Web Service: `apps/api/` → Docker → start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Worker: same image, start command `celery -A app.workers.tasks worker --loglevel=info`
- Add Render PostgreSQL and Redis (free tiers)

### Notes on free tier

- **File uploads**: Use S3-compatible storage (Cloudflare R2 free tier: 10GB) for persistent uploads. Set `STORAGE_BACKEND=s3` in env vars. Local storage is ephemeral on free hosts.
- **Celery + Redis**: Upstash Redis has a generous free tier and works well with Railway/Render.
- **Evaluations take 30–90s**: Free tier instances sleep — consider upgrading to avoid cold starts.

## Hiring-Agent Integration

The `HiringAgentAdapter` in `apps/api/app/services/hiring_agent_adapter.py` is the only integration point between this application and the upstream engine. It:

1. Adds the hiring-agent directory to `sys.path`
2. Imports `PDFHandler`, `fetch_and_display_github_info`, and `evaluator` from upstream
3. Calls them in sequence (parse PDF → GitHub enrichment → AI evaluation)
4. Serializes the Pydantic models to dicts for our API layer

**No evaluation logic lives in this repo.** If the upstream engine changes, only this adapter may need updating.

## Supported AI Models

The hiring-agent supports (configure via `DEFAULT_MODEL` and `LLM_PROVIDER`):

**Gemini (recommended):**
- `gemini-2.0-flash` (default, fastest)
- `gemini-2.5-flash`
- `gemini-2.5-pro`

**Ollama (local):**
- `gemma3:4b`
- `gemma3:12b`
- `qwen3:4b`

## Testing

```bash
# API tests
make test-api

# Frontend type check
cd apps/web && npm run type-check
```

## Contributing

The upstream `hiring-agent` is the source of truth for all evaluation logic. To contribute:
- UI/platform changes: PR to this repo
- Evaluation changes: PR to [interviewstreet/hiring-agent](https://github.com/interviewstreet/hiring-agent)

## License

MIT
