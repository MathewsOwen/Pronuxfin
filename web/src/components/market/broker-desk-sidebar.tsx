"use client";

import { ExternalLink, ShieldCheck, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  getBrokerLiquidityLeaders,
  getBrokerTrustLeaders,
  resolveBrokerHref,
  type BrokerDeskEntry,
} from "@/lib/market/broker-desk-catalog";
import { formatRelativeTime } from "@/lib/market/time";
import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function TrustStars({ score }: { score: number }) {
  return (
    <span className="font-mono text-[10px] text-status-warning" aria-hidden>
      {"★".repeat(score)}
      <span className="text-white/20">{"★".repeat(Math.max(0, 5 - score))}</span>
    </span>
  );
}

function BrokerRow({
  entry,
  rank,
  showLiquidityRank,
}: {
  entry: BrokerDeskEntry;
  rank?: number;
  showLiquidityRank?: boolean;
}) {
  const t = useTranslations("BolsaHub.brokers");
  const name = t(`names.${entry.id}`);
  const href = resolveBrokerHref(entry);
  const hasAffiliate = href !== entry.siteUrl;

  return (
    <li className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {showLiquidityRank && rank != null ? (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                #{rank}
              </span>
            ) : null}
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TrustStars score={entry.trustScore} />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {entry.markets.map((m) => t(`market_${m}`)).join(" · ")}
            </span>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/15"
        >
          {hasAffiliate ? t("ctaAffiliate") : t("ctaSite")}
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </li>
  );
}

export function BrokerDeskSidebar({ className }: { className?: string }) {
  const t = useTranslations("BolsaHub.brokers");
  const locale = useLocale();
  const payload = useQuotesStream();
  const liquidity = getBrokerLiquidityLeaders(10);
  const trusted = getBrokerTrustLeaders();

  const syncLabel =
    payload.fetchedAt != null
      ? formatRelativeTime(new Date(payload.fetchedAt).toISOString(), locale)
      : t("syncPending");

  const isLive = payload.dataMode === "live" || payload.dataMode === "partial";

  return (
    <aside
      className={cn(
        "sticky top-[5.5rem] flex max-h-[calc(100vh-6.5rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/80 p-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] backdrop-blur-sm",
        className,
      )}
      aria-label={t("ariaLabel")}
    >
      <div className="space-y-2 border-b border-white/8 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          {isLive ? (
            <Badge className="border-status-live/30 bg-status-live/10 text-[9px] text-status-live">
              {t("livePulse")}
            </Badge>
          ) : null}
        </div>
        <h2 className="font-heading text-lg font-semibold leading-tight">{t("title")}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {t("syncLabel", { value: syncLabel })}
        </p>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="size-4 text-market-up" aria-hidden />
          <h3 className="text-sm font-semibold">{t("liquidityTitle")}</h3>
        </div>
        <ul className="space-y-2">
          {liquidity.map((entry) => (
            <BrokerRow
              key={entry.id}
              entry={entry}
              rank={entry.liquidityRank}
              showLiquidityRank
            />
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="size-4 text-cognitive" aria-hidden />
          <h3 className="text-sm font-semibold">{t("trustTitle")}</h3>
        </div>
        <ul className="space-y-2">
          {trusted.map((entry) => (
            <BrokerRow key={`trust-${entry.id}`} entry={entry} />
          ))}
        </ul>
      </section>

      <p className="mt-auto border-t border-white/8 pt-3 text-[10px] leading-relaxed text-muted-foreground">
        {t("disclaimer")}
      </p>
    </aside>
  );
}

/** Versão compacta para mobile — abaixo do hero da bolsa */
export function BrokerDeskSidebarMobile() {
  const t = useTranslations("BolsaHub.brokers");
  const liquidity = getBrokerLiquidityLeaders(5);

  return (
    <section
      className="xl:hidden rounded-2xl border border-white/10 bg-zinc-950/60 p-4"
      aria-label={t("ariaLabel")}
    >
      <h2 className="font-heading text-base font-semibold">{t("mobileTitle")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("mobileLead")}</p>
      <ul className="mt-3 space-y-2">
        {liquidity.map((entry) => (
          <BrokerRow
            key={entry.id}
            entry={entry}
            rank={entry.liquidityRank}
            showLiquidityRank
          />
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
