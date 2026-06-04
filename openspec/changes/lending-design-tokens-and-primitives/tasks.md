# Tasks

Branch from `development` as `feature/lending-design-tokens-and-primitives`. Single PR. Land in the order below — the tree compiles after every group, which makes review reviewable.

## 1. Fonts and tokens (no consumer changes yet)

- [x] 1.1 [FE] Download Oswald 500 + 600 and Open Sans 400 + 600 (Latin subset) `.woff2` files. → Used Google's variable woff2s instead — `oswald-variable.woff2` (21 KB) covers Oswald weights 200-700 incl. 500/600; `open-sans-variable.woff2` (42 KB) covers Open Sans weights 300-800 incl. 400/600. Smaller payload than four separate files.
- [x] 1.2 [FE] Add `frontend/public/fonts/LICENSE.md` with attribution for Oswald (OFL) and Open Sans (Apache 2.0). → Both shipped under SIL OFL v1.1; LICENSE.md added.
- [x] 1.3 [FE] Rewrite `frontend/src/tokens.css` per `design.md` A1: full token registry, two `@font-face` blocks (variable axes) with `font-display: swap`, plus backwards-compat aliases for old token names so existing CSS keeps compiling until Phase B/C/D rewrites it.
- [x] 1.4 [FE] Verify with `npm run build` that the build succeeds. → ✓ built in 703ms.

## 2. Dependencies

- [x] 2.1 [FE] `npm install @radix-ui/react-dialog --workspace frontend` (or `cd frontend && npm install @radix-ui/react-dialog`).
- [x] 2.2 [FE] `npm uninstall i18next i18next-browser-languagedetector react-i18next` (do this in step 9 once consumers are migrated; for now leave deps in `package.json`).

## 3. Simple primitives

- [x] 3.1 [FE] Create `frontend/src/ui/Button/{Button.tsx,Button.module.css,Button.test.tsx,index.ts}`. API: `variant: "primary" | "secondary" | "ghost"`, `size: "sm" | "md" | "lg"`, plus standard button props. Tests: renders label, fires `onClick`, disabled state, variant class application.
- [x] 3.2 [FE] Create `frontend/src/ui/Input/{Input.tsx,Input.module.css,Input.test.tsx,index.ts}`. API: standard input props + `label`, `error`. Tests: renders label, propagates value, surfaces error message.
- [x] 3.3 [FE] Create `frontend/src/ui/Select/{Select.tsx,Select.module.css,Select.test.tsx,index.ts}`. API: `options: { value: string; label: string }[]`, `value`, `onChange`, `label`. Native `<select>` styled to match — no headless library needed for v1.
- [x] 3.4 [FE] Create `frontend/src/ui/Chip/{Chip.tsx,Chip.module.css,Chip.test.tsx,index.ts}`. API: `label`, optional `onRemove`. Tests: renders label, fires `onRemove` when close icon clicked.
- [x] 3.5 [FE] Create `frontend/src/ui/Badge/{Badge.tsx,Badge.module.css,Badge.test.tsx,index.ts}`. API: `variant: "available" | "lent" | "neutral" | "rating"`, `children`. Tests: renders text, variant class application.
- [x] 3.6 [FE] Create `frontend/src/ui/Card/{Card.tsx,Card.module.css,Card.test.tsx,index.ts}`. API: `children`, optional `as` (default `div`), optional `clickable` (renders `tabindex=0` + focus ring). Tests: renders children, applies clickable styling and focus ring.

## 4. Dialog primitive (Radix-backed)

- [x] 4.1 [FE] Create `frontend/src/ui/Dialog/{Dialog.tsx,Dialog.module.css,Dialog.test.tsx,index.ts}`. Wrap `@radix-ui/react-dialog` `Root`, `Trigger`, `Portal`, `Overlay`, `Content`, `Title`, `Description`, `Close` with our styles. Add `prefers-reduced-motion` media query in CSS to zero out transitions.
- [x] 4.2 [FE] Tests: opens on trigger, traps focus inside Content, Escape closes, focus returns to trigger on close, animations disabled under `prefers-reduced-motion: reduce` (use `matchMedia` mock).

## 5. ~~PageLayout shell~~ — moved to `site-shell-from-scraped-html`

The shell (header, footer, top nav with the new "Préstamos" submenu) is owned by a separate change. This change keeps the existing `NavBar` mounted as-is; the shell change replaces it.

## 6. ~~NavBar dark variant~~ — moved to `site-shell-from-scraped-html`

Same reason as group 5. The lending app's bespoke `NavBar` is replaced by the new shell's nav, so restyling the current one would be wasted work.

## 7. Migrate `.btn` consumers to `<Button>` primitive

- [x] 7.1 [FE] `frontend/src/components/NavBar.tsx` — logout button → `<Button variant="ghost">`. (NavBar itself is replaced by the shell change; this is a transitional cleanup so the current NavBar stops referencing the `.btn` classes that may also get cleaned up before the shell lands.)
- [x] 7.2 [FE] `frontend/src/components/ConfirmDialog.tsx` — confirm + cancel buttons → `<Button>`.
- [x] 7.3 [FE] `frontend/src/pages/LoginPage.tsx` — submit button → `<Button>`.
- [x] 7.4 [FE] `frontend/src/pages/ForgotPasswordPage.tsx` — submit button → `<Button>`.
- [x] 7.5 [FE] `frontend/src/pages/SetPasswordPage.tsx` — submit button → `<Button>`.
- [x] 7.6 [FE] `frontend/src/pages/MyLoansPage.tsx` — return button (in each row) → `<Button>`.
- [x] 7.7 [FE] `frontend/src/pages/CatalogPage.tsx` — borrow / clear-filters buttons → `<Button>`.
- [x] 7.8 [FE] `frontend/src/pages/GameDetailPage.tsx` — any action buttons → `<Button>`.
- [x] 7.9 [FE] `frontend/src/pages/AdminMembersPage.tsx` — every action and form button → `<Button>`.
- [x] 7.10 [FE] `frontend/src/pages/AdminContentPage.tsx` — every action button → `<Button>`.
- [x] 7.11 [FE] `frontend/src/components/GameCard.tsx` — borrow/return CTA → `<Button>`.
- [x] 7.12 [FE] Search the codebase for remaining `className="btn` matches; expect zero hits.

