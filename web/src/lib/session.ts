import { cookies } from "next/headers";
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
  const apiUrl = process.env.API_URL;
  if (!token || !apiUrl) return null;

  const res = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as SessionUser;
  return {
    id: data.id,
    email: data.email,
    name: data.name ?? null,
    isAdmin: Boolean(data.isAdmin),
  };
}
