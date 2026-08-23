# Tournament Architecture

Tournaments turn 18 Cricket Network into a tournament operating system for organizers. CricHeroes and league sites are functional references only — standings, points and NRR are implemented independently and **auto-derived from real match results** (never fabricated). Empty tournaments render premium empty states.

## Organizer role

- **Today**: creating a tournament requires `user_type in ["tournament_organizer", "admin"]`; the creator is stored as `organizer_id`.
- **Target**: a first-class `TOURNAMENT_ORGANIZER` role (multi-role RBAC) with an organizer dashboard for managing stages, fixtures, standings and corrections. See `docs/ROLES_AND_PERMISSIONS.md`.

## Tournament creation fields

From the current `Tournament` model (`backend/server.py`): `name`, `description`, `location`, `city`, `start_date`, `end_date`, `tournament_type` (e.g. T20/ODI/Test/Box Cricket), `registration_fee`, `prize_money?`, `max_teams`, `images[]`. Derived/managed fields: `organizer_id`, `teams_registered`, `status`, `created_at`.

## Statuses

- **Today**: the model uses `upcoming` / `ongoing` / `completed`.
- **Target** (richer lifecycle):

```
DRAFT ─▶ REGISTRATION_OPEN ─▶ REGISTRATION_CLOSED ─▶ UPCOMING ─▶ LIVE ─▶ COMPLETED
                                                                    │
                                                                CANCELLED
```

## Stages (target)

A tournament is composed of one or more stages:

- **Round robin** — every team plays every other team.
- **Groups** — teams split into groups, round robin within each.
- **Knockout** — single/elimination bracket.
- **Playoffs** — qualifiers/eliminators/final on top of group or league play.

Each stage generates **fixtures** (`Fixture`), and teams enter via **registrations** (`Registration`).

## Standings, points & NRR (target)

- Standings, points tables and **Net Run Rate (NRR)** are **auto-computed from completed match results**, with provenance back to the matches that produced them.
- Corrections are auditable (`AuditLog`) rather than silently overwritten.

## Leaderboards (target)

- Batting/bowling/MVP/fielding leaderboards built **only from verified match stats**, filterable by format/season/tournament/geography, and hidden until enough real data exists.

## What exists now vs. target

- **Now**: `POST /tournaments` (create), `GET /tournaments` (list/filter by `city`/`status`), `GET /tournaments/{id}` (detail), `GET /tournaments/{id}/matches`. A basic `Match` model exists (`scheduled`/`live`/`completed`, optional string scores + `winner_id`/`mvp_player`), but there is no scoring engine, no stages/fixtures/registrations, and no computed standings/points/NRR/leaderboards.
- **Target**: organizer dashboard, `TournamentStage`/`Fixture`/`Registration` models, event-sourced scoring feeding auto-standings and leaderboards. See `docs/ROADMAP.md` (Phase D scoring engine, Phase E organizer operations).
