# Tasks — validacion-membresia

## A. Backend

- [x] A1. Migration 007: `members.last_payment TEXT`, `members.gender TEXT`
- [x] A2. `Member` entity + repository Protocol/SQLite impl: new fields,
      `get_by_member_number`
- [x] A3. `ValidateMemberUseCase` + public `GET /api/members/validate`
- [x] A4. Admin create/PATCH endpoints accept `last_payment` / `gender`
- [x] A5. `import-members` maps "Última cuota" / "Género"
- [x] A6. Pytest: validate endpoint (active socio/socia, inactive, gender
      fallback, 404), import mapping, admin PATCH

## B. Frontend

- [x] B1. `ValidacionPage` (+ CSS) replicating legacy layout; route
      `/validacion` in `App.tsx`; `?id=` auto-lookup
- [x] B2. Validate response type in `types/member.ts`
- [x] B3. `AdminMembersPage`: create-form fields + edit dialog for the two
      fields; `types/admin.ts`

## C. Routing / docs

- [x] C1. Caddyfile(.dev/.e2e) redirects → `/ludoteca/validacion`
- [x] C2. README mention
- [x] C3. E2E guest journey: lookup + redirect

## D. Verification

- [x] D1. pytest + frontend build/type-check green
- [x] D2. Browser smoke test (golden path, not-found, inactive, `?id=`)
      + screenshots vs legacy reference
