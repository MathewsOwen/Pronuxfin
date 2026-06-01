import { describe, expect, it } from "vitest";

import {
  isPrivateAppPath,
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_SITEMAP_PATHS,
  ROBOTS_DISALLOW_EXTRA,
} from "./public-routes";

describe("public-routes", () => {
  it("lists marketing paths for sitemap", () => {
    const paths = PUBLIC_SITEMAP_PATHS.map((entry) => entry.path);
    expect(paths).toContain("");
    expect(paths).toContain("/bolsa");
    expect(paths).toContain("/ferramentas/calendario");
    expect(paths).toContain("/aprenda");
    expect(paths).toContain("/aprenda/glossario");
    expect(paths).toContain("/privacidade");
    expect(paths).toContain("/termos");
    expect(paths).not.toContain("/dashboard");
  });

  it("flags private desk routes", () => {
    expect(isPrivateAppPath("/dashboard")).toBe(true);
    expect(isPrivateAppPath("/ativo/PETR4")).toBe(true);
    expect(isPrivateAppPath("/bolsa")).toBe(false);
  });

  it("keeps robots disallow in sync with private prefixes", () => {
    for (const prefix of PRIVATE_ROUTE_PREFIXES) {
      expect(ROBOTS_DISALLOW_EXTRA).toContain(prefix);
    }
  });

  it("allows legal pages to be indexed (sitemap without robots block)", () => {
    expect(ROBOTS_DISALLOW_EXTRA).not.toContain("/privacidade");
    expect(ROBOTS_DISALLOW_EXTRA).not.toContain("/termos");
  });
});
