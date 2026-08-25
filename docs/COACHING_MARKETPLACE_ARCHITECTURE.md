# 18 Cricket Network — Coaching Marketplace Architecture

This document describes the production-oriented coaching marketplace added to the
existing 18 Cricket Network application. It extends the current FastAPI + MongoDB
(motor) backend and the Expo / React Native frontend **without removing** existing
functionality. The legacy coaching endpoints remain mounted; the marketplace is a
new, cleanly separated module.

> **Absolute rule — no fake data.** The platform contains **real registered coaches
> only**. There is no seeding of coaches, certifications, reviews, sessions, or
> availability. Discovery only ever returns coaches an administrator has approved.
> When none exist, the UI shows a professional empty state.

---

## 1. Where the code lives

| Concern | Location |
| --- | --- |
| Backend module (models, routes, storage, RBAC, audit) | `backend/coaching_marketplace.py` |
| Router + startup index wiring | `backend/server.py` (bottom) |
| Backend tests | `backend/test_coaching_marketplace.py` |
| Shared FE types + API client | `frontend/utils/coaching.ts` |
| Reusable FE form controls | `frontend/components/coaching/Fields.tsx` |
| Coaching Home | `frontend/app/coaching/index.tsx` |
| Coach Partnership disclosure | `frontend/app/coaching/partnership.tsx` |
| Multi-step onboarding wizard | `frontend/app/coaching/apply.tsx` |
| Coach discovery + filters | `frontend/app/coaching/discover.tsx` |
| Public coach profile + booking | `frontend/app/coaching/coach/[id].tsx` |
| Coach dashboard | `frontend/app/coaching/dashboard.tsx` |
| Player sessions | `frontend/app/coaching/my-sessions.tsx` |
| Admin review dashboard | `frontend/app/admin/coaches.tsx` |

The module is mounted with `app.include_router(create_coaching_router(db, get_current_user))`
so it shares the same database handle and JWT authentication dependency as the rest
of the API.

---

## 2. Coach lifecycle

```
User
 → Apply as Coach (Partnership disclosure)
 → Build Coach Profile (multi-step, autosaved draft)
 → Select Services
 → Configure Pricing
 → Upload Qualifications (secure, private)
 → Add Experience
 → Set Availability (structured, recurring)
 → Accept Commercial Terms
 → Submit Application            → status SUBMITTED
 → 18 Cricket Review             → status UNDER_REVIEW / NEEDS_INFORMATION
 → Credentials Verified          → certification status VERIFIED
 → Coach Approved                → status APPROVED, COACH role granted, publishedAt set
 → Coach Profile Published       → appears in discovery
 → Player Discovers Coach        → filtered search of APPROVED coaches only
 → Player Books Session          → CoachSession status REQUESTED
 → Physical or Virtual Training
 → Session Completed             → COMPLETED
 → Future Payment/Payout         → payout breakdown computed; settlement not activated
 → Review                        → real review tied to a completed session
 → Coach Reputation Grows        → averageRating/reviewCount recomputed from real reviews
```

### Coach statuses
`DRAFT → SUBMITTED → UNDER_REVIEW → NEEDS_INFORMATION → APPROVED / REJECTED / SUSPENDED`.
Only **APPROVED** coaches are public.

### Certification statuses
`PENDING → UNDER_REVIEW → VERIFIED / REJECTED / EXPIRED / NEEDS_INFORMATION`.

### Session (booking) statuses
`REQUESTED → PENDING_PAYMENT → CONFIRMED → DECLINED → CANCELLED → COMPLETED → NO_SHOW → REFUNDED`.

---

## 3. Database collections

All collections are additive; nothing existing is dropped or renamed.

| Collection | Purpose |
| --- | --- |
| `coach_profiles` | One per user. Onboarding + published profile, verification statuses. |
| `coach_services` | Services offered (category/subcategory/title/format flags). |
| `coach_pricing` | Structured pricing per session format/duration/currency. |
| `coach_certifications` | Credential **metadata** + secure storage reference (never file bytes). |
| `coach_experience` | Self-reported experience (never auto-verified). |
| `coach_availability` | Structured recurring weekly slots. |
| `coach_blocked_dates` | Vacation / unavailable dates. |
| `coach_applications` | Application records / review queue. |
| `coach_sessions` | Bookings + payout breakdown snapshot. |
| `coach_reviews` | Real reviews, one per completed session. |
| `coach_platform_fee_config` | Single configurable commercial-terms document. |
| `coach_admin_notes` | Internal admin notes. |
| `coach_audit_log` | Append-only audit trail. |
| `coach_notifications` | Queued notification events. |

