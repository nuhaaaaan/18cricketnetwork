# Data Model

MongoDB is the single source of truth. There is no fake runtime data; empty collections render premium empty states rather than placeholders.

## ID conventions

- Most documents carry an application-level `id`: a UUID string (`str(uuid.uuid4())`), which is what routes look up on (e.g. `find_one({"id": ...})`).
- Every document also has Mongo's `_id` (`ObjectId`), stringified in API responses.
- **Users are the exception**: they are keyed on `ObjectId` `_id` (no separate uuid `id`), and other documents reference a user via `str(user["_id"])` (e.g. `vendor_id`, `owner_id`, `user_id`).
- Indexes and cursor-based pagination are a **target** (today most list endpoints use only a `limit`).

## Existing collections

Derived from the Pydantic models and handlers in `backend/server.py`.

- **users** — `phone`, `email?`, `name`, `user_type` (player/vendor/academy/tournament_organizer/admin), `password` (bcrypt), `profile_image?`, `wishlist[]`, `cart[]`, `is_coach?`, `is_verified?`, `verification_type?`, `created_at`.
- **products** — `id`, `vendor_id`, `vendor_name`, `category`, `sub_category?`, `price`, `original_price?`, `stock`, `images[]`, `brand?`, feature flags (`is_featured`/`is_new_arrival`/`is_best_seller`/`is_used`), `specifications`, `rating`, `reviews_count`, `commission_rate`.
- **academies** — `id`, `owner_id`, `name`, `description`, `location`, `city`, `fees`, `schedule`, `facilities[]`, `coaches[]`, `contact_phone`, `rating`, `lead_count`.
- **academy_leads** — `academy_id`, `user_id`, `user_name`, `user_phone`, `user_email?`, `message?`, `status` (pending/contacted/enrolled).
- **tournaments** — `id`, `organizer_id`, `name`, `location`, `city`, `start_date`, `end_date`, `tournament_type`, `registration_fee`, `prize_money?`, `max_teams`, `teams_registered`, `status` (upcoming/ongoing/completed).
- **matches** — `id`, `tournament_id`, `team1_id/name`, `team2_id/name`, `match_date`, `venue`, `status` (scheduled/live/completed), `team1_score?`, `team2_score?`, `winner_id?`, `mvp_player?`.
- **grounds** — `id`, `owner_id/name/phone`, `name`, `location`, `city`, `latitude?`, `longitude?`, `ground_type`, `facilities[]`, `pricing{}`, `time_slots[]`, contact fields, `rating`, `is_verified`, `commission_rate`.
- **training_facilities** — `id`, `owner_id`, `facility_type`, `name`, `location`, `city`, geo, `facilities[]`, `pricing{}`, contact fields, `is_verified`, `commission_rate`.
- **personal_trainers** — `id`, `user_id`, `name`, `bio`, `specialization[]`, `experience_years`, `certifications[]`, `pricing{}`, `location`, `city`, geo, `availability[]`, `is_verified`, `commission_rate`.
- **cricket_gyms** — `id`, `owner_id`, `name`, `location`, `city`, geo, `facilities[]`, `pricing{}`, `trainers[]`, `opening_hours`, `is_verified`, `commission_rate`.
- **bookings** — `id`, `ground_id`, `user_id/name/phone`, `booking_date`, `time_slot`, `booking_type`, `total_amount`, `platform_commission`, `owner_payout`, `payment_status`, `booking_status`.
- **contact_requests** — owner-contact messages (`from_user_*`, `to_owner_id`, `owner_type`, `message`, `contact_method`, `status`).
- **posts** — `id`, `user_id/name/image`, `content`, `images[]`, `post_type` (post/reel/highlight), `likes`, `comments`, `shares`, `video_url?`, `is_archived`.
- **comments** — `id`, `post_id`, `user_id/name/image`, `content`, `likes`.
- **stories** — `id`, `user_id/name/image`, `image`, `expires_at` (24h), `is_highlight`, `highlight_name?`.
- **squad** — friend/follow-like link: `user_id`, `squad_member_id/name/image`.
- **direct_messages** — `id`, `sender_id/name`, `receiver_id`, `content`, `images[]`, `is_read`.
- **group_chats** — `id`, `name`, `creator_id`, `members[]` (max 100), `image?`.
- **group_messages** — `id`, `group_id`, `sender_id/name`, `content`, `images[]`.
- **livestreams** — `id`, `broadcaster_id/name/type`, `title`, `stream_url`, `is_live`, `viewers`, `region`, `match_info?`.
- **teams** — `id`, `name`, `captain_id/name`, `description?`, `logo?`, `members[]`, `city`, `matches_played`, `matches_won`.
- **orders** — `id`, `user_id/name/phone/email?`, `items[]` (OrderItem: product/vendor/qty/price), `total_amount`, `platform_commission`, shipping fields, `payment_status`, `order_status`, `razorpay_*?`.
- **wishlist** — stored as a `wishlist[]` array of product ids on the user document.
- **coaches** — `id`, `user_id`, `name`, `category` (technique/mindset), `bio`, `specializations[]`, `experience_years`, `city`, `hourly_rate`, `group_rate`, `languages[]`, `rating`, `sessions_count`, `is_listed`.
- **coaching_sessions** — `id`, `coach_id/name`, `category`, `created_by`, `session_type` (one_on_one/group), `scheduled_at`, `duration_minutes`, `mode`, `max_participants`, `participants[]`, `price_per_person`, `status` (open/full/cancelled).

## Target additions

New models planned for the unified platform (see `docs/ROADMAP.md`):

- **PlayerProfile** — unified cricket identity (roles, batting/bowling style, verified stats, followers, recruiting status).
- **Team / TeamMembership** — richer team profiles + historical membership (captain/VC/manager/coach), playing XI.
- **Club** — governing entity above teams.
- **Innings / Delivery** — event-sourced scoring; scorecards/analytics computed from deliveries.
- **Fixture / TournamentStage / Registration** — tournament stages, generated fixtures, team registrations.
- **SellerProfile** — seller onboarding + lifecycle (see `docs/MARKETPLACE_ARCHITECTURE.md`).
- **Cart** — server-side cart (currently a `cart[]` array on the user + client `cartStore`).
- **Conversation** — first-class conversation/thread over messages.
- **Follow** — real social graph (replaces `squad`).
- **Notification** — notification model + center.
- **MediaAsset** — media for highlights/reels/stories.
- **Verification** — structured verification records.
- **AuditLog** — auditable corrections (e.g. match edits), never silent overwrite.
