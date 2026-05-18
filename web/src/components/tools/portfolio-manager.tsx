"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import { cn } from "@/lib/utils";

export function PortfolioManager({
  initialSymbol = "",
  initialPrice,
  initialQuantity,
  initialAverageCost,
  editingExisting = false,
}: {
  initialSymbol?: string;
  initialPrice?: number | null;
  initialQuantity?: number | null;
  initialAverageCost?: number | null;
  editingExisting?: boolean;
}) {
  const t = useTranslations("Portfolio");
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

  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
    if (initialQuantity != null && Number.isFinite(initialQuantity)) {
      setQuantity(String(initialQuantity));
    }
    if (initialAverageCost != null && Number.isFinite(initialAverageCost)) {
      setAverageCost(String(initialAverageCost));
    } else if (initialPrice != null && Number.isFinite(initialPrice)) {
      setAverageCost(String(initialPrice));
    }
  }, [initialSymbol, initialPrice, initialQuantity, initialAverageCost]);

  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const qty = Number(quantity);
    const cost = Number(averageCost);
    if (!symbol.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost <= 0) {
      setPending(false);
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
      setMessage(data.message ?? t("saveError"));
      return;
    }
    setMessage(t("saveSuccess"));
    window.location.href = "/carteira";
  }

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <CardTitle className="font-heading">
          {editingExisting ? t("updateTitle") : t("addTitle")}
        </CardTitle>
        <CardDescription>
          {editingExisting ? t("updateSubtitle") : t("addSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">{t("symbol")}</Label>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="PETR4"
              className="mt-1.5 border-white/15 bg-black/20 font-mono"
              required
              readOnly={editingExisting}
              aria-readonly={editingExisting}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("quantity")}</Label>
            <Input
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
            <Label className="text-xs text-muted-foreground">{t("averageCost")}</Label>
            <Input
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
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
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
                className={cn(
                  "text-sm",
                  message === t("saveSuccess") ? "text-emerald-400" : "text-rose-400",
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
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(t("removeConfirm", { symbol }))) return;
    setPending(true);
    await fetch("/api/user/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    window.location.reload();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void remove()}
      className="text-xs text-muted-foreground hover:text-rose-400 disabled:opacity-50"
    >
      {pending ? t("removing") : t("remove")}
    </button>
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