### Indexes (created on startup, idempotent)
- `coach_profiles`: `userId` (unique), `status`, `(country,state,city)`, `specializations`, `virtualAvailable`
- `coach_services`: `coachId`, `(category,active)`
- `coach_pricing`: `coachId`, `(coachId,active)`
- `coach_certifications`: `coachId`, `status`
- `coach_availability`: `(coachId,dayOfWeek)`
- `coach_sessions`: `(coachId,scheduledStart)`, `(playerId,scheduledStart)`, `status`
- `coach_reviews`: `coachId`, `sessionId` (unique)

### Key document shapes
See the Pydantic models in `backend/coaching_marketplace.py`. `CoachProfile` holds
identity, profile, location, virtual meeting config (private), verification statuses
(`identityVerificationStatus`, `backgroundCheckStatus`, `safeguardingStatus`,
`childCoachingEligible`), and aggregate stats. Sensitive/authentication data is not
duplicated from the user record beyond what onboarding needs.

---

## 4. API endpoints

Paths follow the repo convention (`/api` prefix, JWT via `Authorization: Bearer`).
Discovery lives under `/api/coaching/coaches` to avoid colliding with the legacy
`/api/coaches/{id}` route.

### Taxonomy & commercials
- `GET /api/coaching/taxonomy` — categories, session formats, durations, currencies, etc.
- `GET /api/coaching/platform-fee` — current disclosed commercial terms.
- `PUT /api/admin/coaching/platform-fee` — **admin** configures fee (no hard-coding).

### Onboarding / my coach profile
- `GET /api/coach-profiles/me`
- `PUT /api/coach-profiles/me` — create/update draft (autosave; partial).
- `POST /api/coach-applications/submit` — server-side validated submission.
- `GET/POST /api/coach-profiles/me/services`, `PUT/DELETE /api/coach-services/{id}`
- `GET/POST /api/coach-profiles/me/pricing`, `DELETE /api/coach-pricing/{id}`
- `GET/PUT /api/coach-profiles/me/experience`
- `GET/PUT /api/coach-profiles/me/availability`, `POST .../blocked-dates`
- `GET/POST /api/coach-profiles/me/certifications` (multipart upload)
- `GET /api/coach-profiles/me/overview` — dashboard metrics (0 when empty).

### Certifications (secure)
- `GET /api/coach-certifications/{id}/signed-url` — owner/admin mint short-lived token.
- `GET /api/coach-certifications/{id}/file?token=...` — token-gated stream.

### Discovery (public, APPROVED only)
- `GET /api/coaching/coaches` — filters: country, state, city, specialization,
  sessionFormat, virtual, inPerson, minExperience, maxPrice, verifiedOnly, search.
- `GET /api/coaching/coaches/facets` — countries/cities/specializations for filters.
- `GET /api/coaching/coaches/{id}` — privacy-safe public profile.
- `GET /api/coaching/coaches/{id}/availability`

### Bookings & reviews
- `POST /api/coaching/bookings`, `GET /api/coaching/bookings/me?role=player|coach`
- `POST /api/coaching/bookings/{id}/cancel`
- `POST /api/coaching/reviews` — only for the player's own COMPLETED session.

### Admin review dashboard (RBAC-gated)
- `GET /api/admin/coaches?status=...`, `GET /api/admin/coaches/{id}`
- `POST /api/admin/coaches/{id}/approve|reject|request-info|review|suspend|restore`
- `POST /api/admin/coaches/{id}/notes`
- `POST /api/admin/certifications/{id}/verify|reject`
- `GET /api/admin/certifications/{id}/signed-url`
- `GET /api/coaching/notifications/me`

---

## 5. Permissions (RBAC)

Roles are stored on the user document (`roles[]`) alongside the legacy `user_type`.

| Role | How it is granted | Capabilities |
| --- | --- | --- |
| `COACH_APPLICANT` | On starting/submitting an application | Manage own draft, upload own docs. |
| `COACH` | **Only** when an admin approves | Public profile, dashboard, receive bookings. |
| `PLATFORM_ADMIN` | `user_type == 'admin'` or `roles` contains `admin`/`platform_admin` | Review, verify, approve/reject/suspend, configure fees. |

A user may hold multiple roles simultaneously (e.g. `PLAYER + COACH`). A coach
applicant never receives coach privileges automatically. All admin endpoints are
guarded by a `require_admin` dependency; unauthorized calls return `403`.

