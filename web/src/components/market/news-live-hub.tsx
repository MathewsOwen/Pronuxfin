"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSequentialInterval } from "@/hooks/use-sequential-interval";
import {
  ArrowUpRight,
  ExternalLink,
  Filter,
  Newspaper,
  Radio,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { NewsArticle } from "@/lib/market/types";
import { formatRelativeTime } from "@/lib/market/time";
import { NEWS_FEEDS } from "@/lib/market/news-feeds-config";
import { Badge } from "@/components/ui/badge";
import { EngagementSoftCta } from "@/components/market/engagement-soft-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RevealOnce } from "@/components/marketing/landing-reveal";

type NewsApiResponse = {
  ok: boolean;
  articles: NewsArticle[];
  fetchedAt: number;
  message?: string;
};

const EMPTY_ARTICLES: NewsArticle[] = [];

function ArticleAge({ iso }: { iso: string | null }) {
  const locale = useLocale();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = window.setInterval(() => rerender(), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums text-muted-foreground">{formatRelativeTime(iso, locale)}</span>
  );
}

function RegionBadge({ region }: { region?: NewsArticle["region"] }) {
  const t = useTranslations("NewsHub");
  if (!region) return null;
  const global = region === "global";
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        global
          ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25"
          : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
      )}
    >
      {global ? t("regionGlobal") : t("regionBr")}
    </span>
  );
}

