import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

/** Minimal production security env so `next start` passes instrumentation in CI. */
const e2ePublicKey =
  "-----BEGIN PUBLIC KEY-----\n" +
  "A".repeat(64) +
  "\n-----END PUBLIC KEY-----";

const e2eServerEnv: Record<string, string> = {
  PLAYWRIGHT_E2E: "1",
  API_URL: process.env.API_URL ?? "http://127.0.0.1:5999",
  JWT_SECRET:
    process.env.JWT_SECRET ??
    "playwright-e2e-jwt-secret-minimum-32-characters",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://playwright:playwright@127.0.0.1:5432/playwright",
  NEXT_PUBLIC_SITE_URL: baseURL,
  JWT_ALGORITHM: "RS256",
  JWT_PUBLIC_KEY: e2ePublicKey,
  INTERNAL_API_SECRET:
    process.env.INTERNAL_API_SECRET ?? "e2e-internal-api-secret-32chars!",
  COOKIE_SAMESITE_STRICT: "1",
  AI_KEYS_ENCRYPTION_KEY:
    process.env.AI_KEYS_ENCRYPTION_KEY ?? "0123456789abcdef".repeat(4),
  WEBAUTHN_RP_ID: "127.0.0.1",
  WEBAUTHN_ORIGIN: "https://127.0.0.1",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "sk-e2e-placeholder",
  CSP_MODE: "report-only",
};

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
        command: "npx next start -H 127.0.0.1 -p 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        /** `next start` + cold boot pode exceder 2 min em CI ou HDD lento */
        timeout: 180_000,
        env: { ...process.env, ...e2eServerEnv },
      },
});
