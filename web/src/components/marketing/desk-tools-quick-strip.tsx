"use client";

import {
  BarChart3,
  Calculator,
  CalendarDays,
  Landmark,
  LineChart,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RevealBlock, RevealSection } from "@/components/marketing/landing-reveal";
import { cn } from "@/lib/utils";

const DESK_TOOLS = [
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
    id: "calendar",
    href: "/ferramentas/calendario",
    icon: CalendarDays,
    accent: "border-status-warning/20 bg-status-warning/8",
  },
  { id: "news", href: "/noticias", icon: Newspaper, accent: "border-white/12 bg-white/[0.03]" },
] as const;

export function DeskToolsQuickStrip() {
  const t = useTranslations("DeskToolsStrip");

  return (
    <RevealSection>
      <RevealBlock className="rounded-3xl border border-white/12 bg-gradient-to-br from-primary/8 via-transparent to-cognitive/6 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              {t("eyebrow")}
            </p>
            <h3 className="font-heading mt-2 text-2xl font-semibold tracking-tight">{t("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("lead")}</p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DESK_TOOLS.map(({ id, href, icon: Icon, accent }) => (
            <li key={id}>
              <Link
                href={href}
                className={cn(
                  "group flex h-full items-start gap-3 rounded-2xl border p-4 transition-colors hover:border-primary/30",
                  accent,
                )}
              >
                <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-primary">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold group-hover:text-primary">
                    {t(`items.${id}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`items.${id}.body`)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </RevealBlock>
    </RevealSection>
  );
}
