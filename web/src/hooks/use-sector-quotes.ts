"use client";

import { useSequentialInterval } from "@/hooks/use-sequential-interval";
import type { SectorId } from "@/lib/market/sector-universe";
import type { DeskMarketId } from "@/lib/market/world-markets";
import { listSectorSymbols } from "@/lib/market/sector-universe";
import {
  sectorDeskFallbackPayload,
  sectorDeskPlaceholderPayload,
} from "@/lib/market/sector-quotes-client-fallback";
import type { SectorBookPayload } from "@/lib/market/types";
import { PUBLIC_DESK_QUOTES_POLL_MS } from "@/lib/market/quotes-poll-interval";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Atualização independente da mesa canonical (`/api/quotes`): só pede região+setor ativos. */
export function useSectorQuotesBook(
  market: DeskMarketId,
  sector: SectorId,
): SectorBookPayload {
  const canon = useMemo(() => listSectorSymbols(market, sector), [market, sector]);
  const [payload, setPayload] = useState<SectorBookPayload>(() =>
    sectorDeskPlaceholderPayload(market, sector, canon),
  );
  const canonKey = canon.join("|");
  const canonRef = useRef(canonKey);
  const pullRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (canonRef.current !== canonKey) {
      canonRef.current = canonKey;
      setPayload(sectorDeskPlaceholderPayload(market, sector, canon));
    }
  }, [canon, canonKey, market, sector]);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const qp = new URLSearchParams({
        market,
        sector,
      });
      const res = await fetch(`/api/quotes/sector?${qp}`, { cache: "no-store" });
      if (!res.ok) {
        startTransition(() =>
          setPayload(sectorDeskFallbackPayload(market, sector, canon)),
        );
        return;
      }
      const data = (await res.json()) as SectorBookPayload & { warnings?: string[] };
      startTransition(() => setPayload(data));
    } catch {
      startTransition(() =>
        setPayload(sectorDeskFallbackPayload(market, sector, canon)),
      );
    }
  }, [canon, market, sector]);

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
