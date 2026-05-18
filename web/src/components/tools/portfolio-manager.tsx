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
  /** Preço sugerido (ex.: última cotação vinda do terminal do ativo). */
  initialPrice?: number | null;
  initialQuantity?: number | null;
  initialAverageCost?: number | null;
  editingExisting?: boolean;
}) {
  const t = useTranslations("Portfolio");
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState(
    initialQuantity != null && Number.isFinite(initialQuantity)
      ? String(initialQuantity)
      : "100",
  );
  const [averageCost, setAverageCost] = useState(() => {
    if (initialAverageCost != null && Number.isFinite(initialAverageCost)) {
      return String(initialAverageCost);
    }
    if (initialPrice != null && Number.isFinite(initialPrice)) {
      return String(initialPrice);
    }
    return "25";
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
    const res = await fetch("/api/user/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: symbol.trim().toUpperCase(),
        quantity: Number(quantity),
        averageCost: Number(averageCost),
      }),
    });
    setPending(false);
    if (!res.ok) {
      setMessage(t("saveError"));
      return;
    }
    setMessage(t("saveSuccess"));
    window.location.reload();
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
              {pending ? t("saving") : t("saveCta")}
            </button>
            <Link
              href="/bolsa"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("browseMarket")}
            </Link>
            {message ? <p className="text-sm text-primary">{message}</p> : null}
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
