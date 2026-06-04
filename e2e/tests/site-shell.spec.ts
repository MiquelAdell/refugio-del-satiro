/**
 * Site-shell smoke tests.
 *
 * Covers nav/menu/drawer/auth at the shell level using the three storageState
 * fixtures produced by `e2e/scripts/seed-auth-states.ts`. Test names match the
 * IDs in TESTING_PARAMETERS.md so PR comments can cross-reference them.
 *
 * Viewport gating relies on the Playwright project name
 * (chromium-mobile / chromium-tablet / chromium-desktop), since some surfaces
 * are CSS-gated at the 768px breakpoint.
 */

import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";

const FIXTURES_DIR = resolve(__dirname, "..", "fixtures");
const GUEST_STATE = resolve(FIXTURES_DIR, "guest.json");
const MEMBER_STATE = resolve(FIXTURES_DIR, "member.json");
const ADMIN_STATE = resolve(FIXTURES_DIR, "admin.json");

const HOME = "/prestamos/";
const LOGIN_PATH = "/prestamos/login";
const PRESTAMOS_LABEL = "Préstamos";

const isMobileProject = (projectName: string) => projectName === "chromium-mobile";
const isDesktopProject = (projectName: string) => projectName === "chromium-desktop";

async function openPrestamosSubmenuOnMobile(page: Page) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .locator("#mobile-drawer")
    .getByRole("button", { name: new RegExp(`^${PRESTAMOS_LABEL}`) })
    .click();
}

/**
 * On desktop the submenu is CSS-revealed via `:hover` / `:focus-within` on
 * the Préstamos parent. Hovering the parent link makes the submenu visible
 * and reachable for accessibility-tree queries.
 */
async function revealPrestamosSubmenuOnDesktop(page: Page) {
  await page
    .getByRole("link", { name: new RegExp(`^${PRESTAMOS_LABEL}`) })
    .first()
    .hover();
}

test.describe("site-shell @ guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("nav-logo-1: logo visible on home", async ({ page }) => {
    await page.goto(HOME);
    const logo = page.getByRole("link", { name: /Refugio del Sátiro/i }).first();
    await expect(logo).toBeVisible();
    await expect(logo.locator("img")).toHaveAttribute(
      "alt",
      "El Refugio del Sátiro",
    );
  });

  test("nav-menu-guest-1: Iniciar sesión link points to /prestamos/login", async ({
    page,
  }, testInfo) => {
    await page.goto(HOME);

    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }

    const loginLink = page.getByRole("link", { name: "Iniciar sesión" }).first();
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", LOGIN_PATH);
  });
});

test.describe("site-shell @ member", () => {
  test.use({ storageState: MEMBER_STATE });

  test("nav-menu-member-1: submenu shows Mis préstamos + Cerrar sesión, no Administración", async ({
    page,
  }, testInfo) => {
    await page.goto(HOME);

    if (isMobileProject(testInfo.project.name)) {
      await openPrestamosSubmenuOnMobile(page);
    } else {
      await revealPrestamosSubmenuOnDesktop(page);
    }

    await expect(
      page.getByRole("menuitem", { name: "Mis préstamos" }).first(),
    ).toBeVisible();
    // "Cerrar sesión" lives in the header actions slot (desktop) / drawer user row
    // (mobile), not inside the Préstamos submenu — so its ARIA role is "button".
    await expect(
      page.getByRole("button", { name: "Cerrar sesión" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("text=Administración"),
    ).toHaveCount(0);
  });

  test("auth-1: Cerrar sesión clears prestamos_session sentinel", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo.project.name),
      "desktop-only — submenu hovers without needing a drawer click",
    );

    await page.goto(HOME);

    // Sentinel must be set on a member fixture before logout.
    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem("prestamos_session")),
      )
      .toBe("1");

    // "Cerrar sesión" is in the header actions slot — always visible on desktop,
    // no need to hover the Préstamos submenu first.
    await page
      .getByRole("button", { name: "Cerrar sesión" })
      .first()
      .click();

    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem("prestamos_session")),
      )
      .toBeNull();
  });
});

