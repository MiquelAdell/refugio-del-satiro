/**
 * Visual smoke tests.
 *
 * Captures full-page screenshots as test artifacts for manual visual diffing.
 * No pixel comparison — these only confirm that the page renders end-to-end
 * for each auth state at the intended viewport.
 *
 * Test names match the IDs in TESTING_PARAMETERS.md.
 */

import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const FIXTURES_DIR = resolve(__dirname, "..", "fixtures");
const GUEST_STATE = resolve(FIXTURES_DIR, "guest.json");
const MEMBER_STATE = resolve(FIXTURES_DIR, "member.json");
const ADMIN_STATE = resolve(FIXTURES_DIR, "admin.json");

const HOME = "/prestamos/";

const isMobileProject = (name: string) => name === "chromium-mobile";
const isDesktopProject = (name: string) => name === "chromium-desktop";

async function captureFullPage(page: Page, outputPath: string) {
  await mkdir(dirname(outputPath), { recursive: true });
  const buffer = await page.screenshot({ path: outputPath, fullPage: true });
  expect(buffer.byteLength).toBeGreaterThan(0);
}

test.describe("visual @ guest", () => {
  test.use({ storageState: GUEST_STATE });

  test("vis-1: guest home screenshot (desktop)", async ({ page }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo.project.name),
      "vis-1 is desktop-only",
    );
    await page.goto(HOME);
    await expect(
      page.getByRole("link", { name: /Refugio del Sátiro/i }).first(),
    ).toBeVisible();
    await captureFullPage(page, "test-results/vis-1-guest-desktop.png");
  });
});

test.describe("visual @ member", () => {
  test.use({ storageState: MEMBER_STATE });

  test("vis-2: member home screenshot (mobile)", async ({ page }, testInfo) => {
    test.skip(
      !isMobileProject(testInfo.project.name),
      "vis-2 is mobile-only",
    );
    await page.goto(HOME);
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await captureFullPage(page, "test-results/vis-2-member-mobile.png");
  });
});

test.describe("visual @ admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("vis-3: admin home screenshot (desktop)", async ({ page }, testInfo) => {
    test.skip(
      !isDesktopProject(testInfo.project.name),
      "vis-3 is desktop-only",
    );
    await page.goto(HOME);
    await expect(
      page.getByRole("link", { name: /Refugio del Sátiro/i }).first(),
    ).toBeVisible();
    await captureFullPage(page, "test-results/vis-3-admin-desktop.png");
  });
});
