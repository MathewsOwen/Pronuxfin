"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { GlobalAssetSearchResponse } from "@/lib/market/global-asset-search-types";

export function useGlobalAssetSearch(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 280);
  const [payload, setPayload] = useState<GlobalAssetSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pull = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (q.length < 2) {
      setPayload(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q, limit: "16" });
      const res = await fetch(`/api/market/search?${params}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        setPayload(null);
        setError("search_failed");
        return;
      }
      const data = (await res.json()) as GlobalAssetSearchResponse;
      setPayload(data);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPayload(null);
      setError("search_failed");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPayload(null);
      setLoading(false);
      return;
    }
    void pull(debounced);
    return () => abortRef.current?.abort();
  }, [debounced, enabled, pull]);

  return {
    results: payload?.results ?? [],
    partial: payload?.partial ?? false,
    loading,
    error,
    hasQuery: debounced.length >= 2,
  };
}
