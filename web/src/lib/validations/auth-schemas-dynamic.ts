import { z } from "zod";

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
  passwordLetters: string;
  passwordDigits: string;
  nameRequired: string;
  nameMax: string;
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
      .min(8, msg.passwordMin)
      .regex(/[A-Za-z]/, msg.passwordLetters)
      .regex(/[0-9]/, msg.passwordDigits),
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
