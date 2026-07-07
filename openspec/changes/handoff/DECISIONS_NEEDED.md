# Decisions needed from the product owner

These are the open product/visual decisions that gate acceptance criteria in the
three implementation changes. Each has a **recommended default** so Claude Code is
never blocked — if you don't answer, it will build the default and note it. Tick
or edit each one.

> Sourced from `tasks/lending-redesign/style-guide.md` §10 and the archived plan's
> Open Questions. The L1–L5 questions there gate **v2**, not these changes, so
> they are omitted here.

---

### DQ-1 — BGG rating badge position on the game card
*(affects `lending-catalog-rebuild`)*
The first TFM iteration shows the rating **below the cover** in the card body; the
defence-presentation redesign shows it as a **solid red square in the cover's
lower-left**. Pick one (it must be consistent across every card).
- [ ] A — Red square overlay, cover lower-left (later TFM iteration) — **recommended default**
- [ ] B — Numeric rating below the cover, in the card body (first iteration)

### DQ-2 — View-mode (grid/list) persistence
*(affects `lending-catalog-rebuild`)*
- [ ] A — Persist the member's choice in `localStorage` — **recommended default**
- [ ] B — Reset to grid on every visit

### DQ-3 — Cover max-height cap
*(affects `lending-catalog-rebuild`)*
Covers are never cropped, but need an upper bound so portrait RPG covers don't
dominate the grid. Default: cap at the grid column width × 1.5 (so a portrait
cover is at most 1.5× its width tall). Adjust if you have a preference.
- [ ] Use the 1.5× default — **recommended**
- [ ] Other: ________

### DQ-4 — Club-closed days in the borrow calendar
*(affects `lending-borrow-with-return-date`)*
The TFM greys out club-closed days as a no-error affordance. This needs
club-open-day data the API may not expose yet.
- [ ] A — Defer disabling; allow any date in v1, add it when open-days data exists — **recommended default**
- [ ] B — Block this change until open-days data is exposed (adds backend scope)

### DQ-5 — Reservation / intermediate loan state
*(affects `lending-borrow-with-return-date`)*
The TFM shows a two-step "Reservado → Alquilado" model. The repo's stated
non-goal is **no reservation/waitlist**; the live system is direct borrow →
return (two states: active/returned).
- [ ] A — Keep direct borrow → return; no reservation step in v1 — **recommended default** (matches repo non-goals)
- [ ] B — Introduce a reservation step (significant new scope; revisit in v2)

### DQ-6 — `/ludoteca` routing ownership
*(affects `lending-catalog-rebuild`)*
The public `/ludoteca` route needs Caddy/Vite to send it to the SPA. The
in-progress `site-shell-from-scraped-html` change also touches routing.
- [ ] A — Land the `/ludoteca` route wiring inside `lending-catalog-rebuild` — **recommended default**
- [ ] B — Defer `/ludoteca` to the site-shell change; ship catalog rebuild on `/prestamos` only first

---

When answered, fold the choices into each change's `tasks.md` (the relevant tasks
already reference these DQ numbers) and into the spec delta files.
