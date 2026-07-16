# lending-member-profile Specification

## Purpose

Define the authenticated, read-only self-profile and its API security boundary for lending-app members.

## Requirements

### Requirement: Authenticated self-profile

The system SHALL provide a read-only profile at `/ludoteca/profile` for the member identified by the signed session. The profile SHALL NOT accept a member ID, expose another member's record, or provide editing controls.

#### Scenario: Authenticated member opens their profile

- **WHEN** an authenticated member opens `/ludoteca/profile`
- **THEN** the system SHALL display the profile associated with that member's session
- **AND** SHALL NOT provide edit or save controls

#### Scenario: Guest opens the profile route

- **WHEN** a visitor without a valid session opens `/ludoteca/profile`
- **THEN** the frontend SHALL redirect the visitor to `/ludoteca/login`
- **AND** `GET /api/me` without a valid session SHALL return HTTP 401

### Requirement: Member profile information

The profile SHALL display the member's membership number, first name, last name, nickname, email, phone, active status, and last payment using the current-member data already held by the authentication context.

#### Scenario: Complete membership information

- **WHEN** the current member has values for every profile field
- **THEN** the profile SHALL display each value and render active status as `Activo` or `Inactivo`
- **AND** SHALL NOT make a second request for the current member

#### Scenario: Nullable membership information

- **WHEN** membership number, nickname, phone, or last payment is null
- **THEN** the profile SHALL show an explicit unavailable fallback for each null value
- **AND** the API SHALL serialize each nullable field as JSON `null`

### Requirement: Profile navigation

The authenticated member menu SHALL expose the profile, and the profile SHALL link to the existing loans and password-change flows.

#### Scenario: Member navigates from the authenticated menu

- **WHEN** an authenticated member opens the user menu and selects `Mi perfil`
- **THEN** the system SHALL navigate to `/ludoteca/profile`
- **AND** the profile SHALL include links labelled `Mis préstamos` and `Cambiar contraseña`

### Requirement: Current-member API allow-list

`GET /api/me` SHALL derive the current member exclusively from the signed session and SHALL return exactly `id`, `member_number`, `first_name`, `last_name`, `nickname`, `phone`, `email`, `display_name`, `is_admin`, `is_active`, and `last_payment`.

#### Scenario: Authenticated API response

- **WHEN** an authenticated member requests `GET /api/me`
- **THEN** the response SHALL contain exactly the allow-listed fields for the session member
- **AND** SHALL retain `is_admin` for authorization-aware navigation

#### Scenario: Sensitive and internal fields remain private

- **WHEN** `GET /api/me` serializes the session member
- **THEN** the response SHALL NOT contain `password_hash`, `created_at`, `updated_at`, or `gender`
- **AND** no profile endpoint SHALL accept an arbitrary member ID
