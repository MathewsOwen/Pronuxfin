"use client";

import {
  BellRing,
  BookOpen,
  BrainCircuit,
  ChartSpline,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Scale,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PageEnter } from "@/components/marketing/page-enter";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "?";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "PF";
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const t = useTranslations("AppShell");
  const tNav = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initials = initialsFromEmail(user.email);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = [
    { href: "/dashboard", label: t("panel"), icon: LayoutDashboard },
    { href: "/bolsa", label: t("market"), icon: TrendingUp },
    { href: "/projecao", label: t("projecao"), icon: ChartSpline },
    { href: "/noticias", label: t("news"), icon: Newspaper },
    { href: "/assistant", label: t("assistant"), icon: BrainCircuit },
    { href: "/compare", label: t("compare"), icon: Scale },
    { href: "/alerts", label: t("alerts"), icon: BellRing },
    { href: "/education", label: t("education"), icon: BookOpen },
  ];
  const activeLink =
    links.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`)) ??
    links[0];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const AsideNav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[transform,color,background-color,border-color] duration-200 motion-safe:hover:translate-x-px",
              active
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.74_0.14_215/0.25)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active ? (
              <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_oklch(0.74_0.14_215/0.9)]" />
            ) : null}
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <Separator className="my-3 bg-white/10" />
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "justify-start gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        <LogOut className="size-4" />
        {t("logout")}
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,oklch(0.16_0.02_258),oklch(0.12_0.02_258))] lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link
            href="/dashboard"
            className="inline-flex w-fit text-foreground transition-opacity hover:opacity-90"
            aria-label={t("brandLinkAria")}
          >
            <PronuxFinLogo variant="compact" />
          </Link>
        </div>
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/35 to-primary/5 text-xs font-bold tracking-wide text-primary ring-2 ring-primary/25">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("accountLabel")}
              </p>
              <p className="truncate text-sm font-medium leading-tight">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="glass-panel card-shine rounded-2xl border border-white/10 px-4 py-4 shadow-none ring-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("workspaceLabel")}
            </p>
            <p className="mt-2 text-sm font-semibold tracking-tight text-foreground">
              {t("workspaceValue")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ShellPill>{t("sessionValue")}</ShellPill>
              <ShellPill>{t("publicDeskValue")}</ShellPill>
            </div>
          </div>
        </div>
        {AsideNav}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="hidden items-center justify-between gap-6 border-b border-white/10 bg-background/80 px-6 py-4 backdrop-blur-md lg:flex">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("privateDeskLabel")}
            </p>
            <h1 className="font-heading mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
              {activeLink.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ShellPill>{t("sessionValue")}</ShellPill>
            <ShellPill>{t("publicDeskValue")}</ShellPill>
            <LanguageSwitcher />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("accountLabel")}
              </p>
              <p className="max-w-[220px] truncate text-sm font-medium text-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </header>
        <header className="flex h-14 items-center justify-between gap-3 border-b border-white/10 bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Link
            href="/dashboard"
            className="inline-flex w-fit text-foreground"
            aria-label={t("brandLinkAria")}
          >
            <PronuxFinLogo variant="compact" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-expanded={open}
              aria-controls="app-mobile-sheet"
              aria-label={open ? tNav("menuClose") : tNav("menuOpen")}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>
        {open ? (
          <div
            id="app-mobile-sheet"
            className="border-b border-white/10 bg-sidebar px-2 pb-4 lg:hidden"
          >
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary">
                {initials}
              </div>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            {AsideNav}
          </div>
        ) : null}

        <PageEnter
          id={MAIN_CONTENT_ID}
          className="flex-1 bg-[radial-gradient(circle_at_top,oklch(0.74_0.14_215/0.08),transparent_34%)] p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </PageEnter>
      </div>
    </div>
  );
}

function ShellPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}
