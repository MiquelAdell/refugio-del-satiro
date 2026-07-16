import { defineConfig, devices } from "@playwright/test";

// Overridable so the stack can run when another service holds :8000
// (Caddyfile.e2e reads the same variable for its reverse_proxy target).
const API_PORT = process.env.E2E_API_PORT ?? "8000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  globalSetup: "./scripts/seed-auth-states.ts",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8090",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["iPad Pro"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: [
    {
      command: `python -m uvicorn backend.api.app:create_app --factory --port ${API_PORT}`,
      cwd: "..",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: true,
    },
    {
      command: "caddy run --config Caddyfile.e2e --adapter caddyfile",
      cwd: "..",
      url: "http://localhost:8090/ludoteca/api/health",
      reuseExistingServer: true,
    },
  ],
});
