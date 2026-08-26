# 18 Cricket Network — Current State Audit

_Audit date: 2026-08-23. Scope: full repository inspection prior to Phase A productionization._

## 1. Stack & versions

| Layer | Technology | Version |
| --- | --- | --- |
| Mobile/web client | Expo (React Native) | expo `^54.0.30`, react-native `0.79.5`, react `19.0.0` |
| Routing | expo-router (file-based) | `~5.1.4`, `typedRoutes` enabled |
| State | Zustand | `^5.0.8` (`authStore`, `cartStore`, `locationStore`) |
| HTTP | axios | `^1.13.2` (shared instance in `utils/api.ts`) |
| Backend | FastAPI (Python) | `0.110.1`, uvicorn `0.25.0` |
| DB driver | Motor (async MongoDB) | `3.3.1` (pymongo `4.5.0`) |
| Auth | JWT (PyJWT) + bcrypt | phone + password |
| Payments | Razorpay SDK | `2.0.0` (INR-only, keys empty) |
| AI | OpenAI SDK | chatbot endpoint |
| Package manager | yarn `1.22.22` (frontend); pip (backend) | committed `package-lock.json` (npm) also present — mixed |

## 2. Routes / screens map

Existing routes (`frontend/app`):

- `index.tsx` — welcome/redirect
- `auth/login.tsx`, `auth/register.tsx`
- `(tabs)/home.tsx`, `(tabs)/marketplace.tsx`, `(tabs)/social.tsx`, `(tabs)/navigate.tsx`, `(tabs)/profile.tsx`
- `academies/list.tsx`, `grounds/list.tsx`, `tournaments/list.tsx`
- `messages/index.tsx`, `reels/index.tsx`, `comments/[id].tsx`
- `coaching/index.tsx`, `coaching/[category].tsx`, `coaching/become-coach.tsx`, `coaching/my-sessions.tsx`

### Broken / missing navigation targets (referenced in code, no route file)

| Referenced from | Target route | Status |
| --- | --- | --- |
| `marketplace.tsx` | `/cart` | **Missing** (explicitly flagged by product) |
| `marketplace.tsx` | `/products/[id]`, `/products/create` | **Missing** |
| `_layout.tsx` | `/checkout` | Registered, **no screen file** |
| `academies/list.tsx` | `/academies/[id]` | **Missing** |
| `grounds/list.tsx` | `/grounds/[id]` | **Missing** |
| `tournaments/list.tsx` | `/tournaments/[id]` | **Missing** |
| `messages/index.tsx` | `/messages/[id]` | **Missing** (no thread view) |
| `social.tsx` | `/social/create-post` | **Missing** |
| `profile.tsx` | `/profile/settings` | **Missing** |

These currently lead to the expo-router "unmatched route" screen — the primary source of broken navigation.

## 3. Reusable components (today)

Only a handful exist: `Logo`, `ChatBot/*` (FloatingChatButton, ChatInterface, ChatBotWrapper), `Navigation/SearchBar`, `Navigation/LocationInfoCard`. There is **no design system** — every screen re-declares its own `StyleSheet`, colors, headers and card styles.

## 4. UI consistency problems

- **Theme is inconsistent.** Dark screens (`home`, `marketplace`, `profile`, `social` use `Colors.background`=`#000`) coexist with **white** screens (`grounds/list`, `academies/list`, `tournaments/list` use `backgroundColor: Colors.white` with `color: Colors.text` which is **also white** → low-contrast/invisible text in places).
- **Developer-looking titles.** The root `Stack` shows raw route names (`academies/list`, `grounds/list`, `tournaments/list`, `messages/index`) as navigation headers because those routes are not registered with friendly titles / `headerShown:false`.
- Duplicated header/card/`StyleSheet` blocks across nearly every screen.

## 5. Fake / hard-coded / mocked data (must be removed from runtime)

| File | Fake data |
| --- | --- |
| `app/(tabs)/home.tsx` | Stories `Virat, Rohit, Dhoni, KL Rahul`; "Trending Gear" 4× hard-coded `Cricket Bat ₹2,500`; "Live Tournament" `Bengaluru Premier League` (hard-coded, non-functional "Watch Now") |
| `app/(tabs)/profile.tsx` | Hard-coded stats `Posts 12 / Orders 8 / Bookings 5` |
| `backend/seed_database.py` | Demo/seed content (products, coaches, tournaments, etc.) — **manual dev tool only, not auto-run**; retained as a dev utility per policy |

`social.tsx`, `marketplace.tsx`, `academies/list.tsx`, `grounds/list.tsx`, `tournaments/list.tsx` already fetch from the API (good), but lack polished empty/skeleton/error states.

## 6. Backend / API architecture

