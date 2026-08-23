# Roles & Permissions

This document describes the current authorization model and the target role-based access control (RBAC) model. **RBAC is not yet enforced** — it is documented here as the target.

## Current model (as implemented)

Every user has a single `user_type` string plus an ad-hoc `is_coach` boolean flag.

- `user_type` values: `player`, `vendor`, `academy`, `tournament_organizer`, `admin`.
- Authorization is minimal and enforced ad hoc inside route handlers, e.g.:
  - Create product → `user_type in ["vendor", "admin"]`.
  - Create academy → `user_type in ["academy", "admin"]`.
  - Create tournament → `user_type in ["tournament_organizer", "admin"]`.
  - Verify user → `user_type == "admin"`.
  - Most other endpoints only require a valid JWT (any authenticated user).
- There is no multi-role support, no permission matrix, and no audit log today.

## Target model (multi-role RBAC)

A user may hold **multiple** roles. Planned roles:

`USER`, `PLAYER`, `CAPTAIN`, `TEAM_MANAGER`, `COACH`, `SCORER`, `UMPIRE`, `CLUB_ADMIN`, `TOURNAMENT_ORGANIZER`, `LEAGUE_ADMIN`, `SELLER`, `GROUND_OWNER`, `ACADEMY_OWNER`, `PLATFORM_ADMIN`.

## Permission matrix (sketch — target)

Legend: ✅ allowed · — not allowed. This is a design sketch, not the enforced behavior.

| Action | USER/PLAYER | CAPTAIN | TEAM_MANAGER | COACH | SCORER | UMPIRE | CLUB_ADMIN | TOURNAMENT_ORGANIZER | LEAGUE_ADMIN | SELLER | GROUND_OWNER | ACADEMY_OWNER | PLATFORM_ADMIN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create/join team | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — | — | ✅ |
| Manage team roster | — | ✅ | ✅ | — | — | — | ✅ | — | — | — | — | — | ✅ |
| Schedule matches | — | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ | — | — | — | ✅ |
| Score matches (ball-by-ball) | — | — | — | — | ✅ | — | — | ✅ | — | — | — | — | ✅ |
| Officiate / confirm results | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — | ✅ |
| Create tournaments | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | ✅ |
| Manage leagues/seasons | — | — | — | — | — | — | — | — | ✅ | — | — | — | ✅ |
| Manage standings/corrections | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — | ✅ |
| Onboard as seller | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ |
| Publish products | — | — | — | — | — | — | — | — | — | ✅ (approved) | — | — | ✅ |
| List/manage grounds | — | — | — | — | — | — | — | — | — | — | ✅ | — | ✅ |
| List/manage academies | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ |
| Offer coaching sessions | — | — | — | ✅ | — | — | — | — | — | — | — | — | ✅ |
| Verify users/entities | — | — | — | — | — | — | — | — | — | — | — | — | ✅ |

## Enforcement principle

Authorization **must** be enforced backend-side. Hiding buttons in the client is a UX affordance, not a security boundary — every protected mutation must check the caller's roles/permissions server-side (and, where relevant, ownership of the target resource). Sensitive changes (e.g. match corrections) should be recorded in an `AuditLog` rather than silently overwritten.
