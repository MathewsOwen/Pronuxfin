import { Bookmark, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function PortfolioEmptyDeskCallout({
  watchlistCount,
}: {
  watchlistCount: number;
}) {
  const t = await getTranslations("Dashboard");

  return (
    <section
      className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,oklch(0.16_0.03_258),oklch(0.14_0.02_258))] px-5 py-6 md:px-7"
      aria-labelledby="portfolio-empty-desk-title"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-status-live/25 bg-status-live/10">
            <Wallet className="size-5 text-market-up" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-market-up/90">
              {t("portfolioEmptyEyebrow")}
            </p>
            <h2
              id="portfolio-empty-desk-title"
              className="font-heading mt-1 text-lg font-semibold tracking-tight"
            >
              {t("portfolioEmptyTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("portfolioEmptyLead")}
            </p>
            {watchlistCount > 0 ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Bookmark className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                {t("portfolioEmptyWatchlistNote", { count: watchlistCount })}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Link href="/carteira" className={cn(buttonVariants({ size: "sm" }), "glow-ring")}>
            {t("portfolioEmptyCta")}
          </Link>
          <Link href="/bolsa" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("ctaMarket")}
          </Link>
        </div>
      </div>
    </section>
  );
}
