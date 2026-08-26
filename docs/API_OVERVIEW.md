# API Overview

All endpoints are served by FastAPI under a single router with prefix **`/api`** (`backend/server.py`). Protected endpoints require an `Authorization: Bearer <JWT>` header (validated by `get_current_user`); the token is issued at register/login and is valid for 7 days. Interactive docs are available at `/docs` when the server runs.

Below, endpoints are grouped by domain. 🔒 marks endpoints that require authentication.

## Auth
- `POST /auth/register` — create account (phone + password), returns JWT + user.
- `POST /auth/login` — login, returns JWT + user.
- `GET /auth/me` 🔒 — current user.

## Products
- `GET /products` — list/filter (`category`, `is_used`, `search`, `limit`).
- `GET /products/{product_id}` — product detail.
- `POST /products` 🔒 — create (vendor/admin only).
- `PUT /products/{product_id}` 🔒 — update (owner/admin).
- `DELETE /products/{product_id}` 🔒 — delete (owner/admin).

## Academies
- `GET /academies` — list/filter by `city`.
- `GET /academies/{academy_id}` — detail.
- `POST /academies` 🔒 — create (academy/admin only).
- `POST /academies/{academy_id}/leads` 🔒 — submit a lead.

## Tournaments
- `GET /tournaments` — list/filter (`city`, `status`).
- `GET /tournaments/{tournament_id}` — detail.
- `GET /tournaments/{tournament_id}/matches` — matches for a tournament.
- `POST /tournaments` 🔒 — create (tournament_organizer/admin only).

## Grounds
- `GET /grounds` — list/filter (`city`, `ground_type`, near-me via `latitude`/`longitude`/`radius_km`).
- `GET /grounds/nearby` — near-me search.
- `GET /grounds/{ground_id}` — detail.
- `POST /grounds` 🔒 — create.
- `PUT /grounds/{ground_id}` 🔒 — update (owner).

## Training facilities
- `GET /training-facilities` — list/filter (`city`, `facility_type`, near-me).
- `GET /training-facilities/{facility_id}` — detail.
- `POST /training-facilities` 🔒 — create.

## Personal trainers
- `GET /personal-trainers` — list/filter (`city`, `specialization`, near-me).
- `GET /personal-trainers/{trainer_id}` — detail.
- `POST /personal-trainers` 🔒 — create.

## Cricket gyms
- `GET /cricket-gyms` — list/filter (`city`, near-me).
- `GET /cricket-gyms/{gym_id}` — detail.
- `POST /cricket-gyms` 🔒 — create.

## Bookings & owner contact
- `GET /bookings` 🔒 — current user's bookings.
- `POST /bookings` 🔒 — create a ground booking (auto commission split).
- `POST /contact-owner` 🔒 — send a contact request to a ground/facility/trainer/gym owner.

## Social — posts, comments, reels, stories
- `GET /posts` · `POST /posts` 🔒 · `POST /posts/{id}/like` 🔒 · `POST /posts/{id}/share` 🔒 · `POST /posts/{id}/archive` 🔒.
- `GET /posts/{id}/comments` · `POST /posts/{id}/comments` 🔒.
- `GET /reels` — posts of type `reel`.
- `GET /stories` · `POST /stories` 🔒 · `GET /stories/highlights/{user_id}`.
- `POST /profile/photo` 🔒 · `DELETE /profile/photo` 🔒.

## Squad (friends)
- `GET /squad` 🔒 · `POST /squad/add/{user_id}` 🔒 · `DELETE /squad/remove/{user_id}` 🔒.

## Messages & groups
- `GET /messages` 🔒 — conversation list · `GET /messages/{user_id}` 🔒 — thread · `POST /messages/send` 🔒.
- `GET /groups` 🔒 · `POST /groups/create` 🔒 · `POST /groups/{id}/add-members` 🔒 · `GET /groups/{id}/messages` 🔒 · `POST /groups/{id}/messages` 🔒.

## Livestreams
- `GET /livestreams` (`region`, `is_live`) · `GET /livestreams/{id}` · `POST /livestreams` 🔒.
- `POST /livestreams/{id}/join` 🔒 · `/leave` 🔒 · `/end` 🔒 (broadcaster only).

## Search & discovery
- `GET /search` — cross-entity search (`query`, optional `type`: users/products/academies/tournaments/grounds/livestreams).
- `GET /regions` — supported regions.
- `POST /users/{user_id}/verify` 🔒 (admin) · `GET /users/verified`.

## Teams
- `GET /teams` (`city`) · `GET /teams/{team_id}` · `POST /teams` 🔒.

## Orders, wishlist & dashboard
- `POST /orders/create` 🔒 · `GET /orders` 🔒 (role-scoped) · `GET /orders/{id}` 🔒 · `POST /orders/{id}/payment-success` 🔒.
- `GET /wishlist` 🔒 · `POST /wishlist/{product_id}` 🔒 · `DELETE /wishlist/{product_id}` 🔒.
- `GET /stats/dashboard` 🔒 — role-scoped counts.
- `GET /health` — health check.

## Coaching
- `GET /coaching/categories` — technique / mindset.
- `POST /coaches/register` 🔒 · `GET /coaches` (`category`, `city`, `search`) · `GET /coaches/me` 🔒 · `GET /coaches/{coach_id}`.
- `POST /coaching/sessions` 🔒 · `POST /coaching/sessions/{id}/join` 🔒 · `POST /coaching/sessions/{id}/cancel` 🔒 · `GET /coaching/sessions` 🔒 (`scope`, `category`, `coach_id`).

## AI chatbot
- `POST /chatbot` — request/response assistant. Returns a graceful "not configured" message unless `EMERGENT_LLM_KEY`/`OPENAI_API_KEY` is set. This is a single popup, not yet the persistent tool-calling AI layer targeted in the roadmap.

## Planned / partial
- **Sellers** — seller onboarding endpoints (`SellerProfile` create/submit/approve, seller dashboard) are **planned**; today product creation is gated only on the `vendor` `user_type` (see `docs/MARKETPLACE_ARCHITECTURE.md`).
- **Payments** — Razorpay order creation exists inside order flow but full checkout/payments is gated behind the `marketplacePayments` flag (planned).
