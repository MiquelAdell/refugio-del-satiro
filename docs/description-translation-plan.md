# Plan: translating BGG game descriptions to Spanish

Status: **proposal only — not implemented**.

## Problem

Game descriptions come from the BGG thing API and are in English. The catalog
UI is Spanish-only (see `README.md`: "Spanish only; no i18n runtime"), so the
card excerpt and the detail page currently mix Spanish chrome with English
body text.

## Constraints

- BGG does not provide localized descriptions through the XML API, so the text
  must be translated on our side.
- ~240 boardgames plus RPG items today; descriptions change rarely (BGG edits
  are infrequent), so translation is effectively a one-off per description
  version, not a hot path.
- The site runs on a small VPS; translation should happen at import time, not
  per request.

## Recommended approach: translate at import, cache by content hash

1. **Schema**: add `description_es TEXT NOT NULL DEFAULT ''` and
   `description_es_source_hash TEXT NOT NULL DEFAULT ''` to `games` (one
   migration). The hash is `sha256(description)` of the English source the
   translation was made from.
2. **Domain**: a `TranslationService` Protocol in the domain layer
   (`translate(texts: Sequence[str]) -> list[str]`), implemented in the data
   layer against an LLM API (Claude Haiku is the cheap/fast fit; one batched
   request of ~10 descriptions per call keeps costs and rate limits trivial —
   the whole catalog is well under €1 to translate once).
3. **Import flow**: after `fetch_details`, for each game where
   `sha256(description) != description_es_source_hash`, queue the description
   for translation; write `description_es` + the new hash. Unchanged
   descriptions are never re-translated (the cache is the row itself).
4. **Failure mode**: if translation fails or no API key is configured, keep
   `description_es` empty. API serves both fields; the frontend falls back to
   the English `description` when `description_es` is empty — the site never
   breaks because a translation is missing.
5. **Backfill**: a one-off CLI command (`translate-descriptions`) reusing the
   same service, so existing rows don't wait for a BGG edit to get translated.

## Alternatives considered

- **Frontend/browser translation (Google widget, browser auto-translate)** —
  rejected: inconsistent quality, no control, translates the whole page and
  fights the already-Spanish chrome.
- **Free MT APIs (LibreTranslate, DeepL free)** — workable, but board-game
  jargon ("worker placement", "deck-building", "push-your-luck") is where
  generic MT is weakest; an LLM with a one-line prompt ("translate for a
  board-game club catalog; keep game-design terms natural in Spanish") does
  noticeably better for the same near-zero cost at this volume.
- **Translate on read (API middleware with cache)** — rejected: adds a
  runtime dependency on an external API for public pages; import-time keeps
  the serving path fully local.

## Why it is not implemented in this PR

The approach is clear, but it introduces the project's first external LLM/API
dependency (key management on the VPS, cost account, prompt/quality review of
240 translations before publishing). That deserves its own reviewed change
rather than riding along a sync fix + card redesign.