test.describe("site-shell @ admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("nav-menu-admin-1: Administración nested with Miembros + Contenido", async ({
    page,
  }, testInfo) => {
    await page.goto(HOME);

    if (isMobileProject(testInfo.project.name)) {
      await openPrestamosSubmenuOnMobile(page);
      await page
        .locator("#mobile-drawer")
        .getByRole("button", { name: /Administración/ })
        .click();
    } else {
      await revealPrestamosSubmenuOnDesktop(page);
      // Hover the nested Administración trigger so its child list reveals.
      await page
        .getByRole("button", { name: /Administración/ })
        .first()
        .hover();
    }

    await expect(
      page.getByRole("link", { name: "Miembros" }).first(),
    ).toHaveAttribute("href", "/prestamos/admin/members");
    await expect(
      page.getByRole("link", { name: "Contenido" }).first(),
    ).toHaveAttribute("href", "/prestamos/admin/content");
  });
});

// ── Static content-mirror pages ──────────────────────────────────────────────
// The site-shell embed bundle is injected into every scraped static page.
// These tests verify the React SiteHeader renders correctly on a static page
// and that the Google Sites original header is hidden.

const STATIC_PAGE = "/calendario/";

test.describe("site-shell @ static page (guest)", () => {
  test.use({ storageState: GUEST_STATE });

  test("static-shell-1: site-shell-root exists and is visible", async ({
    page,
  }) => {
    await page.goto(STATIC_PAGE);
    await expect(page.locator("#site-shell-root")).toBeVisible();
  });

  test("static-shell-2: Préstamos link href points to /prestamos/", async ({
    page,
  }, testInfo) => {
    await page.goto(STATIC_PAGE);
    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }
    const link = page.getByRole("link", { name: new RegExp(`^${PRESTAMOS_LABEL}`) }).first();
    await expect(link).toBeVisible();
    // React Router with basename="/prestamos" generates href="/prestamos" (no trailing
    // slash) for <Link to="/">. The Caddyfile 301-redirects /prestamos → /prestamos/
    // at the network layer, so both work functionally.
    await expect(link).toHaveAttribute("href", "/prestamos");
  });

  test("static-shell-3: Iniciar sesión link visible for guest", async ({
    page,
  }, testInfo) => {
    await page.goto(STATIC_PAGE);
    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }
    await expect(
      page.getByRole("link", { name: "Iniciar sesión" }).first(),
    ).toBeVisible();
  });

  test("static-shell-4: Google Sites original header is hidden", async ({
    page,
  }) => {
    await page.goto(STATIC_PAGE);
    await expect(page.locator("[data-gs-header]")).toBeHidden();
  });
});

test.describe("site-shell @ static page (member)", () => {
  test.use({ storageState: MEMBER_STATE });

  test("static-shell-5: Cerrar sesión visible for member", async ({
    page,
  }, testInfo) => {
    await page.goto(STATIC_PAGE);
    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }
    await expect(
      page.getByRole("button", { name: "Cerrar sesión" }).first(),
    ).toBeVisible();
  });
});

test.describe("site-shell drawer", () => {
  test.use({ storageState: GUEST_STATE });

  test("draw-1: hamburger toggles drawer (mobile only)", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileProject(testInfo.project.name),
      "drawer is mobile-only (CSS-gated < 768px)",
    );

    await page.goto(HOME);

    const hamburger = page.getByRole("button", { name: "Abrir menú" });
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");

    await hamburger.click();
    await expect(hamburger).toHaveAttribute("aria-expanded", "true");

    const drawer = page.locator("#mobile-drawer");
    await expect(drawer).toHaveAttribute("aria-hidden", "false");
  });
});
