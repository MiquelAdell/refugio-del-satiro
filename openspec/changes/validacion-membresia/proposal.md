# Recover the "Validación Membresía" page

## Why

The legacy PythonAnywhere site serves a public page at
`/Validacion-Membresia` where anyone can type a member number and see whether
that person is a paid-up member. Printed QR codes point at that URL, but on
the new site it currently 301s to `/validacion`, which does not exist. Issue
#78 asks to recover the functionality inside this repo
(`tasks/lending-redesign/plan-replicate-existing-site.md` already planned it
as a public app page backed by the `members` table).

## What Changes

**Backend (Clean Architecture, all layers):**

- `Member` entity gains `last_payment: str | None` (free-text date as in the
  members sheet, e.g. "5/02/2022") and `gender: str | None`
  ("Masculino"/"Femenino"). Forward-only migration `007` adds the two nullable
  TEXT columns to `members`.
- Member repository Protocol/SQLite impl carry the new fields and gain
  `get_by_member_number(member_number) -> Member | None`.
- New `ValidateMemberUseCase` looks a member up by number.
- New **public** endpoint `GET /api/members/validate?number=<int>` returning
  `member_number`, `first_name`, `last_name`, `active`, `last_payment`, and a
  server-derived `gender_label` ("socio" / "socia" / "socio/a" fallback);
  `404` when the number is unknown.
- Admin surfaces accept the new fields: `CreateMemberRequest`, member listing
  response, and a new `PATCH /api/admin/members/{id}` for updating them.
- The `import-members` CLI maps the sheet columns "Última cuota" →
  `last_payment` and "Género" → `gender`.

**Frontend:**

- New public page `ValidacionPage` at `/validacion` (under the SPA's
  `/ludoteca` basename), replicating the legacy presentation: PageTitle
  "Validar membresía", intro line, number search box with clear button,
  full-width Buscar button, and a centred result block ("Nombre Apellidos
  #n", "ES/NO ES socio|socia", "ÚLTIMA CUOTA PAGADA: <fecha>"), plus the
  legacy disclaimer copy. Supports `?id=<n>` auto-lookup. No menu entry.
- `AdminMembersPage` gains the two fields on the create form and an edit
  dialog to maintain them.

**Routing (Caddy):**

- `/Validacion-Membresia` (and case/slash variants) and `/validacion` 301 to
  `/ludoteca/validacion` so printed QR codes keep working.

## Impact

- Affected specs: new `member-validation` capability.
- Affected code: `backend/migrations/`, `backend/domain/`, `backend/data/`,
  `backend/api/routes/{members,admin}.py`, `backend/cli/main.py`,
  `frontend/src/pages/`, `frontend/src/App.tsx`, `frontend/src/types/`,
  `Caddyfile*`, `e2e/`.
