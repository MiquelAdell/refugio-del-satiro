# Exact design tokens — from the Figma file

Transcribed **verbatim** from the Figma design-system pages
(`Color-palette` → "Colors" frame, `Tipography` → "Tipografies" frame). These
are the source-of-truth values; prefer them over the style guide's "approximated
from mockups" entries. Where they differ from the **live** `frontend/src/tokens.css`
(Phase A), the discrepancy is flagged ⚠️ — reconcile during Phase B.

> The auto-generated `fig-tokens.css` in this folder is **not** the palette — it
> holds Figma *Variables*, which in this file are prototype-state strings (button
> labels, role names, dialog states). The real palette/type live as Figma
> *styles*, captured below.

## Colors

### Brand & neutrals
| Figma name | Value | Live `tokens.css` | Notes |
|---|---|---|---|
| AccentColor (brand red) | `#BE0000` | `--color-brand: #be0000` | ✅ match |
| Black / BlackBackground | `#000000` | `--color-header-bg: rgb(0,0,0)` | ✅ nav/header is pure black (style guide approximated `#111`) |
| DimGrey / DarkTextColor | `#1F1F1F` | `--color-text-heading: #1f1f1f` | ✅ headings |
| TextColor | `#333333` | `--color-text-body: #333333` | ✅ body |
| White / WhiteText | `#FFFFFF` | `--color-surface`, `--color-brand-contrast` | ✅ |
| GreyBackground | `#EFEFEF` (rgb 239,239,239) | `--color-surface-alt: #f5f5f5`, `--color-border: #e2e2e2` | ⚠️ Figma uses **#EFEFEF** for grey surfaces/borders; live tokens use `#f5f5f5`/`#e2e2e2`. Align to `#EFEFEF`. |
| WhiteBackground (scrim) | `rgba(0,0,0,0.2)` | — | ⚠️ missing — add as `--color-scrim` (used behind cover badges/heart) |
| Gray | `#6D6D6D` | `--color-text-muted: #6b6b6b` | ⚠️ Figma muted is **#6D6D6D** (style guide said `#6B6B6B`); pick one |
| WhiteText_Hover | `rgba(255,255,255,0.7)` | `--color-header-fg-hover: rgba(255,255,255,0.8)` | ⚠️ Figma hover opacity is **0.7** not 0.8 |
| Semi-transparent | `rgba(31,31,31,0.1)` | — | hairline/overlay tint |

### Logo-only reds (do not use as UI accents)
| Figma name | Value |
|---|---|
| RedLogo | `#D90A27` |
| LightRedLogo | `#E94C61` |
| WhitePale | `#D3C7BA` |

### System / status — ⚠️ these are the **Google palette**, not the live tokens
| Figma name | Value | Live `tokens.css` | Notes |
|---|---|---|---|
| GreenSuccess | `#34A853` | `--color-success: #2e7d32` | ⚠️ reconcile to `#34A853` |
| RedError | `#EA4335` | `--color-danger: #c62828` | ⚠️ reconcile to `#EA4335` |
| WarnYellow | `#FBBC05` | `--color-warning: #ed6c02` | ⚠️ reconcile to `#FBBC05` |

> Destructive **actions** still use brand red `#BE0000`; `RedError #EA4335` is for
> system error *messages/icons* (style guide §2.3 / §5.11).

### Category pill pastels (the real set — style guide only approximated these)
Map each BGG/RPGGeek category family to one pastel. Pair every pill with a
readable dark text colour (≈ the family's deep tone) for AA contrast.

| Figma name | Value | Suggested family |
|---|---|---|
| Verde menta | `#98FB98` | Nature / Familiar / Estrategia |
| Rosa suave | `#FFB6C1` | Party / Horror |
| Azul cielo | `#87CEEB` | Mystery / Investigación |
| Azul turquesa | `#BBFFFF` | Aventura |
| Lavanda | `#EBC9FF` | Sci-Fi / Fantasía urbana |
| Melocotón | `#FFDAB9` | Histórica / Infantil |
| Amarillo pálido | `#FFFF99` | Misc / neutral |
| Gris perla | `#C0C0C0` | Uncategorised |

## Typography

| Role | Family | Size | Case | Colour |
|---|---|---|---|---|
| Page title / H1 | **Oswald** Regular | **80px** | UPPERCASE | `#000`/`#1F1F1F` |
| Section title / H2 | **Open Sans** Regular | **24px** | UPPERCASE | `#1F1F1F` |
| H3 | Open Sans Regular | 24px | — | `#1F1F1F` |
| Display accent / game name | **Oswald** Regular | 22px | — | varies |
| Body (p) | **Open Sans** Regular | **16px** | original | `#333333` |
| Small / meta | Open Sans Regular | **12px** | original | `#333` / `#6D6D6D` |

Notes:
- Live `tokens.css` already declares `--font-family-heading: Oswald` and
  `--font-family-body: "Open Sans"` (self-hosted) — ✅.
- The live type scale tops out at `--font-size-3xl: 2.5rem` (40px). The Figma page
  title is **80px** — ⚠️ add a display step (e.g. `--font-size-display: 5rem`) for
  the H1, used with the short red underline (style-guide §5.2).
- Style guide §3.2 said body 14–15px; the Figma says **16px** body / **12px** meta.
  Trust the Figma.
- `Inter`/`Segoe UI`/`Roboto` appear only in the Figma's annotation labels and
  spec sheets — **not** product fonts. Ignore them.

## Assets pulled into this folder
- `assets/logo-refugio.svg` — the club shield logo (satyr + d10), from the Figma
  `Logos` frame. Ship as SVG; provide positive (on light) and contrast (on black
  nav) variants per style-guide §1.2.
- `assets/` — 31 bitmaps referenced by the materialized reference components
  (sample game covers, icons). Reference only — real covers come from BGG.
- `*.jsx` / `*.d.ts` — materialized reference components (exact measurements):
  `Grid`/`List` game cards, `Button`, `Dialog` (Solicitar préstamo), `TitleH1`,
  `CalendarPicker`/`DatePicker`, `Input`, badges. Read these for pixel-exact
  structure; **re-implement** in the repo's CSS-Modules + `ui/` primitives — do
  not import this JSX into the app.
