# 18CricketNetwork

A published private web application based on the product scope in `nuhaaaaan/18cricketnetwork` (main commit `85239b407c1b40b241b6d0f3d9da5922e78c9be9`). It uses the repository's official logo, with an original futuristic dark interface, red accents, an animated cricket-ball scene and responsive navigation. No Expo dependency. No seeded people, statistics, listings or availability.

## Login and account onboarding

`/login` and `/signup` provide an original animated cricket-themed entry experience with layered bats, balls, lighting and pointer parallax. Onboarding supports player, coach, academy, ground owner, practice facility, talent scout, team/club manager, tournament organizer, umpire, vendor, service provider and fan. Multiple categories and one primary category are supported. Organization details are required for academies, grounds, facilities and vendors. Account profiles use a dedicated private `accounts` table with server-side validation, identity-sourced email and optimistic concurrency. Self-selected roles do not grant administrator access or verify credentials.

The current host exposes ChatGPT authentication only. Google and Microsoft buttons are explicitly disabled and marked setup pending. Independent provider login is not activated, and the UI never pretends that ChatGPT sign-in is direct Google or Microsoft OAuth. That requires a host-compatible external identity integration and provider configuration. Site access remains owner-private. No passwords or OAuth tokens are collected by these pages.

## Application

- Player passports; teams and clubs; editable profiles and listings.
- Player-attributed two-innings limited-overs scoring: squad snapshots, striker/non-striker/bowler selection, automatic ends, batting and bowling figures, boundaries versus all-run totals, extras attribution, dismissal validation, free-hit carryover, short runs, retirements, timed out, five-run umpire penalties, dead-ball notes, pause/abandon, manual official revised targets, undo, concurrency and polling. Existing team-only ledgers remain usable.
- Tournament listings, team registrations, linked fixtures and a basic points table calculated from finished matches.
- Pickup game creation and join/leave.
- Grounds and exclusive one-hour reservations with conflict checks and owner cancellation.
- Academies, coaches, services, recruitment and sponsorship enquiries/applications.
- Marketplace products, local cart preferences, wishlist and database-backed order requests with server-calculated prices and currency/stock validation.
- Cricket social feed, uploaded video reels, 24-hour stories, likes, comments, bookmarks, post reporting and owner review. Server-derived performance snapshots publish to feed or story; PNG export and the native device share sheet support external social sharing.
- YouTube/Vimeo broadcast listings with validated embeds, match links, live/scheduled/ended states and a five-second polling fullscreen scoreboard at `/display?match=<id>`. LED marketplace categories support product listings and order requests.
- In-network direct messages to listing owners, sender/recipient inbox isolation.
- Performance totals derived from recorded deliveries; personal workspace and data export.
- Site-wide assistant interface, catalogue guide, private persistent conversation history, server-side model integration and graceful provider errors.

Structured application records live in D1, not localStorage. Media files live in R2; the assets table stores ownership and file metadata. Uploads support JPG/PNG/WebP/MP4/WebM up to 32 MB, validate basic format signatures and enforce ownership. Authenticated network visitors can access media shared in an active post; video supports byte-range reads. Expired stories are removed from feeds and their media cannot be accessed by other visitors unless another active post shares the same file. Expiration hides stories; it does not delete the owner’s underlying file. Browser storage only retains cart preferences. Hosted sign-in uses the Sites ChatGPT identity boundary; each edit/scoring operation verifies ownership on the server. There is no fabricated verified badge or simulated payment.

## Run / verify

Node 22.13+ is required. Use the Sites dependency installer on a managed workspace, or `npm ci` outside it. `npm run dev` launches the supported development server outside managed Work Mode. On managed Work Mode, use the Sites preview supervisor when the browser skill is available.

`node --test tests/api.test.mjs` verifies the API against SQLite with a D1-compatible adapter. These are isolated tests with fixture identities and temporary in-memory databases, not deployed sign-in tests.

`npx tsc --noEmit` checks TypeScript. `node /root/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-c/scripts/build-site.mjs` creates the Sites Worker build in this managed workspace. Elsewhere use `npm run build`.

Schema migrations are generated with `npm run db:generate` and included in `drizzle/`. Apply the pending migration to local D1 before local API use. Hosted Sites applies migrations at publication. The manifest binds `DB` and `BUCKET`; production data is not created by tests.

## AI configuration

Set `OPENAI_API_KEY` as a server runtime secret through the supported OpenAI Developers/Sites workflow. Set `OPENAI_MODEL` optionally. The key is never sent to browser code. The assistant activates model responses only when the secret exists; otherwise it provides a clearly labelled catalogue/navigation guide, not a pretend LLM. Plugin installation alone does not populate a Site runtime secret.

