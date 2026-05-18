import type { SessionUser } from "@/lib/session";

/** Primeiro nome para saudação — exige `name` guardado na conta. */
export function displayNameForUser(user: Pick<SessionUser, "name">): string {
  const n = user.name?.trim();
  if (!n) return "";
  const first = n.split(/\s+/)[0];
  return first || n;
}

export function userNeedsName(user: Pick<SessionUser, "name">): boolean {
  return !user.name?.trim();
}

export function initialsForUser(user: Pick<SessionUser, "email" | "name">): string {
  const n = user.name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase() || "PF";
  }
  const local = user.email.split("@")[0] ?? "?";
  const segs = local.split(/[._-]+/).filter(Boolean);
  if (segs.length >= 2) {
    return (segs[0]!.slice(0, 1) + segs[1]!.slice(0, 1)).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "PF";
}
