## Why

Members who forget their password have no self-service way to regain access. Currently, only admins can trigger a password reset via the admin panel ("Send access link"). This creates unnecessary admin burden and blocks members from accessing the app until an admin is available.

## What Changes

- New **POST `/api/forgot-password`** endpoint: accepts an email address, creates a password token, and sends a reset email if the email exists. Always returns 200 (no email enumeration).
- New **"Forgot password?"** link on the login page leading to a forgot-password form.
- New **ForgotPasswordPage** frontend page: email input form with success/error feedback.
- Reuses the existing `PasswordToken` entity, `PasswordTokenRepository`, `EmailClient.send_access_link()`, and `SetPasswordPage` for the actual reset.

## Capabilities

### New Capabilities
- `password-reset`: Self-service password reset flow — user submits email, receives reset link, sets new password via existing set-password page.

### Modified Capabilities
(none — this builds on existing infrastructure without changing its requirements)

## Impact

- **Backend**: New route in `auth_routes.py`, new use case in `domain/use_cases/`.
- **Frontend**: New page `ForgotPasswordPage.tsx`, new route `/forgot-password`, link from login page.
- **Dependencies**: None new — uses existing bcrypt, JWT, SMTP, password token infrastructure.
- **Database**: No schema changes — reuses `password_tokens` table.
