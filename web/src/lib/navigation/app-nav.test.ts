import { describe, expect, it } from "vitest";

import {
  APP_MOBILE_QUICK_LINKS,
  APP_NAV_GROUPS,
  flattenAppNavItems,
} from "./app-nav";

describe("app-nav", () => {
  it("groups all private routes without duplicates", () => {
    const flat = flattenAppNavItems();
    const hrefs = flat.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(flat.length).toBeGreaterThanOrEqual(12);
    expect(APP_NAV_GROUPS.map((g) => g.id)).toEqual(["desk", "market", "tools", "account"]);
  });

  it("exposes mobile quick links as desk shortcuts", () => {
    expect(APP_MOBILE_QUICK_LINKS).toHaveLength(3);
    expect(APP_MOBILE_QUICK_LINKS.map((l) => l.href)).toEqual([
      "/dashboard",
      "/bolsa",
      "/alerts",
    ]);
  });
});
