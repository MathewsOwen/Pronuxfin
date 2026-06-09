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
import {
  NEWS_FEEDS,
  WORLD_REGIONS,
  buildNewsHref,
  feedsForWorldRegion,
  isNewsDesk,
  isNewsWorldRegion,
  type NewsDesk,
  type NewsWorldRegion,
} from "@/lib/market/news-feeds-config";
import { Badge } from "@/components/ui/badge";
import { EngagementSoftCta } from "@/components/market/engagement-soft-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RevealOnce } from "@/components/marketing/landing-reveal";

type NewsSourceStatus = {
  source: string;
  region?: NewsArticle["region"];
  ok: boolean;
  count: number;
  error?: string;
};

type NewsApiResponse = {
  ok: boolean;
  articles?: NewsArticle[];
  fetchedAt?: number;
  message?: string;
  error?: string;
  feedsSucceeded?: number;
  feedsAttempted?: number;
  degraded?: boolean;
  sources?: NewsSourceStatus[];
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

function WorldRegionBadge({ worldRegion }: { worldRegion?: NewsArticle["worldRegion"] }) {
  const t = useTranslations("NewsHub");
  if (!worldRegion) return null;
  return (
    <span className="rounded-md bg-cognitive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cognitive ring-1 ring-cognitive/25">
      {t(`worldRegion_${worldRegion}` as "worldRegion_europe")}
    </span>
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
          ? "bg-status-live/15 text-cognitive ring-1 ring-status-live/25"
          : "bg-status-warning/15 text-status-warning ring-1 ring-status-warning/25",
      )}
    >
      {global ? t("regionGlobal") : t("regionBr")}
    </span>
  );
}

