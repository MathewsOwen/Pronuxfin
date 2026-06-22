import { Calculator, CalendarDays, Landmark, Navigation, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolsHubPanelProps = {
  loggedIn: boolean;
};

export async function ToolsHubPanel({ loggedIn }: ToolsHubPanelProps) {
  const t = await getTranslations("Tools.hub");

  const cards = [
    {
      href: "/ferramentas/juros-compostos",
      icon: Calculator,
      title: t("compoundTitle"),
      description: t("compoundDesc"),
    },
    {
      href: "/ferramentas/amortizacao",
      icon: Landmark,
      title: t("amortizationTitle"),
      description: t("amortizationDesc"),
    },
    {
      href: loggedIn ? "/calendario" : "/ferramentas/calendario",
      icon: CalendarDays,
      title: t("calendarTitle"),
      description: t("calendarDesc"),
    },
    ...(loggedIn
      ? [
          {
            href: "/carteira",
            icon: Wallet,
            title: t("portfolioTitle"),
            description: t("portfolioDesc"),
          },
          {
            href: "/rota",
            icon: Navigation,
            title: t("routeTitle"),
            description: t("routeDesc"),
          },
        ]
      : []),
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("lead")}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="glass-panel card-shine group rounded-3xl border border-white/12 p-6 transition-colors hover:border-primary/30"
          >
            <div className="w-fit rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
              <Icon className="size-6" />
            </div>
            <h2 className="font-heading mt-4 text-xl font-semibold group-hover:text-primary">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}>
              {t("open")}
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
