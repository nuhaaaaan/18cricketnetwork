# 18 Franchise operational pilot

This release adds working private organisation records and workflows. It does not establish readiness for official professional-league operations, certify medical software or activate external providers.

## Architecture and isolation

- `franchise_workspaces` is a D1 versioned JSON aggregate. Member acceptance, permission changes, documents and records share one optimistic compare-and-swap boundary. A stale command returns 409, including a command racing membership revocation.
- No franchise data is inserted into the public `records` collection or public search. Lists require ownership, active membership or an invitation to the authenticated email. Accepting an invitation creates membership; no email is dispatched.
- Owners manage membership. Roles are owner, director, coach, analyst, scout, manager, finance, medical, commercial, procurement, supplier and viewer. Clinical records are available only to medical members, including in documents, audit and exports. Owners do not automatically see them.
- Suppliers see published/closed RFQs, their own quotes/invoices and assigned purchase orders. Other bids, internal supplier assessments, finances and scouting remain private.
- Franchise groups link separately owned non-group workspaces. Portfolio reads recheck membership and record permissions for every child. Membership never propagates to a child.
- PDF, TXT and CSV uploads are limited to 5 MB, stored under private R2 keys and downloaded through the authenticated parent-record permission check. Keys are excluded from exports. Upload failure after a version conflict deletes the newly staged object. Attachments are downloads, not inline previews. Malware scanning is not enabled.

## Working modules

Scouting pipeline and evidence; squad scenario rows; contracts and release-document status; non-clinical availability; performance and training records; restricted clinical notes; travel and accommodation; sponsor rights/deliverables; supplier assessments; RFQs, quotes, purchase orders and invoice reconciliation; matchday checklists, incidents and accreditation requests; fan/revenue campaign records; season rule packs; data/media rights and integration registers.

The registers are human-maintained workflows. No automated video analysis, clinical diagnosis, live auction bidding, contract signature, supplier order dispatch, immigration/board submission, ticket sale, fan email or payment is performed by recording a stage.

## Rules and planning

League names are labels, not partnerships. Rule packs require a source URL, reviewer and explicitly entered season, acquisition method, currency, salary cap/floor, squad limits, overseas limit and retention limit. Draft → review → approved → superseded. Approved packs cannot be edited. New seasons use new records.

Rule packs also record playing format, XI overseas limits, salary accounting policy, substitution/replacement policies, registration deadline, points and tie-break order, and a playing-conditions source. These fields do not change the public scoring engine or official league configuration automatically.

Scenario evaluation checks exact linked pack, approved status, currency, duplicate player names, size, cap/floor, overseas count, retention count and an optionally selected eleven. It does not verify legal eligibility, salary-cap accounting inclusions, auction increments, NOCs or live competition registration. Currency is integer minor units with checked safe totals. No exchange rates or cross-currency aggregation are guessed.

## Procurement

RFQ draft → published → closed/cancelled. A quote needs an open published RFQ and must meet its submission deadline. Accepted quotes require owner/director/finance approval; only one quote per RFQ may be accepted. A purchase order snapshots the accepted quotation's currency and amount; there is one active order per quotation. Purchase approval precedes issue, delivery and acceptance. Invoice totals/currency must match the purchase order; one invoice per order. Delivery acceptance and an external reconciliation reference are required before recording reconciliation. This is a manual external-payment record, never payment-provider verification.

## APIs

All endpoints require existing platform authentication, completed profile, same-origin writes, JSON validation where applicable and shared API quotas.

| Method / path | Behaviour |
| --- | --- |
| GET /api/franchise | Accessible workspaces and invitation summaries |
| POST /api/franchise | Create private season workspace |
| GET /api/franchise/:id | Department-filtered workspace |
| POST /api/franchise/:id/accept | Accept invitation for authenticated email |
| POST/PATCH /api/franchise/:id/members | Owner invitation, role change or revocation |
| POST /api/franchise/:id/links | Group owner links an owned child |
| GET /api/franchise/:id/portfolio | Independently authorised child summaries |
| POST /api/franchise/:id/entries | Create typed initial-state record |
| PATCH/DELETE /api/franchise/:id/entries/:entry | Authorised edit, assignment, transition or eligible deletion |
| POST /api/franchise/:id/plan | Evaluate a named squad scenario |
| POST /api/franchise/:id/fulfilment | Assigned supplier or buyer records delivery evidence; buyer acceptance remains separate |
| POST /api/franchise/:id/documents | Raw bounded document; query supplies parentId, version, name |
| GET /api/franchise/:id/documents/:doc | Permission-checked attachment download |
| GET /api/franchise/:id/export | Permission-filtered JSON snapshot |

Every mutation of an existing workspace includes its integer `version`. No client-supplied role, owner, status, aggregate data or audit event is trusted.

## Operational limits and enterprise gates

20 owned workspaces per account, 100 membership slots, 300 records including documents per workspace, 1.5 MB aggregate metadata, 1,000 most recent audit writes (last 100 returned), 100 workspaces per list. The audit is operational and bounded, not an independent immutable archive; reads are not separately audited. Deleted documents may remain if storage deletion fails; operational recovery is needed. No automatic retention scheduler or legal holds.

Before professional production use: independently test organisation isolation; provision approved enterprise SSO/MFA and offboarding; integrate licensed statistics/video; verify identity and supplier evidence; configure clinically appropriate access and retention; commission legal/privacy review; implement external immutable audit, backup/restore and disaster-recovery evidence; load-test concurrent matchday traffic and establish monitored support/SLA. None of these gates is satisfied merely by creating an integration register entry.

## Deployment and review

Apply the tracked additive Drizzle migration through the Sites deployment workflow. Preserve the existing audience. Test schemas, role isolation, invitation acceptance/revocation, group boundaries, stale and concurrent writes, financial state transitions, clinical attachments and exports. Build and security/guide checks must pass before publication. Browser visual QA is unavailable without the supported browser capability; do not claim it passed.
