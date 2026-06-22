import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasSeenPronuxIntroThisSession,
  markPronuxIntroSeenThisSession,
  PRONUX_INTRO_SESSION_KEY,
  wantsPronuxIntro,
} from "./pronux-intro-session";

describe("pronux-intro-session", () => {
  const store = new Map<string, string>();
  let search = "";

  beforeEach(() => {
    store.clear();
    search = "";
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    vi.stubGlobal("window", {
      location: {
        get search() {
          return search;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts unseen and marks seen for the tab session", () => {
    expect(hasSeenPronuxIntroThisSession()).toBe(false);
    expect(wantsPronuxIntro()).toBe(true);
    markPronuxIntroSeenThisSession();
    expect(hasSeenPronuxIntroThisSession()).toBe(true);
    expect(wantsPronuxIntro()).toBe(false);
    expect(store.get(PRONUX_INTRO_SESSION_KEY)).toBe("1");
  });

  it("honors ?intro=0", () => {
    search = "?intro=0";
    expect(wantsPronuxIntro()).toBe(false);
  });
});
