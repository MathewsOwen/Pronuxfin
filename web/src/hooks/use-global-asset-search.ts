"use client";

import { useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { GlobalAssetSearchResponse } from "@/lib/market/global-asset-search-types";

export function useGlobalAssetSearch(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 280);
  const activeQuery = enabled && debounced.length >= 2 ? debounced : "";

  const [payload, setPayload] = useState<GlobalAssetSearchResponse | null>(null);
  const [settledQuery, setSettledQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activeQuery) {
      abortRef.current?.abort();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const q = activeQuery;

    void (async () => {
      try {
        const params = new URLSearchParams({ q, limit: "16" });
        const res = await fetch(`/api/market/search?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!controller.signal.aborted) {
            setPayload(null);
            setError("search_failed");
            setSettledQuery(q);
          }
          return;
        }
        const data = (await res.json()) as GlobalAssetSearchResponse;
        if (!controller.signal.aborted) {
          setPayload(data);
          setError(null);
          setSettledQuery(q);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (!controller.signal.aborted) {
          setPayload(null);
          setError("search_failed");
          setSettledQuery(q);
        }
      }
    })();

    return () => controller.abort();
  }, [activeQuery]);

  const inFlight = activeQuery.length >= 2 && settledQuery !== activeQuery;
  const showResults = activeQuery.length >= 2 && settledQuery === activeQuery && !error;

  return {
    results: showResults ? (payload?.results ?? []) : [],
    partial: showResults ? (payload?.partial ?? false) : false,
    loading: inFlight,
    error: enabled ? error : null,
    hasQuery: activeQuery.length >= 2,
  };
}