export function NewsLiveHub({
  initialDesk = null,
  initialChannel = null,
  initialRegion = null,
}: {
  initialDesk?: NewsDesk | null;
  initialChannel?: string | null;
  initialRegion?: NewsWorldRegion | null;
}) {
  const locale = useLocale();
  const t = useTranslations("NewsHub");
  const tf = useTranslations("NewsFilter");
  const [payload, setPayload] = useState<NewsApiResponse | null>(null);
  const [deskFilter, setDeskFilter] = useState<NewsDesk | null>(initialDesk);
  const [channelFilter, setChannelFilter] = useState<string | null>(initialChannel);
  const [regionFilter, setRegionFilter] = useState<NewsWorldRegion | null>(initialRegion);
  const [prevInitialDesk, setPrevInitialDesk] = useState(initialDesk);
  const [prevInitialChannel, setPrevInitialChannel] = useState(initialChannel);
  const [prevInitialRegion, setPrevInitialRegion] = useState(initialRegion);

  if (initialDesk !== prevInitialDesk) {
    setPrevInitialDesk(initialDesk);
    setDeskFilter(initialDesk);
  }
  if (initialChannel !== prevInitialChannel) {
    setPrevInitialChannel(initialChannel);
    setChannelFilter(initialChannel);
  }
  if (initialRegion !== prevInitialRegion) {
    setPrevInitialRegion(initialRegion);
    setRegionFilter(initialRegion);
  }

  const syncNewsUrl = useCallback(
    (opts?: { mesa?: NewsDesk; fonte?: string; regiao?: NewsWorldRegion }) => {
      const href = buildNewsHref(opts);
      const path = `/${locale}${href}`;
      window.history.replaceState(null, "", path);
    },
    [locale],
  );

  const selectDesk = useCallback(
    (desk: NewsDesk | null) => {
      setDeskFilter(desk);
      setRegionFilter(null);
      setChannelFilter(null);
      syncNewsUrl(desk ? { mesa: desk } : undefined);
    },
    [syncNewsUrl],
  );

  const pull = useCallback(async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const json = (await res.json()) as NewsApiResponse;
      if (res.status === 429) {
        setPayload({
          ok: false,
          articles: [],
          fetchedAt: Date.now(),
          message: json.error === "rate_limited" ? t("rateLimited") : t("fetchError"),
        });
        return;
      }
      setPayload({
        ok: json.ok !== false,
        articles: json.articles ?? [],
        fetchedAt: json.fetchedAt ?? Date.now(),
        message: json.message,
        feedsSucceeded: json.feedsSucceeded,
        feedsAttempted: json.feedsAttempted,
        degraded: json.degraded,
        sources: json.sources,
      });
    } catch {
      setPayload({
        ok: false,
        articles: [],
        fetchedAt: Date.now(),
        message: t("fetchError"),
      });
    }
  }, [t]);

  useSequentialInterval(pull, 30_000);

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
  const deskApplied = deskFilter != null && isNewsDesk(deskFilter);
  const regionApplied = regionFilter != null && isNewsWorldRegion(regionFilter);

  const visibleArticles = useMemo(() => {
    let list = articles;
    if (deskApplied) {
      list = list.filter((a) => a.desk === deskFilter);
    }
    if (regionApplied) {
      list = list.filter((a) => a.worldRegion === regionFilter);
    }
    if (filterUnknown || !filterApplied) return list;
    return list.filter((a) => a.source === trimmedFilter);
  }, [
    articles,
    deskApplied,
    deskFilter,
    filterApplied,
    filterUnknown,
    regionApplied,
    regionFilter,
    trimmedFilter,
  ]);
  const selectedSourceOffline = useMemo(
    () =>
      filterApplied
        ? payload?.sources?.some(
            (s) => s.source === trimmedFilter && s.ok === false,
          ) ?? false
        : false,
    [filterApplied, payload, trimmedFilter],
  );
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
  const showRegionalLayout = deskFilter === "mundo" && !filterApplied;
  const regionsToShow = regionApplied
    ? WORLD_REGIONS.filter((r) => r === regionFilter)
    : WORLD_REGIONS;

  const syncAge =
    payload?.fetchedAt != null
      ? formatRelativeTime(new Date(payload.fetchedAt).toISOString(), locale)
      : "—";

  const deskLabel = deskApplied
    ? deskFilter === "br"
      ? t("deskBr")
      : t("deskMundo")
    : null;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <EngagementSoftCta />

      <nav
        aria-label={t("deskNavAria")}
        className="mb-8 flex flex-wrap gap-2"
      >
        <button
          type="button"
          onClick={() => selectDesk(null)}
          className={cn(
            buttonVariants({ variant: deskApplied ? "outline" : "default", size: "sm" }),
            "h-8 border-white/15",
          )}
        >
          {t("deskAll")}
        </button>
        <button
          type="button"
          onClick={() => selectDesk("br")}
          className={cn(
            buttonVariants({
              variant: deskFilter === "br" ? "default" : "outline",
              size: "sm",
            }),
            "h-8 border-white/15",
          )}
        >
          {t("deskBr")}
        </button>
        <button
          type="button"
          onClick={() => selectDesk("mundo")}
          className={cn(
            buttonVariants({
              variant: deskFilter === "mundo" ? "default" : "outline",
              size: "sm",
            }),
            "h-8 border-white/15",
          )}
        >
          {t("deskMundo")}
        </button>
      </nav>

      {deskApplied ? (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-cognitive/25 bg-cognitive/5 px-4 py-3 text-sm">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
            {deskLabel}
          </Badge>
          <span className="text-muted-foreground">
            {deskFilter === "br" ? t("deskBrLead") : t("deskMundoLead")}
          </span>
          <button
            type="button"
            onClick={() => {
              setChannelFilter(null);
              syncNewsUrl(deskApplied ? { mesa: deskFilter! } : undefined);
            }}
            className="ml-auto text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {t("clearDeskOnly")}
          </button>
        </div>
      ) : null}

      {filterUnknown ? (
        <div className="mb-8 flex flex-wrap items-start gap-3 rounded-2xl border border-status-degraded/30 bg-status-degraded/10 px-4 py-3 text-sm text-foreground">
          <XCircle className="mt-0.5 size-5 shrink-0 text-market-down" aria-hidden />
          <div className="min-w-0 flex-1">
            <p>{tf("unknownChannel")}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{trimmedFilter}</p>
          </div>
          <Link
            href={buildNewsHref(deskApplied ? { mesa: deskFilter! } : undefined)}
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
            href={buildNewsHref(deskApplied ? { mesa: deskFilter! } : undefined)}
            className="ml-auto text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {tf("clearFilter")}
          </Link>
        </div>
      ) : null}

      <header className="card-shine relative overflow-hidden rounded-3xl border border-border bg-zinc-950/45 p-8 sm:p-10 surface-rise">
        <div className="pointer-events-none absolute inset-0 opacity-[0.055] terminal-grid-bg" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-status-warning/12 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-4 border-l-[3px] border-primary/40 pl-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {t("eyebrow")}
            </p>
            <Badge
              variant="outline"
              className="gap-1 border-primary/25 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-status-warning"
            >
              <Radio className="size-3.5" aria-hidden />
              {t("aggregationBadge")}
            </Badge>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {deskFilter === "br" ? (
                <>
                  {t("h1LeadBr")}{" "}
                  <span className="text-gradient-brand">{t("h1AccentBr")}</span>
                </>
              ) : deskFilter === "mundo" ? (
                <>
                  {t("h1LeadMundo")}{" "}
                  <span className="text-gradient-brand">{t("h1AccentMundo")}</span>
                </>
              ) : (
                <>
                  {t("h1Lead")}{" "}
                  <span className="text-gradient-brand">{t("h1Accent")}</span>
                </>
              )}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {deskFilter === "br"
                ? t("subtitleBr")
                : deskFilter === "mundo"
                  ? t("subtitleMundo")
                  : t("subtitle")}
            </p>
          </div>
          <div className="glass-panel card-shine flex w-full max-w-xl flex-col gap-3 rounded-2xl px-4 py-3 font-mono text-[11px] lg:w-auto lg:max-w-none">
            <div className="grid gap-2 sm:grid-cols-3">
              <NewsSignalCard
                label={t("syncLabel")}
                value={syncAge}
                accentClass="border-primary/20 bg-primary/8"
              />
              <NewsSignalCard
                label={t("signalSources")}
                value={String(visibleSourceCount)}
                accentClass="border-cognitive/25 bg-cognitive/10"
              />
              <NewsSignalCard
                label={t("signalArticles")}
                value={String(visibleArticles.length)}
                accentClass="border-teal-500/25 bg-teal-950/18"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
              <span className="rounded-full border border-border bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-status-warning">
                {t("signalRegions", { br: visibleBrCount, global: visibleGlobalCount })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Filter className="size-3" aria-hidden />
                {filterApplied
                  ? t("signalFilter", { filter: trimmedFilter })
                  : deskApplied
                    ? t("signalDesk", { desk: deskLabel ?? "" })
                    : t("filterAll")}
              </span>
              {!payload?.ok ? (
                <span className="rounded-full border border-border bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-status-warning">
                  {payload?.message}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {showRegionalLayout ? (
        <div className="mt-10 space-y-12">
          {regionsToShow.map((region) => {
            const feeds = feedsForWorldRegion(region);
            const regionArticles = visibleArticles.filter(
              (article) => article.worldRegion === region,
            );
            return (
              <section
                key={region}
                id={`regiao-${region}`}
                className="glass-panel surface-rise rounded-3xl border-white/10 p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                  <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                    {t(`worldRegion_${region}` as "worldRegion_europe")}
                  </h2>
                  <Link
                    href={buildNewsHref({ mesa: "mundo", regiao: region })}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t("worldRegionViewAll")}
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feeds.map((feed, index) => (
                    <Link
                      key={feed.source}
                      href={buildNewsHref({
                        mesa: "mundo",
                        regiao: region,
                        fonte: feed.source,
                      })}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 gap-2 border-white/15 bg-white/[0.03] font-normal",
                      )}
                    >
                      <span className="flex size-5 items-center justify-center rounded-md bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {index + 1}
                      </span>
                      {feed.source}
                    </Link>
                  ))}
                </div>
                {regionArticles.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {regionArticles.slice(0, 6).map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">{t("worldRegionEmpty")}</p>
                )}
              </section>
            );
          })}
        </div>
      ) : hero ? (
        <RevealOnce className="glass-panel glow-ring card-shine relative mt-10 overflow-hidden rounded-3xl border-white/12 p-8 sm:p-10 surface-rise">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{hero.source}</Badge>
            <RegionBadge region={hero.region} />
            <WorldRegionBadge worldRegion={hero.worldRegion} />
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
              selectedSourceOffline ? (
                <>{tf("sourceOffline", { channel: trimmedFilter })}</>
              ) : (
                <>{tf("noHeadlinesChannel", { channel: trimmedFilter })}</>
              )
            ) : payload === null ? (
              <>{t("loadingHint")}</>
            ) : !payload.ok ? (
              <>{payload.message ?? t("fetchError")}</>
            ) : (
              <>
                {payload.message ?? t("emptyFeed")}
                {payload.feedsAttempted != null ? (
                  <span className="mt-2 block font-mono text-[11px] text-muted-foreground/80">
                    {t("feedsStatus", {
                      ok: payload.feedsSucceeded ?? 0,
                      total: payload.feedsAttempted,
                    })}
                  </span>
                ) : null}
              </>
            )}
          </p>
        </div>
      )}

      {!showRegionalLayout && grid.length > 0 ? (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      <p className="mx-auto mt-14 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("editorialFoot")}
      </p>
    </div>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a
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
        <WorldRegionBadge worldRegion={article.worldRegion} />
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
