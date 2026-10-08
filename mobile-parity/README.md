# 18CricketNetwork mobile build

Source baseline: `8291ac7389b1f2dea174475a2b8b390300cdb8ba`, branch `production-ready-version-october-26`.

The existing API source in `sites/18cricketnetwork/server/` and its database are retained. The original Expo application in `frontend/` is also retained. Its legacy authentication/API routes are not automatically equivalent to the newer website routes; do not point one client at the other backend without reconciling contracts and identities.

Frontend-only Lovable project: https://lovable.dev/projects/2e75602c-c29c-4198-8df1-39c279e4e36d

This project is a responsive UI build for review and adaptation, not a released native app. It must not provision a replacement backend/database or silently synchronize with the original repository. UI coverage, live API connections, provider activation and native-device support are separate acceptance gates.

## API preservation

`shared/mobile-network/client.mjs` is a frontend-only transport for a future approved HTTPS gateway. It preserves existing paths and versioned mutation payloads, rejects unconfigured requests and private Sites origins, and never supplies platform identity headers. Tokens must come from a verified identity flow and be validated by the server. No token provider or gateway is activated by this module. Keep tokens out of logs and source; use approved device secure storage once the mobile authentication flow is implemented.

The Sites-hosted API currently trusts platform-supplied identity inside that hosting boundary. It cannot safely accept a mobile bearer token merely because the client sends one. A production gateway must validate issuer/audience/signature/expiry and map the same stable user identities before invoking preserved business handlers. CORS, trusted origins, callback allowlists and session/refresh/logout handling need deployment-specific configuration. Do not expose an endpoint that accepts client-supplied `oai-authenticated-user-id`.

## Full feature parity acceptance

Every feature in `features.json` must be reachable and support the corresponding website workflow, not just have a screen. Test identical account/data access, owner/admin permissions, score attribution, competition approvals, booking conflicts, server-priced orders, cancellation/returns, lead consent, moderation, quotas and pending-provider states. No invented fixtures, stock, venue availability or rankings in production.

The preserved website limitations also apply on mobile: manual two-view DRS is not automatic certified ball tracking; camera command telemetry is not a video encoder; paid/postage status needs provider verification; memberships and external feeds need activation; social video safety screening is not connected.

## Native release gates

1. Integrate the approved Lovable design into a maintained mobile frontend. React DOM components are not drop-in React Native components. Evaluate the existing Expo project versus a Capacitor shell using actual device capability requirements before committing to a release path.
2. Configure the shared API gateway and standalone identity securely. Verify web and mobile use the same accounts and records without changing business logic.
3. Add permission-aware camera/upload, location, device sharing, secure sessions and notifications, with denied-permission fallbacks. Do not promise background delivery navigation or native streaming without device tests.
4. Activate payment, live-score, shipping, map, voice and camera providers with appropriate approvals; test in sandboxes first.
5. Run device end-to-end checks on iOS and Android, accessibility/reduced-motion checks, interrupted-request handling and safe scoring synchronization. Offline scoring needs explicit reconciliation, not silent duplicate submissions.
6. Obtain Apple/Google developer access, sign builds, test through TestFlight/internal testing and submit store privacy, permissions and review information.

No App Store/Play Store build or production mobile API connection has been completed at kickoff. Current build progress is visible in the Lovable project; the original site remains unchanged.

Transport tests: `node --test tests/mobile-network.test.mjs`.
