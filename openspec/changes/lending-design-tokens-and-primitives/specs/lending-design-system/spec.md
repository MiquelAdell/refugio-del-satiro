# lending-design-system Specification

## Purpose

Defines the foundation layer of the lending UI: brand-aligned design tokens (color, typography, spacing, elevation), self-hosted Oswald + Open Sans fonts, a small set of reusable UI primitives in `frontend/src/ui/`, and a Spanish-only string layer with no i18n infrastructure. Every later phase of the lending redesign (catalog, borrow flow, admin restyle) builds on this layer rather than reinventing buttons, dialogs, or tokens. The page shell (header, navigation, footer) is owned by the `site-shell` capability, not this one.

## ADDED Requirements

### Requirement: Reduced-motion respected in animated primitives

The system SHALL disable opening/closing transitions on the `Dialog` primitive (and any other animated primitive) when the user has set `prefers-reduced-motion: reduce`.

#### Scenario: Reduced motion media query
- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** the `Dialog` open/close transition duration SHALL be zero
- **AND** no other primitive SHALL animate transforms, opacity, or position

### Requirement: Token registry exposed to consumers

The system SHALL expose every design token as a CSS custom property declared on `:root` in `tokens.css`, organized by category (color, typography, spacing, radius, shadow, breakpoints), with role-based names rather than scale-based numbers.

#### Scenario: Brand color tokens present
- **WHEN** `tokens.css` is read
- **THEN** it SHALL declare `--color-brand`, `--color-brand-hover`, `--color-brand-contrast`, `--color-text-heading`, `--color-text-body`, `--color-text-muted`, `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger` on `:root`

#### Scenario: Typography tokens present
- **WHEN** `tokens.css` is read
- **THEN** it SHALL declare `--font-family-heading` resolving to a stack starting with `Oswald`
- **AND** `--font-family-body` resolving to a stack starting with `"Open Sans"`
- **AND** `--font-weight-regular`, `--font-weight-medium`, `--font-weight-bold`

#### Scenario: Spacing tokens are mobile-first rem values
- **WHEN** `tokens.css` is read
- **THEN** it SHALL declare `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`, `--space-3xl` as `rem` values

### Requirement: Font subsetting and loading strategy

The self-hosted Oswald and Open Sans font files SHALL be `.woff2` only, ship the Latin subset, and use `font-display: swap`.

#### Scenario: woff2 only
- **WHEN** the directory `frontend/public/fonts/` is listed
- **THEN** every font file SHALL have the `.woff2` extension
- **AND** there SHALL be no `.woff`, `.ttf`, `.eot`, or `.otf` files

#### Scenario: font-display: swap
- **WHEN** `tokens.css` `@font-face` blocks are inspected
- **THEN** every block SHALL include `font-display: swap`

#### Scenario: Two weights per family
- **WHEN** the directory `frontend/public/fonts/` is listed
- **THEN** Oswald SHALL ship with weights 500 and 600
- **AND** Open Sans SHALL ship with weights 400 and 600

### Requirement: Dialog primitive built on a headless behavior library

The `Dialog` primitive SHALL delegate focus trapping, Escape-to-close, return-focus-on-close, and portal rendering to a vetted headless behavior library (`@radix-ui/react-dialog`) rather than re-implementing these behaviors in this codebase.

#### Scenario: @radix-ui/react-dialog is the dependency
- **WHEN** `frontend/package.json` is inspected
- **THEN** `@radix-ui/react-dialog` SHALL be listed as a dependency

#### Scenario: ConfirmDialog uses the new Dialog primitive
- **WHEN** `frontend/src/components/ConfirmDialog.tsx` is inspected
- **THEN** it SHALL import `Dialog` from `frontend/src/ui/Dialog`
- **AND** it SHALL NOT contain a hand-rolled focus-trap or keydown-listener implementation

## MODIFIED Requirements

### Requirement: Single-language scaffolding (Spanish)

The system SHALL render Spanish strings only and SHALL NOT include i18n routing, translation files, a language selector, or any `i18next`-class runtime dependency. Spanish copy SHALL be inlined as string literals at the call site rather than read from a JSON translation file.

#### Scenario: No language selector
- **WHEN** any lending page is rendered
- **THEN** there SHALL be no language selector in the header or footer
- **AND** there SHALL be no `LanguageSelector` component imported anywhere in `frontend/src/`

#### Scenario: No translation file infrastructure
- **WHEN** the directory `frontend/src/i18n/` is checked
- **THEN** it SHALL NOT exist
- **AND** `frontend/package.json` SHALL NOT list `i18next`, `i18next-browser-languagedetector`, or `react-i18next` as dependencies

#### Scenario: No useTranslation calls remain
- **WHEN** `frontend/src/` is searched for the literal `useTranslation`
- **THEN** there SHALL be zero matches