- Single monolithic `backend/server.py` (~2,300 lines) defines all models + one `APIRouter(prefix="/api")` and includes it. Endpoints cover: auth, products, academies, tournaments, grounds, training facilities, personal trainers, cricket gyms, bookings, posts/comments/reels/stories, squad, direct messages, group chats, livestreams, search, teams, orders, wishlist, dashboard stats, chatbot, and the newly added coaching endpoints.
- **Dead/unused code:** `server.py` imports **none** of `api_main.py`, `api_routers.py`, `api_marketplace.py`, `bat_services_models.py`, `facility_models.py`, `league_models.py`, `social_models.py`, `payment_models.py`, `streaming_models.py`, `rankings_models.py`, `extended_features_models.py`, `match_aggregator.py`, `news_aggregator.py`, `scheduler_service.py`. These are legacy/alternate implementations and should be pruned in a dedicated cleanup (flagged, not deleted in Phase A to avoid risk).
- No pagination on most list endpoints (only `limit`), no rate limiting, business logic lives directly in route handlers (no service layer).

## 7. MongoDB models & collections

Collections in use: `users, products, academies, academy_leads, tournaments, matches, grounds, training_facilities, personal_trainers, cricket_gyms, bookings, contact_requests, posts, comments, stories, squad, direct_messages, group_chats, group_messages, livestreams, teams, orders, wishlist, coaches, coaching_sessions`.

Gaps vs. the product vision (Section 27 of the brief): no `PlayerProfile`, `TeamMembership`, `Innings`, `Delivery`, `Fixture`, `TournamentStage/Registration`, `SellerProfile`, `Cart`, `Conversation`, `Follow`, `Notification`, `MediaAsset`, `Verification`, `AuditLog`. IDs are a mix of app-level `uuid` string `id` and Mongo `ObjectId` `_id` (users key off `ObjectId`).

## 8. Authentication

- `POST /api/auth/register` + `/login` issue a 7-day JWT `{phone, user_type}`; password hashed with bcrypt. `get_current_user` reads the `Authorization: Bearer` header and looks up the user by phone.
- **Frontend token bug (fixed in prior work):** `utils/api.ts` created its own axios instance that never received the token set on the global axios default; a request interceptor now attaches the token from AsyncStorage.

## 9. Roles / permissions

- Only a single `user_type` string (`player | vendor | academy | tournament_organizer | admin`) + an ad-hoc `is_coach` flag. **No RBAC**: authorization is minimal and mostly enforced ad hoc (e.g., product create checks `user_type in [vendor, admin]`). No multi-role support, no permission matrix, no audit log.

## 10. AI implementation

- `POST /api/chatbot` builds context by querying a few collections then calls OpenAI. Frontend is a floating chat button + interface (`components/ChatBot/*`). It is a single request/response popup — not a persistent platform layer and it does not call structured backend tools.

## 11. Security issues found

- **`backend/.env` is committed to git** and contains a real MongoDB Atlas password (`git ls-files` confirms it is tracked). The old cluster no longer resolves, but committing credentials is unsafe. → Untrack in Phase A, add `.env.example`, fix `.gitignore`.
- **Hard-coded AI key fallback** in `server.py`: `EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-…')`. → Remove the literal fallback; require env var.
- CORS is fully open (`allow_origins=["*"]`) — acceptable for dev, revisit for production.
- `frontend/.metro-cache/` (~9,700 files) is committed — build cache noise; should be gitignored.

## 12. Build / type / test status

- No test suite exists in the frontend (only backend `test_api.py`, a manual script hitting a mismatched `/api/v1/...` path that does not match real routes).
- No CI, no typecheck script wired. `tsconfig.json` present (extends `expo/tsconfig.base`, `strict: true`).
- The Expo **web** target did not build until prior work added a web stub for `react-native-maps` and fixed a default-vs-named `Colors` import; it now bundles (HTTP 200).

## 13. What is reusable vs. needs replacement

- **Reusable:** auth flow, most CRUD API endpoints, coaching feature, marketplace product listing/query, social posts fetch, Zustand stores, `Logo`.
- **Replace/refactor:** all per-screen styling → design system; hard-coded home/profile content → data-driven; broken navigation targets → implement or guard; light/dark inconsistency → dark-first tokens; single `user_type` → RBAC (later phase); monolithic `server.py` → service layer (later phase).

## 14. Phase A scope (this pass)

1. Design-system foundation: dark-first tokens (`constants/theme.ts`) + reusable components (`Screen`, `GlassCard`, `EmptyState`, `SkeletonLoader`, `PrimaryButton`, `SecondaryButton`, `SectionHeader`, `StatCard`).
2. Remove hard-coded/fake data from `home.tsx` and `profile.tsx`; make data-driven with polished empty/skeleton states.
3. Fix developer route titles → friendly names.
4. Implement the marketplace vertical slice: `/cart` (real, backed by `cartStore`), `/products/[id]`, `/checkout` foundation.
5. Security: untrack `backend/.env`, add `.env.example`, remove the hard-coded AI key fallback, gitignore `.metro-cache`.
6. Add polished empty states to list screens.

Later phases (B–J) are captured in `docs/CRICHEROES_FEATURE_GAP_ANALYSIS.md` and the product roadmap.
