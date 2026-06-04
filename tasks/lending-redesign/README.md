# Lending redesign — artefact index

Research and planning folder for two linked initiatives:

1. Replicating the club's existing website (Google Sites +
   PythonAnywhere) inside this repo.
2. Redesigning the `/prestamos` lending flow to match the TFM (Master's
   thesis) design prototype.

All work here is documentation-only. No code changes yet.

## In this folder

- [current-state.md](current-state.md) — inventory of the lending app
  as it exists today (routes, pages, components, endpoints, styling
  approach, known gaps).
- [style-guide.md](style-guide.md) — visual + interaction spec distilled
  from the two TFM PDFs. Colours, typography, spacing, components,
  screens inventory, user flows, a11y. Hex codes and fonts reconciled
  against the live production site (Oswald headings, Open Sans body,
  `#BE0000` brand red). **For UI-generation prompts, start at
  [§11 Agent prompt guide](style-guide.md#11-agent-prompt-guide)** —
  it's a Claude-facing Bias / Reject summary of the whole document.
- [plan-replicate-existing-site.md](plan-replicate-existing-site.md) —
  routing table, phases, operations section (deploy, CI, SEO, GDPR,
  backups, email, monitoring), and resolved vs open questions.
- [plan-lending-redesign.md](plan-lending-redesign.md) — v1/v1.5/v2
  scope triage, screen-to-file mapping, work breakdown, open
  questions.
- [decisions.md](decisions.md) — meeting-ready analysis of the twelve
  decisions still on the table (content workflow, ES-only, owners,
  auth, email, analytics, GDPR, …). Primary input for the meeting with
  Ariadna.
- [mockups/](mockups/) — 11 PNG exports of key TFM screens (150 dpi)
  + a cover screenshot of the Figma prototype.
- [existing-site/](existing-site/) — full-page screenshots of the
  current live site (Google Sites home, Juegos de Mesa) and the
  PythonAnywhere catalog / validation / game-detail pages.

## Related resources outside this folder

- [references/aortegarams_R4.pdf](../../references/aortegarams_R4.pdf)
  — 170-page TFM memoir (design source).
- [references/Presentació TFM.pdf](../../references/Presentació%20TFM.pdf)
  — 43-slide TFM defence deck.
- Figma prototype (public, no login):
  <https://www.figma.com/proto/75YAWEkSnwNWAbB0jJARnZ/TFM---Servei-de-pr%C3%A9stec-digital>
- **Private** GitHub repo with the full PythonAnywhere legacy code +
  history: `MiquelAdell/refugio-del-satiro-legacy-pythonanywhere`.
  Local working copy at
  `~/projects/Refugio/pythonanywhere-archive-legacy/mysite/`.
- Members-data CSV cache (PII, local-only, outside this repo):
  `~/projects/Refugio/members.csv`.
- Auto-memory entries:
  - `project_existing_website.md` — live site architecture + legacy
    archive location + sensitive-facts record.
  - `project_members_data.md` — members Sheet schema + import
    implications.

## Status (2026-04-22)

- Investigation: complete.
- Style guide: complete.
- Plans: drafts ready for implementation, decisions locked in
  (routing, v1 scope, ES-only, DB for member validation,
  `test.refugiodelsatiro.es` staging). Remaining open questions
  listed at the bottom of each plan.
- Next step: implementation (Phase 0 of replication + Phase A of the
  redesign can start in parallel).
