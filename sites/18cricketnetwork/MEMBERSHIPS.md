# 18 membership and business analytics

Implemented for the existing private Sites review release. Azure rollout is pending.

Monthly seller Gold: USD 49 / INR 1,988. Other roles use proposed prices in
`public/membership-plans.js`. Basic is free for every role. Memberships are
per account and role; countries currently supported for quotes are US and IN.
Transaction commissions, delivery charges and applicable taxes are separate.

Business Studio is the `#memberships` route. Gold protects analytics and the
contact-sharing enquiry CRM on the server. Ordinary messages and order
requests remain available to Basic members. No browser flag grants Gold.

Analytics counts consented listing visits by signed-in users, deduplicated by
listing and UTC day. Own views are excluded. The stored visit identity is a
listing/day-specific hash, not an email, IP or advertising cookie. Consent
is optional and scoped to the current browser session. Visits older than
90 days are cleaned up on subsequent analytics writes. This is not a daily
scheduled retention job. The dashboard shows the last 30 days.

Enquiries require explicit contact-sharing consent; email is taken from the
authenticated server identity. Enquiry contacts are private to the relevant
Gold listing owner. Visitors can view and withdraw their own enquiries.
This does not revoke copies already made by a recipient or grant marketing
consent. Non-consented enquiries cannot be submitted.

Subscription checkout deliberately returns unavailable. No subscription
payment is collected. The existing merchandise payment integration is NOT
a recurring subscription integration. Operator-only pilot grants expire
within 31 days and must not be used to represent a paid subscription.

Before production billing: register Stripe and/or Razorpay subscription
products; verify signed provider webhooks, amounts, currency, role, owner,
renewals, cancellations and event idempotency; maintain a billing event
ledger; activate/expire entitlement only from verified billing outcomes.
Confirm the proposed role prices and tax/cancellation policy first.

Before Azure deployment: migrate the application runtime, all SQLite/D1
queries and this generated migration to PostgreSQL, plus file storage and
verified Google/Microsoft identity. Never trust client-supplied identity
headers in an Azure deployment. Existing Sites headers are trusted only
behind the Sites authentication boundary.

External seller website tracking is not implemented. It requires a separately
installed consent-aware integration with verified site ownership. Visits
cannot automatically identify people or create contact leads.

Validation: `node --test tests/api.test.mjs` and the supported build helper.
Browser QA has not been performed.

## Net sessions and equipment repairs

`#nets` lets owners list opening days, local timezone, lanes and hourly prices.
Each one-hour reservation snapshots price, cancellation policy and a 5% fee
split. A unique active slot key prevents double bookings. Cancelling releases
the slot while retaining booking history. Provider confirmation is tracked.
The review release records reservations without collecting payment or fees.

`#repairs` supports workshop discovery by city/equipment/country, optional
geolocation sorting by straight-line distance, quote approval and order
tracking from request through repair and return. Ship-in orders support
separate inbound/return tracking and uploaded carrier labels, private to
the customer and repairer. Printable QR/Code128 references identify the
order and do not purchase postage or replace carrier drop-off codes.

No provider verification, carrier booking, automatic repair warranty decision,
recurring payment collection, tax calculation or automatic facility payout
is claimed in this review release. Those integrations remain launch work.
