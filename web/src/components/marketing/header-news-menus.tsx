"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  WORLD_REGIONS,
  buildNewsHref,
  feedsForDesk,
  feedsForWorldRegion,
  type NewsWorldRegion,
} from "@/lib/market/news-feeds-config";
import { cn } from "@/lib/utils";

export { buildNewsHref as navNewsHref };

type HeaderNewsMenusProps = {
  navLinkClass: string;
  label: string;
  onNavigate?: () => void;
};

function WorldRegionFeedList({
  region,
  onNavigate,
}: {
  region: NewsWorldRegion;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const feeds = feedsForWorldRegion(region);

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cognitive">
        {t(`newsWorldRegion_${region}` as "newsWorldRegion_europe")}
      </p>
      <ul className="flex flex-col gap-0.5">
        {feeds.map((f, index) => (
          <li key={f.source}>
            <Link
              href={buildNewsHref({ mesa: "mundo", regiao: region, fonte: f.source })}
              prefetch={false}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              onClick={onNavigate}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              {f.source}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Desktop: Brasil + Mundo (por região). */
export function HeaderNewsNavDesktop({ navLinkClass, label }: HeaderNewsMenusProps) {
  const t = useTranslations("Nav");
  const feedBr = feedsForDesk("br");

  return (
    <div className="group/navnews relative" role="group" aria-label={label}>
      <div
        className={cn(
          "inline-flex cursor-default items-center gap-1 whitespace-nowrap",
          navLinkClass,
        )}
      >
        <Link
          href={buildNewsHref()}
          prefetch={false}
          className="text-inherit underline-offset-4 transition-colors hover:text-foreground"
        >
          {label}
        </Link>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground opacity-70 transition-transform duration-200 group-hover/navnews:rotate-180"
          aria-hidden
        />
      </div>

      <div className="absolute left-1/2 top-full z-[60] w-max min-w-[min(36rem,calc(100vw-4rem))] max-w-3xl -translate-x-1/2 pt-7 -mt-5 invisible opacity-0 translate-y-1 transition-[opacity,transform,visibility] duration-200 ease-out group-hover/navnews:visible group-hover/navnews:translate-y-0 group-hover/navnews:opacity-100">
        <div className="flex max-h-[min(85vh,32rem)] flex-col rounded-xl border border-white/[0.12] bg-[oklch(0.11_0.041_262/0.97)] px-5 py-4 shadow-[0_24px_80px_oklch(0_0_0/0.55)] backdrop-blur-xl">
          <div className="shrink-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t("newsChannelEyebrow")}
            </p>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              {t("newsChannelHint")}
            </p>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("newsDeskBr")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {feedBr.map((f, index) => (
                  <li key={f.source}>
                    <Link
                      href={buildNewsHref({ mesa: "br", fonte: f.source })}
                      prefetch={false}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {index + 1}
                      </span>
                      {f.source}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={buildNewsHref({ mesa: "br" })}
                prefetch={false}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                {t("newsDeskBrAll")}
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cognitive">
                {t("newsDeskMundo")}
              </p>
              <Link
                href={buildNewsHref({ mesa: "mundo" })}
                prefetch={false}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t("newsDeskMundoAll")}
              </Link>
            </div>
          </div>

          <div
            className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-ms-overflow-style:auto] [scrollbar-color:oklch(0.45_0.05_262)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
            aria-label={t("newsDeskMundo")}
          >
            <div className="grid gap-4 pb-1 sm:grid-cols-2 lg:grid-cols-3">
              {WORLD_REGIONS.map((region) => (
                <WorldRegionFeedList key={region} region={region} />
              ))}
            </div>
          </div>

          <div className="mt-3 shrink-0 border-t border-white/10 pt-3">
            <Link
              href={buildNewsHref()}
              prefetch={false}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("newsAllSources")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile drawer: mesas Brasil e Mundo. */
export function HeaderNewsNavMobile({ navLinkClass, label, onNavigate }: HeaderNewsMenusProps) {
  const t = useTranslations("Nav");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <Link
        href={buildNewsHref()}
        prefetch={false}
        className={cn(navLinkClass, "block rounded-lg px-3 py-2 after:hidden hover:bg-muted")}
        onClick={onNavigate}
      >
        {label}
      </Link>

      <p className="px-3 pt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">
        {t("newsDeskBr")}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 pb-3 pt-2">
        {feedsForDesk("br").map((f, index) => (
          <Link
            key={f.source}
            href={buildNewsHref({ mesa: "br", fonte: f.source })}
            prefetch={false}
            className="text-[13px] text-primary underline-offset-2 hover:underline"
            onClick={onNavigate}
          >
            {index + 1}. {f.source}
          </Link>
        ))}
      </div>

      <p className="px-3 pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-cognitive">
        {t("newsDeskMundo")}
      </p>
      {WORLD_REGIONS.map((region) => (
        <div key={region} className="px-3 pb-2 pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t(`newsWorldRegion_${region}` as "newsWorldRegion_europe")}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {feedsForWorldRegion(region).map((f, index) => (
              <Link
                key={f.source}
                href={buildNewsHref({ mesa: "mundo", regiao: region, fonte: f.source })}
                prefetch={false}
                className="text-[12px] text-primary underline-offset-2 hover:underline"
                onClick={onNavigate}
              >
                {index + 1}. {f.source}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
