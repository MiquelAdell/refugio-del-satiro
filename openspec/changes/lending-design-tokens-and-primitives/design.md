## Context

This is the implementation of Phase A from the archived `plan-lending-redesign` change. The contract lives in `openspec/specs/lending-design-system/spec.md` (5 requirements, 9 scenarios). Decisions D2 (CSS Modules + tiny Radix carve-out), D3 (self-host fonts), D6 (drop i18n), D8 (mobile-first), and D9 (WCAG 2.1 AA) from the archived design.md are still authoritative.

The current state worth highlighting:
- `frontend/src/tokens.css` is a Tailwind-blue palette with system fonts (no Oswald, no Open Sans).
- `frontend/src/components/` already has a `ConfirmDialog` with a hand-rolled focus trap, plus `NavBar` with `.btn` / `.btn-primary` / `.btn-secondary` classes that are imported across pages by string convention.
- 17 files import `useTranslation()` (the archived inventory listed 14; cross-checked against the codebase 2026-04-25 — extras: `main.tsx` for init, `context/AuthContext.tsx`, `pages/AdminContentPage.tsx`).
- `es.json` has 136 lines and is the source of truth for the Spanish copy that gets inlined.

## Goals / Non-Goals

**Goals:**
- Satisfy the token, font, primitives, Dialog, and i18n-removal requirements in `lending-design-system/spec.md`.
- Provide a primitives layer that Phase B/C/D and the shell change can build on without reaching for ad-hoc styles.
- Establish mobile-first defaults in tokens (rem-based spacing, viewport-relative font sizes).
- Drop the i18n stack with zero string regressions.

**Non-Goals:**
- **Header / footer / top nav.** The shell — including the `<PageLayout>` and `Footer` components and the new "Préstamos" submenu replacing the bespoke `NavBar` — is owned by `site-shell-from-scraped-html`. The `<PageLayout>` requirement and "PageLayout shell" scenarios in `lending-design-system/spec.md` will be satisfied by that change, not this one.
- Visual rebuild of `CatalogPage`, `GameCard`, `GameDetailPage`, `MyLoansPage`. Those are Phases B and C.
- Adding `@radix-ui/react-slider`. Phase B owns that.
- Adding toast / skeleton / global error boundary primitives. Those are v1.5 polish.
- Restyling the public root site (`/`) — out of this app's scope.
- Any backend or migration work.

## Decisions

### A1. Token shape and naming

**Decision:** Tokens are CSS custom properties on `:root`, organized by purpose. Names use `--<category>-<role>` (e.g. `--color-text-heading`, `--font-family-heading`). No abbreviations. The full list:

```
Colors      --color-brand, --color-brand-hover, --color-brand-contrast
            --color-text-heading, --color-text-body, --color-text-muted
            --color-surface, --color-surface-alt, --color-border
            --color-success, --color-warning, --color-danger
            --color-available, --color-lent  (legacy, kept for catalog cards)
Typography  --font-family-heading (Oswald), --font-family-body (Open Sans)
            --font-size-{sm,md,lg,xl,2xl,3xl}
            --font-weight-{regular,medium,bold}
            --line-height-{tight,normal,relaxed}
Spacing     --space-{xs,sm,md,lg,xl,2xl,3xl}    (rem-based, mobile-first)
Radius      --radius-{sm,md,lg,full}
Shadow      --shadow-{sm,md,lg}
Breakpoints --bp-{sm,md,lg,xl}                   (declared as CSS vars for JS use)
```

**Why:** explicit role-based names beat Tailwind-style numeric scales for a small codebase. `--color-text-heading` reads better at a CSS call site than `--gray-900`. The legacy `--color-available`/`--color-lent` stay because the catalog cards still reference them; Phase B replaces them with the badge primitive's tokens.

### A2. Fonts: Oswald + Open Sans, woff2 only, two weights each

**Decision:** Self-host:
- `Oswald` weights 500 (medium) and 600 (semibold), Latin subset.
- `Open Sans` weights 400 (regular) and 600 (semibold), Latin subset.
- All `.woff2` only — no `.woff`/`.ttf`/`.eot` fallbacks.
- Files under `frontend/public/fonts/oswald-{weight}.woff2` and `frontend/public/fonts/open-sans-{weight}.woff2`.
- `@font-face` declarations live in `tokens.css` with `font-display: swap`.

**Why:** woff2 is supported in every browser shipping in 2024+, and the Vite build serves files in `public/` as-is. Two weights per family covers headings (Oswald 500/600) and body+CTAs (Open Sans 400/600). Adding more weights is byte cost without UI need.

### A3. Primitives directory structure

**Decision:** `frontend/src/ui/<Primitive>/`
- `<Primitive>.tsx` — component
- `<Primitive>.module.css` — styles (CSS Modules, scoped class names)
- `<Primitive>.test.tsx` — Vitest + RTL
- `index.ts` — re-export

Naming: `Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`. Each accepts a `className` prop for one-off overrides and `data-testid` for tests. None take inline styles.

**Why CSS Modules over inline styles or styled-components:** matches the existing codebase (every component already pairs `.tsx` with a `.css` file). Keeps the styling layer flat and the bundle slim. Project's stated non-goal explicitly forbids CSS-in-JS.

### A4. Dialog primitive sits on top of `@radix-ui/react-dialog`

**Decision:** `Dialog` re-exports the Radix `Root`, `Trigger`, `Portal`, `Overlay`, `Content`, `Title`, `Description`, `Close` primitives wrapped with our own styles. Replaces the existing custom `ConfirmDialog.tsx` focus-trap logic. `ConfirmDialog` itself stays as a small wrapper that composes `Dialog` + a couple of `Button` instances — its public API does not change.

