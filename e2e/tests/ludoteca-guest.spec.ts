/**
 * Public /ludoteca guest-catalog smoke tests (extends the smoke-46 guest
 * journey for the lending-catalog-rebuild change).
 *
 * The /ludoteca basename mounts the same SPA in guest mode: browse the
 * catalog, open a game detail, and verify there is no borrow control —
 * only a visible "Iniciar sesión" link pointing at /prestamos/login.
 */

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const GUEST_STATE = resolve(__dirname, "..", "fixtures", "guest.json");

const LUDOTECA_HOME = "/ludoteca/";
const LOGIN_PATH = "/prestamos/login";
const BORROW_CTA = "Solicitar préstamo";

test.describe("ludoteca @ guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("ludo-1: catalog renders read-only on /ludoteca", async ({ page }) => {
    await page.goto(LUDOTECA_HOME);

    await expect(
      page.getByRole("heading", { name: /Catálogo de juegos/i }),
    ).toBeVisible();
    await expect(page.locator(".game-card").first()).toBeVisible();
    await expect(page.getByRole("button", { name: BORROW_CTA })).toHaveCount(0);
  });

  test("ludo-2: game detail deep link works read-only with a login link", async ({
    page,
  }) => {
    await page.goto(LUDOTECA_HOME);

    // Pick an available game so the detail page shows the guest login CTA.
    const availableCard = page
      .getByRole("link", { name: /— Disponible$/ })
      .first();
    await availableCard.click();
    await expect(page).toHaveURL(/\/ludoteca\/juegos\//);

    await expect(page.getByRole("button", { name: BORROW_CTA })).toHaveCount(0);

    const loginLinks = page.getByRole("link", { name: "Iniciar sesión" });
    await expect(loginLinks.first()).toBeVisible();
    const hrefs = await loginLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    hrefs.forEach((href) => expect(href).toBe(LOGIN_PATH));
  });

  test("ludo-3: member-only nav is hidden in guest mode", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "Submenu reveal is a desktop/tablet hover surface",
    );
    await page.goto(LUDOTECA_HOME);

    await expect(page.getByRole("link", { name: "Mis préstamos" })).toHaveCount(0);
    await expect(page.getByText("Administración")).toHaveCount(0);
  });
});
