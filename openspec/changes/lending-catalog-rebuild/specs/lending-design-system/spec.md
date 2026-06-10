# Spec delta — lending-design-system (Phase B0 token reconciliation)

> Phase A shipped `frontend/src/tokens.css` from values **sampled off the live
> site**. This change reconciles them with the **Figma design-system pages**
> (exact source of truth — see `handoff/figma-extract/DESIGN_TOKENS.md` and
> `tokens.reconciled.css`). Only the tokens whose value changes are listed.

## MODIFIED Requirements

### Requirement: Brand-aligned design tokens

The system SHALL ship a single design-token source at `frontend/src/tokens.css` that defines the club's brand-aligned color, typography, spacing, and elevation values, reconciled with the Figma design-system palette, with no remaining references to the previous Tailwind-blue palette (`#2563eb`) anywhere in the codebase.

#### Scenario: Color tokens
- **WHEN** any frontend component references a color
- **THEN** it resolves through a CSS custom property defined in `tokens.css`
- **AND** the primary brand color SHALL be `#BE0000`
- **AND** the heading text color SHALL be `#1F1F1F`
- **AND** the body text color SHALL be `#333333`
- **AND** the default surface color SHALL be `#FFFFFF` with secondary surface `#EFEFEF`

#### Scenario: Neutral surfaces and borders
- **WHEN** a surface, alt-surface, or hairline border is rendered
- **THEN** `--color-surface-alt` and `--color-border` SHALL both be `#EFEFEF`
- **AND** `--color-text-muted` SHALL be `#6D6D6D`

#### Scenario: System / status colors
- **WHEN** success, warning, or error state colors are rendered
- **THEN** they SHALL be `#34A853`, `#FBBC05`, and `#EA4335` respectively
- **AND** destructive *actions* SHALL continue to use `--color-brand` (`#BE0000`), reserving `#EA4335` for error messages/icons

#### Scenario: Cover scrim and category pills
- **WHEN** a badge sits over a game cover, or a category pill is rendered
- **THEN** `--color-scrim` (`rgba(0,0,0,0.2)`) SHALL be available for the badge backing
- **AND** the `--pill-*` pastel tokens SHALL be available for category families

#### Scenario: Typography tokens
- **WHEN** any heading (H1–H3) renders
- **THEN** it SHALL use the `Oswald` font family
- **AND** body and form text SHALL use the `Open Sans` font family

#### Scenario: Type scale includes the display and small steps
- **WHEN** an H1 page title or small/meta text is rendered
- **THEN** `--font-size-display` SHALL be `5rem` (80px, Oswald uppercase)
- **AND** `--font-size-sm` SHALL be `0.75rem` (12px)

#### Scenario: No legacy color references
- **WHEN** the codebase is searched for the literal string `#2563eb`
- **THEN** there SHALL be zero matches in `frontend/src/`
