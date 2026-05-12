"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function WatchlistToggleButton({
  symbol,
  initialSaved,
}: {
  symbol: string;
  initialSaved: boolean;
}) {
  const t = useTranslations("AssetTerminal");
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    setError(null);
    startTransition(() => {
      void mutateWatchlist();
    });
  }

  async function mutateWatchlist() {
    try {
      const res = await fetch("/api/user/watchlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) {
        throw new Error("watchlist_mutation_failed");
      }
      setSaved((prev) => !prev);
    } catch {
      setError(t("watchlistError"));
    }
  }

  const label = isPending
    ? saved
      ? t("watchlistRemoving")
      : t("watchlistSaving")
    : saved
      ? t("watchlistAdded")
      : t("watchlistAdd");

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={saved ? "secondary" : "outline"}
        size="lg"
        onClick={onToggle}
        disabled={isPending}
        className="min-w-[220px]"
      >
        {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        {label}
      </Button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
