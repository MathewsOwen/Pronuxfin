import { readTrimmedEnv } from "@/lib/env/server-env";

export function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = readTrimmedEnv(name);
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}
