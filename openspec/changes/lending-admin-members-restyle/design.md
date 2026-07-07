## Context

Frontend-only. `AdminMembersPage` is admin-gated (RBAC already in place) and
backed by the `/admin/members*` endpoints listed in
`tasks/lending-redesign/current-state.md` §5 — all of which stay exactly as they
are. Phase A primitives (`Button`, `Input`, `Card`, `Dialog`) and `PageLayout`
already exist under `frontend/src/ui/` and `frontend/src/components/PageLayout/`.

Because there is no mockup (finding F3), follow the design system and style guide
§5.9–5.12 directly; the goal is *consistency*, not a new layout.

## Data flow through the layers

No layer below the frontend is touched. The page keeps its existing hooks/calls:

```
GET  /admin/members              ─► members table
POST /admin/members              ─► create-member form (now inside ui/Card)
PATCH /admin/members/{id}/enable | /disable
POST /admin/members/{id}/send-link | /resend-link
DELETE /admin/members/{id}       ─► via ui/Dialog confirmation
```

Only the presentation layer changes: inline elements → `ui/` primitives; outer
wrapper → `<PageLayout>`; destructive confirmations → `ui/Dialog`.

## Approach

1. Wrap the page body in `<PageLayout>`; remove any per-page header/padding now
   provided by the shell.
2. Swap inline `<button>`/`.btn` for `ui/Button` (variants: primary for create,
   secondary for row actions, danger for delete); inline `<input>` for `ui/Input`;
   wrap the create form in `ui/Card`.
3. Replace the old confirm path (`ConfirmDialog`) with `ui/Dialog` for delete and
   deactivate; keep the exact confirm semantics (action runs only on confirm).
4. Restyle the table with tokens: bold header row, 1px `--color-border` bottom
   hairline per row, no zebra striping. Keep all columns and their order.

## Known constraints

- Do **not** alter columns, actions, sort behaviour, copy, or endpoints — the
  spec asserts parity (`#### Scenario: No new columns or actions`).
- Keep `aria-label`s / labels on inputs; ensure `ui/Dialog` traps focus and
  restores it (WCAG AA, style-guide §9).

## Testing strategy

- **Vitest + RTL**: outermost element is `PageLayout`; buttons/inputs are the
  `ui/` primitives; create form sits in a `Card`; delete/deactivate open a
  `Dialog` and act only on confirm; column set unchanged.
- No backend tests needed (no backend change). Run the existing admin API tests
  unchanged to prove nothing regressed.
