"use client";

import { ArrowUpRight, BarChart3, Calculator, Calendar, Landmark, LineChart, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RevealBlock,
  RevealSection,
  RevealStaggerList,
} from "@/components/marketing/landing-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils";

const SURFACES = [
  { id: "bolsa", href: "/bolsa", icon: LineChart, accent: "border-status-live/25 bg-status-live/8" },
  { id: "projecao", href: "/projecao", icon: BarChart3, accent: "border-cognitive/25 bg-cognitive/8" },
  {
    id: "compound",
    href: "/ferramentas/juros-compostos",
    icon: Calculator,
    accent: "border-primary/25 bg-primary/8",
  },
  {
    id: "amortization",
    href: "/ferramentas/amortizacao",
    icon: Landmark,
    accent: "border-primary/20 bg-primary/5",
  },
  {
    id: "carteira",
    href: "/register",
    icon: Wallet,
    accent: "border-primary/25 bg-primary/8",
  },
  {
    id: "calendario",
    href: "/ferramentas/calendario",
    icon: Calendar,
    accent: "border-primary/20 bg-primary/5",
  },
] as const;

export function ProductDeskPreviewSection() {
  const t = useTranslations("ProductDesk");

  return (
    <section id="produto" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <RevealSection>
          <RevealBlock>
            <SectionHeading
              eyebrow={t("eyebrow")}
              align="center"
              title={t("title")}
              description={t("description")}
            />
          </RevealBlock>

          <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-border bg-status-warning/6 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-status-warning/90">
            {t("honestyBanner")}
          </p>

          <RevealStaggerList
            as="ul"
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SURFACES.map(({ id, href, icon: Icon, accent }) => (
              <li key={id}>
                <Link
                  href={href}
                  className={cn(
                    "surface-rise card-shine group flex h-full flex-col rounded-2xl border p-5 transition-colors hover:border-primary/30",
                    accent,
                  )}
                >
                  <Icon className="size-5 text-primary" aria-hidden />
                  <p className="font-heading mt-4 text-lg font-semibold text-foreground">
                    {t(`surfaces.${id}.title`)}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`surfaces.${id}.body`)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] font-medium text-primary">
                    {t(`surfaces.${id}.cta`)}
                    <ArrowUpRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </RevealStaggerList>

          <RevealBlock className="mt-10 text-center">
            <Link
              href="/bolsa"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-8 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              {t("openDesk")}
            </Link>
          </RevealBlock>
        </RevealSection>
      </div>
    </section>
  );
}
