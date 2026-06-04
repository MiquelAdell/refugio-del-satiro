# Style guide — Lending / Préstec redesign

This guide distils the visual, interaction, and information-architecture
decisions from the UOC Master's thesis prototype by Ariadna Ortega Rams
(June 2024) into something a frontend/graphical implementer can act on. It
covers the redesign of the lending service for **El Refugio del Sátiro**, the
Sabadell-based board-game and role-playing club.

- Source A: `references/aortegarams_R4.pdf` — 170-page TFM memoir, Catalan,
  with high-fidelity mockups from page 48 onwards.
- Source B: `references/Presentació TFM.pdf` — 43-slide defence presentation
  that condenses the same screens and decisions.

Where something is **not** in the PDFs, the guide says so explicitly. Where
an exact value cannot be read off the mockups (most hex codes, fonts, spacing
scale), the guide proposes a concrete token value and flags it as
**approximated from mockups**. The intent is that this document, plus the
exported mockup PNGs under `tasks/lending-redesign/mockups/`, is enough to
build the UI without going back to the PDFs.

---

## 1. Brand identity

### 1.1 What El Refugio del Sátiro is

- A socio-cultural, non-profit association in Sabadell, dedicated to
  role-playing games ("jocs de rol") and board games ("jocs de taula").
- Post-pandemic decline in activity; the redesign is part of a strategic
  push to grow membership and make the club's game library ("ludoteca")
  visible and usable.
- Current public website: `http://www.refugiodelsatiro.es/` — a Google Sites
  page with a red header and the club crest. The prototype deliberately
  reuses the current site's colour palette and typography so the new
  lending module slots inside the existing Google Sites shell via an
  `iframe` (see §1.4).

### 1.2 Logo

- The club logo is a rounded-square red shield with white line art of a
  satyr silhouette overlaid on a d10 (10-sided die) showing the faces
  "9" and "S" — standing for "9 / Sátiro".
- Palette: red fill, white line work, faint outer dark-red shadow giving a
  subtle glossy button look.
- In the prototype it appears small (roughly 28–32 px tall) at the left of
  the top nav on a **black/very dark header bar** — see
  `mockups/01-catalog-home-052.png` and `mockups/10-admin-ludoteca-sync-066.png`.
- On slide "3. Generació / Prototipatge" the logo is shown at large size
  against a black bar, confirming that the logo is meant to live on dark
  backgrounds in the product UI.

Recommendations for the implementation:

- Ship the logo as SVG so it crispens at any density.
- Provide two variants: **positive** (red on light) for light UI surfaces
  and **negative / contrast** (the current glossy red on black) for the
  dark nav bar shown in the prototype.
- Minimum clear space: at least the width of the "S" letter on all sides.
- Do not recolour the shield — the red is the club's single most
  recognisable visual asset.

### 1.3 Tone and visual personality

Mood: community-first, pragmatic, playful-not-cartoonish, legible, calm.

Derived from the thesis (User Persona sheets, content copy, and the
screens themselves):

- **Friendly, community-first.** The persona insights repeatedly stress
  that the club's core value is "community" and "generating presence"
  rather than transactional efficiency. The redesign reflects that with
  avatar rows, "gustos compartidos" (shared tastes), shared-event lists,
  and rich member profiles.
- **Pragmatic, low-jargon.** UX copy is direct Spanish — "Solicitar
  préstamo", "Gestionar reserva", "Finalizar préstamo", "Recoger los
  juegos" — no gamified fluff around the loan actions themselves. The
  ludification layer (insignias / badges) is scoped to a separate area
  so it doesn't colonise the core loan UI.
- **Playful where appropriate.** Admin entry points use large circular
  illustrated tiles (dice on grass, calendar-with-stopwatch, gold
  medal-ribbon, fantasy sword) — see `mockups/05-admin-home-and-events-054.png`.
  These illustrations are sourced from Flaticon per the thesis (§3.2.5)
  and hint at the tabletop-gaming context without being cartoonish.
- **Legible over flashy.** The mockups use plenty of whitespace, large
  page titles with a short red underline, and a single primary-action
  colour (red) so the next step is obvious.

### 1.4 Integration constraint

The redesigned lending service is meant to be embedded inside the existing
Google Sites website via an `iframe`, not to replace it. The technical
architecture (thesis §3.4, figure 28) assumes:

- Google Sites keeps the club's public site.
- The lending service runs on PythonAnywhere (Python + internal DB).
- External data comes from BoardGameGeek / RPGGeek APIs, Google Sheets
  (member list), Gmail (notifications), Google Apps Script (async jobs),
  LibreTranslate (EN → ES of BGG descriptions).

The visual design therefore had to feel at home inside Google Sites:
centred content column, modest max-width, generous vertical rhythm, no
full-bleed hero imagery. The redesign here is a **web app**, not a
marketing site.

---

## 2. Colour palette

The PDFs publish no hex codes, but the thesis states the prototype "reuses
the colour palette of the main portal" (§3.2.5). We confirmed those
canonical values directly from the production site on 2026-04-21:

- Headings color `rgb(31, 31, 31)` (`#1F1F1F`) on the Google Sites pages.
- Primary red `rgb(190, 0, 0)` (`#BE0000`) — used for filled and outline
  buttons on the embedded PythonAnywhere app. This is the club's actual
  interaction red.
- A lighter red `#F83A22` is used for the Google Calendar brand on the
  Calendario page, but not for general UI.
- Body text `rgb(51, 51, 51)` (`#333333`) on `#FFFFFF`.

The table below uses those verified values for brand and neutrals, and
keeps the agent's educated guesses for tokens that could only be sampled
from mockup pixels (ribbon pinks, category pills, status info blue).
Those are still labelled **approximated from mockups**.

### 2.1 Core palette (verified against live site)

