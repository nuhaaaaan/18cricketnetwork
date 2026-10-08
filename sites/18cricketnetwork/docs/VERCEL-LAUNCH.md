# Vercel release, 8 October 2026

Target: project `18cricketnetwork` (`prj_yqrRpUiVxQrKL2QnbFv3smcI3tKp`), owner `abdul-khaders-projects-30b9ad07` (`team_WCI7q26ldmh3W361WBMinBIf`). Repository branch: `production-ready-version-october-26`. Root directory: `sites/18cricketnetwork`. Framework: Next.js. Build: `npm run build:vercel`. Output: `.next`. Node: 22.x or newer. Region: iad1.

The Sites build remains `npm run build`. The Vercel build uses Next.js rather than the Cloudflare Worker bundle. `npm run start:vercel` runs the independent preview locally after building.

Validation: Next.js production build and type checking passed for 17 routes. The 76-test suite passed, including forged-identity and write-rejection checks. HTTP smoke checks passed for home, guides, venues, signup, health and filtered venue API; attempted account writes returned 503. Browser visual verification was unavailable because a Chromium download failed. No deployment URL should be reported as this release until Vercel confirms its commit and ready state.

## Current release boundary

The independent preview serves the UI, 35 feature guides, scoring rules and researched venue reference data. Venue filters and directions work without sign-in. It does not impersonate accounts, copy private production data, invent activity, accept orders, collect money or accept proof uploads. All protected operations return 503 with a launch-setup message. `GET /api/health` discloses these capabilities without secrets.

Sites identity headers are untrusted outside its gateway. The preview never forwards them to the original business API. Direct Google/Microsoft authentication, a persistent database, private media storage and runtime service credentials must be provisioned and integrated before enabling transactions. Do not enable business endpoints merely by supplying a user header or environment variable.

## Production follow-up

1. Restore Vercel access to the owning team; use the project above, not a new account or another project's credentials.
2. Deploy and verify this browsing preview with its current protection settings.
3. Decide whether the production backend/database stays on Azure as previously requested or moves to Vercel-compatible managed services. Current SQL migrations are SQLite-specific; PostgreSQL needs explicit migration and concurrency testing.
4. Provision managed authentication with Google/Microsoft, a persistent database, private file storage and monitoring. Wire and test the existing business API against those services.
5. Activate and test payment capture/refunds/payouts, booking conflicts, moderation, premium entitlements, licensed feeds and camera ingest. Automated DRS is not certified or implemented.
6. Complete operator/contact/privacy terms, backups, recovery and deletion flows. Purchase and verify a domain only after confirming availability and ownership.
7. Update the existing React Native/Expo app to use the same authenticated backend. Produce signed iOS/Android builds, beta-test them, then submit to the stores. Vercel deployment does not submit or publish native apps.
