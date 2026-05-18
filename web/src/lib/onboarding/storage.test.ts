import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dismissOnboarding,
  isOnboardingDismissed,
  onboardingStorageKey,
} from "./storage";

function mockBrowserStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {} as Window);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe("onboarding storage", () => {
  beforeEach(() => {
    mockBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a versioned key per user", () => {
    expect(onboardingStorageKey("user-42")).toBe("pronuxfin_onboarding_v3:user-42");
  });

  it("persists dismiss state", () => {
    expect(isOnboardingDismissed("u1")).toBe(false);
    dismissOnboarding("u1");
    expect(isOnboardingDismissed("u1")).toBe(true);
    expect(isOnboardingDismissed("u2")).toBe(false);
  });
});
