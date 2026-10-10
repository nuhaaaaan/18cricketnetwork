# Release notes

## 2026-10-09 — Cricket-led navigation symbols

- Replaced abstract menu glyphs with a shared SVG line-icon set covering every feature, quick access and header tools. Cricket symbols include ball seams, bats, wickets, helmets, pitches, nets, trophies and scoreboards; business tools retain recognizable payment, food, message and device symbols.
- Reused the icons in role cards and homepage workspace/discovery shortcuts, with fixed responsive sizes, inherited contrast and text labels. Decorative SVGs are hidden from assistive technology; icon-only actions retain accessible names.
- Corrected the umpire workspace report destination to the existing Performance route.

Validation: automated suite, feature-guide/security checks and production build. Browser visual QA unavailable in the current environment.

## 2026-10-09 — Ingredient transparency and 18 Health Rating

- Required complete ingredient inventories, quantities and health-policy acknowledgement for restaurant signup/applications; recipes include cooking method and optional per-100g nutrition. TXT/CSV imports support editable disclosures.
- Added a Python-authored local expert-system foundation exported for Worker inference, provisional 0–10 ingredient indices, cooking/nutrition adjustments, unknown-ingredient no-score behavior and transparent rating breakdowns. No paid API is used for local scoring.
- Added menu-average restaurant ratings with complete coverage requirements and a prominent food-page policy prioritizing wellbeing, ingredient transparency and evidence-backed organic sourcing. Organic evidence stays private; explicit operator review does not imply meal certification or improve nutrition scores.
- Added optional consented, owner-scoped OpenAI advisory reviews with hard daily quotas, caching and revision checks. Credentials, model and enable flag remain unconfigured; no live API calls were made.
- Older restaurants/recipes require disclosure updates for new order requests. Existing order history/fulfillment remains intact. Published rating methodology explains platform heuristics, uncertainty and lack of clinical validation.

Validation: Python/Worker parity, disclosure/score/privacy/optional-provider regressions, full automated suite, security checks and production build. Browser visual QA unavailable.


## 2026-10-09 — Format-aware scoring and competition foundations

- Added T10, T20, ODI, 40-over/custom, Test/first-class and 100-ball profiles. Multi-innings scoring supports declarations, forfeited innings, configured follow-on thresholds, draws and innings victories.
- Added separate Super Over/Super Five rounds, legal-ball versus faced-ball accounting, counting dead-ball adjudication, authorized replacement bowlers, secondary fielders, reduced quotas and official DLS entry/reference workflows.
- Undo appends an audit event without removing the original; five-run awards remain available after a result. Optimistic revision checks and optional command IDs protect scoring from duplicate effects.
- Updated scorer, broadcast, reports, performance totals and reviewed statistical rankings for regular innings and format-aware outcomes.
- Added provisional aggregate-ball NRR, all-out/DLS contributions, no-result/draw points and persisted tournament structure/seed plans. Automatic later-stage scheduling and final tie-break adjudication are not activated.
- Added a free Fantasy XI hub, frozen role/price pools, 11-player/budget/team constraints, private entries, captain multipliers, atomic timestamp/first-delivery locks and live contest leaderboards. No fees or cash prizes.
- Added tested deterministic bench-swap and ring/hysteresis policy primitives. Automatic participation feeds, global skill ratings and production ring awards remain pending.
- Added schema-only contest/entry migration and user-facing feature limitations. Existing globe-first home, careers, 18Ads and settings are preserved.

Validation: full automated regression suite, format/fantasy/API rule cases, security artifact checks and production build. Browser visual verification unavailable in this environment. No ICC certification or automated professional DLS claim.

## 2026-10-09 — Globe-first homepage composition

- Made the red cricket-ball globe and Your game / Your people / One universe the opening hero for signed-in and discovery views.
- Moved personal workspace below the hero and opened ecosystem discovery without a duplicate hero or bat scene.
- Replaced bat/wicket scene on login, signup and About with the existing red globe asset and restrained orbital motion.
- Reduced mobile hero copy, removed orbit-card secondary text, used two-column discovery cards where space allows and minimized the assistant dock.
- Moved home feature guidance to the bottom and hid the redundant account notice on Overview.

Validation: full automated suite and production build; browser visual verification unavailable.


## 2026-10-09 — 18Next Innings and cricket entrance motion

- Expanded Opportunities into a dedicated cricket careers portal at /careers, open to every completed account.
- Added grassroots through international categories, role filters, posting, private applications, review statuses, withdrawal and closing.
- Added layered cricket ball/bat/wicket entrance graphics to homepage, login, signup and About, with pause and reduced-motion support.
- International listings remain self-declared, with no ICC affiliation or verified-employer claim.

Validation: permission and application lifecycle regressions, full suite and production build; browser visual verification unavailable.


## 2026-10-09 — 18Ads and Settings & privacy

- Added owner-scoped campaign requests, four impression budget plans from $4.99 to $299, cancellation and honest zero delivery metrics.
- Added private saved preferences, optional external link history with query stripping and clearing, device support requests, appearance, data saver, browser icon and break reminders.
- Added direct hub pages and navigation, order/payment and membership links, advertising terms and launch revenue/inventory specification.
- Billing, live sponsored delivery and moderator activation remain pending; campaign submission never collects money.

Validation: targeted pricing/privacy/security tests, existing suite and production build. Browser visual verification unavailable.


## 2026-10-09 — Glass, minimalism and spatial interface

- Added one shared visual layer across navigation, dialogs, assistant/call docks, cards, team workspaces, carpool, expense balances, guides and discovery surfaces.
- Added frosted navigation and overlays with opaque browser fallbacks; repeated cards use translucent gradients without nested blur effects.
- Simplified primary actions to a consistent mint accent, increased spacing and softened boundaries while preserving 18 branding and the existing typography scale.
- Added restrained perspective and layered shadows to decorative team/expense objects; forms, scorecards and financial amounts stay flat and readable.
- Added narrow-screen adjustments, reduced-motion/transparency and increased-contrast preferences, visible focus rings and tabular financial figures.
- Recorded the standing requirement to publish, push to GitHub and describe each authorised change in AGENTS.md.

Validation: feature-guide review, existing automated suite and production build. Browser visual verification unavailable in this environment. No payment activation or backend behavior changes in this release.

## 2026-10-09 — Security hardening and credential incident cleanup

- Add shared API quotas, bounded strict JSON parsing, CSRF checks and sensitive-action privacy.
- Pin administrator access to the verified owner subject and email using secret runtime configuration.
- Add nonce CSP and common production headers; block source/config/map paths and remove debug/error details.
- Update vulnerable framework/React/Cloudflare dependencies and remove unused packages; retain documented unpatched development-only advisory chains.
- Add security regression tests, artifact checks and a redacted audit/incident runbook.
- GitHub cleanup removes tracked legacy environment credentials, legacy key literals and generated Metro caches; replace unsafe JWT/CORS defaults. Credential rotation and historical cleanup remain outstanding.

## 2026-10-09 — Personal workspaces and navigation

- Added global Activity, Messages and Match Centre shortcuts with real notifications, unread receipts and owned/team/live match links.
- Grouped navigation by everyday tasks and registered roles, added workspace switching and role-specific home screens.
- Simplified seller, restaurant and facility entry points; refined the navy/teal palette and mobile navigation.
- Added database indexes for owner/type/time, message recipient and unread activity; bounded private queries and retained ownership checks.
