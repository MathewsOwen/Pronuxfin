import { NextResponse } from "next/server";
import { secureAuthCookie } from "@/lib/auth/cookie-settings";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: secureAuthCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
