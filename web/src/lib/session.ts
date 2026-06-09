import { cookies } from "next/headers";
import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { sessionUserFromJwt } from "@/lib/auth/jwt-session";
import { validateAccessToken } from "@/lib/auth/validate-access-session";
import { internalApiHeaders } from "@/lib/http/internal-api-headers";

export async function getSessionToken(): Promise<string | undefined> {
  return readAuthCookieValue(await cookies());
}

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  isAdmin?: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const validated = await validateAccessToken(token);
  if (!validated) return null;

  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) {
    return sessionUserFromJwt(token);
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...internalApiHeaders({ method: "GET", path: "/auth/me" }),
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as SessionUser;
      return {
        id: data.id,
        email: data.email,
        name: data.name ?? null,
        isAdmin: Boolean(data.isAdmin),
      };
    }
  } catch {
    /* API indisponível */
  }

  return null;
}
