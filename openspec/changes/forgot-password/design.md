## Architecture

This change adds a thin layer on top of existing infrastructure. No new entities, repositories, or database tables are needed.

### Backend

**New use case: `RequestPasswordReset`** (`backend/domain/use_cases/request_password_reset.py`)
- Input: email address
- Looks up member by email via `MemberRepository`
- If member exists and is active: creates a `PasswordToken` via `PasswordTokenRepository`
- Sends email with reset link via `EmailClient`
- Returns nothing (void) — caller never learns whether email existed (OWASP: prevent email enumeration)

**New route: `POST /api/forgot-password`** (in `backend/api/routes/auth_routes.py`)
- Request body: `{ "email": "..." }`
- Calls `RequestPasswordReset` use case
- Always returns `200 { "ok": true }` regardless of whether email exists
- Rate limiting: not implemented now (low-traffic club app), but the use case design supports adding it later

**Email**: Reuses `EmailClient.send_access_link()` with the existing email template. The reset link points to `/set-password?token=<token>`, which is the existing set-password page — no new page needed for the actual reset step.

### Frontend

**New page: `ForgotPasswordPage`** (`frontend/src/pages/ForgotPasswordPage.tsx`)
- Simple form: email input + submit button
- On submit: POST to `/api/forgot-password`
- On success: show confirmation message ("If an account with that email exists, we've sent a reset link")
- On error: show generic error
- Link back to login page

**Login page modification**: Add "Forgot password?" link below the login form, linking to `/forgot-password`.

**New route**: `/forgot-password` in `App.tsx`

### Security (OWASP Password Reset best practices)

1. **No email enumeration**: Same response whether email exists or not
2. **Time-limited tokens**: Existing 48-hour expiry on `PasswordToken`
3. **One-time tokens**: Existing `used_at` tracking, token can only be used once
4. **Secure token generation**: Existing `secrets.token_hex(32)` (64 chars, 256 bits)
5. **HTTPS only**: Caddy enforces HTTPS in production
6. **No password in URL**: Token is opaque, password is entered on the form

## Data Flow

```
User enters email → POST /api/forgot-password
  → RequestPasswordReset use case
    → MemberRepository.get_by_email()
    → PasswordTokenRepository.create()
    → EmailClient.send_access_link(email, name, reset_url)
  → 200 OK (always)

User clicks email link → /set-password?token=xxx (existing page)
  → User enters new password
  → POST /api/set-password (existing endpoint)
    → SetPassword use case (existing)
  → Redirected to login
```