The OpenAI Developers plugin was confirmed installed during authoring, but its key-provisioning tool/skill was not exposed in this session. The Site environment had no configured secrets. No key was copied from the reference repository. Live model calls therefore remain unverified. A mocked-provider integration test verifies request construction and response/error handling without credentials or charges.

## Current limits

The scoring engine covers a six-ball, two-innings limited-overs workflow with configurable squad sizes, bowler limits and optional free hits. It is not certified complete for every MCC Law or competition. On-field decisions remain with umpires. The current ICC October 2026 playing conditions informed no-ball/free-hit dismissal restrictions and caught-batter ends. Boundaries, wickets, short runs and penalty decisions require correct scorer input. Automatic DLS calculations, Test/multi-day matches, super overs, The Hundred/pairs formats, umpire workload/fielding restrictions, substitutions, DRS, NRR, scorebook historical insertion/editing and offline synchronization remain outside this implementation. Undo rolls back the most recent event. Balls faced currently exclude wides and no-balls.

Video broadcasting uses an external YouTube/Vimeo broadcast, embedded on the platform. The Site does not ingest/transcode camera or RTMP streams and has no configured streaming provider. The LED view is a browser output usable through HDMI or device mirroring; custom hardware-controller protocols are not connected. No LED stock, product prices or availability have been fabricated. Payment collection, refunds, shipping, legacy-cart inventory reservation, direct Instagram/TikTok publishing, automated highlights, team-admin approval and advanced moderation are not active. Reports are stored and exposed to post owners; there is no automatic cricket-content classifier. External sharing opens the visitor’s device share sheet or downloads a PNG; no social tokens are stored. Coaching bookings use enquiries. Order requests do not charge anyone. New marketplace orders reserve inventory on seller acceptance through a transactional version-checked decrement; legacy cart requests do not reserve inventory.

Bookings use the calendar date entered at the ground and fixed whole-hour slots. The current date boundary uses UTC; venue timezones and opening hours need a later configuration flow. Standings award two points for a win and one for a tie.

## Published Site

The application is deployed as a private Site. Production D1 tables are provisioned at deployment. A live model connection still requires its runtime secret. The standalone `design-preview.html` is an offline visual preview with navigable sections; it does not run the server and does not submit records. Use the saved Sites application for the actual server-backed experience after deployment.

Validation: JavaScript syntax checks, TypeScript, application build and twenty-four API/scoring/account/media/commerce workflow tests passed. Browser QA was unavailable because the managed browser skill was not exposed. Production user interaction, end-to-end uploads, streaming-provider embeds and live AI remain unverified by browser QA. Native deployment and database overview verify hosting and schema provisioning.

## Scoring source references

- ICC current playing conditions: https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions
- ICC Men’s T20I conditions effective October 2026: https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf
- ECB scorer guidance: https://play-cricket.ecb.co.uk/hc/en-us/articles/360000431729-Scoring-A-Match-Balls-Runs-Extras-Wickets-Standard-And-One-Click-Modes-PCS-Pro

To start: create player profiles, create a match, open its scorer, configure both squads before the first delivery, select the opening batters and bowler, then score. Performance → Create performance card publishes server-derived statistics. Community → Create selects a post, reel, story or external live broadcast. The LED display requires a signed-in browser on the display computer.

## Marketplace and PitchRush

Marketplace has separate New and Used shops across equipment categories, plus PitchRush for seller-arranged nearby delivery. Seller profiles store private return addresses and phone numbers in `seller_profiles`; public shop projections expose city, carriers, serviceable postal codes, fee currency and delivery estimates. PitchRush checks enrolled PIN/ZIP codes and the fee currency server-side. It does not dispatch riders, calculate routes or guarantee delivery times. The name is a product working name, not a trademark clearance.

The `commerce_orders` table isolates orders to buyer and seller. A one-product request snapshots price, seller return policy, quantity, address and delivery fee. The server calculates totals. Seller acceptance atomically decreases stock and transitions the order, rejecting competing/stale acceptance. Seller records packing and actual shipping tracking, or local courier handoff; the buyer confirms receipt. Payment remains `not_collected`. No automatic inventory restoration follows returns; seller edits stock after inspection.

Buyers request returns after receipt. The saved change-of-mind policy/window is enforced; wrong/damaged/not-as-described claims can be submitted for seller review regardless of that window. Seller approves or declines, designates an enrolled carrier and optionally uploads a real PDF/image label. Approved returns receive RMA references. Buyer records return tracking; seller confirms receipt and records the external settlement. No refunds are performed by the platform. Delivery, shipment, tracking and settlement entries are participant-reported, not provider-verified.

