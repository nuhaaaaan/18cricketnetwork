# Community coordination and expenses

Routes: `/carpool`, `/expenses`, `/payment-setup`. Existing private audience and completed-profile access remain in force.

Carpool offers and wanted rides cover matches, tournaments, leagues, academies, grounds, practice and community destinations. Discovery uses manual area/destination/date filters, not road routes or GPS. Public identity is name and validated team affiliation; exact pickup and vehicle details require acceptance. Each initial contact is a ride request with optional message. Subsequent chat is participant-only. Acceptance reserves seats with version checks. Withdrawal releases seats; cancellation clears contact consent and informs participants. A wanted ride accepts one proposed driver within its budget. Return-only travel uses a separate listing. Users acknowledge adult participation; driver credentials and insurance are not verified.

Phone requests require an explicit grant by the number owner; revoke prevents subsequent retrieval but cannot erase copied numbers. In-app calls require both accepted participants to consent and the same configured TURN relay used by Team Huddle. Block closes interactions. Private reports are limited and visible to platform operations. Manual cost estimates include driver and accepted passenger seats and integer remainder allocation. Coordination is free: no platform fee, no carpool payment order, optional costs settled directly. No background notifications or automatic routing.

Expense groups invite actual profiles, active team members or competition team owners. Ownership/captain/competition permissions are checked on the server. Invitees accept before costs can be allocated. Expenses are immutable except for guarded voiding; equal/exact/percentage allocations sum exactly in integer minor currency units. Organisers can request dues; members can record their own upfront expenses. Net suggestions are informational and do not replace per-expense requests. Transfers are claims until confirmed by the recipient, distinctly labelled from provider-verified capture.

Online collection requires `EXPENSE_PAYMENTS_ENABLED=true`, approved provider credentials and collector onboarding. Server-fixed share amounts create ordinary commerce orders with a `group_expense` kind, zero platform commission and collector payout ledger. Stripe uses hosted Checkout with eligible methods from merchant configuration. Razorpay creates INR orders and verifies capture server-side. Wrong amounts or currency do not settle balances. Provider payouts are held until release by operations; processor charges remain subject to configured merchant economics. Refund requests require operations reconciliation; released transfers must be reversed with the provider before refund. Refunded contributions require reconciliation before recollection; the existing order is not silently replaced.

## Activation status and responsibilities

| Region/method | Implemented path | Required activation |
| --- | --- | --- |
| US cards, Apple Pay, Cash App Pay, eligible Klarna | Stripe hosted Checkout | Live approved merchant, enabled methods, collector Connect onboarding, sandbox end-to-end capture/payout/refund verification |
| US Venmo | Direct transfer claim | Separate approved PayPal/Braintree capture and payout adapter needed for online checkout |
| US Zelle | Direct transfer claim | Recipient's participating bank; no automatic verification or partnership |
| India UPI, cards, netbanking, eligible transfers | Razorpay hosted checkout | Approved merchant, enabled methods, Route collector accounts, verified capture/payout/refund testing |
| India Apple Pay | Conditional provider support | Approved international payments and explicit Apple Pay enablement; eligibility not guaranteed |
| Membership subscriptions | Entitlement pilot only | Subscription billing adapter remains pending |
| Carpool | Free coordination and direct cost sharing | No payment activation required |

Keys: `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`; operations identity `PLATFORM_ADMIN_EMAIL`; voice `TEAM_TURN_URL` and `TEAM_TURN_SECRET`. Never expose these through public scripts or commit credentials. Provider business agreements, compliance approvals, production credentials and real-money verification cannot be completed by publishing source code. No provider partnership is claimed.

API tests exercise identity privacy, seat capacity, stale updates, phone consent/revocation, call gating, blocks, private reports, wanted-driver budgets, cost rounding, group membership, pending transfer claims, recipient confirmation, activation gating, fixed checkout amounts and synthetic provider capture/collector ledger. Synthetic tests do not establish live merchant activation or device/browser compatibility.
