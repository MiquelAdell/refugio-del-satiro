# lending-design-system Specification (delta)

## REMOVED Requirements

### Requirement: PageLayout shell

**Reason**: Ownership moves from `lending-design-system` to the new `site-shell` capability. The shell (header, navigation, footer, layout composition) is a whole-site concern that applies to lending and to future React-rendered static-content pages alike, not a lending-design-system primitive. The `lending-design-system` spec now scopes only to tokens, fonts, primitives, and the Spanish-only string layer.

**Migration**: see `site-shell/spec.md` — its "PageLayout composes header, main, footer" requirement supersedes this one and adds the previously implicit scenarios (top-level nav, Préstamos submenu, role-gated Administración, mobile burger, active-route highlighting, footer without language selector).
