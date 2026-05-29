"use client";

import { useEffect, useRef } from "react";

import type { WatchlistRadarSignal } from "@/lib/user-watchlist/intelligence";
import { apiMutation } from "@/lib/http/api-mutation-fetch";

export function WatchlistSignalSync({
  items,
}: {
  items: Array<{
    symbol: string;
    signal: WatchlistRadarSignal;
  }>;
}) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current || items.length === 0) return;
    sentRef.current = true;

    void apiMutation("/api/user/watchlist/signals", {
      method: "POST",
      body: JSON.stringify({
        signals: items.map((item) => ({
          symbol: item.symbol,
          priority: item.signal.priority,
          attentionLevel: item.signal.attentionLevel,
          newsCount: item.signal.newsCount,
          moveAbs: item.signal.moveAbs,
          rangeProgress: item.signal.rangeProgress,
          reasons: item.signal.reasons,
        })),
      }),
    }).catch(() => undefined);
  }, [items]);

  return null;
}
