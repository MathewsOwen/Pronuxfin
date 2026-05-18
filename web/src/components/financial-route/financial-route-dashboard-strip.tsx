import { getTranslations } from "next-intl/server";
import { Navigation } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { EvaluatedFinancialRoute } from "@/lib/financial-route/types";

export async function FinancialRouteDashboardStrip({
  routes,
}: {
  routes: EvaluatedFinancialRoute[];
}) {
  const t = await getTranslations("FinancialRoute");
  const primary = routes[0];
  const behindCount = routes.filter((r) => !r.status.onTrack).length;

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-cognitive/20 bg-cognitive/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cognitive/30 bg-cognitive/10 p-2">
          <Navigation className="size-5 text-cognitive" />
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground">{t("dashboardTitle")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("dashboardLead", { count: routes.length })}
            {behindCount > 0
              ? ` · ${t("dashboardBehindCount", { count: behindCount })}`
              : primary?.status.onTrack
                ? ` · ${t("dashboardOnTrack")}`
                : null}
          </p>
          {primary ? (
            <p className="mt-1 font-mono text-xs text-cognitive/90">
              {primary.route.label} — {Math.round(primary.status.progressPct)}%
            </p>
          ) : null}
        </div>
      </div>
      <Link href="/rota" className={buttonVariants({ variant: "outline", size: "sm" })}>
        {t("dashboardCta")}
      </Link>
    </div>
  );
}
