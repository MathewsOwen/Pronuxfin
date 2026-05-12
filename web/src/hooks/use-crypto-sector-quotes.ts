"use client";

import { useSequentialInterval } from "@/hooks/use-sequential-interval";
import {
  cryptoSectorDeskFallbackPayload,
  cryptoSectorDeskPlaceholderPayload,
} from "@/lib/market/crypto-sector-quotes-client-fallback";
import { type CryptoSectorId } from "@/lib/market/crypto-sector-universe";
import type { CryptoSectorBookPayload } from "@/lib/market/types";
import { PUBLIC_DESK_QUOTES_POLL_MS } from "@/lib/market/quotes-poll-interval";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export function useCryptoSectorQuotesBook(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  const [payload, setPayload] = useState<CryptoSectorBookPayload>(() =>
    cryptoSectorDeskPlaceholderPayload(sector),
  );
  const sectorRef = useRef(sector);
  const pullRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (sectorRef.current !== sector) {
      sectorRef.current = sector;
      setPayload(cryptoSectorDeskPlaceholderPayload(sector));
    }
  }, [sector]);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const qp = new URLSearchParams({ sector });
      const res = await fetch(`/api/quotes/crypto-sector?${qp}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        startTransition(() => setPayload(cryptoSectorDeskFallbackPayload(sector)));
        return;
      }
      const data = (await res.json()) as CryptoSectorBookPayload & {
        warnings?: string[];
      };
      startTransition(() => setPayload(data));
    } catch {
      startTransition(() => setPayload(cryptoSectorDeskFallbackPayload(sector)));
    }
  }, [sector]);

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useEffect(() => {
    void pull();
  }, [pull]);

  useSequentialInterval(pull, PUBLIC_DESK_QUOTES_POLL_MS);

  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) void pullRef.current();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return payload;
}
