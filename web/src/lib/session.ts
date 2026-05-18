import { cookies } from "next/headers";
import { sessionUserFromJwt } from "@/lib/auth/jwt-session";
import { AUTH_COOKIE } from "@/lib/constants";

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE)?.value;
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
      headers: { Authorization: `Bearer ${token}` },
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
