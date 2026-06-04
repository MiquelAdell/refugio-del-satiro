/**
 * Seed authentication states for Playwright tests.
 *
 * Logs in as the seeded member and admin test users via POST /api/login,
 * then writes three storageState fixtures (guest, member, admin) under
 * e2e/fixtures/. Spec files load them via `test.use({ storageState: ... })`.
 *
 * Auth mechanics (see backend/api/auth.py + frontend/src/context/AuthContext):
 *   - Backend sets an HttpOnly cookie `session_token` (JWT) on /api/login.
 *   - Frontend writes a sentinel flag to localStorage["prestamos_session"] = "1"
 *     so AuthContext attempts /me on mount. The flag value is opaque; the
 *     cookie carries the real session.
 *
 * Both pieces must be present in the storageState for an authenticated test.
 *
 * Run via Playwright globalSetup (configured in playwright.config.ts) or
 * standalone with the frontend's bundled tsx:
 *   cd frontend && yarn playwright test --config ../e2e/playwright.config.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { request, type APIRequestContext } from "@playwright/test";

const FIXTURES_DIR = resolve(__dirname, "..", "fixtures");

const API_BASE = process.env.E2E_API_BASE ?? "http://localhost:8000";
const APP_BASE = process.env.E2E_APP_BASE ?? "http://localhost:8090";
const SESSION_STORAGE_KEY = "prestamos_session";
const SESSION_STORAGE_VALUE = "1";

interface TestUser {
  readonly role: "member" | "admin";
  readonly email: string;
  readonly password: string;
}

const users: ReadonlyArray<TestUser> = [
  {
    role: "member",
    email: process.env.TEST_MEMBER_EMAIL ?? "e2e-member@test.local",
    password: process.env.TEST_MEMBER_PASSWORD ?? "e2e-test-password-member",
  },
  {
    role: "admin",
    email: process.env.TEST_ADMIN_EMAIL ?? "e2e-admin@test.local",
    password: process.env.TEST_ADMIN_PASSWORD ?? "e2e-test-password-admin",
  },
];

async function loginAndVerify(api: APIRequestContext, user: TestUser): Promise<void> {
  const loginResponse = await api.post(`${API_BASE}/api/login`, {
    data: { email: user.email, password: user.password },
    headers: { "Content-Type": "application/json" },
  });
  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed for ${user.email}: ${loginResponse.status()} ${await loginResponse.text()}`,
    );
  }
  const meResponse = await api.get(`${API_BASE}/api/me`);
  if (!meResponse.ok()) {
    throw new Error(
      `/api/me failed after login for ${user.email}: ${meResponse.status()}`,
    );
  }
  const me = (await meResponse.json()) as { is_admin: boolean };
  const expectAdmin = user.role === "admin";
  if (me.is_admin !== expectAdmin) {
    throw new Error(
      `Role mismatch for ${user.email}: expected is_admin=${expectAdmin}, got ${me.is_admin}`,
    );
  }
}

async function writeAuthenticatedState(user: TestUser, outputPath: string): Promise<void> {
  // Use a fresh APIRequestContext per user so cookies don't leak between roles.
  const api = await request.newContext();
  try {
    await loginAndVerify(api, user);
    // storageState() on the APIRequestContext gives us the session_token cookie.
    // We also need localStorage["prestamos_session"]="1" so AuthContext fetches /me.
    const apiState = await api.storageState();
    const state = {
      ...apiState,
      origins: [
        {
          origin: APP_BASE,
          localStorage: [
            { name: SESSION_STORAGE_KEY, value: SESSION_STORAGE_VALUE },
          ],
        },
      ],
    };
    await writeFile(outputPath, JSON.stringify(state, null, 2), "utf-8");
  } finally {
    await api.dispose();
  }
}

async function writeGuestState(outputPath: string): Promise<void> {
  // A pristine storageState: no cookies, no origin data. Matches the shape
  // Playwright would emit from `context.storageState()` on a fresh context,
  // without requiring a browser launch.
  const emptyState = { cookies: [], origins: [] };
  await writeFile(outputPath, JSON.stringify(emptyState, null, 2), "utf-8");
}

async function main(): Promise<void> {
  await mkdir(FIXTURES_DIR, { recursive: true });

  const guestPath = resolve(FIXTURES_DIR, "guest.json");
  await writeGuestState(guestPath);
  console.log(`wrote ${guestPath}`);

  for (const user of users) {
    const outPath = resolve(FIXTURES_DIR, `${user.role}.json`);
    await writeAuthenticatedState(user, outPath);
    console.log(`wrote ${outPath} (${user.email})`);
  }
}

// Playwright globalSetup expects a default export of (config) => Promise<void>.
export default async function globalSetup(): Promise<void> {
  await main();
}

// Allow running standalone: `node -r ts-node/register e2e/scripts/seed-auth-states.ts`
// or any TS runner. Under Playwright globalSetup, only the default export is used.
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