**Why over rolling our own dialog:** focus trap + Escape + return-focus + portaling is exactly the surface that custom implementations get subtly wrong. Radix is ~12 KB gzipped of behavior we don't have to re-test. The carve-out is documented in plan-lending-redesign design.md F4.

### A5. ~~PageLayout vs NavBar split~~ — moved to shell change

Originally Phase A would introduce a `<PageLayout>` wrapping the existing `NavBar`. Removed 2026-04-25: the user wants the header and footer to mirror the scraped club site (`frontend/public/content-mirror/`), with a new "Préstamos" submenu replacing the lending app's bespoke nav. That is a whole-site shell decision, not a lending-app decision, and it lives in the new `site-shell-from-scraped-html` change. Phase A leaves the existing `NavBar` mounted as-is; the shell change replaces it.

### A6. i18n removal: inline literals from `es.json`, no helper

**Decision:** Replace every `t("some.key")` call with the literal Spanish string from `es.json`. Do **not** introduce a `strings.ts` constants file as a halfway-house — there's no demand for it, and it would just become a smaller version of the i18n layer. Hard-coded strings are fine for 100-screen apps; this one has fewer.

Interpolation calls like `t("catalog.playerRange", { min, max })` become template literals: `` `${min} – ${max}` ``.

**Why:** the project is Spanish-only and will stay that way per Decision D6. The cheapest change with the smallest abstraction surface area is the right one.

### A7. ~~NavBar adapted to dark variant per style-guide §5.1~~ — moved to shell change

Originally Phase A would restyle the lending NavBar to a dark-bar variant per style-guide §5.1. Removed 2026-04-25 with A5: `NavBar` is replaced wholesale by the shell change, so any restyling of the current NavBar would be wasted work. The style-guide §5.1 reference still applies — it just gets implemented inside `site-shell-from-scraped-html`.

### A8. Existing `ConfirmDialog` consumers untouched

**Decision:** `ConfirmDialog`'s public API stays the same (`open`, `onClose`, `onConfirm`, `title`, `body`, `confirmLabel`, `cancelLabel`). Its implementation is rewritten on top of the new `Dialog` primitive. Pages that import `ConfirmDialog` (`MyLoansPage`, `AdminMembersPage`, ...) require zero changes.

**Why:** this is Phase A's only "structure unchanged" guarantee. Lets us land the primitives without coupling the migration to consumer rewrites.

## Risks / Trade-offs

- **i18n removal blast radius (17 files)** → land it in a single PR; do not ship a half-migrated state. Mitigation: each file's removal is a mechanical inline-from-es.json — small, reviewable diff. CI typecheck + Vitest catch any missed import.
- **Token rename breaks every existing CSS file** → search-and-replace is mechanical. Mitigation: do the rewrite, then run `grep -r "color-primary\|color-bg-card\|color-text-secondary" frontend/src` to confirm no orphans, then `npm run typecheck && npm run lint && npm test && npm run build`.
- **Self-hosted font legality** → Oswald and Open Sans are both Apache 2.0 / SIL Open Font License. Bundling under `public/fonts/` is allowed; just include attribution in a `frontend/public/fonts/LICENSE.md`.
- **Radix Dialog visual mismatch** → the Radix components are unstyled. We provide the `.module.css` for them. Mitigation: the `Dialog` primitive's tests include a snapshot that asserts the styling.
- **Existing tests assert i18n keys, not literals** → audit and update assertions when the i18n source goes away. Mitigation: track in tasks; can't ship until tests pass.
- **NavBar stays as-is and may briefly look stale** → because A5/A7 moved to the shell change, the lending app keeps its current NavBar (now styled by the new tokens, slightly different look). This is acceptable as an interim — the shell change replaces it shortly after.

## Migration Plan

Single PR on `development`, branch `feature/lending-design-tokens-and-primitives`. Order matters because of the typecheck/test cycle — work top-down so the tree compiles at every commit:

1. Drop in `.woff2` files and `LICENSE.md`. No code references yet.
2. Rewrite `tokens.css` (full new palette + `@font-face` blocks). Run `npm run build` — should pass; CSS class refs will be broken in many components but no new ones added.
3. Add `@radix-ui/react-dialog`. Remove the three i18next deps.
4. Build `ui/Button`, `ui/Input`, `ui/Select`, `ui/Chip`, `ui/Badge`, `ui/Card` (the simple primitives) with tests.
5. Build `ui/Dialog` on Radix.
6. Rewrite `ConfirmDialog` on `ui/Dialog`. Adjust its tests to assert the same public behavior.
7. Find/replace existing `.btn` usages → `<Button>`. Leave the `.btn` style classes in `NavBar.css` for now — `NavBar` itself is replaced by the shell change.
8. i18n removal: delete `frontend/src/i18n/`, delete `LanguageSelector.tsx/.css`, inline literals across the 17 files. Update tests that assert i18n keys.
9. Update `main.tsx` to remove i18n init.
10. Run the gauntlet: `npm run typecheck && npm run lint && npm test && npm run build && cd ../e2e && npx playwright test`.
11. Manual smoke: login, browse catalog, view a game, borrow, return, admin members. Confirm fonts render, brand red on CTAs, no console errors, no Google Fonts requests.

Rollback: revert the merge commit on `development`. No data state involved.

## Open Questions

- ~~**A-Q1.**~~ Footer scope — moved to `site-shell-from-scraped-html`.
- ~~**A-Q2.**~~ Bare-auth pages layout — moved to `site-shell-from-scraped-html` (the shell change decides what login / forgot / set-password pages look like inside the new shell).
- **A-Q3.** Do we want `prefers-reduced-motion` handling in this change for the Dialog open/close animation? Default: yes (set `transition` to `none` when reduced-motion is preferred — trivial to add). Decision: include it.
