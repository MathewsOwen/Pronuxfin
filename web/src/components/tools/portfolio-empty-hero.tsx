import { LineChart, PlusCircle, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
    <section
      className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.02] px-6 py-8"
      aria-labelledby="portfolio-empty-title"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/90">
        {t("emptyEyebrow")}
      </p>
      <h2
        id="portfolio-empty-title"
        className="font-heading mt-2 text-2xl font-semibold tracking-tight md:text-3xl"
      >
        {t("emptyTitle")}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t("empty")}
      </p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
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
      <div className="mt-6 flex flex-wrap gap-2">
        <a href="#portfolio-add-form" className={cn(buttonVariants({ size: "sm" }), "glow-ring")}>
          {t("emptyCtaAdd")}
        </a>
        <Link href="/bolsa" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("browseMarket")}
        </Link>
      </div>
    </section>
  );
}
