# Cricket scoring implementation contract

## Published boundaries

The shared reducer in public/scoring-engine.js serves browser scorecards and server command validation. New setups freeze format/rule metadata. Existing ledgers retain their saved delivery attribution and do not silently reinterpret no-ball balls faced. The match record is currently a versioned JSON aggregate in D1, not the proposed independently normalized PostgreSQL event store.

Accepted commands append uniquely identified records. Undo references the last active event and leaves the original in the ledger. A match revision compare-and-set prevents conflicting writes. Optional command IDs return the original effect on retry. Administrative competition commands enter the existing approval workflow. There is no claim of horizontally distributed match actors, transactional projection outbox or guaranteed live push transport; clients poll authoritative revisions.

## Formats

T10/T20/ODI/40-over/custom use six-ball overs. Hundred uses five-ball sets and ten-ball changes of bowling end. It uses the checked 2026 ECB one-run no-ball default; historical/local conditions must be supplied explicitly before adopting a profile. Test and first-class have four possible innings and no per-bowler or innings delivery quota. They do not use free hits or limited-overs target revisions. Follow-on lead defaults to 200 and is configured by match officials for match duration/applicable conditions.

Bowler, batter and team counters are separate. New faced no-balls count for the batter. Bat runs, wides and no-ball penalties charge the bowler; byes/leg-byes and administrative penalties do not. Dead-ball counting and non-standard over closure require an umpire decision. Exceptional runs, short runs and surviving ends are scorer-entered with authoritative adjudication. Automatic tracking, appeals, DRS adjudication, all field restrictions, penalty-time timers and session clocks are not provided by this reducer.

Super Overs and Super Fives use separate innings. Standard limited-overs repeat-round eligibility is checked. ECB-specific limit/fallback and competition-specific weather advancement must be administered by officials; an available scoring loop is not an automatic tournament qualification decision. Tie-break runs do not enter ordinary player statistics or NRR.

## DLS and NRR

DLS is an official-value entry workflow, not a resource calculation implementation. Record the target, final chase quota and calculation reference, or the par at abandonment and reference. Minimum chase play is configurable before scoring. Interrupted innings quotas are separately recorded. Do not use proportional run rate as DLS.

NRR stores/derives runs and legal-ball contributions: early all-out uses the full final quota; a completed DLS chase credits the first side target minus one at the final allocated chase quota; an abandoned DLS result credits the first side par at actual chase balls. No-result, Test and tie-break innings do not enter ordinary NRR. Forfeit/refusal-to-play special cases and bonus/disciplinary points remain manual competition decisions. Standings are provisional; equal exact points/wins/NRR share rank until prescribed tie-break adjudication. Team names currently identify standings rows, so duplicate team names are rejected by the competition planner rather than merged knowingly.

## Fantasy and rankings

Fantasy contests are free-to-play. Nominated players, published roles, prices and policy freeze on creation. The server validates every XI and applies 2x/1.5x captain multipliers. Contest entry writes recheck time, contest version and first-delivery state within the SQL mutation. Entries are private; leaderboards show anonymous entry IDs. One member has one entry per contest.

Declared lock timestamps and first deliveries are enforced; automatic toss-time detection is not activated. Bench swap logic is tested but requires an authoritative participation integration before use. Do not infer DNP from zero score. Transfers/emergency replacements/auction contracts require additional product rules and workflows.

Reviewed actual-player statistical boards aggregate all regular innings and remain separate from fantasy users. Ring thresholds, cohort eligibility and weekly hysteresis are tested policy functions, not active awarded badges. Global user skill, contextual player impact, Elo calibration, seasonal snapshots and anti-collusion need implementation/backtesting. No fabricated ratings or seeded players are deployed.

## Interfaces

- POST /api/score/:matchId: version, optional commandId, command facts. Conflicts return 409.
- GET /api/scorecard/:matchId: authoritative revision and all innings.
- POST /api/match-setup/:matchId: pre-score profile, squads, roles and officials.
- GET/POST /api/competition/:competitionId: provisional standings or admin-owned structure/points/seed plans.
- GET/POST /api/fantasy/contests: list real contests or authorized publication.
- GET /api/fantasy/contests/:id: own entry, anonymous leaderboard and source match version.
- POST /api/fantasy/contests/:id/entry: validated atomic submission; invalid XI 422, lock 423, conflict 409.

Existing identity, account-completion gates, rate limiting, origin checks and competition governance apply. GraphQL, SSE/WebSocket and normalized projection APIs remain future work, not advertised as active.

## Rule references

- ICC format and competition playing conditions: https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions
- ECB Hundred 2026: https://resources.ecb.co.uk/ecb/document/2026/03/24/f8005182-b39c-4c25-83bd-1ffff0415b7a/The-Hundred-2026.pdf
- Cricket NSW scorer guidance: https://nswcusa.cricketnsw.com.au/app/uploads/2020/05/Scorers-Manual-130922-w-sheets.pdf

These references inform tests and design. Neither the website nor its rule engine is ICC-certified.
