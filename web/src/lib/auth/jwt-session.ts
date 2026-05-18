import { jwtVerify } from "jose";
import type { SessionUser } from "@/lib/session";

const PLATFORM_ADMIN_ROLE = "platform_admin";

export async function sessionUserFromJwt(
  token: string,
): Promise<SessionUser | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") return null;

    const roles = payload.roles;
    const isAdmin =
      Array.isArray(roles) &&
      roles.some((r) => r === PLATFORM_ADMIN_ROLE);

    return {
      id: sub,
      email,
      name: typeof payload.name === "string" ? payload.name : null,
      isAdmin,
    };
  } catch {
    return null;
  }
}
