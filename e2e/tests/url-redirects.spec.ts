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
const UNKNOWN_PATH = "/this-path-does-not-exist-7f3a";
const CANONICAL_DOMAIN = "refugiodelsatiro.es";
const REDIRECT_DOMAIN = "www.refugiodelsatiro.es";
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-frame-options": "SAMEORIGIN",
};

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

  test("red-prestamos-root: /prestamos redirects to /ludoteca/", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/prestamos`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/ludoteca/");
  });

  test("red-prestamos-path: /prestamos/<path> redirects to /ludoteca/<path> preserving query string", async ({
    page,
    baseURL,
  }) => {
    const originalPath = "/prestamos/juegos/catan?foo=bar";
    await page.goto(`${baseURL}${originalPath}`, { waitUntil: "commit" });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/ludoteca/juegos/catan");
    expect(url.search).toBe("?foo=bar");
  });

  test("red-validacion: /Validacion-Membresia redirects to /ludoteca/validacion", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/Validacion-Membresia`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/ludoteca/validacion");
  });

  test("red-validacion: legacy lowercase /Validacion-membresia redirects to /ludoteca/validacion", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/Validacion-membresia`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/ludoteca/validacion");
  });

  test("red-validacion: /validacion redirects to /ludoteca/validacion", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/validacion`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/ludoteca/validacion");
  });

  test("red-trailing-slash: /calendario canonicalises to /calendario/", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/calendario`, { waitUntil: "commit" });
    expect(new URL(page.url()).pathname).toBe("/calendario/");
  });

  test("url-1: unknown path returns 404", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}${UNKNOWN_PATH}`, {
      waitUntil: "commit",
    });
    expect(response, "expected a response from Caddy").not.toBeNull();
    expect(response!.status()).toBe(404);
  });

  test("canonical-host-1: www redirects to apex preserving path and query", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/calendario/?source=legacy`, {
      headers: { Host: REDIRECT_DOMAIN },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe(
      `https://${CANONICAL_DOMAIN}/calendario/?source=legacy`,
    );
  });

  test("canonical-host-2: apex serves the app without a host redirect", async ({
    request,
    baseURL,
  }) => {
    const healthResponse = await request.get(`${baseURL}/ludoteca/api/health`, {
      headers: { Host: CANONICAL_DOMAIN },
      maxRedirects: 0,
    });

    expect(healthResponse.status()).toBe(200);
    expect(healthResponse.headers().location).toBeUndefined();
    expect(await healthResponse.json()).toEqual({ status: "ok" });
  });

  test("static-font-1: root font assets are served by the app", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(
      `${baseURL}/fonts/open-sans-variable.woff2`,
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("font/woff2");
    expect((await response.body()).byteLength).toBeGreaterThan(1_000);
  });

  test("security-headers-1: conservative headers cover app and root font routes", async ({
    request,
    baseURL,
  }) => {
    for (const path of [
      "/fonts/open-sans-variable.woff2",
      "/ludoteca/",
      "/ludoteca/login",
    ]) {
      const response = await request.get(`${baseURL}${path}`);
      expect(response.status(), path).toBe(200);
      expect(response.headers(), path).toMatchObject(SECURITY_HEADERS);
    }
  });
});
