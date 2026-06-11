# Spec delta — ludoteca-rpg-catalog

## ADDED Requirements

### Requirement: Canonical app URL is /ludoteca

The SPA (catalog, detail, my-loans, admin, auth pages) SHALL be served under
`/ludoteca`. Guest vs member presentation SHALL derive from authentication
state, not from the URL path.

#### Scenario: /prestamos redirects
- **WHEN** a client requests `/prestamos` or any `/prestamos/<path>?<query>`
- **THEN** it SHALL be redirected to `/ludoteca/` or `/ludoteca/<path>?<query>`
  with the query string preserved

#### Scenario: Catalog default
- **WHEN** a client opens `/ludoteca/`
- **THEN** it SHALL land on `/ludoteca/juegos-de-mesa` (board-game catalog,
  existing filters and search unchanged)

#### Scenario: Existing deep links survive
- **WHEN** a client opens `/ludoteca/juegos/<slug>` or `/socios/ludoteca`
- **THEN** the board-game detail page SHALL render / the legacy redirect to
  `/ludoteca` SHALL still apply

### Requirement: RPG items imported from the BGG collection

`refugio import-rol` SHALL import the `RefugioDelSatiro` BGG collection with
`subtype=rpgitem` (name, images, year, rating, description) into the `games`
table with `item_type='rpgitem'`, upserting by `bgg_id`.

#### Scenario: Re-running the import
- **WHEN** `import-rol` runs twice
- **THEN** the second run SHALL update existing rows (no duplicates)

### Requirement: RPG items are catalog-only

RPG items SHALL be excluded from every lending path.

#### Scenario: Lending exclusion
- **WHEN** an rpgitem exists in the database
- **THEN** it SHALL NOT appear in `GET /api/juegos`, its slug SHALL 404 on
  `GET /api/juegos/{slug}`, and borrowing it SHALL be rejected

### Requirement: Public RPG API

`GET /api/rol` SHALL list rpgitems and `GET /api/rol/{slug}` SHALL return one,
with fields id, bgg_id, name, slug, thumbnail_url, image_url, year_published,
bgg_rating, description — no loan fields.

#### Scenario: Unknown slug
- **WHEN** `GET /api/rol/{slug}` matches no rpgitem
- **THEN** the API SHALL return 404 `"Libro no encontrado."`

### Requirement: RPG catalog UI

`/ludoteca/juegos-de-rol` SHALL render RPG cards (cover, rating, name, year —
no availability badge, players, or play time) with search and name/rating
sorting only. `/ludoteca/rol/{slug}` SHALL render the detail page (image,
year, rating, description, RPGGeek link) with no borrow UI or loan history.

#### Scenario: Searching the RPG catalog
- **WHEN** the user types a search term on `/ludoteca/juegos-de-rol`
- **THEN** only matching items SHALL remain, with no player/time/location/
  availability facets offered

### Requirement: Catalog type toggle and BGG attribution

Both catalog pages SHALL show a two-pill toggle — "Juegos de mesa" /
"Libros de rol" (active filled, inactive outline, `aria-current="page"`) —
and a "powered by BGG" banner linking to https://boardgamegeek.com/.

#### Scenario: Switching catalogs
- **WHEN** the user clicks "Libros de rol" on the board-game catalog
- **THEN** the app SHALL navigate to `/ludoteca/juegos-de-rol` with that pill
  active, and vice versa
