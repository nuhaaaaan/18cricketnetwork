# 18 Team Huddle

Open `/team-huddle` after completing registration. Existing team record owners automatically manage their team hub. Invite registered players by selecting their player profile. Invitations notify the player immediately; accepting grants private team access. The team owner can appoint captains, vice-captains and keepers. Only owners and accepted captains manage squads and schedules.

Each fixture includes opponent team, venue, game and reporting timestamps, IANA time zone, overs, notes, selected match-day squad and individual duties. Competition fixtures remain proposals until an authorised competition organiser approves them. Approved fixtures create ordinary match records using existing scoring APIs. Updates never reset scored matches; player attribution and official XI confirmation remain the scoring setup workflow. Captain selection notifications go to all active teammates. Removed members receive a final removal notification and lose private access.

Team and fixture channels support captain announcements and member messages; direct messages are visible only to sender and recipient. New accepted members can see historical team-channel messages. No end-to-end messaging encryption is claimed. Manual ETAs are optional and may be cleared. Expired ETAs are omitted from API results, but data is not automatically purged. No GPS is collected.

Changes, audit events and notification rows commit atomically. Stale versions return 409 without extra notification rows. Open pages poll every five seconds; there is no background push, SMS, email or guaranteed offline delivery. Calls do not cause outgoing phone/PSTN or WhatsApp calls.

## Voice activation

Calling is disabled unless both runtime secrets are present:

- `TEAM_TURN_URL`: comma-separated `turn:` / `turns:` relay URLs.
- `TEAM_TURN_SECRET`: a TURN REST shared HMAC secret configured on the relay.

The server issues per-user credentials expiring in one hour. It never returns the shared secret. Relay-only WebRTC keeps peer addresses behind the relay. Microphone permission occurs after the member clicks Start or Accept. No media is stored by 18. Call participation and SDP/ICE signaling are private to active invited members. Signaling is polling-based; heartbeat freshness is 45 seconds, abandoned sessions expire after 90 seconds, and pending invitations expire after 90 seconds. Six-person maximum uses one browser connection per peer. Larger calls require a conferencing provider/SFU. Test on iOS Safari, Android Chrome and desktop across Wi-Fi/mobile networks before enabling in production. Relay configuration, browser media and physical-device verification are outstanding.

The web API contract under `/api/huddle` can be reused by the future mobile app after standalone authentication is configured. This release does not implement native mobile screens or background calling.
