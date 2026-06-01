import { cookies } from "next/headers";

import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { validateAccessToken } from "@/lib/auth/validate-access-session";

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = readAuthCookieValue(jar);
  if (!token) return null;

  const session = await validateAccessToken(token);
  return session?.userId ?? null;
}
