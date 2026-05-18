import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { MacroRouteContext } from "@/lib/financial-route/macro-route-context";

export async function MacroRouteBanner({
  macro,
  locale,
}: {
  macro: MacroRouteContext;
  locale: string;
}) {
  if (!macro.hasHighImpactThisWeek && macro.upcomingHighImpact.length === 0) {
    return null;
  }

  const t = await getTranslations("FinancialRoute");
  const summary = locale.startsWith("pt") ? macro.eventSummaryPt : macro.eventSummaryEn;

  return (
    <div className="rounded-2xl border border-cognitive/25 bg-cognitive/8 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex gap-3">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-cognitive" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {macro.hasHighImpactToday ? t("macroBannerToday") : t("macroBannerWeek")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("macroBannerHint", { inflation: macro.referenceInflationPct })}
          </p>
        </div>
      </div>
      <Link
        href="/calendario"
        className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3 sm:mt-0 shrink-0" })}
      >
        {t("macroBannerCta")}
      </Link>
    </div>
  );
}