| Token                 | Value     | Source | Usage                                                                 |
| --------------------- | --------- | ------ | --------------------------------------------------------------------- |
| `color.brand.red`     | `#BE0000` | live site (PythonAnywhere button) | Primary buttons, page-title underline, active tab, admin "Sword" tile |
| `color.brand.red.hover` | `#9E0000` | darken 10% | Hover/pressed state of primary buttons                              |
| `color.brand.red.soft` | `#F6E3E6` | approximated | Light red surfaces, "reservado" ribbon tint on some cards            |
| `color.accent.calendar` | `#F83A22` | live site (Calendario page) | Calendar/event accents — secondary to brand red |
| `color.nav.bg`        | `#111111` | mockup sample | Top navigation bar background (very dark, near-black)                 |
| `color.nav.fg`        | `#FFFFFF` | mockup | Top navigation text and icons                                         |
| `color.surface`       | `#FFFFFF` | live site | Default page background                                               |
| `color.surface.alt`   | `#F5F5F5` | approximated | Secondary surfaces (rows, table headers, subtle card fills)           |
| `color.border`        | `#E0E0E0` | approximated | Hairline borders on cards, tables, filter rows                        |
| `color.text.default`  | `#1F1F1F` | live site (h1) | Page headings                                                    |
| `color.text.body`     | `#333333` | live site (body) | Body copy                                                      |
| `color.text.muted`    | `#6B6B6B` | mockup sample | Meta text, "Reservado por mí" subtitles, secondary labels           |
| `color.text.inverse`  | `#FFFFFF` | — | Text on red buttons or dark nav                                         |

### 2.2 Category / tag pills (approximated)

Tag pills identify the game category. Two distinct pill styles appear in
the mockups:

| Category              | Background   | Text      | Appears in                                 |
| --------------------- | ------------ | --------- | ------------------------------------------ |
| "Familiar"            | `#B6EFC7`    | `#0E3B1E` | Diamant card, mockup 02, 06               |
| "Estrategia"          | `#B6EFC7`    | `#0E3B1E` | 7 Wonders card, mockup 02                 |
| "Fiesta"              | `#F7B5C2`    | `#5C1A27` | Speed Cups card, mockup 02                |
| "Aventura"            | `#B6EFC7`    | `#0E3B1E` | Petition list, mockup 07                  |
| "Fantasia Urbana"     | `#CDE8F6`    | `#0A3040` | Liminal, Vampire cards, mockup 11         |
| "Mitología"           | `#CDE8F6`    | `#0A3040` | Liminal RPG, mockup 11                    |
| "Horror"              | `#F7B5C2`    | `#5C1A27` | Vampire RPG, mockup 11                    |
| "Ciencia Ficción"     | `#D6D1EE`    | `#1D1148` | Alien RPG, mockup 11                      |

**Interpretation:** the mockups use a consistent *muted pastel* pill
system where each category has a single stable colour across all cards
("Horror" is pink anywhere it appears). For implementation, normalise
these into four or five category-family tokens (`pill.nature`,
`pill.party`, `pill.mystery`, `pill.scifi`, `pill.neutral`) and map each
BGG / RPGGeek category to a family — otherwise every new category
requires a new token.

### 2.3 Status / state colours

| Token                  | Value     | Usage                                                                   |
| ---------------------- | --------- | ----------------------------------------------------------------------- |
| `color.status.success` | `#2E7D32` | "Juegos añadidos" tile, success confirmations, sync OK                  |
| `color.status.warning` | `#E8A317` | "Juego modificado" tile, mild-urgency warnings                           |
| `color.status.danger`  | `#BE0000` | "Juego eliminado" tile, destructive actions, error icon in sync dialog (same as brand red) |
| `color.status.info`    | `#2F80ED` | Progress-stepper active dots (Historial / Sincronización / Confirmación) |

### 2.4 Ribbon overlays on game covers

The corner banner that marks a game as `EN PRÉSTAMO` or `RESERVADO` is a
diagonal pink-to-red ribbon at the lower-right of the cover (see
`mockups/02-game-cards-states-049.png` and `11-rpg-cards-and-requests-050.png`).

- `ribbon.prestamo.bg`: `#E95A7A` (pink-red) — "EN PRÉSTAMO"
- `ribbon.reservado.bg`: `#BE0000` (brand red) — "RESERVADO"
- `ribbon.fg`: `#FFFFFF`, bold uppercase, ~11px tracking-wide text.

