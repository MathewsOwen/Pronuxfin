import { describe, expect, it } from "vitest";

import { resolveActiveNavLabel } from "./resolve-active-nav-label";

describe("resolveActiveNavLabel", () => {
  const t = (key: string) => `label:${key}`;

  it("returns label for exact and nested routes", () => {
    expect(resolveActiveNavLabel("/dashboard", t)).toBe("label:panel");
    expect(resolveActiveNavLabel("/bolsa/PETR4", t)).toBe("label:market");
  });

  it("falls back to unknown page label", () => {
    expect(resolveActiveNavLabel("/rota-inexistente", t)).toBe("rota-inexistente");
    expect(resolveActiveNavLabel("/", t)).toBe("label:unknownPage");
  });
});
