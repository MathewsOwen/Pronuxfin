"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Radio } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { INDEX_PROXY_LABELS } from "@/lib/market/indices";
import type { QuoteSnapshot, QuotesPayload } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const HERO_SYMBOLS = ["BOVA11", "PETR4", "VALE3", "BTC"] as const;

export function HeroLiveDesk() {
  const t = useTranslations("HeroLive");
  const locale = useLocale();
  const [payload, setPayload] = useState<QuotesPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as QuotesPayload;
        if (!cancelled) setPayload(json);
      } catch {
        /* ignore */
      }
    }
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const rows = HERO_SYMBOLS.map((symbol) => {
    const equity = payload?.results?.find((q) => q.symbol === symbol);
    const crypto = payload?.crypto?.find((q) => q.symbol === symbol);
    return {
      symbol,
      label: INDEX_PROXY_LABELS[symbol] ?? equity?.shortName ?? crypto?.shortName ?? symbol,
      quote: equity ?? crypto ?? null,
    };
  });

  const live =
    payload != null &&
    payload.fetchedAt > 0 &&
    rows.some((r) => r.quote?.regularMarketPrice != null) &&
    !payload.simulated &&
    !payload.cryptoSimulated;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-lg lg:mx-0"
    >
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-amber-500/10 blur-2xl motion-reduce:hidden" />

      <div className="glass-panel card-shine glow-ring relative overflow-hidden rounded-[1.75rem] border-white/15 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] terminal-grid-bg" />

        <div
          className={cn(
            "absolute right-4 top-4 flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider",
            live
              ? "border-emerald-500/25 bg-emerald-950/40 text-emerald-400"
              : "border-amber-500/35 bg-amber-950/40 text-amber-200",
          )}
        >
          <Radio className="size-3" aria-hidden />
          {live ? t("badgeLive") : t("badgeSync")}
        </div>

        <p className="absolute left-4 top-4 max-w-[55%] font-mono text-[9px] leading-snug text-muted-foreground">
          {t("disclaimerCorner")}
        </p>

        <div className="relative mt-14 space-y-4 px-6 pb-6 pt-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("tapeTitle")}
          </p>

          <ul className="space-y-2">
            {rows.map((row) => (
              <QuoteRow key={row.symbol} row={row} locale={locale} />
            ))}
          </ul>

          <div className="rounded-xl border border-amber-500/15 bg-black/35 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-400/95">
              {t("cognitiveTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("cognitiveBody")}</p>
          </div>

          <Link
            href="/bolsa"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-primary hover:underline"
          >
            {t("ctaDesk")}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function QuoteRow({
  row,
  locale,
}: {
  row: { symbol: string; label: string; quote: QuoteSnapshot | null };
  locale: string;
}) {
  const q = row.quote;
  const pct = q?.regularMarketChangePercent;
  const up = pct != null && pct >= 0;

  const price =
    q?.regularMarketPrice != null
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: q.currency ?? "BRL",
          maximumFractionDigits: row.symbol === "BTC" ? 0 : 2,
        }).format(q.regularMarketPrice)
      : "—";

  const change =
    pct != null
      ? new Intl.NumberFormat(locale, {
          style: "percent",
          signDisplay: "exceptZero",
          maximumFractionDigits: 2,
        }).format(pct / 100)
      : null;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {row.label}
        </p>
        <p className="font-semibold text-foreground">{row.symbol}</p>
      </div>
      <div className="text-right">
        <p className="font-heading text-lg font-semibold tabular-nums tracking-tight">{price}</p>
        {change != null ? (
          <p
            className={cn(
              "font-mono text-[11px] font-medium",
              up ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {change}
          </p>
        ) : null}
      </div>
    </li>
  );
}