export function NewsLiveHub({
  channelFilter = null,
}: {
  channelFilter?: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("NewsHub");
  const tf = useTranslations("NewsFilter");
  const [payload, setPayload] = useState<NewsApiResponse | null>(null);

  const pull = useCallback(async () => {
    const res = await fetch("/api/news", { cache: "no-store" });
    const json = (await res.json()) as NewsApiResponse;
    setPayload(json);
  }, []);

  useSequentialInterval(pull, 10_000);

  const articles = useMemo(
    () => payload?.articles ?? EMPTY_ARTICLES,
    [payload],
  );

  const validSources = useMemo(
    () => new Set(NEWS_FEEDS.map((f) => f.source)),
    [],
  );
  const trimmedFilter = channelFilter?.trim() ?? "";
  const filterUnknown = trimmedFilter !== "" && !validSources.has(trimmedFilter);
  const filterApplied = trimmedFilter !== "" && validSources.has(trimmedFilter);

  const visibleArticles = useMemo(() => {
    if (filterUnknown || !filterApplied) return articles;
    return articles.filter((a) => a.source === trimmedFilter);
  }, [articles, filterApplied, filterUnknown, trimmedFilter]);
  const visibleSourceCount = useMemo(
    () => new Set(visibleArticles.map((article) => article.source)).size,
    [visibleArticles],
  );
  const visibleBrCount = useMemo(
    () => visibleArticles.filter((article) => article.region !== "global").length,
    [visibleArticles],
  );
  const visibleGlobalCount = useMemo(
    () => visibleArticles.filter((article) => article.region === "global").length,
    [visibleArticles],
  );

  const hero = visibleArticles[0];
  const grid = visibleArticles.slice(1);

  const syncAge =
    payload?.fetchedAt != null
      ? formatRelativeTime(new Date(payload.fetchedAt).toISOString(), locale)
      : "—";

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <EngagementSoftCta />

      {filterUnknown ? (
        <div className="mb-8 flex flex-wrap items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/25 px-4 py-3 text-sm text-foreground">
          <XCircle className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p>{tf("unknownChannel")}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{trimmedFilter}</p>
          </div>
          <Link
            href="/noticias"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 shrink-0 border-white/15")}
          >
            {tf("clearFilter")}
          </Link>
        </div>
      ) : null}

      {filterApplied ? (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
            {trimmedFilter}
          </Badge>
          <span className="text-muted-foreground">{tf("filteringByLine")}</span>
          <Link
            href="/noticias"
            className="ml-auto text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {tf("clearFilter")}
          </Link>
        </div>
      ) : null}

      <header className="card-shine relative overflow-hidden rounded-3xl border border-amber-500/20 bg-zinc-950/45 p-8 sm:p-10 surface-rise">
        <div className="pointer-events-none absolute inset-0 opacity-[0.055] terminal-grid-bg" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-amber-500/12 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-4 border-l-[3px] border-amber-400/75 pl-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-400/95">
              {t("eyebrow")}
            </p>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/35 bg-amber-950/25 font-mono text-[10px] uppercase tracking-wider text-amber-200"
            >
              <Radio className="size-3.5" aria-hidden />
              {t("aggregationBadge")}
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {t("h1Lead")}{" "}
              <span className="text-gradient-brand">{t("h1Accent")}</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">{t("subtitle")}</p>
          </div>
          <div className="glass-panel card-shine flex w-full max-w-xl flex-col gap-3 rounded-2xl px-4 py-3 font-mono text-[11px] lg:w-auto lg:max-w-none">
            <div className="grid gap-2 sm:grid-cols-3">
              <NewsSignalCard
                label={t("syncLabel")}
                value={syncAge}
                accentClass="border-amber-500/25 bg-amber-950/18"
              />
              <NewsSignalCard
                label={t("signalSources")}
                value={String(visibleSourceCount)}
                accentClass="border-sky-500/25 bg-sky-950/18"
              />
              <NewsSignalCard
                label={t("signalArticles")}
                value={String(visibleArticles.length)}
                accentClass="border-teal-500/25 bg-teal-950/18"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
              <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200">
                {t("signalRegions", { br: visibleBrCount, global: visibleGlobalCount })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Filter className="size-3" aria-hidden />
                {filterApplied
                  ? t("signalFilter", { filter: trimmedFilter })
                  : t("filterAll")}
              </span>
              {!payload?.ok ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">
                  {payload?.message}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {hero ? (
        <RevealOnce className="glass-panel glow-ring card-shine relative mt-10 overflow-hidden rounded-3xl border-white/12 p-8 sm:p-10 surface-rise">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{hero.source}</Badge>
            <RegionBadge region={hero.region} />
            <ArticleAge iso={hero.publishedAt} />
          </div>
          <h2 className="font-heading mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            <a
              href={hero.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-start gap-2 transition-colors hover:text-primary"
            >
              {hero.title}
              <ArrowUpRight className="mt-1 size-5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
            </a>
          </h2>
          {hero.summary ? (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {hero.summary}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={hero.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "sm" }), "gap-2 glow-ring h-9")}
            >
              {t("readFull")}
              <ExternalLink className="size-3.5" />
            </a>
            <Link
              href="/bolsa"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 border-white/15 bg-transparent",
              )}
            >
              {t("viewDesk")}
            </Link>
          </div>
        </RevealOnce>
      ) : (
        <div className="glass-panel surface-rise mt-10 rounded-3xl border-dashed border-white/15 p-12 text-center text-muted-foreground">
          <Newspaper className="mx-auto size-10 opacity-40" />
          <p className="mt-4">
            {filterApplied && trimmedFilter ? (
              <>{tf("noHeadlinesChannel", { channel: trimmedFilter })}</>
            ) : (
              <>{t("loadingHint")}</>
            )}
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((article) => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel card-shine surface-rise group flex flex-col rounded-2xl border-white/10 p-5 transition-[border-color,box-shadow] hover:border-primary/25"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {article.source}
              </span>
              <RegionBadge region={article.region} />
              <ArticleAge iso={article.publishedAt} />
            </div>
            <p className="font-heading mt-3 flex-1 text-base font-medium leading-snug tracking-tight group-hover:text-primary">
              {article.title}{" "}
              <ExternalLink className="inline size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
            </p>
            {article.summary ? (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {article.summary}
              </p>
            ) : null}
          </a>
        ))}
      </div>

      <p className="mx-auto mt-14 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("editorialFoot")}
      </p>
    </div>
  );
}

function NewsSignalCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]",
        accentClass,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
