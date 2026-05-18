import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardDeskCharts } from "@/components/dashboard/dashboard-desk-charts";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildPortfolioChartData } from "@/lib/user-portfolio/chart-data";
import type { PortfolioSummary } from "@/lib/user-portfolio/snapshot";
import { cn } from "@/lib/utils";

type AgendaEvent = {
  id: string;
  titlePt: string;
  titleEn: string;
  date: string;
  timeUtc: string | null;
  watchlistSymbol?: string | null;
};

export async function DashboardAnalyticsSection({
  locale,
  portfolioSummary,
  assistantHref,
  agendaHasLive,
  todayCalendarEvents,
  agendaFallback,
}: {
  locale: string;
  portfolioSummary: PortfolioSummary | null;
  assistantHref: string;
  agendaHasLive: boolean;
  todayCalendarEvents: AgendaEvent[];
  agendaFallback: string[];
}) {
  const t = await getTranslations("Dashboard");
  const portfolioCharts = portfolioSummary
    ? await buildPortfolioChartData(portfolioSummary.positions, locale)
    : null;

  return (
    <>
      {portfolioCharts && portfolioSummary ? (
        <DashboardDeskCharts
          locale={locale}
          currency={portfolioSummary.currency}
          flowSeries={portfolioCharts.flowSeries}
          allocation={portfolioCharts.allocation}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading">{t("flowTitle")}</CardTitle>
              <CardDescription>{t("flowEmpty")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/carteira" className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("ctaPortfolio")}
              </Link>
            </CardContent>
          </Card>
          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("aiTitle")}</CardTitle>
              <CardDescription>{t("aiSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>• {t("aiP1")}</p>
              <p>• {t("aiP2")}</p>
              <p className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 text-emerald-200">
                {t("aiCta")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div
        className={cn(
          "grid gap-6",
          portfolioCharts ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]" : "lg:grid-cols-1",
        )}
      >
        {portfolioCharts ? (
          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("aiTitle")}</CardTitle>
              <CardDescription>{t("aiSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>• {t("aiP1")}</p>
              <p>• {t("aiP2")}</p>
              <Link href={assistantHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("aiCta")}
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="font-heading">{t("agendaTitle")}</CardTitle>
              <CardDescription>
                {agendaHasLive ? t("agendaSubtitleLive") : t("agendaSubtitle")}
              </CardDescription>
            </div>
            <Link
              href="/calendario"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              <CalendarDays className="size-4" />
              {t("agendaFullCta")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {agendaHasLive
              ? todayCalendarEvents.map((ev, index) => {
                  const title = locale.startsWith("pt") ? ev.titlePt : ev.titleEn;
                  const timeLabel = formatAgendaEventTime(ev.date, ev.timeUtc, locale);
                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-950/20 text-xs font-semibold text-emerald-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        {ev.watchlistSymbol ? (
                          <Link
                            href={`/ativo/${encodeURIComponent(ev.watchlistSymbol)}`}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {title}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-foreground">{title}</p>
                        )}
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {timeLabel}
                        </p>
                      </div>
                    </div>
                  );
                })
              : agendaFallback.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-950/20 text-xs font-semibold text-emerald-300">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function formatAgendaEventTime(date: string, timeUtc: string | null, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(timeUtc ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" } : {}),
    }).format(new Date(`${date}T${timeUtc ?? "12:00"}:00Z`));
  } catch {
    return date;
  }
}
