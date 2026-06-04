# Auth screens presentation — decision (issue #53)

Scope: the three auth routes `/login`, `/forgot-password`, `/set-password`.

## 1. Chosen option: **Option A** — wrap auth routes in `PageLayout`

Wrap all three auth routes in the existing `PageLayout` (real `SiteHeader` +
`SiteFooter`) instead of `MinimalPageLayout`.

Rationale: the auth card is already on-brand (uses `--color-bg-card`,
`--color-border`, `--radius-lg`, `--shadow-md`) and `MinimalPageLayout`'s
background is already `--color-surface-alt` — identical to the authenticated
screens. The only thing missing from the auth pages is the surrounding chrome.
`SiteHeader` already renders the guest "Iniciar sesión" action
(`SiteHeader.tsx:284-287` and drawer `:326-335`) and `SiteFooter` is purely
social links with no auth-sensitive content. So Option A makes the screens feel
fully integrated by *reusing* an existing 3-line wrapper with near-zero new code,
while Option B would mean maintaining a second layout that only duplicates a
subset of `PageLayout`. Option A also gives users a consistent way back into the
site (header nav + footer socials) from any auth screen.

## 2. Exact changes (file by file)

**`frontend/src/App.tsx`** — in the three routes at lines 61–84, replace each
`<MinimalPageLayout>…</MinimalPageLayout>` wrapper with
`<PageLayout>…</PageLayout>`. Remove the now-unused `MinimalPageLayout` import.
Add the `PageLayout` import if it is not already present (it is already imported
for the admin routes — reuse it).

No changes to `LoginPage.tsx` / `LoginPage.css`, `ForgotPasswordPage.tsx`,
`SetPasswordPage.tsx` / `SetPasswordPage.css`. The forms keep their existing
self-centering wrapper (`.login-page` etc. with `padding: var(--space-2xl) …`),
which already gives correct vertical rhythm inside `PageLayout`'s `<main>`
(`flex: 1`). Do not add the standalone 60px logo — the header logo replaces it.

**`frontend/src/components/SiteHeader/SiteHeader.tsx`** — resolve the
self-referential guest action (see point 3).

## 3. Guest-action-on-login resolution (Option A) — **hide it on `/login`**

On the `/login` route the header "Iniciar sesión" action is self-referential, so
**hide it** (do not render it on `/login`). Keep it on `/forgot-password` and
`/set-password`, where linking back to login is useful.

Implementation: `SiteHeader.tsx` already imports `useMatch` from
`react-router-dom` (line 2) — no new import. Add:

```ts
const isLoginRoute = Boolean(useMatch("/login"));
```

Then gate both guest actions:

- Desktop (`:284`): render the `Link to="/login"` only when
  `role === "guest" && !isLoginRoute`. When on `/login`, render nothing in that
  slot (the `headerActions` container stays; it just has no login link).
- Drawer (`:326`): same condition for the `drawerLoginAction` item.

Chosen over the `styles.active` treatment because a visibly-disabled link to the
page you are already on adds noise without value; hiding is cleaner and the logo
+ nav already orient the user. (`styles.active` at
`SiteHeader.module.css:84` is reserved for nav items, not the login action, so
reusing it here would also be a slight semantic mismatch.)

## 4. Fate of `MinimalPageLayout`: **delete**

After the App.tsx swap it has no remaining consumers. Delete the whole component
directory and its test:

- `frontend/src/components/MinimalPageLayout/MinimalPageLayout.tsx`
- `frontend/src/components/MinimalPageLayout/MinimalPageLayout.module.css`
- `frontend/src/components/MinimalPageLayout/MinimalPageLayout.test.tsx`
- `frontend/src/components/MinimalPageLayout/index.ts`

Then remove any remaining `MinimalPageLayout` import in `App.tsx`. Keeping a
second restyled layout (Option B) would be dead duplication of `PageLayout`.

## 5. Token-usage notes

No new tokens and no token changes. Everything already maps to existing tokens:

- Page background comes from `PageLayout`/body via `--color-surface-alt` (same as
  the old `MinimalPageLayout`), so the visual background is unchanged.
- The header guest action uses `--color-header-fg` / `--color-header-bg` and
  `--radius-sm` (`SiteHeader.module.css:275-294`) — untouched.
- The auth card continues to use `--color-bg-card`, `--color-border`,
  `--radius-lg`, `--shadow-md` (`LoginPage.css:7-15`).

Accessibility: the header already provides keyboard-navigable nav and a focus
outline on the logo; the auth inputs keep their `--color-primary` focus ring
(`LoginPage.css:45-49`). No regressions introduced.
