import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FetchTimeoutError,
  fetchWithTimeout,
  marketFetchTimeoutMs,
} from "./fetch-with-timeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves when fetch completes before timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("ok", { status: 200 })),
    );

    const promise = fetchWithTimeout("https://example.com", undefined, {
      timeoutMs: 5_000,
    });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
  });

  it("throws FetchTimeoutError when fetch hangs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      }),
    );

    const promise = fetchWithTimeout("https://example.com", undefined, {
      timeoutMs: 100,
      label: "market",
    });
    const assertion = expect(promise).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(150);
    await assertion;
  });

  it("reads MARKET_FETCH_TIMEOUT_MS from env", () => {
    vi.stubEnv("MARKET_FETCH_TIMEOUT_MS", "8000");
    expect(marketFetchTimeoutMs()).toBe(8000);
  });
});
