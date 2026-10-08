# External live scores and 18Digital

## External matches: /live-scores

Scores live in external_score_cache, with viewer follows in score_follows. They are read-only: no external result is inserted into records, scoring deliveries, local rankings, tournament results or match-review approvals. Local matches continue to use their existing scorer.

Two independent provider adapters can be enabled:

- CricketData / CricAPI: set CRICKET_DATA_API_KEY and, only after confirming the plan's website display / redistribution rights, CRICKET_DATA_LICENSE_CONFIRMED=true. Uses the documented HTTPS /v1/currentMatches endpoint with bounded pagination (four pages). Incomplete pagination is labeled. Competition / country metadata is shown only when supplied; names are not guessed from teams. Public docs: https://cricketdata.org/live-cricket-score-api/.
- A contracted partner for additional leagues: set EXTERNAL_SCORES_URL to an HTTPS endpoint, optional EXTERNAL_SCORES_TOKEN, EXTERNAL_SCORES_NAME and EXTERNAL_SCORES_LICENSE_CONFIRMED=true. The token remains server-side. Contract example (not seed data): {matches:[{id,name,competition,country,format,venue,startsAt,state,status,teams,innings:[{name,runs,wickets,overs}],updatedAt}],coverage,truncated}. Valid states: live, upcoming, completed, abandoned, unknown. Max 1,000 matches / two-million-character payload. Do not point this at scraped third-party pages.

Confirm coverage, current-season availability, latency, attribution, pagination, quotas and display rights for each requested league: IPL, international cricket, MLC, MiLC, Ranji, Indian state leagues and other worldwide leagues. A competition appearing in a provider's directory does not establish live-score coverage; provider plans and data features vary. Missing records are never reported as proof that no game is happening. No feed is claimed to cover all games worldwide.

SCORES_REFRESH_SECONDS defaults to 120 (bounded 60–900). Shared D1 cache leases limit provider requests across viewers. Hub polling occurs only while visible. Outages retain the last actual score with delayed status and successful retrieval timestamp; provider event timestamps remain separate and are unavailable unless supplied. API keys and upstream error bodies are never returned to browsers. Official competition-site links are navigation fallbacks, not imported score feeds or partnerships.

## Premium 18Digital

Active, unexpired 18Gold in any membership category enables assistant eligibility. Server checks apply to both text and browser-voice transcripts. Basic / expired users cannot get AI answers by modifying client payloads. History deletion remains available for privacy and never resets quotas. Subscription billing remains unconfigured; explicit time-limited operator pilot grants are distinct from paid subscriptions.

OPENAI_API_KEY is required; OPENAI_MODEL defaults to the existing gpt-4o-mini configuration. Missing provider keys fail closed, never returning canned answers labeled AI. The existing Chat Completions API is retained with max_completion_tokens and store=false. Answers can address cricket and general questions, but the model has no browsing or write tools, and cannot guarantee all questions or current facts. Context contains bounded visible catalogue records and timestamped external score snapshots, treated as untrusted data.

Default allowance controls (server environment overrides are bounded):

- ASSISTANT_MONTHLY_REQUESTS=100, ASSISTANT_DAILY_REQUESTS=30
- ASSISTANT_MONTHLY_TOKENS=100000
- ASSISTANT_MAX_OUTPUT_TOKENS=600
- ASSISTANT_GLOBAL_DAILY_TOKENS=1000000

Periods use UTC calendar days / months. One in-flight request per member, five recent persisted questions per minute, and atomic per-user/global token reservations protect concurrent requests. Reservation uses UTF-8 payload size + framing allowance + output cap, conservatively estimating potential token use, then reconciles provider-reported usage when available. Missing usage retains the reservation. Definitively rejected HTTP requests release tokens but count as attempts; ambiguous network failures / empty answers retain reservations to avoid accidental repeat spend. These are token / request safeguards, not a provider billing-dollar guarantee. Configure provider-side project spending limits too. Clearing chat cannot clear token usage. No public client route activates premium.

## Voice scope

Browser SpeechRecognition / webkitSpeechRecognition provides explicit microphone-start dictation where supported. Users consent, review the transcript, and press Send; no always-on microphone or automatic sending. Browser speech services may process audio; the site stores chat text, not raw audio. SpeechSynthesis offers optional spoken replies and a Stop audio control, with English US, English India and Hindi language preferences. Availability / voices depend on browser / device, and typed chat remains the fallback. This is voice-enabled question-and-answer, not a full-duplex OpenAI Realtime / Siri replacement; there are no paid audio API calls or client-exposed OpenAI keys.

## Publication

Preserve owner-private access. This does not change Azure deployment, domain ownership, OAuth providers, subscriptions or the audience. Feed and model credentials / licensing require owner activation before genuine worldwide score viewing or AI answers can be live. No synthetic matches, statistics, premium grants or usage records are deployed; synthetic data exists only in isolated tests.
