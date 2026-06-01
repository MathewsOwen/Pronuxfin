import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";

/** Janela fixa distribuída (Postgres) — vale entre instâncias serverless. */

function envMs(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envMax(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const LOGIN_WINDOW_MS = envMs("AUTH_RATE_LIMIT_LOGIN_WINDOW_MS", 60_000);
const LOGIN_MAX = envMax("AUTH_RATE_LIMIT_LOGIN_MAX", 25);

const REGISTER_WINDOW_MS = envMs("AUTH_RATE_LIMIT_REGISTER_WINDOW_MS", 300_000);
const REGISTER_MAX = envMax("AUTH_RATE_LIMIT_REGISTER_MAX", 15);

const FORGOT_WINDOW_MS = envMs("AUTH_RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MS", 300_000);
const FORGOT_MAX = envMax("AUTH_RATE_LIMIT_FORGOT_PASSWORD_MAX", 8);

const RESET_WINDOW_MS = envMs("AUTH_RATE_LIMIT_RESET_PASSWORD_WINDOW_MS", 300_000);
const RESET_MAX = envMax("AUTH_RATE_LIMIT_RESET_PASSWORD_MAX", 12);

const WEBAUTHN_WINDOW_MS = envMs("AUTH_RATE_LIMIT_WEBAUTHN_WINDOW_MS", 60_000);
const WEBAUTHN_MAX = envMax("AUTH_RATE_LIMIT_WEBAUTHN_MAX", 40);

const REFRESH_WINDOW_MS = envMs("AUTH_RATE_LIMIT_REFRESH_WINDOW_MS", 60_000);
const REFRESH_MAX = envMax("AUTH_RATE_LIMIT_REFRESH_MAX", 30);

export function getRateLimitClientKey(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return `ip:${real}`;
  return "unknown";
}

export function rateLimitLogin(key: string) {
  return consumeRateLimit(`auth:login:${key}`, LOGIN_MAX, LOGIN_WINDOW_MS, {
    failClosed: true,
  });
}

export function rateLimitRegister(key: string) {
  return consumeRateLimit(
    `auth:register:${key}`,
    REGISTER_MAX,
    REGISTER_WINDOW_MS,
    { failClosed: true },
  );
}

export function rateLimitForgotPassword(key: string) {
  return consumeRateLimit(`auth:forgot:${key}`, FORGOT_MAX, FORGOT_WINDOW_MS, {
    failClosed: true,
  });
}

export function rateLimitResetPassword(key: string) {
  return consumeRateLimit(`auth:reset:${key}`, RESET_MAX, RESET_WINDOW_MS, {
    failClosed: true,
  });
}

export function rateLimitWebAuthn(key: string) {
  return consumeRateLimit(
    `auth:webauthn:${key}`,
    WEBAUTHN_MAX,
    WEBAUTHN_WINDOW_MS,
    { failClosed: true },
  );
}

export function rateLimitRefresh(key: string) {
  return consumeRateLimit(`auth:refresh:${key}`, REFRESH_MAX, REFRESH_WINDOW_MS, {
    failClosed: true,
  });
}

export function rateLimitLogout(key: string) {
  return consumeRateLimit(`auth:logout:${key}`, REFRESH_MAX, REFRESH_WINDOW_MS, {
    failClosed: true,
  });
}

export function authRateLimitedResponse(
  retryAfterSec: number,
  code:
    | "AUTH_RATE_LIMIT_LOGIN"
    | "AUTH_RATE_LIMIT_REGISTER"
    | "AUTH_RATE_LIMIT_FORGOT_PASSWORD"
    | "AUTH_RATE_LIMIT_RESET_PASSWORD"
    | "AUTH_RATE_LIMIT_WEBAUTHN"
    | "AUTH_RATE_LIMIT_REFRESH"
    | "AUTH_RATE_LIMIT_LOGOUT",
) {
  const res = NextResponse.json(
    {
      code,
      message:
        code === "AUTH_RATE_LIMIT_LOGIN" ?
          "Too many login attempts. Please wait before retrying."
        : code === "AUTH_RATE_LIMIT_REGISTER" ?
          "Too many registration attempts. Please wait before retrying."
        : code === "AUTH_RATE_LIMIT_FORGOT_PASSWORD" ?
          "Too many password recovery attempts. Please wait before retrying."
        : code === "AUTH_RATE_LIMIT_WEBAUTHN" ?
          "Too many passkey attempts. Please wait before retrying."
        : code === "AUTH_RATE_LIMIT_LOGOUT" ?
          "Too many logout attempts. Please wait before retrying."
        : code === "AUTH_RATE_LIMIT_REFRESH" ?
          "Too many session refresh attempts. Please wait before retrying."
        : "Too many password reset attempts. Please wait before retrying.",
    },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}
