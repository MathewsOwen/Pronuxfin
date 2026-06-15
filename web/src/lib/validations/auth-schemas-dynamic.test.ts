import { describe, expect, it } from "vitest";

import { createRegisterSchema } from "./auth-schemas-dynamic";

const msg = {
  emailInvalid: "E-mail inválido",
  passwordMin: "Mínimo 12 caracteres",
  passwordWeak: "Senha fraca",
  passwordCommon: "Senha comum",
  nameRequired: "Nome obrigatório",
  nameMax: "Nome muito longo",
  termsRequired: "Aceite os termos",
};

const strongPassword = "Senha123!Segura";

describe("createRegisterSchema", () => {
  const schema = createRegisterSchema(msg);

  it("rejects registration without terms acceptance", () => {
    const result = schema.safeParse({
      name: "Ana Silva",
      email: "ana@example.com",
      password: strongPassword,
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
      password: strongPassword,
      acceptTerms: true,
    });
    expect(result.success).toBe(true);
  });
});
