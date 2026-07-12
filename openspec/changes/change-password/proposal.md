## Why

Members can only regain a lost password via the emailed one-time-token flow
(`/api/forgot-password` → `/api/set-password`). There is no way for a
logged-in member who already knows their password to change it themselves —
the only option is to trigger a password reset, which is not the standard
expectation for account security hygiene.

## What Changes

- New **POST `/api/change-password`** endpoint: requires an authenticated
  session, accepts `{ "current_password": "...", "new_password": "..." }`,
  verifies the current password before setting the new one.
- New **"Cambiar contraseña"** menu item in the `[user name]` dropdown menu,
  visible to every logged-in member (not admin-only).
- New **ChangePasswordPage** frontend page at `/change-password`: current
  password, new password, and confirmation fields with success/error
  feedback.
- Reuses the existing `bcrypt` hashing (`hash_password`/`verify_password`)
  and `MemberRepository.set_password_hash` — no new tables or dependencies.

## Capabilities

### New Capabilities
- `password-change`: Self-service password change for authenticated
  members — user provides current password + new password, current
  password is verified, new password is hashed and stored.

### Modified Capabilities
(none — this builds on existing infrastructure without changing its
requirements)

## Impact

- **Backend**: New use case `backend/domain/use_cases/change_password.py`,
  new route in `auth_routes.py`, new dependency factory in
  `dependencies.py`.
- **Frontend**: New page `ChangePasswordPage.tsx`, new route
  `/change-password`, new menu item in `SiteHeader.tsx`.
- **Dependencies**: None new — uses existing bcrypt and JWT-cookie session
  infrastructure.
- **Database**: No schema changes — reuses the existing `password_hash`
  column on `members`.
