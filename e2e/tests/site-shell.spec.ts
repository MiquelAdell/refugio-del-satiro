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

const HOME = "/ludoteca/";
const LOGIN_PATH = "/ludoteca/login";
const PROFILE_PATH = "/ludoteca/profile";
const LUDOTECA_LABEL = "Ludoteca";
const MEMBER_DISPLAY_NAME = "E2E Member";
const MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL ?? "TEST_email@domain.com";

const isMobileProject = (projectName: string) =>
  projectName === "chromium-mobile";
const isDesktopProject = (projectName: string) =>
  projectName === "chromium-desktop";

async function openLudotecaSubmenuOnMobile(page: Page) {
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .locator("#mobile-drawer")
    .getByRole("button", { name: new RegExp(`^${LUDOTECA_LABEL}`) })
    .click();
}

/**
 * On desktop the submenu is CSS-revealed via `:hover` / `:focus-within` on
 * the Ludoteca parent. Hovering the parent link makes the submenu visible
 * and reachable for accessibility-tree queries.
 */
async function revealLudotecaSubmenuOnDesktop(page: Page) {
  await page
    .getByRole("link", { name: new RegExp(`^${LUDOTECA_LABEL}`) })
    .first()
    .hover();
}

async function openUserSubmenu(page: Page, projectName: string) {
  if (isMobileProject(projectName)) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page
      .getByRole("button", { name: MEMBER_DISPLAY_NAME, exact: true })
      .filter({ visible: true })
      .click();
    return;
  }

  await page
    .getByRole("button", { name: MEMBER_DISPLAY_NAME, exact: true })
    .filter({ visible: true })
    .hover();
}

test.describe("site-shell @ guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("nav-logo-1: logo visible on home", async ({ page }) => {
    await page.goto(HOME);
    const logo = page
      .getByRole("link", { name: /Refugio del Sátiro/i })
      .first();
    await expect(logo).toBeVisible();
    // The shield img is decorative (alt=""); the accessible name comes from
    // the link's aria-label plus the visible logo text.
    await expect(logo.locator("img")).toHaveAttribute("alt", "");
    await expect(logo.getByText("El Refugio del Sátiro")).toBeVisible();
  });

  test("nav-menu-guest-1: Iniciar sesión link points to /ludoteca/login", async ({
    page,
  }, testInfo) => {
    await page.goto(HOME);

    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
    }

    const loginLink = page
      .getByRole("link", { name: "Iniciar sesión" })
      .first();
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", LOGIN_PATH);
  });

  test("profile-guest-1: direct profile navigation redirects to login", async ({
    page,
  }) => {
    await page.goto(PROFILE_PATH);

    await expect(page).toHaveURL(new RegExp(`${LOGIN_PATH}$`));
    await expect(page.getByRole("heading", { name: "Mi perfil" })).toHaveCount(
      0,
    );
    await expect(page.getByText(MEMBER_EMAIL)).toHaveCount(0);
  });
});

test.describe("site-shell @ member", () => {
  test.use({ storageState: MEMBER_STATE });

  test("nav-menu-member-1: submenu shows Mis préstamos + Cerrar sesión, no Administración", async ({
    page,
  }, testInfo) => {
    await page.goto(HOME);

    if (isMobileProject(testInfo.project.name)) {
      await openLudotecaSubmenuOnMobile(page);
    } else {
      await revealLudotecaSubmenuOnDesktop(page);
    }

    await expect(
      page.getByRole("menuitem", { name: "Mis préstamos" }).first(),
    ).toBeVisible();
    // "Cerrar sesión" lives in the header actions slot (desktop) / drawer user row
    // (mobile), not inside the Ludoteca submenu — so its ARIA role is "button".
    await expect(
      page.getByRole("button", { name: "Cerrar sesión" }).first(),
    ).toBeVisible();
    await expect(page.locator("text=Administración")).toHaveCount(0);
  });

  test("profile-member-1: member opens the read-only profile from the user menu", async ({
    page,
  }, testInfo) => {
    const meRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/api/me")) {
        meRequests.push(request.url());
      }
    });

    await page.goto(HOME);
    await openUserSubmenu(page, testInfo.project.name);

    const profileLink = page
      .getByRole("link", { name: "Mi perfil", exact: true })
      .filter({ visible: true });
    await expect(profileLink).toHaveAttribute("href", PROFILE_PATH);
    await profileLink.click();

    await expect(page).toHaveURL(new RegExp(`${PROFILE_PATH}$`));
    await expect(
      page.getByRole("heading", { name: "Mi perfil" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: MEMBER_EMAIL })).toBeVisible();
    await expect(page.getByText("Estado de membresía")).toBeVisible();
    await expect(page.getByText("Activo").first()).toBeVisible();
    const profileActions = page.getByRole("navigation", {
      name: "Acciones del perfil",
    });
    await expect(
      profileActions.getByRole("link", { name: "Mis préstamos" }),
    ).toBeVisible();
    await expect(
      profileActions.getByRole("link", { name: "Cambiar contraseña" }),
    ).toBeVisible();
    expect(meRequests).toHaveLength(1);
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
    // no need to hover the Ludoteca submenu first.
    await page.getByRole("button", { name: "Cerrar sesión" }).first().click();

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
      await openLudotecaSubmenuOnMobile(page);
      await page
        .locator("#mobile-drawer")
        .getByRole("button", { name: /Administración/ })
        .click();
    } else {
      await revealLudotecaSubmenuOnDesktop(page);
      // Hover the nested Administración trigger so its child list reveals.
      await page
        .getByRole("button", { name: /Administración/ })
        .first()
        .hover();
    }

    await expect(
      page.getByRole("link", { name: "Miembros" }).first(),
    ).toHaveAttribute("href", "/ludoteca/admin/members");
    await expect(
      page.getByRole("link", { name: "Contenido" }).first(),
    ).toHaveAttribute("href", "/ludoteca/admin/content");
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

  test("static-shell-2: Ludoteca link (under Socios) href points to /socios/ludoteca", async ({
    page,
  }, testInfo) => {
    await page.goto(STATIC_PAGE);
    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page
        .locator("#mobile-drawer")
        .getByRole("button", { name: "Socios" })
        .click();
    } else {
      await page.getByRole("link", { name: "Socios" }).first().hover();
    }
    const link = page
      .getByRole("link", { name: new RegExp(`^${LUDOTECA_LABEL}`) })
      .first();
    await expect(link).toBeVisible();
    // Scraped from the Socios submenu on the Google Site; the Caddyfile
    // 301-redirects /socios/ludoteca → /ludoteca at the network layer.
    await expect(link).toHaveAttribute("href", "/socios/ludoteca");
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
