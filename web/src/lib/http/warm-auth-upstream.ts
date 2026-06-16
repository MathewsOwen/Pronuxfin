import { readTrimmedEnv } from "@/lib/env/server-env";
import { resolveAuthUpstreamTimeoutMs } from "@/lib/http/auth-timeout";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

/** Acorda a API Nest (Render free tier) antes de auth mutations. */
export async function warmAuthUpstream(): Promise<{
  ok: boolean;
  uptimeSec: number | null;
}> {
  const base = readTrimmedEnv("API_URL").replace(/\/+$/, "");
  if (!base) return { ok: false, uptimeSec: null };

  const timeoutMs = resolveAuthUpstreamTimeoutMs(base);
  try {
    const res = await fetchWithTimeout(
      `${base}/health/live`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
      { timeoutMs, label: "auth-warmup" },
    );
    if (!res.ok) return { ok: false, uptimeSec: null };
    const body = (await res.json().catch(() => null)) as {
      uptime_sec?: number;
    } | null;
    return {
      ok: true,
      uptimeSec:
        typeof body?.uptime_sec === "number" && Number.isFinite(body.uptime_sec)
          ? body.uptime_sec
          : null,
    };
  } catch {
    return { ok: false, uptimeSec: null };
  }
}
