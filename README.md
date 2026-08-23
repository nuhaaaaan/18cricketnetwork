# 18 Cricket Network

One cricket ecosystem — scoring, tournaments, teams, community, discovery, coaching, and a gear marketplace — in a single mobile-first product. 18 Cricket Network is built independently, with its own architecture and dark-first visual language.

## Vision

Unify the strongest capabilities of several category-leading products into one cricket platform (each is a **functional reference only** — no cloning of code, design, or assets):

- **CricHeroes** — scoring, stats, tournaments.
- **MSCL / league sites** — leagues, seasons, governance.
- **Brewing Cricket** — grassroots community and local discovery.
- **Amazon** — marketplace and commerce.
- **Instagram** — social graph and media.
- **Google Maps** — location-based discovery.
- **18 Cricket AI** — a native intelligence + voice layer (our differentiator).

## Tech stack

- **Client**: Expo / React Native `0.79.5`, React `19`, expo-router v5 (file-based, `typedRoutes`), Zustand, axios (`utils/api.ts` attaches the JWT). Configured via `EXPO_PUBLIC_BACKEND_URL`.
- **Backend**: FastAPI (monolithic `backend/server.py`, single `APIRouter(prefix="/api")`), MongoDB via `motor`. Auth is phone + password with JWT (PyJWT) and bcrypt.
- **Design system**: `constants/theme.ts` (dark-first tokens) + `components/ui` primitives; `utils/format.ts` centralizes currency.

## Architecture summary

```
Expo / React Native client  ──HTTPS + Bearer JWT──▶  FastAPI (/api)  ──motor──▶  MongoDB
```

Clients never connect to MongoDB directly — all data access goes through the `/api` layer. See `docs/ARCHITECTURE.md`.

## Core principle — MongoDB is the source of truth

There is **no fake runtime data**. When a collection is empty, the app shows a premium empty state rather than placeholder content. The dev seed script (`backend/seed_database.py`) is **manual / opt-in only** and must never auto-populate the database.

## Quick start (local dev)

Backend (FastAPI + MongoDB). Copy `backend/.env.example` to `backend/.env` and fill in values (at minimum `MONGO_URL` and `DB_NAME`; `JWT_SECRET`, and optional `EMERGENT_LLM_KEY`/`OPENAI_API_KEY` and `RAZORPAY_*`):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

Frontend (Expo, web target):

```bash
cd frontend
yarn install
# set EXPO_PUBLIC_BACKEND_URL to your backend URL (e.g. http://localhost:8001)
yarn expo start --web
```

Optional — seed demo data for local development only (never in production):

```bash
python backend/seed_database.py
```

Interactive API docs are available at `http://localhost:8001/docs`.

## Documentation

- [`docs/CRICKET_PLATFORM_FEATURE_MATRIX.md`](docs/CRICKET_PLATFORM_FEATURE_MATRIX.md) — capabilities vs. reference products, current status, priority.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased roadmap (A–J) and feature flags.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering, folders, request/auth flow.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — collections and target additions.
- [`docs/ROLES_AND_PERMISSIONS.md`](docs/ROLES_AND_PERMISSIONS.md) — current vs. target RBAC.
- [`docs/API_OVERVIEW.md`](docs/API_OVERVIEW.md) — endpoints by domain.
- [`docs/MARKETPLACE_ARCHITECTURE.md`](docs/MARKETPLACE_ARCHITECTURE.md) — seller + product lifecycles.
- [`docs/TOURNAMENT_ARCHITECTURE.md`](docs/TOURNAMENT_ARCHITECTURE.md) — tournaments, stages, standings.
- [`docs/CURRENT_STATE_AUDIT.md`](docs/CURRENT_STATE_AUDIT.md) · [`docs/CRICHEROES_FEATURE_GAP_ANALYSIS.md`](docs/CRICHEROES_FEATURE_GAP_ANALYSIS.md).

## Secrets

Configuration comes from environment variables (see `backend/.env.example` and `EXPO_PUBLIC_BACKEND_URL`). Never commit real secrets.
