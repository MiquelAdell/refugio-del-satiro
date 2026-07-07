# Spec delta — lending-design-system (Phase B0 token reconciliation)

> Phase A shipped `frontend/src/tokens.css` from values **sampled off the live
> site**. This change reconciles them with the **Figma design-system pages**
> (exact source of truth — see `handoff/figma-extract/DESIGN_TOKENS.md` and
> `tokens.reconciled.css`). Only the tokens whose value changes are listed.

## MODIFIED Requirements

### Requirement: Color tokens match the Figma palette

The design-system color tokens SHALL use the exact values defined in the Figma
`Color-palette` frame.

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

### Requirement: Type scale includes the display step

The type scale SHALL provide the page-title and small-text steps used by the
Figma `Tipografies` frame.

#### Scenario: Page title and meta text
- **WHEN** an H1 page title or small/meta text is rendered
- **THEN** `--font-size-display` SHALL be `5rem` (80px, Oswald uppercase)
- **AND** `--font-size-sm` SHALL be `0.75rem` (12px)
