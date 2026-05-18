"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
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
import { PortfolioLiveMarketPanel } from "@/components/tools/portfolio-live-market-panel";
import type { QuoteSnapshot } from "@/lib/market/types";
import { cn } from "@/lib/utils";

export function PortfolioManager({
  initialSymbol = "",
  initialPrice,
  initialQuantity,
  initialAverageCost,
  editingExisting = false,
  isFirstPosition = false,
}: {
  initialSymbol?: string;
  initialPrice?: number | null;
  initialQuantity?: number | null;
  initialAverageCost?: number | null;
  editingExisting?: boolean;
  isFirstPosition?: boolean;
}) {
  const t = useTranslations("Portfolio");
  const router = useRouter();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState(() =>
    initialQuantity != null && Number.isFinite(initialQuantity)
      ? String(initialQuantity)
      : "",
  );
  const [averageCost, setAverageCost] = useState(() => {
    if (initialAverageCost != null && Number.isFinite(initialAverageCost)) {
      return String(initialAverageCost);
    }
    if (initialPrice != null && Number.isFinite(initialPrice)) {
      return String(initialPrice);
    }
    return "";
  });

  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [pending, setPending] = useState(false);

  const handleSelectSymbol = useCallback((quote: QuoteSnapshot) => {
    setSymbol(quote.symbol);
  }, []);

  const handleUseLivePrice = useCallback((price: number) => {
    setAverageCost(String(price));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const qty = Number(quantity);
    const cost = Number(averageCost);
    if (!symbol.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost <= 0) {
      setPending(false);
      setMessageTone("error");
      setMessage(t("saveError"));
      return;
    }
    const res = await fetch("/api/user/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: symbol.trim().toUpperCase(),
        quantity: qty,
        averageCost: cost,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setMessageTone("error");
      setMessage(data.message ?? t("saveError"));
      return;
    }
    setMessageTone("success");
    setMessage(isFirstPosition ? t("saveFirstSuccess") : t("saveSuccess"));
    router.push("/carteira");
    router.refresh();
  }

  return (
    <Card
      id="portfolio-add-form"
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">
          {editingExisting
            ? t("updateTitle")
            : isFirstPosition
              ? t("firstAddTitle")
              : t("addTitle")}
        </CardTitle>
        <CardDescription>
          {editingExisting
            ? t("updateSubtitle")
            : isFirstPosition
              ? t("firstAddSubtitle")
              : t("addSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PortfolioLiveMarketPanel
          symbol={symbol}
          onSelectSymbol={handleSelectSymbol}
          onUseLivePrice={handleUseLivePrice}
        />
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="portfolio-symbol" className="text-xs text-muted-foreground">
              {t("symbol")}
            </Label>
            <Input
              id="portfolio-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder={t("symbolPlaceholder")}
              className="mt-1.5 border-white/15 bg-black/20 font-mono"
              required
              readOnly={editingExisting}
              aria-readonly={editingExisting}
            />
          </div>
          <div>
            <Label htmlFor="portfolio-quantity" className="text-xs text-muted-foreground">
              {t("quantity")}
            </Label>
            <Input
              id="portfolio-quantity"
              type="number"
              min="0.0001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="mt-1.5 border-white/15 bg-black/20"
              required
            />
          </div>
          <div>
            <Label htmlFor="portfolio-average-cost" className="text-xs text-muted-foreground">
              {t("averageCost")}
            </Label>
            <Input
              id="portfolio-average-cost"
              type="number"
              min="0.0001"
              step="any"
              value={averageCost}
              onChange={(e) => setAverageCost(e.target.value)}
              placeholder="0"
              className="mt-1.5 border-white/15 bg-black/20"
              required
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className={cn(buttonVariants({ size: "sm" }), pending && "opacity-60")}
            >
              {pending ? t("saving") : editingExisting ? t("updateCta") : t("saveCta")}
            </button>
            <Link
              href="/bolsa"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("browseMarket")}
            </Link>
            {message ? (
              <p
                role={messageTone === "error" ? "alert" : "status"}
                aria-live="polite"
                className={cn(
                  "text-sm",
                  messageTone === "success" ? "text-market-up" : "text-market-down",
                )}
              >
                {message}
              </p>
            ) : null}
          </div>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}

export function PortfolioRemoveButton({ symbol }: { symbol: string }) {
  const t = useTranslations("Portfolio");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(t("removeConfirm", { symbol }))) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/user/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("removeError"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void remove()}
        className="text-xs text-muted-foreground hover:text-market-down disabled:opacity-50"
      >
        {pending ? t("removing") : t("remove")}
      </button>
      {error ? (
        <p className="text-[10px] text-market-down" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PortfolioEditLink({
  symbol,
  quantity,
  averageCost,
}: {
  symbol: string;
  quantity: number;
  averageCost: number;
}) {
  const t = useTranslations("Portfolio");
  const params = new URLSearchParams({
    symbol,
    quantity: String(quantity),
    averageCost: String(averageCost),
  });
  return (
    <Link
      href={`/carteira?${params.toString()}`}
      className="text-xs font-medium text-primary hover:underline"
    >
      {t("edit")}
    </Link>
  );
}
