# Athlete Fuel operational setup

The /food module uses actual restaurant_profiles, food_menu and commerce_orders records. No restaurant, menu, nutrition, rating or order seeds are published. Test fixtures are confined to isolated SQLite databases.

## Partner workflow

1. Sign in and select Sports restaurant during account onboarding. Existing authenticated users can submit a restaurant application directly from Athlete Fuel.
2. Declare the food business permit / registration reference, healthy-menu commitment, food safety obligations, opening hours, pickup point, serviceable ZIP/PIN codes, tax rate and cancellation / food issue policy. Applications remain pending and closed. Registration edits require reapproval.
3. Platform operations must independently verify eligibility, local food requirements, tax settings and accurate pickup details, then approve. This reference submission is not automatic license verification.
4. Add actual meals with price, available portions, ingredients, allergens / cross-contact and seller-declared dietary tags. Enable order intake explicitly.
5. Restaurant accepts a request and reserves all portions atomically. Menu or restaurant changes invalidate stale requests. Requests and accepted unpaid orders can be cancelled before any provider checkout exists; accepted cancellations restore portions. After a checkout exists, operations must reconcile it before cancellation.
6. Verified payment enables preparing, then ready. Customer pickup requires the buyer's code. Delivery uses the existing funded PitchRush offer / claim / navigation / handover or reviewed photo-proof workflow.

## Fees and settlements

- Food commission is fixed at 500 basis points (5%) of food subtotal. It excludes tax, delivery and all driver tips, irrespective of configurable gear commissions.
- Tax is restaurant-declared, snapshotted at order creation and credited separately to the restaurant. The platform does not determine jurisdiction-specific tax applicability or filing duties.
- A delivery quote stores the existing road-distance rider and platform tariff. Driver ledger amount equals quoted base rider earnings plus the entire driver tip. Tips never enter restaurant earnings or commission. Pickup has no driver tip.
- Completed, provider-paid orders create held earnings; actual transfers require verified payout accounts, operator settlement approval, the hold period and provider credentials. Food issues hold settlements pending denial/resolution or a provider refund. Full approved refunds include the tip; transfer reversals require operator reconciliation if money was already released.
- Food orders share existing provider integration: Stripe Connect USA, Razorpay Route India. Configure actual STRIPE_SECRET_KEY or RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET, complete restaurant and rider payout onboarding, and verify captured payments. No client assertion can mark an order paid.
- Configure GOOGLE_MAPS_API_KEY with Routes API access, or a supported HTTPS ROUTING_API_URL, for actual road quotes. No straight-line fallback or fabricated distance is used.
- Drop-off photo uploads also depend on the existing content-safety provider setup; code-based handover does not require a photo.

## Go-live limits

The Site audience is unchanged (owner-private). Restaurant registrations and customer orders require access to this Site. This publication does not purchase a domain, deploy to Azure or make the Site public. No live payment, legal compliance, restaurant partnership, food-safe handling certification or availability is asserted merely because the UI exists.

Missing keys fail closed. Operators must activate providers, confirm food-business and delivery eligibility, approve real restaurants and enroll food-capable riders before consumer launch. Riders opt in to food handling and confirm a suitable insulated bag to receive meal offers; existing equipment offers are unchanged. Food policies use issue review rather than fictitious physical returns for perishable meals.
