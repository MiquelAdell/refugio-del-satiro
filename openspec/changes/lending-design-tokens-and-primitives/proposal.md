## Why

Phase A of the lending redesign roadmap (see archived `plan-lending-redesign`). This change makes part of the `lending-design-system` capability spec real: rewrites design tokens to the club's brand palette, self-hosts Oswald + Open Sans, extracts the shared UI primitives every later phase will depend on, and removes the i18n scaffolding. It is the *foundation* phase — Phases B/C/D all assume the primitives and tokens this change ships.

The shell (header, footer, top nav with the new `Préstamos` submenu) is **out of scope here** — it is owned by a separate change `site-shell-from-scraped-html` because the shell decisions apply to the whole site (including the static pages currently served by Caddy from `frontend/public/content-mirror/`), not just the lending app.

## What Changes

- **Replace `frontend/src/tokens.css`** with the brand palette and typography (`#BE0000` primary, `#1F1F1F` headings, `#333333` body, white/`#F5F5F5` surfaces, Oswald headings, Open Sans body). Drops the entire Tailwind-blue token set.
- **Self-host Oswald and Open Sans** as `.woff2` files under `frontend/public/fonts/`, declared via `@font-face` in `tokens.css`. No runtime requests to `fonts.googleapis.com` / `fonts.gstatic.com`.
- **Add `@radix-ui/react-dialog`** as a dependency (headless dialog logic — focus trap, Escape, return-focus). No other Radix primitives are needed in Phase A; the catalog phase will add `@radix-ui/react-slider`.
- **Create `frontend/src/ui/`** with seven primitives: `Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`. Each in its own folder with `.tsx`, `.css`, and `.test.tsx`. All use tokens, none hard-code colors.
- **Migrate existing `.btn` usage** in `NavBar`, `LoginPage`, `ForgotPasswordPage`, `SetPasswordPage`, `MyLoansPage`, `CatalogPage`, `GameDetailPage`, `AdminMembersPage`, `AdminContentPage`, `ConfirmDialog`, `GameCard` to import `Button` from `frontend/src/ui/Button`. The `.btn`/`.btn-primary`/`.btn-secondary` classes in `NavBar.css` stay for now — `NavBar` itself is replaced by the shell change, so cleanup happens there.
- **Rebuild `ConfirmDialog`** on top of the new `Dialog` primitive (Radix-backed) instead of the current custom-rolled focus-trap implementation.
- **Drop i18n**: delete `frontend/src/i18n/`, `frontend/src/components/LanguageSelector.tsx`/`.css`, remove `i18next`, `i18next-browser-languagedetector`, `react-i18next` from `frontend/package.json`, inline Spanish copy from `es.json` into the 17 call sites listed in design.md Context. **BREAKING** for any external code importing `LanguageSelector` (none in tree).

## Capabilities

### New Capabilities

(none — this change implements the existing `lending-design-system` capability)

### Modified Capabilities

- `lending-design-system`: Replace placeholder Purpose with a real one; ADD requirements that pin the concrete Phase A implementation choices (Radix Dialog backing, full token name list, font weights). Note: `<PageLayout>` and the NavBar shell move to the `site-shell-from-scraped-html` change; the existing spec scenarios for `<PageLayout>` will be satisfied by that change, not this one.

## Impact

- **Frontend** (every file under `frontend/src/`): tokens rewrite touches all CSS modules; i18n removal touches 17 `.tsx` files (see design.md Context); new `ui/` directory; `ConfirmDialog` rewritten on Radix.
- **Dependencies**:
  - **Add**: `@radix-ui/react-dialog`.
  - **Remove**: `i18next`, `i18next-browser-languagedetector`, `react-i18next`.
- **Backend**: zero changes. No API, route, or migration touched.
- **Tests**: unit tests for each primitive (`Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`). Existing page tests need their `useTranslation` mocks removed and any text assertions updated to Spanish literals from `es.json`.
- **E2E**: Playwright suite re-run to confirm no regression (login, borrow, return, admin flows). No new e2e tests in Phase A — those land with Phase B feature changes.
- **Bundle size**: net +~150 KB for self-hosted woff2 fonts, ~35 KB for `@radix-ui/react-dialog`, minus ~80 KB for removed i18next stack. Roughly neutral.
- **Rollback**: revert the merge commit on `development`. No data state involved.