`/labels?product=<id>` generates seller inventory QR and Code 128 codes tied to product IDs. `/labels?order=<id>` generates an authorized return QR and RMA barcode. Codes are generated locally using qrcode and bwip-js; they are not carrier-issued postage. Actual carrier labels/QR documents are supplied separately by sellers, with private asset access for the order participants. PDF carrier documents download as attachments; product and social upload paths reject PDFs. Product photo assets are shared with signed-in visitors. Carrier drop-off/pickup links use official websites; no unverified street locations or carrier QR codes are invented.

USA carrier choices: USPS, UPS, FedEx. India choices: India Post, Delhivery, Blue Dart, DTDC and Shiprocket. Carrier booking, paid label generation, eligible print-in-store QR issuance, location lookup APIs, automated tracking, payments and rider dispatch require merchant/provider accounts and integrations. The current implementation supports manually purchased carrier labels and seller-managed delivery.

Build QR/barcode assets with `node scripts/market-assets.mjs` after dependency changes. Browser QA and physical scanning/drop-off were unavailable; native QR and Code 128 SVG rendering was verified, alongside API isolation, stock conflicts, PitchRush serviceability, return lifecycle and private carrier documents.

Carrier references:
- https://www.usps.com/ship/label-broker.htm
- https://www.ups.com/us/en/support/shipping-support/print-shipping-labels/how-to-write-address/how-to-return-a-package
- https://www.fedex.com/en-us/customer-support/faqs/returning/returns/use-qr-code-return.html
- https://apidocs.shiprocket.in/

## Payments, settlement and rider pilot (current release)

This section supersedes the earlier marketplace statements about no checkout or rider dispatch. The site now implements hosted Stripe checkout (USD/US) and Razorpay Checkout (INR/India), server-side captured-payment verification, private payment records, provider-connected seller/rider accounts, held earnings, administrator settlement, and refunds of received returns before payouts. No credentials are configured by default. No card, UPI or bank details are collected by this application. Global currencies may be listed but cross-border checkout is not implemented.

Pilot commissions: new gear 8%, used gear 5%, grounds 10%, coaching/academies 12%, other paid services 12%. Commission excludes delivery and tax. Provider fees are absorbed from the platform commission, not additionally deducted from the disclosed seller payout. These are proposed business tariffs, not guaranteed profitable rates; revisit low-ticket orders, chargebacks, processor costs and acquisition costs before wider launch. Admin rule changes affect future order snapshots. Tax calculation, tax invoices, minimum commissions, subscription billing, cancellation compensation and automatic inventory restoration are not implemented.

PitchRush road quotes pay US riders max($6.50, $4 + $1.25/mile + $0.20/quoted minute), with a $2 buyer platform fee. India pays max(₹45, ₹25 + ₹8/km + ₹1/quoted minute), with a ₹15 buyer platform fee. Initial maximum road distance: 10 miles US, 15 km India. Rates cover pickup-to-drop-off only, with no detour increase; pickup approach, waiting compensation and tips require a later tariff extension. Motor routing is used; bicycle applicants must not be approved for dispatch until cycle routing is supported. Quotes require configured real routing and saved seller/buyer coordinates. Buyers confirm the full quote before request creation. Seller-managed delivery remains an alternative.

Rider applications require operator review, including local eligibility, identity, vehicle/insurance and payout onboarding outside this form. Self-attestation is not KYC. Approved riders explicitly go available, see anonymized nearby offers, claim an offer once, and unlock exact addresses. Payment is verified before offering dispatch. Buyer-only codes validate in-person handover; owned photo uploads validate unattended drop-off, followed by buyer/seller review. Reported GPS is not independently verified. Completed jobs create unique earnings records; a retryable settlement-record action recovers interrupted finalization. Driver payout eligibility begins after a 24-hour review hold. Seller payout eligibility begins after the saved return window plus 2 days. These are settlement holds, not regulated escrow.

Payouts and refunds use atomic processing claims. Stripe transfer/refund requests use idempotency keys; Razorpay searches matching ledger/order notes before issuance. A failed or ambiguous request remains processing and requires provider-dashboard reconciliation before an operator repairs the database state. Do not blindly reset or retry financial claims. Returns block seller settlement. Refunds after released payouts require transfer reversal and operator reconciliation; automatic reversals and partial refunds are not implemented. The owner-private site uses authenticated payment refresh, not unauthenticated webhook callbacks. Payment status is therefore not automatically synchronized while all participants are absent; public verified-signature webhook integration is required for unattended production settlement.

