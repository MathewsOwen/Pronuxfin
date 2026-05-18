import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChartSpline,
  LayoutDashboard,
  Navigation,
  Newspaper,
  Scale,
  TrendingUp,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export type AppNavGroup = {
  id: string;
  labelKey: string;
  items: AppNavItem[];
};

/** Navegação privada agrupada (Fase 3 — reduz sobrecarga de 13 itens planos). */
export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    id: "desk",
    labelKey: "navGroupDesk",
    items: [
      { href: "/dashboard", labelKey: "panel", icon: LayoutDashboard },
      { href: "/carteira", labelKey: "portfolio", icon: Wallet },
      { href: "/calendario", labelKey: "calendar", icon: CalendarDays },
      { href: "/rota", labelKey: "route", icon: Navigation },
      { href: "/alerts", labelKey: "alerts", icon: BellRing },
      { href: "/compare", labelKey: "compare", icon: Scale },
    ],
  },
  {
    id: "market",
    labelKey: "navGroupMarket",
    items: [
      { href: "/bolsa", labelKey: "market", icon: TrendingUp },
      { href: "/projecao", labelKey: "projecao", icon: ChartSpline },
      { href: "/noticias", labelKey: "news", icon: Newspaper },
    ],
  },
  {
    id: "tools",
    labelKey: "navGroupTools",
    items: [
      { href: "/ferramentas", labelKey: "tools", icon: Wrench },
      { href: "/assistant", labelKey: "assistant", icon: BrainCircuit },
      { href: "/education", labelKey: "education", icon: BookOpen },
    ],
  },
  {
    id: "account",
    labelKey: "navGroupAccount",
    items: [{ href: "/perfil", labelKey: "profile", icon: UserRound }],
  },
];

export const APP_MOBILE_QUICK_LINKS: AppNavItem[] = [
  { href: "/dashboard", labelKey: "panel", icon: LayoutDashboard },
  { href: "/bolsa", labelKey: "market", icon: TrendingUp },
  { href: "/alerts", labelKey: "alerts", icon: BellRing },
];

export function flattenAppNavItems(): AppNavItem[] {
  return APP_NAV_GROUPS.flatMap((group) => group.items);
}
