# lending-design-system Specification

## Purpose
TBD - created by archiving change plan-lending-redesign. Update Purpose after archive.
## Requirements
### Requirement: Brand-aligned design tokens

The system SHALL ship a single design-token source at `frontend/src/tokens.css` that defines the club's brand-aligned color, typography, spacing, and elevation values, with no remaining references to the previous Tailwind-blue palette (`#2563eb`) anywhere in the codebase.

#### Scenario: Color tokens
- **WHEN** any frontend component references a color
- **THEN** it resolves through a CSS custom property defined in `tokens.css`
- **AND** the primary brand color SHALL be `#BE0000`
- **AND** the heading text color SHALL be `#1F1F1F`
- **AND** the body text color SHALL be `#333333`
- **AND** the default surface color SHALL be `#FFFFFF` with secondary surface `#F5F5F5`

#### Scenario: Typography tokens
- **WHEN** any heading (H1–H3) renders
- **THEN** it SHALL use the `Oswald` font family
- **AND** body and form text SHALL use the `Open Sans` font family

#### Scenario: No legacy color references
- **WHEN** the codebase is searched for the literal string `#2563eb`
- **THEN** there SHALL be zero matches in `frontend/src/`

### Requirement: Self-hosted fonts

The system SHALL self-host the Oswald and Open Sans font files under `frontend/public/fonts/` and declare them via `@font-face` in `tokens.css`, with no runtime requests to `fonts.googleapis.com` or `fonts.gstatic.com`.

#### Scenario: No external font requests at runtime
- **WHEN** the catalog page is loaded with browser network inspection
- **THEN** there SHALL be no requests to `fonts.googleapis.com` or `fonts.gstatic.com`
- **AND** all font files SHALL be served from the same origin under `/fonts/`

### Requirement: Reusable UI primitives

The system SHALL provide a primitives directory `frontend/src/ui/` exporting `Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, and `Dialog` components, each styled exclusively through tokens from `tokens.css`.

#### Scenario: Primitives exist and are used
- **WHEN** the directory `frontend/src/ui/` is listed
- **THEN** it SHALL contain files for each of `Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, and `Dialog`
- **AND** every page under `frontend/src/pages/` that needs a button SHALL import `Button` from `frontend/src/ui/Button` rather than redefining `.btn` styles inline

#### Scenario: Dialog accessibility
- **WHEN** a `Dialog` opens
- **THEN** focus SHALL move to the first interactive element inside the dialog
- **AND** pressing `Escape` SHALL close the dialog
- **AND** focus SHALL return to the element that opened the dialog when it closes

### Requirement: PageLayout shell

The system SHALL provide a `<PageLayout>` component matching the wider club site shell (header, navigation, footer) that every authenticated lending page wraps with.

#### Scenario: Pages share layout
- **WHEN** a lending page renders
- **THEN** its top-level JSX SHALL be `<PageLayout>...</PageLayout>`
- **AND** the layout SHALL render the club's header (logo + nav) and footer consistently across pages

### Requirement: Single-language scaffolding (Spanish)

The system SHALL render Spanish strings only and SHALL NOT include i18n routing, translation files, or a language selector.

#### Scenario: No language selector
- **WHEN** any lending page is rendered
- **THEN** there SHALL be no language selector in the header or footer
- **AND** there SHALL be no `LanguageSelector` component imported anywhere in `frontend/src/`

#### Scenario: No translation file infrastructure
- **WHEN** the directory `frontend/src/i18n/` is checked
- **THEN** it SHALL NOT exist
- **AND** no `react-i18next` (or similar) dependency SHALL be listed in `frontend/package.json`

