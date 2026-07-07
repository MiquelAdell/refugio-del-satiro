# Claude Code handoff — Refugio del Sátiro lending redesign (v1, Phases B/C/D)

This folder is a ready-to-implement work package for the remaining phases of the
lending redesign. It is written in the repo's **OpenSpec** convention so it drops
straight into `openspec/changes/`. It does **not** invent a new process — it
continues the plan already archived at
`openspec/changes/archive/2026-04-25-plan-lending-redesign/`.

## TL;DR for Claude Code

Phase A (design tokens + `ui/` primitives + `PageLayout`, i18n dropped) is
**merged**. Implement the three remaining phases, one PR each, branching from
`development`:

| Order | Change folder | Phase | Surface | Risk |
|------:|---------------|-------|---------|------|
| 1 | `lending-catalog-rebuild` | B1–B3 | Frontend only | Med |
| 2 | `lending-borrow-with-return-date` | B4 + C1 | **Backend + DB + Frontend** | Med |
| 3 | `lending-admin-members-restyle` | D1 | Frontend only | Low |

For each change: read `proposal.md` → `design.md` → work `tasks.md` top to bottom
→ run `openspec validate <change>` + the test/lint/typecheck gates → open the PR.

## Where these files go

Copy each change folder into the repo as-is:

```
handoff/openspec/changes/<change>/   ──►   openspec/changes/<change>/
```

`DECISIONS_NEEDED.md` is for the product owner; it does not go into the repo (or
park it under `tasks/lending-redesign/`).

## Execution order & dependencies

1. **`lending-catalog-rebuild`** first — it adds the `onBorrow(gameId)` hook point
   on `GameDetailPage` and the `/ludoteca` route.
2. **`lending-borrow-with-return-date`** second — it supplies the actual borrow
   dialog handler that the catalog's Borrow CTA calls, plus the backend field and
   `MyLoansPage`. (Can begin in parallel; the dialog can attach to the existing
   catalog borrow control during transition.)
3. **`lending-admin-members-restyle`** any time — independent, lowest risk; good
   warm-up or parallel track.

Branch naming `feature/<change>`, Conventional Commits, merge to `development`.
**Definition of Done** (from `openspec/config.yaml`): specs updated, code matches
specs, tests pass, no breaking surface changed without a proposal. Honour the
Boy-Scout rule.

## Reference materials already in the repo — read these, don't re-derive

| What | Where | Use for |
|------|-------|---------|
| **Visual source of truth** | `tasks/lending-redesign/style-guide.md` | Every component (§5), colour (§2), type (§3), spacing (§4), a11y (§9). §11 is the condensed do/don't list — paste it into UI-generation prompts. |
| Exported TFM pages | `tasks/lending-redesign/mockups/*.png` | Screen-level reference (these are PDF-page exports, not pixel mockups). |
| **Design tokens (live)** | `frontend/src/tokens.css` | Use these CSS variables; do not introduce new hex codes. |
| `ui/` primitives (live) | `frontend/src/ui/` | Compose from `Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`; `PageLayout`/`SiteHeader`/`SiteFooter`. |
| Canonical capability specs | `openspec/specs/lending-*` | The full requirements each change implements. The change folders carry only deltas. |
| Current-state inventory | `tasks/lending-redesign/current-state.md` | Route/component/endpoint map. **Note:** it predates Phase A (lists `NavBar`/`LanguageSelector`/`#2563eb`); treat as a structural map, not a styling source. |
| Decision log | `tasks/lending-redesign/decisions.md` + archived `design.md` | Why scope was cut; D1–D10 resolved decisions. |

## Figma source

The original prototype is the UOC TFM by Ariadna Ortega Rams ("TFM – Servei de
préstec digital"). Exact values extracted from the `.fig` live under
`handoff/figma-extract/` — **prefer these over the style guide's "approximated
from mockups" entries when the two disagree:**

- **`figma-extract/DESIGN_TOKENS.md`** — the verbatim palette + type scale from
  the Figma design-system pages, mapped to the live `tokens.css` with every
  discrepancy flagged ⚠️ (border `#EFEFEF`, Google-palette system colours, the
  real pastel pill set, 80px Oswald page titles, 16px/12px body/meta). **Read
  this first when touching tokens or any visual.**
- **`figma-extract/*.jsx` / `*.d.ts`** — materialized reference components with
  pixel-exact structure: `Grid`/`List` game cards, `Button`, `Dialog`
  (Solicitar préstamo), `DatePicker`/`CalendarPicker`, `Input`, `TitleH1`,
  badges. Reference only — re-implement in the repo's CSS-Modules + `ui/`
  primitives; do not import this JSX.
- **`figma-extract/assets/`** — `logo-refugio.svg` (club shield) + the bitmaps
  the reference components paint.
- `fig-tokens.css` is auto-generated Figma *Variables* (prototype-state strings,
  not the palette) — ignore it; `DESIGN_TOKENS.md` is the real token source.

## Design guardrails (condensed — full list in style-guide §11)

**Bias toward:** brand red `#BE0000` as the single CTA colour; near-black nav with
white text + small red shield; centred constrained width (~1120px); Oswald
uppercase titles with a short red underline; Open Sans body 14–15px; flat
surfaces, 1px hairlines, no resting shadows; pastel category pills by family;
line-art icons always paired with text; confirmation dialogs on state-changing
actions.

**Reject:** gradients, glassmorphism, neon; resting shadows on cards/buttons/
pills; pill-shaped buttons or radii > 8px; multi-colour CTAs; hero/marketing
layouts; desktop hamburger; emoji in chrome; tinting or force-cropping game
covers; icon-only affordances without a tooltip/`aria-label`.

## Open decisions

See `DECISIONS_NEEDED.md` — six product/visual questions (DQ-1…DQ-6), each with a
recommended default so nothing blocks. The relevant `tasks.md` items reference
these DQ numbers.
