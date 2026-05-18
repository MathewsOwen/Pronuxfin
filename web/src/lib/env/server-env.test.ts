import { afterEach, describe, expect, it, vi } from "vitest";

import {
  configDegradationReason,
  isJwtSecretConfigured,
  isProductionRuntime,
  jwtSecretReadinessDetail,
} from "@/lib/env/server-env";

describe("server-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats development as non-production gate", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isProductionRuntime()).toBe(false);
    expect(configDegradationReason()).toBeUndefined();
  });

  it("flags short JWT secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "https://api.test");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost/db");
    vi.stubEnv("JWT_SECRET", "too-short");
    expect(isJwtSecretConfigured()).toBe(false);
    expect(jwtSecretReadinessDetail()).toContain("too short");
    expect(configDegradationReason()).toMatch(/JWT_SECRET/i);
  });

  it("passes config checks when production env is complete", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "https://api.test");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost/db");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    expect(configDegradationReason()).toBeUndefined();
  });
});