Runtime setup in Sites Settings (never commit credentials):
- `PLATFORM_ADMIN_EMAIL`: trusted Sites-authenticated owner email. Configured for this site's owner. No client supplied identity is trusted.
- `STRIPE_SECRET_KEY`: Stripe platform key with Connect enabled. Sellers and US riders use Stripe Express onboarding. Test mode must pass end-to-end before live mode. Platform balance, disputes and processor fees remain operator responsibilities.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: India Razorpay account with Route activated. Create and verify linked accounts in the provider dashboard, then the admin operations desk links each native site owner ID to a provider account ID. Review account activation in Razorpay before linking.
- `GOOGLE_MAPS_API_KEY`: secret server key enabled for Routes and Geocoding; restrict APIs and application access as applicable.
- `GOOGLE_MAPS_BROWSER_KEY`: public browser key restricted to this site origin, Maps JavaScript only. Google routes are drawn only on Google Maps.
- Alternatively `ROUTING_API_URL`: operator-controlled HTTPS OSRM endpoint for real routes on the OpenStreetMap interface. No public demo routing is silently assumed.

`/navigate` supports destination pins, permission-based own location, location following, actual provider route instructions when activated, optional speech of selected instructions, and Google/Apple native navigation links. `/navigate?ground=<id>` works without a reservation. Grounds may supply a map pin and full address; without a pin, external address navigation is available. `/navigate?job=<id>&leg=pickup|drop` checks participant access. The browser is not a complete native navigation engine: traffic, lane guidance, background/offline navigation and continuous spoken turn detection use the native app. No fake location or straight-line estimate is presented as a road route. Google activation requires applicable public terms/privacy and attribution; OSM tiles retain attribution and browser caching, without offline prefetch.

Mindset coaching is available in coach categories and paid coaching requests. Paid services use provider acceptance, captured checkout, provider completion and buyer confirmation. Booking reserves a ground slot separately; scheduling/cancellation terms remain provider confirmed. Do not cancel a funded reservation without resolving its financial order.

Build map assets with `node scripts/maps-assets.mjs`. Automated tests cover tariff arithmetic, optional/bounded coordinates, authority and key failures, rider review, trusted service pricing and provider capture amount validation. Browser/device navigation, provider sandbox payouts and real rider operations still require end-to-end testing with actual connected accounts.

## Shop discovery and declared store policies

The marketplace now has a brand directory including One8, equipment menus, junior/adult, gender/fit and activity categories, subcategories, size search, store filters, stock filtering, currency-specific price ranges, newest/name/price sorting, persisted wishlist actions and session product comparison (up to four listings). Prices are grouped by currency during sorting and are never silently converted. Brand names are normalized case-insensitively, including One8/one 8 and SS/SS TON. Brand menus contain discovery options even when no seller stocks that brand; no authorized dealership or affiliation is implied. Registered stores appear in the directory independently of inventory.

The original shop footer links to brand/type browsing, new and used gear, PitchRush, stores, seller settings, orders/tracking, return guidance, size guidance, payment explanation, privacy and pilot terms. Reference patterns were reviewed from brewingcricket.us and one8.com; no retailer products, images, commercial copy, payment-method logos or contact details were copied. Site language remains English, and currency choices reflect actual listing currencies. There is no newsletter sending service or claim that all retailer features are implemented.

Seller registration/settings requires explicit return-policy consent. Suggested defaults are 30 calendar days for new gear and 7 for used gear; sellers may choose 0–90 days separately. They declare change-of-mind postage payer, exclusions and a 1–14 business day inspection target. Generated policies cover return authorization, condition, no undisclosed restocking fee, seller postage responsibility for approved wrong/damaged/materially misdescribed items, original-provider refunds and consumer-rights precedence. Store policy text is generated in server/store-policy.js, not copied from a retailer.

New listing forms recommend inheriting the store policy. A seller may instead publish listing-specific terms. Both are shown before ordering; orders snapshot their policy source/version and full terms. Existing orders are unchanged by later edits. Product-version and inherited-policy-version checks reject stale requests so buyers can review updated terms. Existing seller profiles must declare their policy in settings before receiving new requests; their earlier orders keep the original snapshots. Approved fault-related return postage on new policy-declared orders is assigned to the seller, even if change-of-mind postage is buyer-paid. Inspection targets are declared commitments, not automated deadlines or guarantees.

The store declaration is an operational policy, not a jurisdiction-specific legal review. Before public launch, finalize operator contact information, retention periods and jurisdiction-specific terms/privacy. Browser UI QA is unavailable in this environment; automated checks cover filtering combinations, brand normalization, policy consent, immutable order snapshots, postage responsibility, and the existing commerce flows.

### Brand artwork review
The shop brand directory displays the 15 logos supplied in the user's reference (including HRS and CEAT), plus the official inline One8 header SVG from one8.com. The supplied PNG is preserved intact and individual cards use CSS clipping. Logos identify browsing filters, not platform partnerships or seller authorization. `design/shop-review.html` is a self-contained, unpublished design review; it is not a checkout or inventory source.
