# Password Reset

## Requirements

### R1: Forgot password endpoint
- POST `/api/forgot-password` accepts `{ "email": "<address>" }`
- If email belongs to an active member: create a password token and send a reset email
- If email does not exist or member is inactive: do nothing
- Always return `200 { "ok": true }` regardless of outcome

### R2: Reset email content
- Uses the existing email template (`send_access_link`)
- Reset link format: `{base_url}/set-password?token={token}`
- Token expires in 48 hours (existing behavior)

### R3: Frontend forgot-password page
- Accessible at `/forgot-password`
- Shows a form with one field: email address
- On submit, calls `POST /api/forgot-password`
- On success, shows a confirmation message (does not reveal whether email exists)
- Provides a link back to the login page

### R4: Login page link
- The login page includes a "Forgot password?" link pointing to `/forgot-password`

### R5: Password reset completion
- Uses the existing `/set-password?token=xxx` page and `POST /api/set-password` endpoint
- No changes needed to the existing set-password flow

## Scenarios

### S1: Member requests password reset with valid email
- Given: a member with email "user@example.com" exists and is active
- When: POST `/api/forgot-password` with `{"email": "user@example.com"}`
- Then: a password token is created, an email is sent, response is `200 {"ok": true}`

### S2: Request with non-existent email
- Given: no member with email "unknown@example.com" exists
- When: POST `/api/forgot-password` with `{"email": "unknown@example.com"}`
- Then: no token is created, no email is sent, response is still `200 {"ok": true}`

### S3: Request with inactive member email
- Given: a member with email "inactive@example.com" exists but is_active=false
- When: POST `/api/forgot-password` with `{"email": "inactive@example.com"}`
- Then: no token is created, no email is sent, response is `200 {"ok": true}`

### S4: SMTP not configured
- Given: SMTP settings are not configured
- When: POST `/api/forgot-password` with a valid email
- Then: token is created but email sending is skipped (returns false), response is still `200 {"ok": true}`

### S5: Frontend flow
- User clicks "Forgot password?" on login page
- User enters email and submits
- Page shows "If an account with that email exists, we've sent a reset link"
- User receives email, clicks link, lands on set-password page
- User sets new password, logs in
