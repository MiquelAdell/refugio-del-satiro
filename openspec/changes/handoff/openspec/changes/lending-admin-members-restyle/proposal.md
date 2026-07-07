## Why

`AdminMembersPage` (`frontend/src/pages/AdminMembersPage.tsx`, ~12KB) still uses
the pre-redesign look: inline button/input styles, ad-hoc dialogs, and no shared
page shell. This change implements the **`lending-admin-members-restyle`**
capability (`openspec/specs/lending-admin-members-restyle/spec.md`): migrate the
page to the Phase-A `ui/` primitives and `PageLayout` **without changing its
structure, columns, actions, or endpoints**. It is the lowest-risk phase and can
ship independently of the catalog/borrow work.

There is **no TFM mockup** for this screen (archived-plan finding **F3**); it is a
list/table screen fully described by the design system + style guide §5.9
(buttons), §5.10 (form fields), §5.11 (dialogs), §5.12 (tables).

## What Changes

- Wrap the page in `<PageLayout>` so header/footer match `CatalogPage`/`MyLoansPage`.
- Replace every inline button with `ui/Button`, every text input with `ui/Input`;
  render the create-member form inside a `ui/Card`.
- Replace the bespoke confirm flow with the `ui/Dialog` primitive (focus trap,
  Escape-to-close) for destructive actions (delete member, deactivate member).
- Restyle the members table to tokens (hairline row separators, no zebra; bold
  column headers) — style-guide §5.12.

## Goals

- Visual consistency with the rest of the lending app, achieved purely by
  swapping in shared primitives and the page shell.

## Non-Goals

- **No** new columns, actions, sorting behaviour, or copy changes.
- **No** API change — `/admin/members*` endpoints are untouched.
- No new member-management features (bulk actions, search, pagination).

## User Impact

- Admins see the same page with the same controls, restyled to match the product.
  Zero workflow change.

## Compatibility

- Pure frontend restyle. No public interface change. Same RBAC (admin-only).

## Rollback

Standalone PR on `development`; revert the merge commit. CSS/markup-level change
only — reverting restores the previous styling with no data or API impact.
