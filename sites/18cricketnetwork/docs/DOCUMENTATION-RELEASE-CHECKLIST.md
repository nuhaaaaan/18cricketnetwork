# Feature documentation is part of every release

User-facing source of truth: `public/feature-guide.js`, served at `/about`, with inline About panels on each network section. Membership prices come directly from the shared plan module. Do not promise unfinished integrations, invented data or legal compliance.

For every changed feature:

1. Review its actual server permissions, offer, prices, states, privacy behaviour and provider activation.
2. Update the guide's offer, policy, best practices and current limits. Bump `GUIDE_UPDATED` to the review date. Review overlapping guides, not just the main one.
3. Add new source files to that feature's `sources` list. Add new features to `FEATURES`; coverage tests require all navigation features to have guides.
4. After human review, recompute the SHA-256 hashes in `docs/feature-guide-review.json`. Hash each listed source in order as `file + '\0' + contents`, then append JSON of `{offer,policy,practice,limits}`. Do not refresh hashes simply to silence a failed check.
5. Run `node scripts/check-feature-guide.mjs` and all tests, then build/publish. `npm run build` runs the check automatically through `prebuild`.

The gate detects drift in declared sources, not every semantic change or external-provider policy update. Add watch sources as functionality grows. It does not invent policy text or autonomously edit after release. Developer review remains required.

Before public launch, finalise operator contact details, legal terms, jurisdictional policy review, data retention/deletion, disputes, hardware validation and provider testing. Operational guides describe current behaviour and do not replace final legal notices.
