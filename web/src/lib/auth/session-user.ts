import { jwtVerify } from "jose";
import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/lib/constants";

export async function getSessionUserId(): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const sub = payload.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}
