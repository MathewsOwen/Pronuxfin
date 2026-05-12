"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NEWS_FEEDS } from "@/lib/market/news-feeds-config";
import { cn } from "@/lib/utils";

export function navNewsHref(fonte?: string) {
  if (!fonte) return "/noticias";
  const q = new URLSearchParams({ fonte });
  return `/noticias?${q.toString()}`;
}

type HeaderNewsMenusProps = {
  navLinkClass: string;
  label: string;
  onNavigate?: () => void;
};

const feedBr = NEWS_FEEDS.filter((f) => f.region === "br");
const feedGlobal = NEWS_FEEDS.filter((f) => f.region === "global");

/** Desktop: ao passar o mouse, abre barra por canal de informação. */
export function HeaderNewsNavDesktop({ navLinkClass, label }: HeaderNewsMenusProps) {
  const t = useTranslations("Nav");

  return (
    <div className="group/navnews relative" role="group" aria-label={label}>
      <div
        className={cn(
          "inline-flex cursor-default items-center gap-1 whitespace-nowrap",
          navLinkClass,
        )}
      >
        <Link
          href="/noticias"
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

      {/* pt + margem negativa = ponte só no hover entre item e cartão */}
      <div className="absolute left-1/2 top-full z-[60] w-max min-w-[min(22rem,calc(100vw-4rem))] max-w-xl -translate-x-1/2 pt-7 -mt-5 invisible opacity-0 translate-y-1 transition-[opacity,transform,visibility] duration-200 ease-out group-hover/navnews:visible group-hover/navnews:translate-y-0 group-hover/navnews:opacity-100">
        <div className="rounded-xl border border-white/[0.12] bg-[oklch(0.11_0.041_262/0.97)] px-5 py-4 shadow-[0_24px_80px_oklch(0_0_0/0.55)] backdrop-blur-xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/90">
            {t("newsChannelEyebrow")}
          </p>
          <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
            {t("newsChannelHint")}
          </p>

          <div className="mt-4 grid gap-5 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("newsBrLabel")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {feedBr.map((f) => (
                  <li key={f.source}>
                    <Link
                      href={navNewsHref(f.source)}
                      prefetch={false}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      {f.source}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("newsGlobalLabel")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {feedGlobal.map((f) => (
                  <li key={f.source}>
                    <Link
                      href={navNewsHref(f.source)}
                      prefetch={false}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      {f.source}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            <Link href="/noticias" prefetch={false} className="text-xs font-medium text-primary hover:underline">
              {t("newsAllSources")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile drawer: lista de canais sempre visível abaixo de Notícias. */
export function HeaderNewsNavMobile({ navLinkClass, label, onNavigate }: HeaderNewsMenusProps) {
  const t = useTranslations("Nav");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <Link
        href="/noticias"
        prefetch={false}
        className={cn(navLinkClass, "block rounded-lg px-3 py-2 after:hidden hover:bg-muted")}
        onClick={onNavigate}
      >
        {label}
      </Link>
      <p className="px-3 pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-400/90">
        {t("newsChannelEyebrow")}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 pb-3 pt-2">
        {NEWS_FEEDS.map((f) => (
          <Link
            key={f.source}
            href={navNewsHref(f.source)}
            prefetch={false}
            className="text-[13px] text-primary underline-offset-2 hover:underline"
            onClick={onNavigate}
          >
            {f.source}
          </Link>
        ))}
      </div>
    </div>
  );
}
