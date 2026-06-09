import { z } from "zod";

const COMMON = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "admin123",
  "pronuxfin",
]);

export function passwordPolicyRefine(password: string, ctx: z.RefinementCtx): void {
  if (password.length < 12) {
    ctx.addIssue({
      code: "custom",
      message: "Senha deve ter pelo menos 12 caracteres.",
    });
    return;
  }

  if (COMMON.has(password.toLowerCase())) {
    ctx.addIssue({
      code: "custom",
      message: "Senha demasiado comum. Escolha outra.",
    });
    return;
  }

  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (classes < 3) {
    ctx.addIssue({
      code: "custom",
      message:
        "Senha fraca: use pelo menos 3 tipos (minúscula, maiúscula, número, símbolo).",
    });
  }
}

export const strongPasswordSchema = z
  .string()
  .min(12)
  .max(256)
  .superRefine(passwordPolicyRefine);
