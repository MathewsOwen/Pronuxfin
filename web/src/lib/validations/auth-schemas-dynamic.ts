import { z } from "zod";

import { passwordPolicyRefine } from "@/lib/validations/password-policy";

export function createLoginSchema(msg: {
  emailInvalid: string;
  passwordRequired: string;
}) {
  return z.object({
    email: z.string().email(msg.emailInvalid),
    password: z.string().min(1, msg.passwordRequired),
  });
}

export function createForgotPasswordSchema(msg: { emailInvalid: string }) {
  return z.object({
    email: z.string().email(msg.emailInvalid),
  });
}

export function createRegisterSchema(msg: {
  emailInvalid: string;
  passwordMin: string;
  passwordWeak: string;
  passwordCommon: string;
  nameRequired: string;
  nameMax: string;
  termsRequired: string;
}) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, msg.nameRequired)
      .max(120, msg.nameMax),
    email: z.string().email(msg.emailInvalid),
    password: z
      .string()
      .min(12, msg.passwordMin)
      .max(256)
      .superRefine((password, ctx) => {
        passwordPolicyRefine(password, ctx, {
          tooShort: msg.passwordMin,
          tooWeak: msg.passwordWeak,
          tooCommon: msg.passwordCommon,
        });
      }),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: msg.termsRequired,
    }),
  });
}

export function createResetPasswordSchema(msg: {
  tokenRequired: string;
  passwordMin: string;
  passwordLetters: string;
  passwordDigits: string;
  passwordMismatch: string;
}) {
  return z
    .object({
      token: z.string().min(1, msg.tokenRequired),
      password: z
        .string()
        .min(8, msg.passwordMin)
        .regex(/[A-Za-z]/, msg.passwordLetters)
        .regex(/[0-9]/, msg.passwordDigits),
      confirmPassword: z.string().min(1, msg.passwordMismatch),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: msg.passwordMismatch,
      path: ["confirmPassword"],
    });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type ForgotPasswordValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
export type ResetPasswordValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
