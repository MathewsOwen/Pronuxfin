import { describe, expect, it } from "vitest";

import { createRegisterSchema } from "./auth-schemas-dynamic";

const msg = {
  emailInvalid: "E-mail inválido",
  passwordMin: "Mínimo 8 caracteres",
  passwordLetters: "Inclua letras",
  passwordDigits: "Inclua números",
  nameRequired: "Nome obrigatório",
  nameMax: "Nome muito longo",
  termsRequired: "Aceite os termos",
};

describe("createRegisterSchema", () => {
  const schema = createRegisterSchema(msg);

  it("rejects registration without terms acceptance", () => {
    const result = schema.safeParse({
      name: "Ana Silva",
      email: "ana@example.com",
      password: "Senha123",
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "acceptTerms")).toBe(
        true,
      );
    }
  });

  it("accepts registration when terms are accepted", () => {
    const result = schema.safeParse({
      name: "Ana Silva",
      email: "ana@example.com",
      password: "Senha123",
      acceptTerms: true,
    });
    expect(result.success).toBe(true);
  });
});
