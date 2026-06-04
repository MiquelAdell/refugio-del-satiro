import { defineConfig, devices } from "@playwright/test";

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
      command: "python -m uvicorn backend.api.app:create_app --factory --port 8000",
      cwd: "..",
      url: "http://localhost:8000/api/health",
      reuseExistingServer: true,
    },
    {
      command: "caddy run --config Caddyfile.e2e --adapter caddyfile",
      cwd: "..",
      url: "http://localhost:8090/",
      reuseExistingServer: true,
    },
  ],
});
