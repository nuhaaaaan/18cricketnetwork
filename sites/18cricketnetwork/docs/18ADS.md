# 18Ads revenue and activation model

Prices are product decisions, not claims about market rates. Anyone with a completed account may request an equipment, service, coaching or facility campaign. Purchases remain separate from 18Gold.

| Plan | USD budget cap | Impression cap | Window | Effective CPM at full delivery |
|---|---:|---:|---:|---:|
| Local starter | $4.99 | 500 | 7 days | $9.98 |
| Club reach | $24.99 | 3,000 | 14 days | $8.33 |
| Regional growth | $79.99 | 12,000 | 30 days | $6.67 |
| Network spotlight | $299.00 | 50,000 | 30 days | $5.98 |

Revenue should accrue on verified delivered impressions, up to the selected budget. Do not bill the full cap for undelivered inventory. Return unused prepaid balance to the original payment method after campaign close. Revenue excludes processor fees, taxes and refunds; no sales or lead guarantee. Inventory reservation, billing and refunds are not implemented in this release.

Required launch behavior: use eligible visible sponsored slots, at least 50% visible for one continuous second; issue server-signed delivery tokens, reject replay and self views, deduplicate events and apply frequency caps (three displays per member per day per campaign). Exclude minors and sensitive targeting. Advertisers see aggregate metrics, never visitor identities. Estimate delivery using the trailing 14 days of eligible inventory for selected geography/category, allocate at most 20% of eligible slots to sponsored content and deduct already-reserved inventory. Show unknown rather than fabricated reach when samples are insufficient. Unique reach must come from distinct measured viewers, not inferred from impressions.

Existing implementation: authenticated owner-scoped requests, private metrics initialized to zero, fixed server-derived prices, HTTPS validation, shared text screening/rate limits, cancellation and advertising policy. Database tables initialize idempotently. Campaign status never transitions to live or paid from client input.

Activation dependencies: moderator queue and decision audit, identity-bound provider checkout/webhooks, prepaid inventory reservation, deduplicated view/click delivery, pacing, frequency caps, invalid-traffic review and unused-balance refund reconciliation. These must be built and tested before taking advertising money. The UI explicitly displays these limits.
