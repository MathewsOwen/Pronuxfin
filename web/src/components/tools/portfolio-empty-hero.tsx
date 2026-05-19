import { LineChart, PlusCircle, Search, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function PortfolioEmptyHero() {
  const t = await getTranslations("Portfolio");

  const steps = [
    { icon: Search, title: t("step1Title"), body: t("step1Body") },
    { icon: PlusCircle, title: t("step2Title"), body: t("step2Body") },
    { icon: LineChart, title: t("step3Title"), body: t("step3Body") },
  ] as const;

  return (
    <section aria-labelledby="portfolio-empty-title">
      <EmptyState icon={Wallet} title={t("emptyTitle")} description={t("empty")}>
        <a href="#portfolio-add-form" className={cn(buttonVariants({ size: "sm" }), "glow-ring")}>
          {t("emptyCtaAdd")}
        </a>
        <Link href="/bolsa" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("browseMarket")}
        </Link>
      </EmptyState>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-primary/90">
        {t("emptyEyebrow")}
      </p>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
          >
            <span className="font-mono text-[10px] text-muted-foreground">
              {t("stepLabel", { step: index + 1 })}
            </span>
            <div className="mt-3 flex items-center gap-2">
              <Icon className="size-4 text-primary" aria-hidden />
              <p className="text-sm font-medium text-foreground">{title}</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
