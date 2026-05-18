"use client";

import { Layers, Loader2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import {
  collectDeskQuotes,
  findDeskQuote,
} from "@/lib/market/portfolio-live-search";
import type { QuoteSnapshot } from "@/lib/market/types";
import { parseSymbolsInput } from "@/lib/user-portfolio/parse-symbols-input";
import { cn } from "@/lib/utils";

type DraftRow = {
  symbol: string;
  quantity: string;
  averageCost: string;
  shortName?: string;
  livePrice?: number | null;
};

function emptyRow(symbol: string, quote?: QuoteSnapshot): DraftRow {
  return {
    symbol,
    quantity: "1",
    averageCost:
      quote?.regularMarketPrice != null && Number.isFinite(quote.regularMarketPrice)
        ? String(quote.regularMarketPrice)
        : "",
    shortName: quote?.shortName,
    livePrice: quote?.regularMarketPrice ?? null,
  };
}

export function PortfolioBulkAddPanel({
  watchlistSymbols,
  existingSymbols,
}: {
  watchlistSymbols: string[];
  existingSymbols: string[];
}) {
  const t = useTranslations("Portfolio");
  const locale = useLocale();
  const router = useRouter();
  const deskPayload = useQuotesStream();
  const deskQuotes = useMemo(() => collectDeskQuotes(deskPayload), [deskPayload]);

  const existingSet = useMemo(() => new Set(existingSymbols), [existingSymbols]);
  const watchlistAvailable = useMemo(
    () => watchlistSymbols.filter((s) => !existingSet.has(s)),
    [watchlistSymbols, existingSet],
  );

  const [selectedWatchlist, setSelectedWatchlist] = useState<Set<string>>(() => new Set());
  const [pasteInput, setPasteInput] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [quotesPending, setQuotesPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  function toggleWatchlist(symbol: string) {
    setSelectedWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  function mergeRows(incoming: DraftRow[]) {
    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.symbol, r]));
      for (const row of incoming) {
        if (existingSet.has(row.symbol)) continue;
        map.set(row.symbol, row);
      }
      return [...map.values()].slice(0, 20);
    });
  }

  function addFromWatchlist() {
    const incoming = [...selectedWatchlist].map((symbol) => {
      const quote = findDeskQuote(deskQuotes, symbol);
      return emptyRow(symbol, quote);
    });
    mergeRows(incoming);
    setSelectedWatchlist(new Set());
  }

  function addFromPaste() {
    const symbols = parseSymbolsInput(pasteInput);
    const incoming = symbols.map((symbol) => {
      const quote = findDeskQuote(deskQuotes, symbol);
      return emptyRow(symbol, quote);
    });
    mergeRows(incoming);
    setPasteInput("");
  }

  async function loadLiveQuotes() {
    if (rows.length === 0) return;
    setQuotesPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/quotes/lookup/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: rows.map((r) => r.symbol) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        results?: Array<{ symbol: string; quote: QuoteSnapshot | null }>;
      };
      if (!res.ok || !data.ok || !data.results) {
        setMessageTone("error");
        setMessage(t("bulkQuotesError"));
        return;
      }
      const bySymbol = new Map(data.results.map((r) => [r.symbol, r.quote]));
      setRows((prev) =>
        prev.map((row) => {
          const quote = bySymbol.get(row.symbol) ?? findDeskQuote(deskQuotes, row.symbol);
          if (!quote?.regularMarketPrice) return row;
          return {
            ...row,
            shortName: quote.shortName ?? row.shortName,
            livePrice: quote.regularMarketPrice,
            averageCost: row.averageCost || String(quote.regularMarketPrice),
          };
        }),
      );
    } catch {
      setMessageTone("error");
      setMessage(t("bulkQuotesError"));
    } finally {
      setQuotesPending(false);
    }
  }

  async function saveAll() {
    setSavePending(true);
    setMessage(null);
    const positions = rows
      .map((row) => ({
        symbol: row.symbol,
        quantity: Number(row.quantity),
        averageCost: Number(row.averageCost),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.quantity) &&
          row.quantity > 0 &&
          Number.isFinite(row.averageCost) &&
          row.averageCost > 0,
      );

    if (positions.length === 0) {
      setSavePending(false);
      setMessageTone("error");
      setMessage(t("bulkSaveEmpty"));
      return;
    }

    try {
      const res = await fetch("/api/user/portfolio/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        saved?: string[];
        failed?: Array<{ symbol: string; reason: string }>;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setMessageTone("error");
        setMessage(data.message ?? t("bulkSaveError"));
        return;
      }
      const saved = data.saved?.length ?? 0;
      const failed = data.failed?.length ?? 0;
      if (saved === 0) {
        setMessageTone("error");
        setMessage(t("bulkSaveError"));
        return;
      }
      setMessageTone("success");
      setMessage(
        failed > 0
          ? t("bulkSavePartial", { saved: String(saved), failed: String(failed) })
          : t("bulkSaveSuccess", { saved: String(saved) }),
      );
      setRows((prev) => prev.filter((row) => data.failed?.some((f) => f.symbol === row.symbol)));
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage(t("bulkSaveError"));
    } finally {
      setSavePending(false);
    }
  }

  function updateRow(symbol: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.symbol === symbol ? { ...row, ...patch } : row)));
  }

  function removeRow(symbol: string) {
    setRows((prev) => prev.filter((row) => row.symbol !== symbol));
  }

  const money = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return String(value);
    }
  };

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cognitive/25 bg-cognitive/10">
            <Layers className="size-4 text-cognitive" aria-hidden />
          </span>
          <div>
            <CardTitle className="font-heading">{t("bulkTitle")}</CardTitle>
            <CardDescription>{t("bulkSubtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {watchlistAvailable.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t("bulkWatchlistTitle")}</p>
            <ul className="flex flex-wrap gap-2">
              {watchlistAvailable.map((symbol) => (
                <li key={symbol}>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(symbol)}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                      selectedWatchlist.has(symbol)
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-white/15 bg-white/[0.03] text-muted-foreground hover:border-white/25",
                    )}
                  >
                    {symbol}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={selectedWatchlist.size === 0}
              onClick={addFromWatchlist}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-3.5" />
              {t("bulkAddSelected")}
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="bulk-paste" className="text-sm">
            {t("bulkPasteLabel")}
          </Label>
          <textarea
            id="bulk-paste"
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value.toUpperCase())}
            placeholder={t("bulkPastePlaceholder")}
            rows={2}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            onClick={addFromPaste}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("bulkAddPaste")}
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={quotesPending}
                onClick={() => void loadLiveQuotes()}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {quotesPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                {t("bulkLoadQuotes")}
              </button>
              <button
                type="button"
                disabled={savePending}
                onClick={() => void saveAll()}
                className={cn(buttonVariants({ size: "sm" }), "glow-ring")}
              >
                {savePending ? t("bulkSaving") : t("bulkSaveAll")}
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">{t("colAsset")}</th>
                    <th className="px-3 py-2">{t("bulkLivePrice")}</th>
                    <th className="px-3 py-2">{t("colQty")}</th>
                    <th className="px-3 py-2">{t("averageCost")}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.symbol} className="border-b border-white/5">
                      <td className="px-3 py-2">
                        <p className="font-mono font-medium">{row.symbol}</p>
                        {row.shortName ? (
                          <p className="text-xs text-muted-foreground">{row.shortName}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {money(row.livePrice)}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.symbol, { quantity: e.target.value })}
                          className="h-8 border-white/15 bg-black/20"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={row.averageCost}
                          onChange={(e) => updateRow(row.symbol, { averageCost: e.target.value })}
                          className="h-8 border-white/15 bg-black/20"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.symbol)}
                          className="text-xs text-muted-foreground hover:text-market-down"
                        >
                          {t("bulkRemoveRow")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("bulkEmptyDraft")}</p>
        )}

        {message ? (
          <p
            role={messageTone === "error" ? "alert" : "status"}
            className={cn(
              "text-sm",
              messageTone === "success" ? "text-market-up" : "text-market-down",
            )}
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