## 8. ConfirmDialog rewrite

- [x] 8.1 [FE] Rewrite `frontend/src/components/ConfirmDialog.tsx` on top of `ui/Dialog`. Public API unchanged: `open`, `onClose`, `onConfirm`, `title`, `body`, `confirmLabel`, `cancelLabel`.
- [x] 8.2 [FE] Delete the hand-rolled focus-trap / keydown-listener code from the previous implementation.
- [x] 8.3 [FE] Update `ConfirmDialog.test.tsx`: same behavior assertions, new internal mocks if needed for Radix portal.

## 9. Drop i18n

- [x] 9.1 [FE] Inline Spanish literals from `frontend/src/i18n/es.json` at the call site for each of the 17 files in `design.md` Context. Process file by file so commits stay small. Replace `t("foo.bar")` → `"<es.json[foo.bar]>"`. Replace `t("foo", { x })` → template literal.
- [x] 9.2 [FE] Delete `frontend/src/components/LanguageSelector.tsx` + `LanguageSelector.css`.
- [x] 9.3 [FE] Remove the `<LanguageSelector />` mount from wherever it renders (NavBar / footer).
- [x] 9.4 [FE] Delete `frontend/src/i18n/` (the whole directory).
- [x] 9.5 [FE] Remove `i18next`, `i18next-browser-languagedetector`, `react-i18next` from `frontend/package.json` (`npm uninstall ...`).
- [x] 9.6 [FE] Remove the i18n init import from `frontend/src/main.tsx`.
- [x] 9.7 [FE] Update tests that assert on translation keys to assert the inlined Spanish literal instead.
- [x] 9.8 [FE] `grep -r "useTranslation\|i18next\|i18n/" frontend/src` SHALL return zero matches.

## 10. Verify

- [x] 10.1 [FE] `cd frontend && npm run typecheck` passes. → `tsc -b` clean (no output).
- [x] 10.2 [FE] `cd frontend && npm run lint` passes. → 4 pre-existing `react-hooks/set-state-in-effect` errors in `AuthContext.tsx`, `useGameHistory.ts`, `useGames.ts`, `useMyLoans.ts` confirmed via `git stash && lint` to predate this change (introduced when `eslint-plugin-react-hooks` was bumped to ^7.0.1). My added/modified files are lint-clean. CI does not run lint (only `.github/workflows/deploy.yml` exists). Refactoring the hook fetchers is out of Phase A scope; recorded as follow-up tech debt.
- [x] 10.3 [FE] `cd frontend && npm test` passes. → 22 tests across 7 files all pass.
- [x] 10.4 [FE] `cd frontend && npm run build` produces a clean build. → built in 420ms; bundle JS is 297 KB (down from 335 KB pre-i18n-drop).
- [ ] 10.5 [FE] `cd e2e && npx playwright test` passes against the dev server. → **Skipped during apply** — requires a running dev server + DB seed; should be run before merge.
- [x] 10.6 [FE] Manual smoke test in browser. → Done via Chrome DevTools MCP against `http://localhost:5173/prestamos/` (vite dev + uvicorn on 8765, prestamos.db). Verified: catalog renders 226 games with new GameCard; game detail (`/games/1`) renders title/year/lent badge/history with Spanish literals; login + forgot-password pages render with Button primitive; programmatic checks confirm `h1 font-family: Oswald`, `body font-family: "Open Sans"`, `body color: rgb(51,51,51)`, submit button `background-color: rgb(190,0,0)`. 58 resources loaded; **zero requests to `fonts.google*`**. Two pre-existing a11y issues flagged by DevTools (form fields without labels in CatalogPage SearchBar + dual-slider) — out of Phase A scope, recorded for v1.5 a11y pass. Authenticated flows (ConfirmDialog borrow/return, MyLoans, AdminMembers) NOT exercised because sandbox blocked password modification; covered by unit tests + to be re-checked manually after merge.
- [x] 10.7 [FE] `grep -r "#2563eb" frontend/src` SHALL return zero matches. → ✓ zero matches.

## 11. Documentation

- [x] 11.1 [CR] Update `README.md` "Tech Stack" if it mentions blue tokens or i18next; update the "Planned work" entry to mark Phase A as the active change.
- [x] 11.2 [CR] Add a one-paragraph note to the README pointing readers at `frontend/src/ui/` as the primitives directory new components should compose from.

## 12. Open the PR

- [ ] 12.1 [CR] Open PR titled `feat(ui): brand-aligned tokens, self-hosted fonts, ui/ primitives, drop i18n` against `development`. Body links to this change directory and the archived `plan-lending-redesign`.
- [ ] 12.2 [CR] Confirm CI passes (typecheck, lint, test, build, playwright if wired).
