/**
 * Public /ludoteca guest-catalog smoke tests (extends the smoke-46 guest
 * journey for the lending-catalog-rebuild change).
 *
 * The /ludoteca basename mounts the SPA in guest mode: browse the catalog,
 * open a game or RPG detail, and verify borrow controls are absent.
 *
 * - ludo-1..ludo-3: board-game catalog journey
 * - ludo-4..ludo-6: RPG catalog journey
 */

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const GUEST_STATE = resolve(__dirname, "..", "fixtures", "guest.json");

const LUDOTECA_HOME = "/ludoteca/";
const CATALOG_BOARDGAMES = "/ludoteca/juegos-de-mesa";
const CATALOG_RPG = "/ludoteca/juegos-de-rol";
const LOGIN_PATH = "/ludoteca/login";
const BORROW_CTA = "Solicitar préstamo";

test.describe("ludoteca @ guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("ludo-1: catalog renders read-only on /ludoteca", async ({ page }) => {
    await page.goto(LUDOTECA_HOME);

    // Root redirects client-side to /juegos-de-mesa
    await expect(page).toHaveURL(new RegExp(CATALOG_BOARDGAMES));

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

  // ── RPG catalog journey ──────────────────────────────────────────────────────

  test("ludo-4: pill toggle navigates to RPG catalog", async ({ page }) => {
    await page.goto(CATALOG_BOARDGAMES);

    // Both pills must be visible on the board-game catalog.
    await expect(
      page.getByRole("link", { name: "Juegos de mesa" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Libros de rol" }),
    ).toBeVisible();

    // Clicking "Libros de rol" navigates to /juegos-de-rol.
    await page.getByRole("link", { name: "Libros de rol" }).click();
    await expect(page).toHaveURL(new RegExp(CATALOG_RPG));
  });

  test("ludo-5: RPG catalog shows heading, an RPG card, and powered-by-BGG", async ({
    page,
  }) => {
    await page.goto(CATALOG_RPG);

    await expect(
      page.getByRole("heading", { name: /Catálogo de libros de rol/i }),
    ).toBeVisible();

    // At least one RPG card must be present (seeded rpgitem).
    await expect(page.locator(".rpg-card").first()).toBeVisible();

    // Powered-by-BGG banner links to boardgamegeek.com.
    const bggLink = page.locator(".powered-by-bgg a");
    await expect(bggLink).toBeVisible();
    await expect(bggLink).toHaveAttribute("href", "https://boardgamegeek.com/");

    // No borrow CTA anywhere on the catalog.
    await expect(page.getByRole("button", { name: BORROW_CTA })).toHaveCount(0);
  });

  test("ludo-6: RPG detail has no borrow CTA and shows RPGGeek link", async ({
    page,
  }) => {
    await page.goto(CATALOG_RPG);

    // Click the first RPG card.
    const rpgCard = page.locator(".rpg-card a").first();
    const cardName = await rpgCard.getAttribute("aria-label");
    await rpgCard.click();

    // URL must be /ludoteca/rol/<slug>.
    await expect(page).toHaveURL(/\/ludoteca\/rol\//);

    // No borrow button.
    await expect(page.getByRole("button", { name: BORROW_CTA })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Pedir prestado/i })).toHaveCount(0);

    // "Ver en RPGGeek" link present.
    const rpggeekLink = page.getByRole("link", { name: "Ver en RPGGeek" });
    await expect(rpggeekLink).toBeVisible();
    await expect(rpggeekLink).toHaveAttribute(
      "href",
      /^https:\/\/rpggeek\.com\/rpgitem\//,
    );

    // Powered-by-BGG banner not present on the detail page (no PoweredByBgg component).
    // (No assertion — only catalog pages include it.)

    // Back link returns to RPG catalog.
    await page.getByRole("link", { name: /Volver al catálogo/ }).click();
    await expect(page).toHaveURL(new RegExp(CATALOG_RPG));

    // Suppress unused variable warning.
    void cardName;
  });
});
