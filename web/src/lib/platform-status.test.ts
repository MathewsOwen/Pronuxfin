import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPlatformStatus,
  invalidatePlatformStatusCache,
} from "@/lib/platform-status";

describe("getPlatformStatus", () => {
  beforeEach(() => {
    invalidatePlatformStatusCache();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "https://api.pronuxfin.test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost/db");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
  });

  afterEach(() => {
    invalidatePlatformStatusCache();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reports healthy when backend responds ok", async () => {
    const status = await getPlatformStatus();
    expect(status.degraded).toBe(false);
    expect(status.reason).toBeUndefined();
  });

  it("retries backend before degrading", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const status = await getPlatformStatus();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status.degraded).toBe(false);
  });

  it("degrades on missing JWT in production", async () => {
    vi.stubEnv("JWT_SECRET", "");
    const status = await getPlatformStatus();
    expect(status.degraded).toBe(true);
    expect(status.reason).toMatch(/JWT_SECRET/i);
  });

  it("uses cache on subsequent calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await getPlatformStatus();
    await getPlatformStatus();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
