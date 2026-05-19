import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        /** `next start` + cold boot pode exceder 2 min em CI ou HDD lento */
        timeout: 180_000,
        env: {
          API_URL: process.env.API_URL ?? "http://127.0.0.1:5999",
          JWT_SECRET:
            process.env.JWT_SECRET ??
            "playwright-e2e-jwt-secret-minimum-32-characters",
          DATABASE_URL:
            process.env.DATABASE_URL ??
            "postgresql://playwright:playwright@127.0.0.1:5432/playwright",
          NEXT_PUBLIC_SITE_URL: baseURL,
        },
      },
});
