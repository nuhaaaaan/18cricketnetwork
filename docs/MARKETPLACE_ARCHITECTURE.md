# Marketplace Architecture

The marketplace lets cricket sellers list gear and lets players buy it. **Amazon is used only as a functional reference** for commerce flows (seller onboarding, catalog moderation, cart/checkout, orders, reviews) — the implementation, schema, and design are entirely our own. MongoDB is the source of truth; there is no fake product data, and empty catalogs render premium empty states.

## Seller onboarding lifecycle (target)

This run adds the **seller onboarding foundation**. A `SellerProfile` moves through explicit statuses:

```
DRAFT ──submit──▶ PENDING_REVIEW ──approve──▶ APPROVED
                       │                          │
                       └──reject──▶ REJECTED      └──suspend──▶ SUSPENDED
```

- **DRAFT** — seller is completing their profile.
- **PENDING_REVIEW** — submitted, awaiting platform review.
- **APPROVED** — may publish products.
- **REJECTED** — not approved; may revise and resubmit.
- **SUSPENDED** — publishing rights revoked.

Rule: **only APPROVED sellers can publish products.**

## Product lifecycle (target)

Each product carries a status:

```
DRAFT ──submit──▶ PENDING_REVIEW ──approve──▶ ACTIVE ⇄ OUT_OF_STOCK
                       │                          │
                       └──reject──▶ REJECTED      └──archive──▶ ARCHIVED
```

- **DRAFT** — being edited by the seller.
- **PENDING_REVIEW** — awaiting moderation.
- **ACTIVE** — publicly visible and purchasable.
- **OUT_OF_STOCK** — visible but unavailable.
- **ARCHIVED** — hidden by the seller.
- **REJECTED** — failed moderation.

Rule: **only ACTIVE products are public.**

## Categories (target)

Bats · Balls · Batting Gloves · Wicketkeeping Gloves · Pads · Helmets · Shoes · Clothing · Cricket Kits · Training Equipment · Accessories · Used Gear · Other.

## Cart / checkout / order flow (target)

1. **Cart** — items held client-side (`cartStore`) and, as a target, persisted server-side.
2. **Checkout** — collects shipping details and totals; currency is centralized via `utils/format.ts` (no hard-coded currency per screen).
3. **Order** — created server-side with `total_amount` and `platform_commission`, then transitions `placed → confirmed → shipped → delivered` (or `cancelled`).
4. **Payment** — behind the `marketplacePayments` feature flag; Razorpay is wired to create an order when keys are configured and to mark orders paid on success.

## What exists now vs. target

- **Now**: product CRUD gated on the `vendor` `user_type`; product listing/search/detail; cart store + checkout foundation; order create/list/detail + `payment-success`; wishlist; Razorpay order creation when keys are set. Rating fields exist on products but reviews are not yet implemented.
- **Target**: first-class `SELLER` role + `SellerProfile` onboarding and lifecycle; product moderation lifecycle and the category taxonomy above; seller dashboard; reviews/ratings; full checkout + payments behind `marketplacePayments`. See `docs/ROADMAP.md` (Phase B seeds seller onboarding; Phase G completes the marketplace).
