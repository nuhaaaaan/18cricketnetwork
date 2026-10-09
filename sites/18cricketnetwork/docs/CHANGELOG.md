# Release notes

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
