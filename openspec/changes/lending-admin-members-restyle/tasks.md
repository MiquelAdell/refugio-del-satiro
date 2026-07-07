# Tasks — lending-admin-members-restyle (Phase D1)

Branch from `development` as `feature/lending-admin-members-restyle`.
Conventional Commits. Lowest-risk phase — independent of catalog/borrow work.
Definition of Done: specs updated, code matches specs, tests pass, lint +
typecheck clean.

## 1. Page shell

- [ ] 1.1 [FE] Wrap `pages/AdminMembersPage.tsx` in `<PageLayout>`; remove now-duplicated per-page header/padding.

## 2. Primitives

- [ ] 2.1 [FE] Replace every inline button / `.btn` with `ui/Button` (primary = create; secondary = row actions; danger = delete).
- [ ] 2.2 [FE] Replace every text input with `ui/Input`; wrap the create-member form in `ui/Card`.
- [ ] 2.3 [FE] Replace the bespoke confirm flow with `ui/Dialog` for **delete** and **deactivate** (focus trap, Escape-to-close, action only on confirm).
- [ ] 2.4 [FE] Restyle the members table with tokens: bold header, 1px `--color-border` row hairlines, no zebra. Keep all columns/order.

## 3. Parity guard & specs

- [ ] 3.1 [FE] Verify no column, action, sort behaviour, copy, or endpoint changed (diff against pre-redesign page).
- [ ] 3.2 [FE] Update/extend the page test: outermost element is `PageLayout`; controls are `ui/` primitives; create form in `Card`; delete/deactivate open a `Dialog` and act only on confirm; column set unchanged.
- [ ] 3.3 [FE] Run the existing `/admin/members*` API tests unchanged to confirm no backend regression.
- [ ] 3.4 [CR] Update `specs/lending-admin-members-restyle/spec.md` (delta in this folder) only if implementation refines a scenario; otherwise note "implements as specified".
- [ ] 3.5 [CR] `openspec validate lending-admin-members-restyle` → no errors; frontend lint + typecheck + test.
