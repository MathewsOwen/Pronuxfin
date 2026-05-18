"use client";

import * as Sentry from "@sentry/nextjs";
import {
  BellRing,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChartSpline,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  Newspaper,
  UserRound,
  Scale,
  TrendingUp,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PageEnter } from "@/components/marketing/page-enter";
import { QuotesStreamProvider } from "@/components/market/quotes-stream-provider";
import { SystemDegradationBanner } from "@/components/layout/system-degradation-banner";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";
import { useRouter } from "next/navigation";
import {
  classifyDegradedReason,
  degradedStatusFingerprint,
  recoveredStatusFingerprint,
} from "@/lib/sentry/platform-status-fingerprint";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { displayNameForUser, initialsForUser } from "@/lib/user-display";

export function AppShell({
  user,
  degradedReason,
  children,
}: {
  user: SessionUser;
  degradedReason?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("AppShell");
  const tNav = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const prevDegradedRef = useRef<boolean | null>(null);
  const displayName = displayNameForUser(user);
  const initials = initialsForUser(user);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const degraded = Boolean(degradedReason);
    const prev = prevDegradedRef.current;
    prevDegradedRef.current = degraded;

    if (prev === degraded) return;

    if (degraded) {
      Sentry.withScope((scope) => {
        scope.setLevel("warning");
        scope.setTag("platform.status", "degraded");
        scope.setTag("platform.degraded_bucket", classifyDegradedReason(degradedReason));
        scope.setFingerprint(degradedStatusFingerprint(degradedReason));
        if (degradedReason) scope.setExtra("degraded_reason", degradedReason);
        Sentry.captureMessage("platform_status_degraded");
      });
      return;
    }

    if (prev) {
      Sentry.withScope((scope) => {
        scope.setLevel("info");
        scope.setTag("platform.status", "recovered");
        scope.setFingerprint(recoveredStatusFingerprint());
        Sentry.captureMessage("platform_status_recovered");
      });
    }
  }, [degradedReason]);

  const links = [
    { href: "/dashboard", label: t("panel"), icon: LayoutDashboard },
    { href: "/carteira", label: t("portfolio"), icon: Wallet },
    { href: "/calendario", label: t("calendar"), icon: CalendarDays },
    { href: "/rota", label: t("route"), icon: Navigation },
    { href: "/ferramentas", label: t("tools"), icon: Wrench },
    { href: "/bolsa", label: t("market"), icon: TrendingUp },
    { href: "/projecao", label: t("projecao"), icon: ChartSpline },
    { href: "/noticias", label: t("news"), icon: Newspaper },
    { href: "/assistant", label: t("assistant"), icon: BrainCircuit },
    { href: "/compare", label: t("compare"), icon: Scale },
    { href: "/alerts", label: t("alerts"), icon: BellRing },
    { href: "/education", label: t("education"), icon: BookOpen },
    { href: "/perfil", label: t("profile"), icon: UserRound },
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
    <QuotesStreamProvider>
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
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-white/[0.04]"
            aria-label={t("profileLinkAria")}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/35 to-primary/5 text-xs font-bold tracking-wide text-primary ring-2 ring-primary/25">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("accountLabel")}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium leading-tight">
                  {displayName || user.email}
                </p>
                {user.isAdmin ? (
                  <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    {t("adminBadge")}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </Link>
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
        {degradedReason ? <SystemDegradationBanner reason={degradedReason} /> : null}
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
            <Link
              href="/perfil"
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right transition-colors hover:bg-white/[0.06]"
              aria-label={t("profileLinkAria")}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("accountLabel")}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center justify-end gap-2">
                <p className="max-w-[220px] truncate text-sm font-medium text-foreground">
                  {displayName || user.email}
                </p>
                {user.isAdmin ? (
                  <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    {t("adminBadge")}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 max-w-[280px] truncate text-right text-xs text-muted-foreground">
                {user.email}
              </p>
            </Link>
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
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              {user.isAdmin ? (
                <span className="w-fit rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-200">
                  {t("adminBadge")}
                </span>
              ) : null}
            </div>
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
    </QuotesStreamProvider>
  );
}

function ShellPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}
