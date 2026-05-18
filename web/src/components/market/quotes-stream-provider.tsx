"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSequentialInterval } from "@/hooks/use-sequential-interval";
import { deskBootstrapQuotesPayload } from "@/lib/market/desk-bootstrap-quotes";
import { resolveClientQuotesFallback } from "@/lib/market/quotes-client-fallback";
import type { QuotesPayload } from "@/lib/market/types";
import { PUBLIC_DESK_QUOTES_POLL_MS } from "@/lib/market/quotes-poll-interval";

/** Um único ciclo `/api/quotes` — cadência institucional (≥60 s; `NEXT_PUBLIC_QUOTES_POLL_MS`). */
export const QUOTES_POLL_MS = PUBLIC_DESK_QUOTES_POLL_MS;

const QuotesContext = createContext<QuotesPayload | undefined>(undefined);

export function QuotesStreamProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<QuotesPayload>(deskBootstrapQuotesPayload);
  const pullRef = useRef<() => Promise<void>>(async () => {});

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) {
        setPayload(resolveClientQuotesFallback());
        return;
      }
      const data = (await res.json()) as QuotesPayload & { warnings?: string[] };
      setPayload(data);
    } catch {
      setPayload(resolveClientQuotesFallback());
    }
  }, []);

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useSequentialInterval(pull, QUOTES_POLL_MS);

  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) void pullRef.current();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <QuotesContext.Provider value={payload}>{children}</QuotesContext.Provider>
  );
}

export function useQuotesStream(): QuotesPayload {
  const ctx = useContext(QuotesContext);
  if (ctx === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.error("useQuotesStream deve estar dentro de QuotesStreamProvider");
    }
    return deskBootstrapQuotesPayload();
  }
  return ctx;
}