---

## 6. Secure document handling

- Certificate files are **never** stored in MongoDB — only metadata plus a
  `storageProvider`/`storageKey` reference.
- Default storage is a private on-disk directory (`backend/private_uploads/`, git-ignored),
  outside any public path. If `COACH_S3_BUCKET` (+ AWS creds) is configured, the same
  interface transparently uses **private S3 objects**.
- Uploads validate: allowed MIME (`application/pdf`, `image/jpeg`, `image/png`),
  **magic-byte sniffing** (extension is never trusted), and a size limit
  (`COACH_MAX_FILE_BYTES`, default 10 MB).
- Retrieval requires a **short-lived signed token** (15 min JWT) minted only for the
  owning coach or an admin. Public coach profiles expose only "Verified Qualification"
  — never the document, credential number, or storage location.
- Storage secrets are never sent to the client.

---

## 7. Platform fee architecture (configurable, not hard-coded)

`coach_platform_fee_config` (single document) holds:
`coachPlatformFeeType` (`percentage|flat|none`), `coachPlatformFeeValue`,
`coachPlatformFeeCurrency`, `coachPlatformFeeEffectiveDate`, plus processor-fee and
tax fields. **Default is `none`** — no commission is hard-coded. Admins change it via
`PUT /api/admin/coaching/platform-fee`.

Separate concepts are preserved and computed transparently at booking time:

```
Session Price
 − Platform Fee (18 Cricket Network)
 − Payment Processing Fee
 = Coach Payout      (Taxes tracked separately)
```

No real settlement is performed; the breakdown is stored on each booking for future
payment integration.

---

## 8. Session & policy model

Bookings capture coach, player, service, pricing, session type, delivery mode,
schedule, participants, price and payout breakdown. Group formats carry
minimum/maximum participants and per-person pricing. Cancellation/refund/no-show and
other policies are represented as coach- and (future) platform-configurable fields
(e.g. `cancellationPolicy`, `bookingLeadTimeHours`, `minCancellationNoticeHours`),
ready to be enforced when payments go live.

---

## 9. Virtual & physical sessions

- **Virtual:** `meetingProvider`, `meetingUrl`, `meetingId`, `meetingPassword`,
  `virtualInstructions` are stored privately and are **never** exposed on the public
  profile — they become available to authorized booked participants only.
- **Physical:** city/state/country/lat/long, `travelRadiusKm`, travel preferences and
  preferred facilities. Coaches can later associate with grounds/academies/clubs.
  No locations are invented.

---

## 10. Safety architecture

Verification statuses (`NOT_REQUESTED|PENDING|VERIFIED|FAILED|EXPIRED`) exist for
identity, background check and safeguarding, plus `childCoachingEligible`. The system
**never** claims a check was completed unless its status is genuinely `VERIFIED`.
Credibility badges (`18 Cricket Verified Coach`, `Identity Verified`,
`Certification Verified`, `Safeguarding Verified`, `Background Check Verified`) are
emitted **only** when their backing verification is complete — never faked.

---

## 11. Audit & notifications

Every lifecycle and admin mutation writes to `coach_audit_log`
(`actorId, action, entityType, entityId, oldValue, newValue, timestamp, metadata`):
application submitted, profile edited, certificate uploaded/verified/rejected, coach
approved/rejected/suspended/restored, pricing changed, session requested/cancelled,
platform-fee changed, admin notes. Notification events (application submitted/under
review/more-info, certification verified/rejected, coach approved/rejected, booking
requested/confirmed/cancelled, session reminder/completed, review request) are queued
in `coach_notifications`.

---

## 12. Testing

`backend/test_coaching_marketplace.py` runs the real app against a throwaway database
and covers: taxonomy/fee defaults, no-fake-data empty state, draft autosave, submission
validation, certification upload type-validation, full submission, discovery excludes
unapproved profiles, unauthorized approval/verification (403), admin approval +
publication + role assignment, public-profile privacy, certification verification +
badge, secure signed-URL document access, booking + payout breakdown, configurable
platform fee, suspend/restore, and audit-log writes.

Run:

```bash
cd backend
MONGO_URL="mongodb://localhost:27017" ./.venv/bin/python -m pytest test_coaching_marketplace.py -v
```

---

## 13. Future payments

The model is payout-ready (price, platform fee, processor fee, coach payout on every
booking) and designed for a marketplace provider such as Stripe Connect. No fake
checkout is implemented and no raw card data is ever stored.
