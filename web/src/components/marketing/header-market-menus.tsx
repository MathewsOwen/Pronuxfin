"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type HeaderMarketMenusProps = {
  navLinkClass: string;
  label: string;
  onNavigate?: () => void;
};

const EQUITIES_LINKS = [
  { href: "/bolsa#indices", key: "marketIndicesLink" },
  { href: "/bolsa#equities-sector-book", key: "marketEquitiesSectorsLink" },
] as const;

const CRYPTO_LINKS = [
  { href: "/bolsa#crypto-major-tape", key: "marketCryptoMajorsLink" },
  { href: "/bolsa#crypto-sector-book", key: "marketCryptoSectorsLink" },
] as const;

export function HeaderMarketNavDesktop({
  navLinkClass,
  label,
}: HeaderMarketMenusProps) {
  const t = useTranslations("Nav");

  return (
    <div className="group/navmarket relative" role="group" aria-label={label}>
      <div
        className={cn(
          "inline-flex cursor-default items-center gap-1 whitespace-nowrap",
          navLinkClass,
        )}
      >
        <Link
          href="/bolsa"
          prefetch={false}
          className="text-inherit underline-offset-4 transition-colors hover:text-foreground"
        >
          {label}
        </Link>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground opacity-70 transition-transform duration-200 group-hover/navmarket:rotate-180"
          aria-hidden
        />
      </div>

      <div className="invisible absolute left-1/2 top-full z-[60] w-max min-w-[min(24rem,calc(100vw-4rem))] max-w-2xl -translate-x-1/2 translate-y-1 pt-7 -mt-5 opacity-0 transition-[opacity,transform,visibility] duration-200 ease-out group-hover/navmarket:visible group-hover/navmarket:translate-y-0 group-hover/navmarket:opacity-100">
        <div className="rounded-xl border border-white/[0.12] bg-[oklch(0.11_0.041_262/0.97)] px-5 py-4 shadow-[0_24px_80px_oklch(0_0_0/0.55)] backdrop-blur-xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("marketDeskEyebrow")}
          </p>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
            {t("marketDeskHint")}
          </p>

          <div className="mt-4 grid gap-5 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("marketEquitiesLabel")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {EQUITIES_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("marketCryptoLabel")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {CRYPTO_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            <Link href="/bolsa" prefetch={false} className="text-xs font-medium text-primary hover:underline">
              {t("marketAllDesk")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeaderMarketNavMobile({
  navLinkClass,
  label,
  onNavigate,
}: HeaderMarketMenusProps) {
  const t = useTranslations("Nav");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <Link
        href="/bolsa"
        prefetch={false}
        className={cn(navLinkClass, "block rounded-lg px-3 py-2 after:hidden hover:bg-muted")}
        onClick={onNavigate}
      >
        {label}
      </Link>
      <div className="grid gap-3 px-3 pb-3 pt-2 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("marketEquitiesLabel")}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {EQUITIES_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="text-[13px] text-primary underline-offset-2 hover:underline"
                onClick={onNavigate}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("marketCryptoLabel")}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {CRYPTO_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="text-[13px] text-primary underline-offset-2 hover:underline"
                onClick={onNavigate}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
