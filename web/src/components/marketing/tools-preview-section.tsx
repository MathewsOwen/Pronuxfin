"use client";

import { Calculator, CalendarDays, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CompoundInterestCalculator } from "@/components/tools/compound-interest-calculator";
import { EconomicCalendarView } from "@/components/tools/economic-calendar-view";
import { RevealBlock, RevealSection } from "@/components/marketing/landing-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolsPreviewSection() {
  const t = useTranslations("ToolsPreview");

  return (
    <section id="ferramentas" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <RevealSection>
          <RevealBlock>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("title")}
              description={t("description")}
            />
          </RevealBlock>
        </RevealSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel card-shine rounded-3xl border border-white/12 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
                <Calculator className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">{t("compoundTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("compoundLead")}</p>
              </div>
            </div>
            <CompoundInterestCalculator compact />
            <Link
              href="/ferramentas/juros-compostos"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
            >
              {t("compoundCta")}
            </Link>
          </div>

          <div className="glass-panel card-shine rounded-3xl border border-white/12 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl border border-primary/20 bg-primary/8 p-2 text-status-warning">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">{t("calendarTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("calendarLead")}</p>
              </div>
            </div>
            <EconomicCalendarView previewLimit={4} />
            <Link
              href="/ferramentas/calendario"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
            >
              {t("calendarCta")}
            </Link>
          </div>
        </div>

        <div className="glass-panel card-shine flex flex-col gap-4 rounded-3xl border border-white/12 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-status-live/25 bg-status-live/10 p-2 text-market-up">
              <Wallet className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">{t("portfolioTitle")}</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t("portfolioLead")}
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "glow-ring shrink-0")}
          >
            {t("portfolioCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
