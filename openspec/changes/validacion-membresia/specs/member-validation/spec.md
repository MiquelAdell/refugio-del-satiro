# member-validation

## ADDED Requirements

### Requirement: Public member validation endpoint

The system SHALL expose `GET /api/members/validate?number=<int>` without
authentication. For a known member number it SHALL return HTTP 200 with
`member_number`, `first_name`, `last_name`, `active` (the member's
`is_active` flag), `last_payment` (nullable), and `gender_label` derived
server-side: `"socio"` when gender is "Masculino", `"socia"` when
"Femenino", `"socio/a"` when unset. For an unknown number it SHALL return
HTTP 404. No other member data (email, phone, DNI) is exposed.

#### Scenario: Active member found

- **WHEN** a visitor requests `/api/members/validate?number=12` and member 12
  exists with `is_active = true`, gender "Femenino", last_payment "5/02/2026"
- **THEN** the response is 200 with `active: true`, `gender_label: "socia"`,
  `last_payment: "5/02/2026"`, and the member's first and last name

#### Scenario: Inactive member found

- **WHEN** the member exists but `is_active = false`
- **THEN** the response is 200 with `active: false`

#### Scenario: Unknown member number

- **WHEN** no member has the requested number
- **THEN** the response is 404

### Requirement: Public validation page

The system SHALL serve a public page at `/validacion` (SPA route, no menu
entry) replicating the legacy `/Validacion-Membresia` presentation: a
"Validar membresía" page title, an intro line, a member-number search box
with clear button, a Buscar button disabled while the field is empty, a
centred result block, and the legacy disclaimer copy. The page SHALL
auto-look-up when opened with `?id=<n>`.

#### Scenario: Valid member lookup

- **WHEN** a visitor searches an existing active member's number
- **THEN** the page shows "NOMBRE APELLIDOS #n" and a display-size
  "ES socio" / "ES socia" verdict, and "ÚLTIMA CUOTA PAGADA:" with the date
  when available

#### Scenario: Inactive member lookup

- **WHEN** the member exists but is not active
- **THEN** the verdict reads "NO ES socio" / "NO ES socia"

#### Scenario: Unknown number lookup

- **WHEN** the number matches no member
- **THEN** the page shows "No se ha encontrado al socio o socia con número"
  followed by the searched number

### Requirement: Legacy URL redirects

The web server SHALL 301-redirect `/Validacion-Membresia`,
`/Validacion-membresia` (the legacy Flask route casing), their
trailing-slash variants, and `/validacion` outside the SPA to
`/ludoteca/validacion`, so printed QR codes keep working.

#### Scenario: QR code URL

- **WHEN** a client requests `/Validacion-Membresia`
- **THEN** it is 301-redirected to `/ludoteca/validacion`

### Requirement: Membership data maintenance

Members SHALL carry optional `last_payment` and `gender` fields. Admins
SHALL be able to set them when creating a member and update them on existing
members via `PATCH /api/admin/members/{id}` and the admin members UI. The
member CSV import SHALL populate them from the sheet columns "Última cuota"
and "Género".

#### Scenario: Admin updates última cuota

- **WHEN** an admin PATCHes a member with `last_payment: "10/03/2026"`
- **THEN** subsequent validation lookups return the new date

#### Scenario: Import backfills fields

- **WHEN** the member CSV import runs on a row with "Última cuota" and
  "Género" values
- **THEN** the upserted member row stores them in `last_payment` and `gender`
