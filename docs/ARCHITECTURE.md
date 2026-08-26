# Architecture

18 Cricket Network is a mobile-first cricket ecosystem with an Expo/React Native client, a FastAPI backend, and MongoDB for storage. Clients never talk to MongoDB directly — all data access goes through the `/api` HTTP layer.

## Layering

```
┌─────────────────────────────────────────────────────────┐
│  Client — Expo / React Native (expo-router, web + native) │
│  screens (app/) · design system (components/ui,           │
│  constants/theme) · Zustand stores · axios (utils/api.ts) │
└───────────────┬───────────────────────────────────────────┘
                │  HTTPS + JSON, Authorization: Bearer <JWT>
                │  EXPO_PUBLIC_BACKEND_URL + "/api"
                ▼
┌─────────────────────────────────────────────────────────┐
│  API — FastAPI (backend/server.py)                        │
│  single APIRouter(prefix="/api") · Pydantic models ·      │
│  JWT auth (PyJWT) + bcrypt · CORS                         │
└───────────────┬───────────────────────────────────────────┘
                │  Motor (async MongoDB driver)
                ▼
┌─────────────────────────────────────────────────────────┐
│  Data — MongoDB (db = client[DB_NAME])                    │
│  source of truth · uuid string id + Mongo ObjectId _id    │
└─────────────────────────────────────────────────────────┘
```

## Tech stack

- **Client**: Expo/React Native `0.79.5`, React `19`, `expo-router` v5 (file-based, `typedRoutes`), Zustand for state, axios (`utils/api.ts` shared instance that attaches the JWT).
- **Backend**: FastAPI, monolithic `backend/server.py` (~2,400 lines), one `APIRouter(prefix="/api")`. Auth is phone + password with JWT (PyJWT) and bcrypt password hashing. Optional Razorpay + OpenAI integrations initialize only when env vars are set.
- **DB**: MongoDB via `motor` (async). See `docs/DATA_MODEL.md`.

## Folder structure

- `frontend/app/` — expo-router routes (file-based).
  - `(tabs)/` — `home`, `marketplace`, `social`, `navigate`, `profile` + `_layout`.
  - `auth/` — `login`, `register`.
  - `academies/`, `grounds/`, `tournaments/` — `list` + `[id]` detail.
  - `products/[id]`, `cart`, `checkout` — marketplace slice.
  - `coaching/`, `messages/`, `reels/`, `comments/[id]`.
- `frontend/components/ui/` — design system (`Screen`, `GlassCard`, `Button`, `EmptyState`, `SkeletonLoader`, `SectionHeader`, `StatCard`, barrel `index.ts`).
- `frontend/components/` — `Logo`, `ChatBot/*`, `Navigation/*`.
- `frontend/constants/theme.ts` — dark-first design tokens (legacy `Colors.ts` maps onto the same palette).
- `frontend/store/` — Zustand stores: `authStore`, `cartStore`, `locationStore`.
- `frontend/utils/` — `api.ts` (axios + JWT interceptor), `format.ts` (centralized currency/date), location/navigation services.
- `backend/server.py` — the running API (all models + routes).
- `backend/seed_database.py` — manual/opt-in dev seed script (never auto-runs).

## Request flow

1. A screen calls the shared axios instance in `utils/api.ts` (base URL = `EXPO_PUBLIC_BACKEND_URL` + `/api`).
2. A request interceptor reads the token from `AsyncStorage` and sets `Authorization: Bearer <token>`.
3. FastAPI routes the request under `/api`; protected routes depend on `get_current_user`.
4. Handlers query MongoDB through Motor and return JSON (Mongo `_id` is stringified in responses).

## Auth flow

- `POST /api/auth/register` and `/login` verify credentials (bcrypt) and issue a 7-day JWT signed with `JWT_SECRET` (HS256), carrying `{phone, user_type}`.
- The client stores the token and sends it on every request.
- `get_current_user` validates the Bearer token and loads the user by phone; `GET /api/auth/me` returns the current user.

## Design system

Lives in `constants/theme.ts` (tokens) and `components/ui` (primitives). Screens should compose these instead of re-declaring per-screen styles; `utils/format.ts` centralizes currency so it is never hard-coded per screen.

## Planned service/repository layering

The backend is currently monolithic: models and business logic live directly in `server.py` route handlers, with no service or repository layer, minimal pagination (`limit` only), and no rate limiting. The **target** is to extract domain service modules (e.g. auth, marketplace, tournaments, social, coaching) with a repository layer over MongoDB, add indexes and cursor-based pagination, and prune the legacy/unused modules in `backend/` (`api_main.py`, `api_routers.py`, `api_marketplace.py`, `*_models.py`, `match_aggregator.py`, `news_aggregator.py`, `scheduler_service.py`) that `server.py` does not import.
