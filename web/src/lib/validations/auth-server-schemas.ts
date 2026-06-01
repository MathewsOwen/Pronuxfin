import { z } from "zod";

/** Server-side auth payloads — validated in the BFF before forwarding to Nest. */

export const authLoginBodySchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(256),
});

export const authRegisterBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(256),
  acceptTerms: z.literal(true),
});

export const authForgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(320),
});

export const authResetPasswordBodySchema = z
  .object({
    token: z.string().trim().min(1).max(512),
    password: z.string().min(8).max(256),
    confirmPassword: z.string().min(1).max(256),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const webauthnLoginOptionsBodySchema = z.object({
  challengeId: z.string().trim().min(8).max(64),
});

export const webauthnLoginVerifyBodySchema = z.object({
  challengeId: z.string().trim().min(8).max(64),
  response: z.record(z.string(), z.unknown()),
});
