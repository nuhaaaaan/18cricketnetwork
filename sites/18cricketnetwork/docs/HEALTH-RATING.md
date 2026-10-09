# 18 Health Rating — deployed v1 contract

The foundation is `models/health_rating.py`, an explicit expert system, not a learned model. `python3 models/health_rating.py --export` produces the versioned `public/health-model.js` parameters. The existing Cloudflare Worker cannot execute a Python process; JavaScript inference consumes that export. Python/Worker parity and export reproducibility are tested. No training dataset, clinical validation, sensitivity/specificity, WHO endorsement or nutritional accreditation is claimed.

## Required disclosure

Restaurant account signup and restaurant application submission require a full inventory, ingredient grams and organic yes/no flags, complete-ingredients declaration and food-policy acknowledgement. Meals require the same recipe disclosure plus cooking method and existing allergen/cross-contact statements. Quantities refer to one consistently defined batch. Expand compound foods into their ingredient components. Simple TXT/CSV upload (10 KB; 1–100 rows) imports into the editable form; the normalized disclosure is persisted in existing JSON records. No PDF/image/OCR support is claimed. No schema migration is needed.

## Local inference

Each recognized ingredient has a published group index from 0 to 9. The recipe index is the grams-weighted mean, excluding neutral water and seasonings. Cooking penalties and supplied per-100g sodium (>600 mg), added sugar (>10 g) and saturated fat (>5 g) penalties are then applied; clamp 0–10 and round to one decimal. These cutoffs and weights are platform heuristics, **not** WHO-approved food-profile rules. They are not athlete-specific nutritional advice. Added fibre is displayed as declared information, not a score bonus. Missing nutrition is prominently labelled; absence never means zero nutrient content. Unrecognized ingredients or only neutral ingredients produce no numerical score.

The provisional restaurant score is an equal average of every available meal, only when all have numeric ratings. Before meals exist, the inventory-only index is explicitly labelled. Coverage is shown. The seller controls recipes and available-menu status, so this is not independently measured whole-business healthfulness. Ingredient completeness and measurements cannot be established from the disclosure alone.

General dietary direction follows [WHO healthy-diet guidance](https://www.who.int/news-room/fact-sheets/detail/healthy-diet): variety, minimally processed foods and moderation of free sugar, sodium and unhealthy fats. [USDA organic labelling guidance](https://www.ams.usda.gov/rules-regulations/organic/labeling) informs evidence handling, not a claimed automatic regulatory certification. Organic claims do not boost the nutrition index. Operations can record that it reviewed evidence for a declared inventory; profile resubmission removes that status. That review is scoped to inventory and does not certify every prepared meal. Evidence references are private; approved ingredient disclosures are member-visible. Listings with reviewed organic inventory evidence are ordered first, then by available rating.

## Optional OpenAI observations

`GET /api/food/health/config` reports activation without exposing secrets. `POST /api/food/health/review` requires a menu item owned by the requester, exact revision and explicit external-processing consent. The adapter requires all three: `HEALTH_OPENAI_ENABLED=true`, `OPENAI_API_KEY` (secret) and `HEALTH_OPENAI_MODEL`. No secret was created or configured in this release. Provider account/billing and credential approval are still required. No live provider request was made during development.

Only a consented review calls the provider. There are hard limits of five requests per owner per UTC day and 100 globally, with atomic request reservations and a per-owner expiring lock in the existing assistant usage tables. Failed requests consume the attempt allowance to prevent uncontrolled retry costs. Responses are bounded, advisory and private; they do not replace the local numeric index. A saved review is reused, and any menu edit clears it. Concurrent recipe edits cause the response save to fail with 409. Only ingredient rows, declared preparation/nutrition and local score details are sent, not account contact information, permits or organic evidence references. No automatic background calls or free-usage promise.

## Existing records

Older disclosures are not silently converted or assigned scores. Restaurants must update and reapprove profiles before opening/new order submission; old meals require recipe declarations before a new order request. Existing historical order snapshots and fulfillment paths remain available. Ratings are not food-safety or allergen clearance; allergens are a separate mandatory statement.

## Validation

Tests cover strict uploads and ingredient parsing, missing/unknown data, organic/water non-boosting, cooking/nutrition penalties, menu coverage, Python/Worker parity, signup enforcement, server-side score derivation, evidence privacy, consent/ownership/version checks, disabled-provider no-network behavior, advisory cache and edit invalidation. Browser visual QA is unavailable in the current managed environment.
