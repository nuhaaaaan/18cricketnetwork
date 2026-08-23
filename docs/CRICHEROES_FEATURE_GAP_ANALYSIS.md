# CricHeroes Functional Gap Analysis — 18 Cricket Network

_CricHeroes (https://cricheroes.com/global) is used only as a **functional** reference for grassroots-cricket capabilities. No CricHeroes source, assets, branding, text, or design are copied. All capabilities below are to be implemented independently in the 18 Cricket architecture and visual language._

Legend for **Status in 18 Cricket**: ✅ implemented · 🟡 partial · ⛔ missing.
**Priority**: P0 (foundation) · P1 (core) · P2 (differentiator/later).

| Capability (CricHeroes reference) | In CricHeroes | Status in 18 Cricket | 18 Cricket approach / differentiator | Priority |
| --- | --- | --- | --- | --- |
| Player profiles & cricket identity | Yes | 🟡 basic user (phone/name/type) | Unified cricket identity: roles, batting/bowling style, teams, verified stats, followers, recruiting status | P0 |
| Team profiles & rosters | Yes | 🟡 basic `teams` CRUD | Full roster, captain/VC/manager/coach, historical `TeamMembership`, playing XI | P1 |
| Match scheduling & invites | Yes | ⛔ | `Match` lifecycle (Scheduled→Completed), invites + notifications, formats/ball-type/venue | P1 |
| Ball-by-ball live scoring | Yes | ⛔ | Event-sourced `Delivery` engine (T10/T20/40/50/100-ball/custom), offline-first, undo | P1 |
| Scorecards (batting/bowling/FOW/partnerships) | Yes | ⛔ | Computed from delivery events only (never stored-final-only) | P1 |
| Advanced analytics (Manhattan, worm, wagon wheel, phases) | Yes | ⛔ | Computed from real data; hide until enough data exists | P2 |
| Tournament management (groups, rounds, knockouts, points, NRR) | Yes | 🟡 `tournaments` list + basic model | First-class `TOURNAMENT_ORGANIZER` role + dashboard; stages/fixtures/points auto-updated from matches | P1 |
| Points tables / standings & NRR | Yes | ⛔ | Auto-derived from match results with provenance | P1 |
| Leaderboards (batting/bowling/MVP/fielding) | Yes | ⛔ | Built only from verified match stats; filters by format/season/tournament/geo | P1 |
| Player/team discovery & search | Yes | 🟡 `/api/search` (basic) | Universal Discover across all entities + location-aware (Near Me/city/state) | P1 |
| Live match viewing / match center | Yes | ⛔ | Premium Match Center: live score, commentary, reactions, chat, stream architecture | P2 |
| Live streaming & score overlays | Yes | ⛔ | Integration architecture + overlay foundation (no fake AI output) | P2 |
| Highlights / media | Yes | 🟡 `stories`, `reels`, `livestreams` models | `MediaAsset` model; future AI highlights/summaries (not faked) | P2 |
| Awards / badges / milestones | Yes | ⛔ | Achievement system tied to real stats | P2 |
| Notifications | Yes | ⛔ | `Notification` model + center (invites, results, follows, orders…) | P1 |
| Social / community feed | Yes | 🟡 `posts`/`comments`/likes | Real social graph (`Follow`), feed derived from graph | P1 |
| Messaging | Yes (chat) | 🟡 `direct_messages`/`group_chats` models, list only | Complete DM threads, unread/read receipts, blocking/reporting; team/tournament/match chats | P1 |
| Marketplace / shop | Limited | 🟡 products CRUD + listing | Full `SELLER` role, seller dashboard, product schema, cart/checkout, orders, reviews; dynamic currency | P1 |
| Coaching | Limited | ✅ technique/mindset coaches, 1-on-1 & group sessions | Coach marketplace: discovery, booking, reviews, more specialties; dynamic currency | P1→P2 |
| Academies | Yes (listings) | 🟡 model + list | Claimable academy entities, programs, facilities, reviews | P2 |
| Grounds / venues | Yes (listings) | 🟡 model + list | Claimable venues, availability + booking, reviews | P2 |
| Scorer / umpire tooling | Yes | ⛔ | `SCORER`/`UMPIRE` roles, assignment, dispute resolution, audit log | P2 |
| Match editing / corrections with history | Yes | ⛔ | Auditable corrections (`AuditLog`), never silent overwrite | P1 |
| AI assistant | No (differentiator) | 🟡 chatbot popup | Persistent AI layer that calls backend tools; never fabricates data | P2 (diff) |
| Voice interaction / voice scoring | No (differentiator) | ⛔ | Voice-first navigation/search/scoring with confirmations | P2 (diff) |
| Recruiting / opportunities | No (differentiator) | ⛔ | Player availability + recruiting graph | P2 (diff) |

## 18 Cricket differentiators (beyond CricHeroes)

AI-native interaction · voice-first navigation & scoring · cricket professional network + recruiting · seller/coach/ground/academy marketplaces · tournament operating system · unified cricket identity · modern social graph · cinematic, dark-first "2099" UX.

## Notes on non-cloning

Where a CricHeroes concept conflicts with our architecture, we implement the better 18 Cricket approach (e.g., event-sourced scoring with full provenance/audit rather than storing only final scores; graph-based personalized home feed; AI/voice as first-class layers). We do not replicate CricHeroes layout, copy, colors, or assets.
