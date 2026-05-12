"use client";

import { useSequentialInterval } from "@/hooks/use-sequential-interval";
import type { SectorId, MarketRegionId } from "@/lib/market/sector-universe";
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
  region: MarketRegionId,
  sector: SectorId,
): SectorBookPayload {
  const canon = useMemo(() => listSectorSymbols(region, sector), [region, sector]);
  const [payload, setPayload] = useState<SectorBookPayload>(() =>
    sectorDeskPlaceholderPayload(region, sector, canon),
  );
  const canonKey = canon.join("|");
  const canonRef = useRef(canonKey);
  const pullRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (canonRef.current !== canonKey) {
      canonRef.current = canonKey;
      setPayload(sectorDeskPlaceholderPayload(region, sector, canon));
    }
  }, [canon, canonKey, region, sector]);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const qp = new URLSearchParams({
        region,
        sector,
      });
      const res = await fetch(`/api/quotes/sector?${qp}`, { cache: "no-store" });
      if (!res.ok) {
        startTransition(() =>
          setPayload(sectorDeskFallbackPayload(region, sector, canon)),
        );
        return;
      }
      const data = (await res.json()) as SectorBookPayload & { warnings?: string[] };
      startTransition(() => setPayload(data));
    } catch {
      startTransition(() =>
        setPayload(sectorDeskFallbackPayload(region, sector, canon)),
      );
    }
  }, [canon, region, sector]);

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
