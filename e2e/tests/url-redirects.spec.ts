/**
 * URL redirect smoke tests.
 *
 * Verifies the accented-URL canonicalisation, legacy Google Sites slug
 * redirects, trailing-slash canonicalisation, and the 404 surface for
 * unknown paths. All redirects are defined in `Caddyfile.e2e` (and the
 * production Caddyfile it mirrors).
 *
 * Test names match the IDs in TESTING_PARAMETERS.md. The `red-*` prefix
 * is new in this file and will be registered there by W5.
 */

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const GUEST_STATE = resolve(__dirname, "..", "fixtures", "guest.json");

const ENCODED_WITH_SLASH = "/juegos-de-rol/campa%C3%B1as/";
const CANONICAL_WITH_SLASH = "/juegos-de-rol/campanas/";
const ENCODED_NO_SLASH = "/juegos-de-rol/campa%C3%B1as";
const CANONICAL_NO_SLASH = "/juegos-de-rol/campanas";
const UNKNOWN_PATH = "/this-path-does-not-exist-7f3a";

test.describe("url-redirects", () => {
  test.use({ storageState: GUEST_STATE });

  test("int-1: encoded accented URL with trailing slash redirects to ASCII canonical", async ({
    page,
    baseURL,
  }) => {
    const response = await page.goto(`${baseURL}${ENCODED_WITH_SLASH}`, {
      waitUntil: "commit",
    });
    expect(response, "navigation should produce a response").not.toBeNull();
    expect(new URL(page.url()).pathname).toBe(CANONICAL_WITH_SLASH);
  });

  test("int-2: encoded accented URL without trailing slash redirects to ASCII canonical", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}${ENCODED_NO_SLASH}`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe(CANONICAL_WITH_SLASH);
  });

  test("red-inicio: /inicio redirects to /", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/inicio`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("red-inicio: /inicio/ redirects to /", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/inicio/`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("red-ludoteca: /socios/ludoteca redirects to /ludoteca/", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/socios/ludoteca`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/ludoteca/");
  });

  test("red-validacion: /Validacion-Membresia redirects to /validacion/", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/Validacion-Membresia`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/validacion/");
  });

  test("red-trailing-slash: /calendario canonicalises to /calendario/", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/calendario`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/calendario/");
  });

  test("red-spa-no-trailing: /prestamos/games/1 is not redirected (SPA exclusion)", async ({
    page,
    baseURL,
  }) => {
    const target = "/prestamos/games/1";
    await page.goto(`${baseURL}${target}`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe(target);
  });

  test("url-1: unknown path returns 404", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}${UNKNOWN_PATH}`, {
      waitUntil: "commit",
    });
    expect(response, "expected a response from Caddy").not.toBeNull();
    expect(response!.status()).toBe(404);
  });
});