The ribbon sits on top of the cover image, rotated roughly 35° at the
lower-right corner. In the post-test redesign (defence slide "4.
Avaluació / Adequació…") the card became *cleaner* — ribbon retained,
but the score badge was reworked as a **solid red square in the
lower-left of the cover** showing only the numeric BGG score (e.g.
`8.3`) in white.

### 2.5 Contrast and accessibility notes

The PDFs **do not specify contrast ratios**. The red `#BE0000` on white
gives ~7.6:1 (passes AA and AAA for normal text). The muted text
`#6B6B6B` on white is ~5.7:1 (AA). The pink-red ribbon with white text
falls slightly below AA for small text — if it carries real semantic
meaning (it does, it changes the affordance of the card), also expose
state in a text label and/or icon, not colour alone.

---

## 3. Typography

**The PDFs do not name a specific font family**, but we confirmed the
production site's stack on 2026-04-21:

- Headings (H1 `CATÁLOGO`, H2, club title): **Oswald** weight 400 via
  Google Fonts. H1 renders at 80px on the live site.
- Body: **Open Sans** on the PythonAnywhere app, Roboto on the Google
  Sites shell. Both resolve to `"Helvetica Neue", Helvetica, Arial,
  sans-serif` as fallback.

Since Open Sans is the font used throughout the club's actual catalog
and admin app (the PythonAnywhere embed), we adopt it as the body
default rather than Roboto.

### 3.1 Font stack (verified)

```
--font-family-base: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-family-display: "Oswald", "Open Sans", "Helvetica Neue", Arial, sans-serif;
```

- Body, form, and data text use `--font-family-base` at 400/600 weight.
- Large uppercase page titles, club name, and game names use
  `--font-family-display` at 400/700 weight (Oswald reads best at 400
  large; 700 for emphasis).

For GDPR: self-host both fonts from `frontend/public/fonts/` rather
than linking `fonts.googleapis.com` — the EU user base makes hot-link
requests to Google a small but avoidable liability.

### 3.2 Type scale (approximated from mockup measurements)

| Role                 | Size   | Weight | Line-height | Case      | Notes                                    |
| -------------------- | ------ | ------ | ----------- | --------- | ---------------------------------------- |
| Page title (H1)      | 40–48px | 700   | 1.15        | UPPERCASE | Red underline, ~120px wide, 3px thick    |
| Section title (H2)   | 24–28px | 700   | 1.2         | UPPERCASE | e.g. "HISTORIAL DE PRÉSTAMOS Y COMENTARIOS" |
| Game name on detail  | 36–42px | 700   | 1.1         | UPPERCASE | `DIAMANT`                                 |
| Card title           | 16px   | 600   | 1.2         | Regular case | Used when game cover is small (list)  |
| Body / paragraph     | 14–15px | 400   | 1.5         | Regular   | Description, comments                     |
| Meta / muted         | 12–13px | 400   | 1.4         | Regular   | "Reservado por mí", "Fecha actualización" |
| Button label         | 14–15px | 500   | 1          | Regular   | "Solicitar préstamo", "Buscar"             |
| Table header         | 13px   | 700   | 1.2         | Regular   | "Nombre usuario", "Fecha salida"           |
| Score badge number   | 14–16px | 700   | 1          | —         | White on red square on cover              |

### 3.3 Hierarchy rules

1. One H1 per screen — the big uppercase page title with a short red
   underline directly below it.
2. Game names rendered on a detail page behave like an H1 for that
   page even when a generic H1 "CATÁLOGO" is also visible (e.g. detail
   view reads: breadcrumb "Atrás" → game cover → `DIAMANT` + icons +
   tags + action button).
3. Use the display uppercase family only on titles, tab-bar text, and
   short calls-to-action. Avoid it for descriptive paragraphs.

---

## 4. Spacing & layout

The PDFs **do not publish a spacing scale**. The values below are read
off the mockups and normalised into a 4-px base scale.

### 4.1 Spacing scale (approximated)

```
--space-1: 4px;    // tight gaps inside pills, between icon + label
--space-2: 8px;    // default small padding
--space-3: 12px;
--space-4: 16px;   // default card padding
--space-5: 24px;   // between cards in grid, between form rows
--space-6: 32px;   // between major sections inside a page
--space-7: 48px;   // above/below page title
--space-8: 64px;   // between the top nav and the H1
```

### 4.2 Container width

The prototype is clearly a **centred, constrained-width** layout — the
catalog, detail, community and admin views all sit in a content column
with visible white margins left and right even on a desktop screen.
This fits the iframe-inside-Google-Sites constraint.

- `--container-max-width: 1120px` (approximated).
- `--container-padding-x: 24px` on tablet, `16px` on mobile, `0` above
  1120px (centred with `margin: 0 auto`).

### 4.3 Grid

The catalog has two view modes toggled by an icon group at the top
right of the filter bar (list / grid — see `mockups/01-catalog-home-052.png`):

- **Grid view:** 3 columns on desktop, likely 2 on tablet, 1 on mobile.
  Each cell ≈ 260–300px wide. Gutter ≈ 16–24px.
- **List view:** full-width rows, cover thumbnail ~110px square on the
  left, title + icons + description to its right.

### 4.4 Breakpoints (proposed — not in PDFs)

The mockups are desktop-only. Propose the standard Material-leaning
breakpoints:

- `sm`: 0–599px (mobile)
- `md`: 600–904px (small tablet)
- `lg`: 905–1239px (desktop)
- `xl`: ≥ 1240px (wide)

Document for the frontend developer: at `sm`, filter bar tabs should
wrap or turn into a dropdown, the admin 4-tile grid should stack to 1
column, and detail-page history tables should become card-style lists.

### 4.5 Depth & elevation

The prototype is **flat by default** — no drop shadows on buttons, the
nav, cards at rest, tabs, or pills. Depth comes from:

- **Surface colour shifts** — `#FFFFFF` page over `#F5F5F5` secondary
  surfaces; dark near-black nav over light page.
- **1px hairline borders** at `color.border` (`#E0E0E0`) on cards,
  tables, filter rows, and inactive tab pills.
- **Type weight contrast** — bold uppercase titles against regular
  body copy carry the visual hierarchy, not shadow stacks.

Exceptions where a soft shadow is allowed:

- **Cards on hover** — subtle lift to signal interactivity (see §5.6).
- **Modal dialogs** — single soft shadow,
  `0 8px 24px rgba(31, 31, 31, 0.08)`, anchoring the dialog above the
  page (see §5.11).
- **Dropdowns and popovers** — same treatment as modals at smaller
  offset.

Never use shadows for:

- Buttons of any variant (primary, secondary, danger).
- Score badges or ribbons on game covers.
- Category pills, status pills, or kbd-style chips.
- The top navigation bar.

---

## 5. Components

All visual references below point to files in
`tasks/lending-redesign/mockups/` (produced from the thesis PDF at 150dpi).

### 5.1 Top navigation bar

Reference: `01-catalog-home-052.png`, `10-admin-ludoteca-sync-066.png`.

- **Background:** near-black (`color.nav.bg` ≈ `#111`).
- **Height:** ~52px.
- **Left:** club shield logo at ~28–32px, vertically centred.
- **Right:** text links in white, right-aligned, 14–15px, regular weight:
  - Socio view: `Catálogo` · `Comunidad` · `Perfil`
  - Admin view: `Catálogo` · `Comunidad` · `Perfil` · `Administración`
- **Active link:** subtle brightening / underline under current section
  (see "Administración" on the admin mockup).
- **No hamburger menu** on the prototype — at mobile widths, propose
  collapsing the 3–4 text links into a single hamburger.
- No search icon in the nav — the catalog itself holds the search
  experience.

### 5.2 Page title block

Reference: every screen.

- Uppercase H1, centred horizontally.
- Red underline directly below: ~120px × 3px, also centred.
- ~32–48px of space above and below the block.

### 5.3 Tab bar (primary catalog tabs)

Reference: `01-catalog-home-052.png`, `08-game-detail-history-and-popular-filters-064.png`.

Five primary tabs across the top of the catalog: `Juegos de mesa`,
`Juegos de rol`, `Populares`, `Prestados`, `Petición de juegos`.

- Each tab is a **pill with a 1px grey border**, white background, black
  label.
- **Active tab** inverts: solid red (`color.brand.red`) fill, white
  label. No bottom indicator line — the fill is the indicator.
- Gap between tabs: ~8px.
- Tabs are fully equal-width on desktop; on narrower widths they should
  wrap or scroll horizontally.

### 5.4 Sub-tab bar (secondary tabs)

Reference: `01-catalog-home-052.png` (Buscador / Filtros), `08-*.png`
(Juegos de mesa / Juegos de rol inside "Populares").

A two-option horizontal toggle styled as a single wide group with a
full-width bottom border. The **active** sub-tab has a thicker bottom
border in red. These are used for mode switches like search-vs-filter,
or board-games-vs-role-games inside `Populares`.

### 5.5 Search + filter region

Reference: `01-catalog-home-052.png`, `06-search-and-new-game-request-055.png`.

- A search mode with a single `Buscar juego por nombre…` text input with
  a magnifier icon on the left, and a `Buscar` button as a full-width
  light-grey row directly below.
- A filter mode with sliders ("Número de jugadores 1–10", "Edad mínima
  +2"), a "Categoria" multi-select that displays chips of picked
  values with an `x` to remove, and a red `Buscar` button on the right.
- On filter mode, the `Buscar` button switches to solid red (primary)
  because filters require an explicit apply.

### 5.6 Game card (catalog grid cell)

Reference: `02-game-cards-states-049.png`, `11-rpg-cards-and-requests-050.png`.

Structure from top to bottom:

1. **Cover image** (fills card width, ~260–300px wide, ~300–360px tall
   depending on aspect ratio of the cover).
2. **State overlays on the cover:**
   - Heart icon (favourite) top-right, 24px, white outline on a subtle
     dark scrim so it works on any cover. Filled red when favourited.
   - Optional BGG rating badge in the lower-left of the cover — solid
     red square, ~40×40px, white bold number. Shown in the
     post-user-test iteration (defence slide "2. Adequació…").
   - Optional diagonal ribbon lower-right: `EN PRÉSTAMO` (pink-red) or
     `RESERVADO` (brand red).
3. **Below the cover, inside the card body:**
   - Rating number in very large type on the left (~20px, bold).
   - Game title (single line, ellipsised if too long).
   - One-line description (3–4 lines clamped, muted colour).
   - Meta icon row: player count (silhouettes), recommended age,
     play-time (clock). For role-playing books: book icon ("rulebook"),
     quill icon ("adventure module").
   - Category pills at the bottom, up to two visible.
4. Card has a 1px grey border, ~8px border-radius, white background, and
   a subtle shadow on hover.

### 5.7 Game card (catalog list cell)

Reference: `01-catalog-home-052.png` (list view icons near top-right).

The same information reflowed as a horizontal row:

- Cover thumbnail (~110×140px) on the left.
- Title + meta icons + clamped description to its right.
- Category pills bottom-right of the row.
- Heart/favourite at the far right.
- State ribbon (if any) is applied as a small corner on the thumbnail.

### 5.8 Game detail page

Reference: `03-game-detail-states-048.png`, `08-game-detail-history-and-popular-filters-064.png`.

Header region:

- Breadcrumb/back link (`< Atrás`) top-left.
- Two-column hero: **cover image** (~260px wide) on the left; **name,
  meta icons, category pills, primary action button** on the right.
- Primary button on the right is the *state-driven action*:
  - Available → `Solicitar préstamo` (red primary).
  - Currently reserved by *me* → `Gestionar reserva` (red primary) plus
    a small muted label below: "Reservado por mí".
  - Currently on loan by *me* → `Finalizar préstamo` (red primary).
  - Reserved/on loan by *someone else* → opens the notify-anonymously
    dialog (see §5.11).
- Favourited-by row: small avatars of members who favourited this game,
  plus a hollow heart button for the current user to toggle their
  favourite. See the updated screen on page 64.
- Long description below, collapsible via `Mostrar más`.

Then a large section block titled `HISTORIAL DE PRÉSTAMOS Y
COMENTARIOS`, with an `Expandir comentarios` button, and a loan/review
table (see §5.12).

### 5.9 Buttons

| Variant     | Background     | Text    | Border       | Usage                                        |
| ----------- | -------------- | ------- | ------------ | -------------------------------------------- |
| Primary     | `brand.red`    | white   | none         | Solicitar préstamo, Buscar (filters), Confirmar sincronización |
| Secondary   | white          | `text.default` | 1px `border` | Cancelar, Volver al historial, tab pills (inactive) |
| Tertiary    | transparent    | `text.default` | none       | Icon-only actions (heart, ordering toggle)     |
| Danger      | `brand.red`    | white   | none         | "Cerrar" on error dialog (same red as primary — state colour doubles as action colour) |
| Disabled    | `#DDDDDD`      | `#9A9A9A` | none       | Full-width "Buscar" bar when nothing is entered |

- Height: 40–44px for regular, 36px for compact.
- Padding: 16px horizontal, 8–10px vertical.
- Corner radius: 4px (subtle, not pill-like) — the design is clearly
  *rectangular with small rounding*, not rounded-pill.
- Hover: darken background by ~10–12%.
- Focus: 2px outline at `color.status.info` with 2px offset (not shown
  in the mockups — proposed for accessibility).
- Active/pressed: darken by ~18%.

### 5.10 Form fields

Reference: `04-loan-date-dialog-053.png`, `06-search-and-new-game-request-055.png`.

- **Text inputs** have a top label with a small calendar/search icon
  and underline-style border (Material-like), no box fill. Placeholder
  text in muted grey.
- **Radio groups** are used for "Juegos de mesa / Juegos de rol" and
  "Por nombre / Por ID" on the request-new-game form.
- **Sliders** (noUiSlider-style) for "Número de jugadores" and "Edad
  mínima".
- **Dropdowns** display a downward chevron; open as a simple list with
  hover-highlighted rows.
- **Multi-select** (used for "Categoria") displays chosen values as
  small chips with an `x` inside the input.
- **Date picker** (see §5.14) for reservation pickup date.

### 5.11 Modal dialogs

Reference: `04-loan-date-dialog-053.png` (date picker),
`07-error-and-notify-dialog-057.png` (error + notify).

- Centred modal, ~480–560px wide, white background, 8px radius,
  drop shadow.
- Top-left: dialog title in the display uppercase style ("Solicitar
  préstamo", "Error en la sincronización").
- Top-right: `×` close icon.
- Body: form fields or message text. Error messages have a small red
  `×` icon on the left of the copy.
- Footer: right-aligned actions, secondary `Cancelar` on the left,
  primary (red) `Sí, notificar` / `Confirmar` / `Cerrar` on the right.
- Dialogs for destructive / state-changing actions always appear — per
  thesis heuristic §3.3.1 item 5, every meaningful action prompts
  confirmation.

### 5.12 Tables

Reference: `08-game-detail-history-and-popular-filters-064.png`
(history of loans and reviews), `10-admin-ludoteca-sync-066.png`
(synchronisation diff).

- Header row: small-caps or bold column titles in a slightly lighter
  weight, separated from body by a 1px grey underline.
- Body rows: zebra-stripes OFF; rows separated by 1px bottom hairline.
- Avatar + name compound cell: small round avatar (~28px) left, full
  name right.
- Star ratings displayed as 5-star row, with filled stars in red and
  unfilled in light grey.
- For the sync diff table: each row is a compact card-table hybrid
  with the game cover, rating badge, icon row, and a status checkbox
  on the right (green tick, orange edit, red cross).

### 5.13 Category pills

See §2.2. Short rounded pills, ~10–12px horizontal padding, 2–4px
vertical, 12–13px label.

### 5.14 Date picker

Reference: `04-loan-date-dialog-053.png`.

- Embedded inside the "Solicitar préstamo" modal.
- Month header with left/right chevrons.
- Grid of days Lun–Dom (Spanish weekday abbreviations).
- **Disabled days** (club closed) are rendered in pale grey and are
  not selectable — a concrete accessibility improvement over "same
  colour but shows error on click".
- Selected day highlighted with a red circle.

### 5.15 Admin entry-point tile

Reference: `05-admin-home-and-events-054.png`.

- Large circular illustrated icon (~160px diameter) on a coloured
  background:
  - Ludoteca: two dice on grass (green), "GESTIÓN DE LUDOTECA".
  - Eventos: calendar + stopwatch (purple), "RESERVA PARA EVENTOS".
  - Insignias: gold medal ribbon (navy), "GESTIÓN DE INSIGNIAS".
  - Roles: fantasy sword (red), "GESTIÓN DE ROLES".
- Title below each icon in uppercase bold.
- Short descriptive line below the title (2–3 lines, muted text).
- The 4 tiles sit in a single row on desktop; propose stacking to
  2×2 on tablet, 1×4 on mobile.

### 5.16 Community member card

Reference: `09-loan-search-and-community-065.png` (post-user-test
redesign).

Three columns: **Socios del Refugio** / **Próximos Eventos** /
**Gustos Compartidos**.

- Each member appears as a small card-row: round avatar (~44px), name
  in bold, role underneath in muted (Junta / Socio), and a small
  coloured badge (featured insignia) to the right.
- Upcoming events render as a thumbnail image + event title in red +
  date + venue + opening hours, as a list of small cards.
- "Gustos compartidos" uses an avatar + a row of favourite-game
  thumbnail squares + a red "+n" overflow chip when there are more.

### 5.17 Progress stepper

Reference: `10-admin-ludoteca-sync-066.png`.

A simple 3-step horizontal progress bar used in the ludoteca-sync
flow: "Historial · Sincronización · Confirmación". The active step is
in red with a filled dot; inactive steps are muted grey.

### 5.18 Request/petition list row

Reference: `07-error-and-notify-dialog-057.png`.

- Game cover thumbnail on the left.
- Title with year, description, category pill, and a `n votos a favor`
  chip with a thumbs-up icon on the right.
- Clicking the chip toggles the vote. Post-user-test note (thesis
  §3.3.1 item 3): the user who created the petition should be able to
  *withdraw* their own petition if no one else has voted for it — add
  an `×` top-right of the row, conditional on that rule.

---

## 6. Iconography & imagery

### 6.1 Icon style

- The mockups use **line-art, monochrome icons** at ~16–20px alongside
  meta info (players, age, time, book-type for RPG).
- All icons sit left-aligned to their label with a ~4–6px gap.
- Icon colour matches the surrounding text colour (primary text on
  white backgrounds, white on dark nav).

### 6.2 Icons that need careful choice

Thesis heuristic §3.3.1 item 2 identifies that the icons for
*role-playing book* and *adventure module* were confusing to users.
The recommendation is:

- Pair each unfamiliar icon with an on-hover / on-focus **tooltip**
  that explains the concept.
- Always expose the concept as text too (don't rely on the icon alone).

### 6.3 Illustrations

The four admin tiles (§5.15) and the "User Persona" cards use richer
flat illustrations sourced from Flaticon and SVG Repo (per thesis
§3.2.5). Implementation guidance:

- Keep the illustration set consistent — do not mix line-art and
  flat-colour styles on the same page.
- Illustrations should be SVG, transparent background, with the coloured
  circle *rendered in the HTML* (not baked into the image) so the colour
  tokens can drive theming.

### 6.4 Game covers / artwork

Game covers come directly from BoardGameGeek and RPGGeek via their
APIs. They carry their own wildly varying art styles; the UI must
cope with that:

- Cards should have a neutral frame (white card on light grey page) so
  the cover's colours don't clash with page chrome.
- Never tint or re-colour the cover.
- Apply a thin semi-transparent dark scrim behind the heart icon and
  the optional BGG rating badge so they remain readable over bright
  art.
- Cover aspect ratios vary (square boxes for board games, tall portrait
  for RPG books). The frame allows any ratio — **do not force crop**
  to a uniform ratio; that destroys recognition. Instead, constrain
  the card height to the cover's natural height.

### 6.5 Member avatars

- Round, 40–44px default, 28px in tables, 64–72px on persona/ludoteca
  sync pages.
- On placeholders, render the member's initial on a coloured circle
  (PDF doesn't show a fallback — proposed).

---

## 7. Screens inventory

All page references use `aortegarams_R4.pdf`. Slide references use
`Presentació TFM.pdf`.

| # | Screen                      | Purpose                                                                   | Key elements                                                                                        | PDF reference                                    |
|---|-----------------------------|---------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------|
| 1 | User selector (prototype)   | Prototype-only helper to pick the test persona                            | Two round avatars: Àlex (Socio) / Nora (Junta)                                                      | Slide 17 (Prototipatge)                          |
| 2 | Catalog (home)              | Entry point; browse / search / filter all games                           | Top nav, H1, 5 primary tabs, search/filter sub-tabs, grid of game cards, view toggle                | p. 52, fig. 13 · `mockups/01-*.png`               |
| 3 | Catalog filter mode         | Narrow results by category, player count, age                             | Slider controls, multi-select, red `Buscar` primary CTA                                             | p. 55, fig. 17 · `mockups/06-*.png`               |
| 4 | Board-game card grid        | Visual list of jocs de taula with state ribbons                           | Rating, cover, ribbons, meta icons, category pills                                                  | p. 49, fig. 8 · `mockups/02-*.png`                |
| 5 | RPG card grid               | Same structure; meta icons include book + quill                           | Covers of tall portrait aspect, "Horror" / "Ciencia Ficción" / "Fantasia Urbana" pills               | p. 50, fig. 9 · `mockups/11-*.png`                |
| 6 | Game detail (available)     | Show full info + main action                                              | Breadcrumb, cover, title, icons, pills, `Solicitar préstamo`, description with "Mostrar más"         | p. 48, fig. 7 · `mockups/03-*.png`                |
| 7 | Game detail (reserved by me)| Post-request: let me manage my reservation                                | `Gestionar reserva` red button, "Reservado por mí" label                                              | p. 48, fig. 7 (centre row) · `mockups/03-*.png`   |
| 8 | Game detail (on loan by me) | Let me finalise the loan                                                  | `Finalizar préstamo` red button                                                                     | p. 49, fig. 7 (top of p. 49) · `mockups/03-*.png` |
| 9 | Loan request dialog         | Pick the pickup date                                                      | Modal, date picker, only club-open days selectable                                                  | p. 53, fig. 14 · `mockups/04-*.png`               |
| 10 | Anonymous notify dialog    | Tell the current holder another member wants the game                     | Modal with explanation, `Cancelar` / `Sí, notificar`                                                | p. 57, fig. 20 · `mockups/07-*.png`               |
| 11 | Error dialog (sync)        | Surface sync failures                                                     | "Error en la sincronización" title, red `×` icon, `Cerrar`                                           | p. 57, fig. 19 · `mockups/07-*.png`               |
| 12 | Game petitions list        | Crowd-sourced purchase suggestions                                        | `SOLICITAR UN NUEVO JUEGO` red wide button, petition rows with vote chip                             | p. 50, fig. 10 · `mockups/07-*.png`               |
| 13 | Request new game form      | Two modes (by name vs by BGG/RPGG ID)                                     | Radio groups, search input, result preview rows with "+" add button                                 | p. 55–56, figs. 17–18 · `mockups/06-*.png`         |
| 14 | Popular games filter       | Trending across both media types                                          | Sub-tab: juegos de mesa / de rol; sliders; results count indicator                                   | p. 64, fig. 23 · `mockups/08-*.png`               |
| 15 | Loans-in-progress view     | "All loans" vs "My loans" toggle                                          | Sub-tab: Todos los préstamos / Mis préstamos; search-by-name input                                   | p. 65, fig. 24 · `mockups/09-*.png`               |
| 16 | Game history + reviews     | Below the detail: chronological loans, ratings, comments                  | Table with avatar + dates + comment + stars; `Expandir comentarios`                                 | p. 64, fig. 22 · `mockups/08-*.png`               |
| 17 | Profile (self / others)    | Personal info, favourites, badges, loan history                           | Avatar, bio, badges grid, favourites carousel, loan history list                                     | thesis §3.2.3, §3.4 — **not fully mocked**       |
| 18 | Community page             | Surface members, upcoming events, shared tastes                           | 3 columns: Socios del Refugio, Próximos Eventos, Gustos Compartidos                                  | p. 65, fig. 25 · `mockups/09-*.png`               |
| 19 | Admin home                 | Four large tiles: Ludoteca / Eventos / Insignias / Roles                  | Illustrated circular tiles, uppercase labels, short descriptions                                    | p. 54, fig. 15 · `mockups/05-*.png`               |
| 20 | Event management           | Create events and reserve games per event                                 | Event form row (title + date + `Crear evento` button) + rows of existing events with action buttons | p. 54, fig. 16 · `mockups/05-*.png`               |
| 21 | Ludoteca sync — history    | Last sync runs log, trigger a new sync                                    | Progress stepper, history list (admin avatar + date)                                                 | p. 66, fig. 26 · `mockups/10-*.png`               |
| 22 | Ludoteca sync — diff       | Review added / modified / deleted games before confirming                 | 3 status tiles (✓ ✎ ✗), list of affected games with cover + rating + status check                      | p. 66, fig. 27 · `mockups/10-*.png`               |
| 23 | Member + role management   | Sync socios from Google Sheets; enable/disable, assign admin role         | Not fully mocked in prototype                                                                        | thesis §3.4.3                                    |
| 24 | Badge management           | Create new badges with expiration date                                    | Not fully mocked in prototype                                                                        | thesis §3.4.3                                    |

Screens 17, 23, 24 are **defined in the thesis text but not rendered as
full mockups**. Their visual design is therefore a design gap that the
implementer should resolve by extrapolating from the components above
(progress stepper + list rows for sync-style pages, card grids for
badges, etc.).

---

## 8. User flows

### 8.1 Socio (member) flows

These correspond to Àlex Vilalta's persona and Escenaris 1–5 (thesis
§3.2.3 and §7.8.1).

#### Flow A — Discover and borrow a game

1. Socio opens the club website, goes to "Préstec" / "Préstamo".
2. System checks membership (via session). If not a socio, show a
   blocking notice ("encara no està donat d'alta").
3. Land on **Catálogo** (grid view by default).
4. Socio scrolls, filters, or searches by name.
5. Opens **Detail** for the game.
6. If the game is free → tap `Solicitar préstamo` → date-picker modal
   → confirm → the card for the socio now shows `Gestionar reserva`
   and a muted "Reservado por mí" below.
7. If the game is already held → tap the primary CTA → opens the
   **Anonymous notify dialog**. Socio chooses whether to notify the
   current holder.

#### Flow B — Confirm pickup and return

1. Socio goes to the `Prestados` tab → switches to `Mis préstamos`.
2. Finds their game row, opens detail.
3. Detail shows `Gestionar reserva` while the book isn't physically
   picked up, and switches to `Finalizar préstamo` once marked as
   collected.
4. Socio returns the book → opens detail again → taps `Finalizar
   préstamo` → confirmation → game goes back to *available* state and
   the socio can leave a comment and star rating.

#### Flow C — Propose a new game for the club to buy

1. From **Catálogo**, open `Petición de juegos` tab.
2. View existing petitions, vote on any that look interesting
   (thumbs-up chip).
3. Tap `Solicitar un nuevo juego` red CTA → opens form.
4. Pick "Juego de mesa / Juego de rol", pick "Por nombre / Por ID",
   run search against BGG/RPGGeek, tap `+` on a result to attach it,
   add a comment, confirm.
5. The new petition appears at the top of the list with 1 vote (the
   requester's own).

#### Flow D — Find people with shared tastes

1. Open **Comunidad** from top nav.
2. Browse the `Socios del Refugio` list, the `Próximos Eventos`
   schedule, and the `Gustos Compartidos` column that surfaces members
   whose favourites overlap with yours.
3. Tap a member → view their profile, favourites, and loan history.

### 8.2 Admin (junta) flows

These correspond to Nora Gómez's persona and Escenaris 6–9.

#### Flow E — Create an event and reserve games for it

1. Admin top nav has an extra `Administración` link — tap it.
2. Tap the **Reserva para eventos** tile.
3. Enter the event title and date → `Crear evento`.
4. Open the event row → `Gestionar juegos` → pick games from the
   catalogue that should be earmarked for the event.
5. On the event day, admin taps `Recoger los juegos` to mark them
   physically taken from the club storage.

#### Flow F — Ludoteca sync (add/remove games)

1. Admin goes to **Gestión de ludoteca** tile from the admin home.
2. Review the history list of previous syncs.
3. Open the BGG profile link (top-right), add or delete games on
   BGG/RPGGeek as the source of truth.
4. Tap `Sincronizar juegos` → the system pulls the diff and shows the
   three-tile summary (`n añadidos` / `n modificados` / `n eliminados`).
5. Admin validates each row → `Confirmar sincronización`. The status
   stepper moves to "Confirmación".

#### Flow G — Manage member roles

1. Admin goes to **Gestión de roles**.
2. System syncs members from the club's Google Sheet.
3. Admin flags who is a socio, who is on the junta (gets admin
   privileges). Screen not fully mocked — implement as a list with
   per-row toggles.

#### Flow H — Create a badge

1. Admin goes to **Gestión de insignias**.
2. Create a badge (name + expiration date).
3. Thesis notes this flow is *contested* — user testing opened a
   debate about whether admins should assign badges directly or hand
   out redemption codes. **Left unresolved in the prototype; see
   Open Questions.**

---

## 9. Accessibility

Explicit accessibility guidance from the thesis is limited, but there
are several concrete points.

From the thesis (§3.3.1 heuristic analysis):

- **Icon-only affordances need tooltips.** The book vs quill RPG icons
  were tested as confusing. Icons that carry semantic meaning must
  always have a text label OR an on-focus/hover tooltip AND `aria-label`.
- **Prevent errors by disabling invalid inputs.** The date picker greys
  out non-club days instead of letting the user pick and then erroring.
- **Confirmation dialogs on every meaningful action.** Thesis marks
  this a "good practice" — the implementation should mirror it
  (loan request, petition withdrawal, sync confirmation, badge creation).
- **Heat-map analysis (Attention Insight) favours the grid view over
  the list view** for the catalog. That doesn't make list view
  inaccessible, but it suggests grid is the better default for
  cognitive load. Keep both — some users will prefer list.

Extra accessibility guidance (proposed — not explicit in the PDFs):

- Target WCAG 2.1 AA. Verify the brand red `#BE0000` against all
  backgrounds it touches (body copy, nav links, pill text).
- Focus ring on all interactive elements, 2px `color.status.info` outline
  at 2px offset. Never rely on hover alone.
- Tabs and tab panels should use `role="tablist"` / `role="tab"` /
  `role="tabpanel"` with proper `aria-selected` wiring.
- Modals should trap focus, close on Esc, and restore focus on close.
- Date picker and sliders need keyboard operability (arrow keys) and
  screen-reader announcements of the current value.
- State on game cards ("En préstamo", "Reservado") must be exposed to
  screen readers with `aria-label` on the card that reads, e.g.,
  "Diamant — reservado". The diagonal ribbon alone is invisible to
  assistive tech.

Responsive / content-reflow guidance:

- At `sm` widths, tables on the game detail page and on the
  sync-diff page should degrade to **cards** — avoid horizontal scroll
  wrappers because they obscure the loan comments, which are the key
  content.
- The primary CTA on the detail page must remain reachable without
  scrolling past the description. Pin it under the cover on mobile.

---

## 10. Open questions

Things the PDFs leave ambiguous, incomplete, or outright unresolved.
The implementer (or Miquel, as product owner) should confirm each
before the frontend team starts coding.

1. **Exact brand hex codes.** ~~The thesis does not publish any.~~
   **Resolved 2026-04-21**: sampled from the production site. Brand red
   is `#BE0000`, calendar accent `#F83A22`, heading text `#1F1F1F`,
   body `#333333` on `#FFFFFF`. Pill and ribbon colours remain
   approximated from the mockups — confirm these with the club if a
   brand sheet exists.
2. **Font family.** ~~The thesis says "the prototype follows the
   typography of the main portal"~~ **Resolved 2026-04-21**:
   production uses Oswald for headings and Open Sans for body. Plan
   to self-host both under `frontend/public/fonts/` for GDPR.
3. **Language.** The prototype is in Spanish (`Solicitar préstamo`,
   `Catálogo`, etc.). The club is in Sabadell and the thesis itself is
   in Catalan. Decide whether to ship ES only, or a CA/ES switcher.
   The BGG→ES translation is already planned via LibreTranslate; a
   Catalan variant would be additional scope.
4. **Authentication.** Thesis §3.4.3 explicitly *defers* authentication
   design to a future iteration. There are three plausible options:
   username/password stored in PythonAnywhere, Google OAuth (but some
   socis may not have Google accounts), or a magic-link over email.
   Pick one and scope it now — the rest of the UI depends on "am I a
   socio / am I an admin" signals being reliable.
5. **Badge (insignia) mechanics.** User testing produced conflicting
   feedback: should admins grant badges directly, or issue redemption
   codes that members enter? The thesis leaves it open. Product
   decision required before building the admin `Gestión de insignias`
   screen.
6. **Withdrawing petitions and editing comments.** Thesis heuristic
   §3.3.1 item 3 flags these as missing. Should a requester be able
   to withdraw a petition *after* other members have voted? And can
   a member edit a loan comment they wrote? Decide and bake it into
   the permission model.
7. **Score badge position on the game card.** The first-iteration
   mockup (p. 48–50) shows the rating *below* the cover, inside the
   card body. The defence presentation shows a redesigned card where
   the rating is a **red square inside the cover**, lower-left.
   Pick one.
8. **Cover aspect ratio handling.** RPG book covers are tall portrait,
   board-game boxes are closer to square. Confirm that the grid cells
   can accommodate variable heights, otherwise padding/trimming
   strategy needs a tighter spec.
9. **View-mode toggle persistence.** The catalog has a grid/list
   toggle. Persist the user's choice (localStorage)? The thesis
   doesn't say.
10. **Mobile design.** The prototype is desktop-only. All responsive
    behaviour described in §4 and §9 is proposed, not documented.
    Schedule a quick mobile pass once the desktop baseline is shipped.

---

## 11. Agent prompt guide

A condensed, Claude-facing summary of the rules above. Paste at the top
of any prompt that asks for UI generation in this style.

Bias toward:

- Brand red `#BE0000` as the single CTA colour, white text on red,
  4px corner radius (rectangular, not pill).
- Dark near-black nav (`#111111`) with white text and the small red
  shield logo on the left.
- Centred, constrained-width layout — 1120px max with generous side
  margins even on desktop. The UI is meant to live inside an iframe.
- Oswald uppercase titles with a short red underline (~120×3px)
  centred under the H1.
- Open Sans body at 14–15px, 1.5 line-height, `#333333` on `#FFFFFF`.
- Flat surfaces, 1px grey borders, no drop shadows on cards or
  buttons. Depth via colour shifts and type weight.
- Pastel category pills mapped by family: green for nature, pink for
  party/horror, blue for mystery/sci-fi, purple for sci-fi-leaning.
  One pill colour per category family.
- Line-art monochrome icons at 16–20px, always paired with a text
  label.
- Confirmation modals on every state-changing action.

Reject:

- Gradients of any kind, glassmorphism, neon glows.
- Drop shadows on resting cards, buttons, ribbons, or pills.
- Pill-shaped buttons or corner radii larger than 8px.
- Multi-colour CTAs — red is the only primary action colour.
- Hero imagery, full-bleed banners, marketing-site layouts.
- Hamburger menus on desktop (collapse only below 600px).
- Emoji in UI chrome.
- Tinting BGG/RPGGeek game covers or forcing them to a uniform
  aspect ratio — frame them in a neutral white card instead.
- Icon-only affordances without a tooltip or `aria-label`.

When generating, ask: "Would this slot cleanly into the current
Refugio del Sátiro Google Sites page without looking out of place?"
If not, start over.

---

## Appendix — exported mockups

Files live in `/Users/miqueladell/code/refugio-del-satiro/tasks/lending-redesign/mockups/`.

- `01-catalog-home-052.png` — full catalog page, grid view with tabs,
  search/filter bar, three sample cards. The canonical home-screen
  reference.
- `02-game-cards-states-049.png` — three board-game cards side by side
  showing available / on-loan ribbon / reserved ribbon states.
- `03-game-detail-states-048.png` — three states of the Diamant detail
  page: available, reserved-by-me, on-loan-by-me.
- `04-loan-date-dialog-053.png` — the `Solicitar préstamo` date-picker
  modal with disabled-day handling.
- `05-admin-home-and-events-054.png` — admin home with the four
  illustrated tiles, and the event-management page below.
- `06-search-and-new-game-request-055.png` — search vs filter modes
  and the `Solicitar un nuevo juego` form with BGG ID/name toggle.
- `07-error-and-notify-dialog-057.png` — sync error dialog and
  anonymous-notify dialog, plus a petitions-list snippet.
- `08-game-detail-history-and-popular-filters-064.png` — post-user-test
  detail page with "Favorito de" avatar row and the loan/comment
  history table, plus the updated `Populares` filter/sort UI.
- `09-loan-search-and-community-065.png` — the `Prestados` Todos/Mis
  sub-tab, and the redesigned community page (three columns).
- `10-admin-ludoteca-sync-066.png` — the ludoteca-sync history view and
  the sync-diff confirmation view with the three status tiles.
- `11-rpg-cards-and-requests-050.png` — role-playing book cards with
  the book/quill icon pair, and the petitions list with vote counts.
