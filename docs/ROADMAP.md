# 18 Cricket Network — Roadmap

A phased plan to grow the current app into one unified cricket ecosystem. Each phase is scoped to a set of subsystems and builds on the previous one. Status keys: **done**, **in progress**, **planned**.

The non-negotiable product rules apply to every phase: MongoDB is the source of truth, there is no fake runtime data, empty states are shown when collections are empty, and the dev seed script (`backend/seed_database.py`) is manual/opt-in only and must never auto-populate.

## Phase A — Foundation & audit (done)
- Full repository audit (`docs/CURRENT_STATE_AUDIT.md`).
- Dark-first design system: `constants/theme.ts` tokens + `components/ui` (`Screen`, `GlassCard`, `Button`, `EmptyState`, `SkeletonLoader`, `SectionHeader`, `StatCard`).
- Fake-data removal from `home.tsx` / `profile.tsx`; data-driven screens with empty/skeleton states.
- Route + security fixes: friendly route titles, untrack `backend/.env`, add `.env.example`, remove hard-coded AI key fallback, gitignore build cache.

## Phase B — Navigation, fake-data elimination, seller foundation (in progress)
- Home navigation fix.
- Continued fake-data elimination across screens.
- New bottom navigation: **Home / Discover / Create / AI / Profile**.
- Seller onboarding foundation (see `docs/MARKETPLACE_ARCHITECTURE.md`).
- Futuristic, dark-first UI polish.

## Phase C — Teams, matches & scheduling (planned)
- Team profiles, rosters, `TeamMembership`, playing XI.
- Non-tournament (friendly) match scheduling with invites.
- Match lifecycle scaffolding ahead of the scoring engine.

## Phase D — Scoring engine, stats & scorecards (planned)
- Event-sourced `Delivery` scoring (offline-first, undo).
- Scorecards computed from delivery events (batting/bowling/FOW/partnerships).
- `SCORER` role and scorer tooling foundation.

## Phase E — Tournament organizer operations (planned)
- `TOURNAMENT_ORGANIZER` dashboard.
- Stages (round robin/groups/knockout/playoffs), fixtures.
- Auto-computed standings, points tables and NRR; leaderboards.
- Leagues/seasons/divisions governance.

## Phase F — Social graph, messaging & discovery (planned)
- Real `Follow` social graph and graph-derived feed.
- Full DM/threads, read receipts, blocking/reporting.
- `Notification` model + center.
- Universal Discover + near-me location discovery; recruiting/opportunities.

## Phase G — Marketplace completion (planned)
- Checkout + payments (behind `marketplacePayments` flag).
- Reviews/ratings; seller dashboard; product moderation lifecycle.

## Phase H — Coaches, academies & grounds (planned)
- Coach marketplace with reviews.
- Claimable academies and grounds/venues; availability + booking.

## Phase I — AI & voice (planned)
- Persistent AI layer with backend tool-calling (never fabricates data).
- Voice-first navigation, search and scoring with confirmations.

## Phase J — Analytics, media & live match center (planned)
- Advanced analytics (Manhattan/worm/wagon wheel/phases) from real data.
- `MediaAsset` + AI highlights/summaries (not faked).
- Premium live match center; awards/badges tied to real stats.

## Feature flags (planned)
- `marketplacePayments`
- `liveStreaming`
- `videoHighlights`
- `advancedAI`
- `groundBooking`
