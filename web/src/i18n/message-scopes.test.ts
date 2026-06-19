import { describe, expect, it } from "vitest";
import {
  needsFullI18nCatalog,
  pickMessageNamespaces,
  PUBLIC_I18N_NAMESPACES,
  stripLocalePathname,
} from "@/i18n/message-scopes";

describe("message-scopes", () => {
  it("strips locale prefix", () => {
    expect(stripLocalePathname("/pt-BR/bolsa", ["pt-BR", "en"])).toBe("/bolsa");
    expect(stripLocalePathname("/en", ["pt-BR", "en"])).toBe("/");
  });

  it("requires full catalog only on private desk routes", () => {
    expect(needsFullI18nCatalog("/dashboard")).toBe(true);
    expect(needsFullI18nCatalog("/ativo/PETR4")).toBe(true);
    expect(needsFullI18nCatalog("/bolsa")).toBe(false);
    expect(needsFullI18nCatalog("/")).toBe(false);
  });

  it("picks only public namespaces", () => {
    const all = {
      Nav: { market: "Bolsa" },
      Dashboard: { title: "Painel" },
      Hero: { title: "Hero" },
    };
    const picked = pickMessageNamespaces(all, PUBLIC_I18N_NAMESPACES);
    expect(picked).toEqual({ Nav: { market: "Bolsa" }, Hero: { title: "Hero" } });
    expect(picked).not.toHaveProperty("Dashboard");
  });
});
