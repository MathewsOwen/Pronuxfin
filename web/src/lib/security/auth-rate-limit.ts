import { NextResponse } from "next/server";

/** Janela deslizante em memória (por instância Node). Adequado a VPS/Node; serverless diminui alcance mas ainda corta rajadas. */

const LOGIN_WINDOW_MS = Number(
  process.env.AUTH_RATE_LIMIT_LOGIN_WINDOW_MS ?? 60_000,
);
const LOGIN_MAX = Number(process.env.AUTH_RATE_LIMIT_LOGIN_MAX ?? 25);

const REGISTER_WINDOW_MS = Number(
  process.env.AUTH_RATE_LIMIT_REGISTER_WINDOW_MS ?? 300_000,
);
const REGISTER_MAX = Number(process.env.AUTH_RATE_LIMIT_REGISTER_MAX ?? 15);

const FORGOT_WINDOW_MS = Number(
  process.env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MS ?? 300_000,
);
const FORGOT_MAX = Number(process.env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_MAX ?? 8);

const RESET_WINDOW_MS = Number(
  process.env.AUTH_RATE_LIMIT_RESET_PASSWORD_WINDOW_MS ?? 300_000,
);
const RESET_MAX = Number(process.env.AUTH_RATE_LIMIT_RESET_PASSWORD_MAX ?? 12);

type Entry = Map<string, number[]>;

function prune(ts: number[], now: number, windowMs: number): number[] {
  return ts.filter((t) => now - t < windowMs);
}

function allow(entries: Entry, key: string, windowMs: number, max: number) {
  const now = Date.now();
  let list = prune(entries.get(key) ?? [], now, windowMs);
  if (list.length >= max) {
    entries.set(key, list);
    return { ok: false as const, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  list = [...list, now];
  entries.set(key, list);
  return { ok: true as const };
}

const loginHits: Entry = new Map();
const registerHits: Entry = new Map();
const forgotHits: Entry = new Map();
const resetHits: Entry = new Map();

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
  return allow(loginHits, key, LOGIN_WINDOW_MS, LOGIN_MAX);
}

export function rateLimitRegister(key: string) {
  return allow(registerHits, key, REGISTER_WINDOW_MS, REGISTER_MAX);
}

export function rateLimitForgotPassword(key: string) {
  return allow(forgotHits, key, FORGOT_WINDOW_MS, FORGOT_MAX);
}

export function rateLimitResetPassword(key: string) {
  return allow(resetHits, key, RESET_WINDOW_MS, RESET_MAX);
}

export function authRateLimitedResponse(
  retryAfterSec: number,
  code:
    | "AUTH_RATE_LIMIT_LOGIN"
    | "AUTH_RATE_LIMIT_REGISTER"
    | "AUTH_RATE_LIMIT_FORGOT_PASSWORD"
    | "AUTH_RATE_LIMIT_RESET_PASSWORD",
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
        : "Too many password reset attempts. Please wait before retrying.",
    },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}
