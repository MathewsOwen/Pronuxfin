"use client";

import { useEffect, useRef, useState } from "react";

import { apiWarmupLiveUrl } from "@/lib/http/api-warmup-url";

export type AuthWarmupState = "idle" | "warming" | "ready" | "slow";

const BROWSER_WARMUP_TIMEOUT_MS = 90_000;

/**
 * Acorda a API Nest directamente do browser (CORS), sem passar pelo BFF Vercel.
 * Evita o limite de ~10s das funções serverless no plano Hobby durante cold start.
 */
export function useAuthUpstreamWarmup(): AuthWarmupState {
  const [state, setState] = useState<AuthWarmupState>("idle");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setState("warming");

    void (async () => {
      try {
        const res = await fetch(apiWarmupLiveUrl(), {
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(BROWSER_WARMUP_TIMEOUT_MS),
        });
        setState(res.ok ? "ready" : "slow");
      } catch {
        setState("slow");
      }
    })();
  }, []);

  return state;
}

/** Reutilizável antes de submit (retry manual). */
export async function warmAuthUpstreamFromBrowser(): Promise<boolean> {
  try {
    const res = await fetch(apiWarmupLiveUrl(), {
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(BROWSER_WARMUP_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}
