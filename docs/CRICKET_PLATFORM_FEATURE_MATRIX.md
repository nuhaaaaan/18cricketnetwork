# Cricket Platform Feature Matrix

18 Cricket Network aims to unify the strongest capabilities of several category-leading products into **one** independent cricket platform. The products below are **functional references only** — they help us describe _what_ a capability should do. We do **not** clone their code, design, copy, branding, or assets, and our architecture and visual language are entirely our own.

Reference products: **CricHeroes** (scoring/stats/tournaments), **MSCL** and similar league sites (leagues/governance), **Brewing Cricket** (grassroots community/local discovery), **Amazon** (marketplace/commerce), **Instagram** (social graph/media), **Google Maps** (location discovery). 18 Cricket adds an AI + voice layer as a native differentiator.

Legend — current status: ✅ implemented · 🟡 partial · ⛔ missing. Priority: P0 (foundation) · P1 (core) · P2 (differentiator/later).

| Capability | CricHeroes | MSCL | Brewing Cricket | Amazon | Instagram | Google Maps | 18 Cricket Current | 18 Cricket Target | Priority | Implementation Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live scoring | Yes | — | — | — | — | — | ⛔ | Event-sourced live scoring | P1 | Planned (Phase D) |
| Ball-by-ball | Yes | — | — | — | — | — | ⛔ | `Delivery` event stream, offline-first, undo | P1 | Planned (Phase D) |
| Scorecards | Yes | Yes | — | — | — | — | ⛔ | Computed from delivery events | P1 | Planned (Phase D) |
| Advanced analytics (Manhattan/worm/wagon wheel) | Yes | — | — | — | — | — | ⛔ | Derived from real data; hidden until enough data | P2 | Planned (Phase J) |
| Tournaments | Yes | Yes | Some | — | — | — | 🟡 list + basic model | Organizer OS: stages, fixtures, auto-standings | P1 | Partial (Phase E) |
| Groups/knockouts | Yes | Yes | — | — | — | — | ⛔ | Round robin, groups, knockout, playoffs | P1 | Planned (Phase E) |
| Points table/NRR | Yes | Yes | — | — | — | — | ⛔ | Auto-derived from match results w/ provenance | P1 | Planned (Phase E) |
| Leaderboards | Yes | Yes | — | — | — | — | ⛔ | Built from verified match stats | P1 | Planned (Phase E) |
| Player profiles | Yes | Yes | — | — | Yes | — | 🟡 basic user | Unified cricket identity (`PlayerProfile`) | P0 | Partial |
| Team profiles | Yes | Yes | Some | — | — | — | 🟡 basic `teams` CRUD | Rosters, roles, `TeamMembership`, playing XI | P1 | Partial (Phase C) |
| Leagues/seasons/divisions | Some | Yes | — | — | — | — | ⛔ | League/season/division governance | P1 | Planned (Phase E) |
| Fixtures/scheduling | Yes | Yes | — | — | — | — | ⛔ | `Fixture` generation from stages | P1 | Planned (Phase C/E) |
| Standings governance | Some | Yes | — | — | — | — | ⛔ | Governed standings + corrections/audit | P1 | Planned (Phase E) |
| Match scheduling (non-tournament) | Yes | — | Yes | — | — | — | ⛔ | Friendly match scheduling + invites | P1 | Planned (Phase C) |
| Player/match discovery | Yes | — | Yes | — | Yes | — | 🟡 basic `/api/search` | Universal Discover across entities | P1 | Partial (Phase F) |
| Near-me location discovery | Some | — | Yes | — | — | Yes | 🟡 lat/long radius on grounds/facilities | Location-aware discovery everywhere | P1 | Partial (Phase F) |
| Grounds listings + booking | Yes | — | Yes | — | — | Yes | 🟡 grounds + bookings model | Claimable venues, availability, reviews | P2 | Partial (Phase H) |
| Academies | Yes | — | Yes | — | — | Some | 🟡 model + list + leads | Claimable academies, programs, reviews | P2 | Partial (Phase H) |
| Coaches | Some | — | Yes | — | — | — | ✅ technique/mindset + 1-on-1/group | Coach marketplace + reviews | P1 | Partial (Phase H) |
| Marketplace/sellers | Limited | — | — | Yes | — | — | 🟡 product CRUD (vendor `user_type`) | `SELLER` role + seller onboarding + dashboard | P1 | Partial (Phase B/G) |
| Product listings | Limited | — | — | Yes | — | — | 🟡 products list/query | Product lifecycle + categories + moderation | P1 | Partial (Phase G) |
| Cart/checkout | — | — | — | Yes | — | — | 🟡 cart store + checkout foundation | Full cart→checkout→payment flow | P1 | Partial (Phase G) |
| Orders | — | — | — | Yes | — | — | 🟡 order create + status | Full order lifecycle + fulfillment | P1 | Partial (Phase G) |
| Reviews/ratings | Some | — | — | Yes | — | Yes | ⛔ (rating fields exist, unused) | Reviews for products/sellers/coaches/venues | P1 | Planned (Phase G/H) |
| Social feed/posts | Some | — | Yes | — | Yes | — | 🟡 posts/comments/likes | Graph-derived personalized feed | P1 | Partial (Phase F) |
| Stories/reels | — | — | — | — | Yes | — | 🟡 stories + reels models | Media-rich stories/reels | P1 | Partial (Phase F) |
| Follow graph | — | — | Some | — | Yes | — | 🟡 `squad` (friends) | Real `Follow` social graph | P1 | Partial (Phase F) |
| Messaging/DMs | Yes | — | — | — | Yes | — | 🟡 DM + group models, list only | Full threads, receipts, blocking/reporting | P1 | Partial (Phase F) |
| Notifications | Yes | — | — | Yes | Yes | — | ⛔ | `Notification` model + center | P1 | Planned (Phase F) |
| Media/highlights | Yes | — | — | — | Yes | — | 🟡 stories/reels/livestreams | `MediaAsset` + AI highlights (not faked) | P2 | Partial (Phase J) |
| Awards/badges | Yes | Some | — | — | — | — | ⛔ | Achievements tied to real stats | P2 | Planned (Phase J) |
| Scorer/umpire tooling | Yes | Some | — | — | — | — | ⛔ | `SCORER`/`UMPIRE` roles + assignment | P2 | Planned (Phase D/E) |
| AI assistant (tool-calling) | No (diff) | — | — | Some | — | — | 🟡 chatbot popup (request/response) | Persistent AI that calls backend tools | P2 | Partial (Phase I) |
| Voice | No (diff) | — | — | — | — | Some | ⛔ | Voice-first navigation/search/scoring | P2 | Planned (Phase I) |
| Recruiting/opportunities | No (diff) | Some | Yes | — | — | — | ⛔ | Availability + recruiting graph | P2 | Planned (Phase F) |

Non-negotiable across all capabilities: **MongoDB is the source of truth, no fake runtime data**, and empty states are shown (premium, not placeholders) when a collection is empty.
