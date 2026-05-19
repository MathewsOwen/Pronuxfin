import { describe, expect, it } from "vitest";

import { resolveActiveNavLabel } from "./resolve-active-nav-label";

describe("resolveActiveNavLabel", () => {
  const t = (key: string) =>
    ({
      panel: "Painel",
      portfolio: "Carteira",
      unknownPage: "Página",
    })[key] ?? key;

  it("returns label for exact private route", () => {
    expect(resolveActiveNavLabel("/dashboard", t)).toBe("Painel");
    expect(resolveActiveNavLabel("/carteira", t)).toBe("Carteira");
  });

  it("falls back to segment for unknown paths", () => {
    expect(resolveActiveNavLabel("/ativo/PETR4", t)).toBe("PETR4");
  });
});
