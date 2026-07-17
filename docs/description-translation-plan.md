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
- Translation must be entirely free — no paid API accounts.

## Recommended approach: DeepL API Free at import, cache by content hash

DeepL API Free allows 500,000 characters/month at no cost — the whole catalog
(~240 descriptions, roughly 300–400k characters) fits in a single month, and
the content-hash cache keeps recurring usage near zero (only new games and
BGG edits consume quota).

1. **Schema**: add `description_es TEXT NOT NULL DEFAULT ''` and
   `description_es_source_hash TEXT NOT NULL DEFAULT ''` to `games` (one
   migration). The hash is `sha256(description)` of the English source the
   translation was made from.
2. **Domain**: a `TranslationService` Protocol in the domain layer
   (`translate(texts: Sequence[str]) -> list[str]`), implemented in the data
   layer against the DeepL REST API
   (`https://api-free.deepl.com/v2/translate`, `target_lang=ES`). DeepL
   accepts up to 50 texts per request, so the whole catalog is a handful of
   batched calls. Remaining quota is checkable via `/v2/usage`.
3. **Import flow**: after `fetch_details`, for each game where
   `sha256(description) != description_es_source_hash`, queue the description
   for translation; write `description_es` + the new hash. Unchanged
   descriptions are never re-translated (the cache is the row itself).
4. **Failure mode**: if translation fails, quota is exhausted, or no API key
   is configured, keep `description_es` empty. API serves both fields; the
   frontend falls back to the English `description` when `description_es` is
   empty — the site never breaks because a translation is missing.
5. **Backfill**: a one-off CLI command (`translate-descriptions`) reusing the
   same service, so existing rows don't wait for a BGG edit to get translated.

## Account registration and configuration (done by Claude)

Part of the implementation change, performed by Claude with hand-offs to
Miquel where noted:

1. **Register** a DeepL API Free account at deepl.com via browser automation,
   using `refugiodelsatiro@gmail.com` (the project's Google account). Read
   the verification email via the Google Workspace MCP for that account.
   - DeepL may ask for a credit card for identity verification (Free is
     never charged). If prompted, pause and hand off to Miquel for card
     entry.
2. **Retrieve the API key** from the DeepL account page
   (Account → API Keys).
3. **Configure locally**: add `DEEPL_API_KEY` to `.env`; add
   `deepl_api_key: str | None` to `Settings` in `backend/config.py` (same
   pattern as `bgg_bearer_token`).
4. **Configure deploy**: add `DEEPL_API_KEY=${DEEPL_API_KEY:-}` to the `app`
   service environment in `docker-compose.yml` (alongside `BGG_BEARER_TOKEN`)
   and add the key to the VPS `.env` at `/root/refugio-del-satiro`. The VPS
   is production — confirm with Miquel before writing there.

## Alternatives considered

- **LLM API (Claude Haiku)** — the original proposal; rejected: no API access
  available, and any LLM API means a paid account. A jargon-aware prompt
  would handle board-game terms ("worker placement", "deck-building")
  slightly better, but DeepL is the strongest free MT for en→es and the
  pre-publish review of the ~240 translations catches jargon misses once.
- **Offline MT (Argos Translate, Opus-MT)** — the fallback if DeepL signup or
  quota ever becomes a problem: pip-installable, fully local, no account.
  Quality is a step below DeepL, which is why it is not the first choice.
- **Frontend/browser translation (Google widget, browser auto-translate)** —
  rejected: inconsistent quality, no control, translates the whole page and
  fights the already-Spanish chrome.
- **Translate on read (API middleware with cache)** — rejected: adds a
  runtime dependency on an external API for public pages; import-time keeps
  the serving path fully local.

## Why it is not implemented in this PR

The approach is clear, but it introduces the project's first external
translation-API dependency: a DeepL account registration, key management on
the VPS, and a human quality review of ~240 translations before
publishing. That deserves its own reviewed change
(including the registration/configuration steps above) rather than riding
along a sync fix + card redesign.
