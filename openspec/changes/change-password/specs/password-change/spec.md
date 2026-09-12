# Password Change

## Requirements

### R1: Change password endpoint
- POST `/api/change-password` requires an authenticated session (401 if not logged in)
- Accepts `{ "current_password": "...", "new_password": "..." }`
- If `current_password` does not match the member's stored hash: return `400` with an error message, no change made
- If `new_password` is shorter than 4 characters: return `400` with an error message, no change made
- On success: hash and store `new_password`, return `200 { "ok": true }`

### R2: Frontend change-password page
- Accessible at `/change-password`
- Shows a form with three fields: current password, new password, confirm new password
- Client-side validation: new password ≥ 4 characters, new password === confirmation
- On submit, calls `POST /api/change-password`
- On success, shows a confirmation message and clears the form
- On error (e.g. wrong current password), shows the error returned by the API

### R3: User menu entry
- The `[user name]` dropdown menu includes a "Cambiar contraseña" item linking to `/change-password`
- Visible to every logged-in member, regardless of admin status
- Not shown to guests

## Scenarios

### S1: Member changes password successfully
- Given: a member is logged in with password "oldpassword"
- When: POST `/api/change-password` with `{"current_password": "oldpassword", "new_password": "newpassword"}`
- Then: the member's password hash is updated, response is `200 {"ok": true}`, and subsequent login with "newpassword" succeeds

### S2: Wrong current password
- Given: a member is logged in with password "oldpassword"
- When: POST `/api/change-password` with `{"current_password": "wrongpassword", "new_password": "newpassword"}`
- Then: no change is made, response is `400` with an error message

### S3: New password too short
- Given: a member is logged in with password "oldpassword"
- When: POST `/api/change-password` with `{"current_password": "oldpassword", "new_password": "abc"}`
- Then: no change is made, response is `400` with an error message

### S4: Unauthenticated request
- Given: no active session
- When: POST `/api/change-password` with any body
- Then: response is `401`

### S5: Frontend flow
- User opens the `[user name]` dropdown menu and clicks "Cambiar contraseña"
- User enters current password, new password, and confirmation
- On submit, the page shows a success message and clears the fields
- If the current password is wrong, the page shows the API's error message instead
