# 18 decision review and mobile reuse

The live implementation is **human-assisted review**, not certified ICC DRS. Two distinct owner-registered cameras (bowler-end and square-leg) are mandatory for broadcasts declared `broadcastSource: "18-camera"`. External broadcast posts are unchanged. Current ICC technical requirements exceed this minimum.

## Shared domain and APIs

`public/drs-rules.js` is runtime-independent JavaScript. Web, Worker and future React Native/other JS mobile clients can import its validation, checklists and conservative evaluation. The existing scoring, ranking and report engines also remain reusable modules. All durable features live in server APIs and D1/R2, not a second mobile-only database. Native clients must use the same server authorization and business rules; a native UI, OAuth/session strategy, deep links, camera permissions, uploads, notifications and platform testing still need implementation. Current hosting identity uses trusted ChatGPT headers; mobile clients cannot supply those headers themselves.

Authenticated JSON endpoints:

- `GET /api/drs/:matchId`: setup, camera readiness, source version and audited reviews.
- `POST /api/drs/:matchId/setup`: `{version, bowler_end, square_leg, placementNote, syncConfirmed}`. Two distinct cameras owned by caller. Only match/competition admins. Alignment declaration binds the current recording session IDs.
- `POST /api/drs/:matchId/reviews`: `{matchVersion, eventIndex, type, originalDecision, referral:"umpire"}`. Opens against a real scored delivery and snapshots evidence context.
- `POST /api/drs/:matchId/reviews/:reviewId`: `{version, observations, aligned, decision, reason, evidence:[{role,url,seconds},...]}`. Exactly two role-tagged supported replay references. Unknown evidence retains original. Version checks prevent finalisation against changed scorecards. Final audit records are immutable.
- Existing `POST /api/records` Live posts accept `broadcastSource:"18-camera"`. Require linked match, admin and two recording acknowledgements, live heartbeats, operator-confirmed alignment. A later data refresh suspends the embed when readiness fails. The upstream provider stream is **not** stopped by this UI gate.

## Safety and remaining engineering

- All observations, timestamps, placement and alignment are entered by an authorised human, not detected or verified by computer vision. They are labelled accordingly. The system evaluates entered facts; it does not analyse video frames.
- No approved tracking or edge-detection provider exists here. LBW trajectory and umpire’s-call cannot authorise a predicted OUT. Plain replay can establish exclusion checks (no-ball, bat first, leg-side pitching etc.). Ambiguous frame order remains inconclusive. Officials verify all live-ball, wicket, ground, clean-catch and boundary details.
- Ordinary boundary classifier excludes overthrows/penalties; special run-out/runner/non-striker timing, obstruction, dead ball and other complex cases go to manual umpire assessment. Applicable competition playing conditions may change the base laws. This is not a full-law adjudication engine or automatic Test/super-over scorer.
- Reviews do not rewrite scoring ledgers. Existing tournament/league-admin approval flow remains the only authorised route for scorecard corrections. Player review limits/timers are deliberately not activated without verified captain identities and official timing integration.
- Hardware gateway handles authenticated device telemetry and capture commands, not RTSP/RTMP/HLS encoding. A real camera video ingest, timecode synchronisation, calibrated multiple-angle pipeline, approved ball tracking/audio edge detection, delivery IDs from hardware, validated uncertainty handling and on-site hardware tests are required for automated DRS. Operator-entered replay URLs are not proof of camera provenance.
- Future adapters must produce server-authenticated, calibrated, versioned evidence, retain originals and uncertainty, and never let client-supplied AI flags bypass umpire authority or scoring governance.

Rules reference: ICC Men's T20I playing conditions effective October 2026, Appendix D and dismissal/boundary clauses. This does not claim every competition uses the same review allowances or that the two-camera setup meets ICC technical requirements.
