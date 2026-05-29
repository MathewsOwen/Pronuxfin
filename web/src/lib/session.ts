import { cookies } from "next/headers";
import { sessionUserFromJwt } from "@/lib/auth/jwt-session";
import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
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

  const jwtUser = await sessionUserFromJwt(token);
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) return jwtUser;

  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, ...internalApiHeaders() },
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
    /* API indisponível — mantém sessão via JWT para não derrubar abas públicas */
  }

  return jwtUser;
}
