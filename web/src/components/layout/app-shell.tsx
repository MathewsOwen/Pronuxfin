"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import {
  AppShellMobileQuickBar,
  AppShellSidebarNav,
  resolveActiveNavLabel,
} from "@/components/layout/app-shell-nav";
import { PageEnter } from "@/components/marketing/page-enter";
import { QuotesStreamProvider } from "@/components/market/quotes-stream-provider";
import { SystemDegradationBanner } from "@/components/layout/system-degradation-banner";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";
import {
  classifyDegradedReason,
  degradedStatusFingerprint,
  recoveredStatusFingerprint,
} from "@/lib/sentry/platform-status-fingerprint";
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
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevDegradedRef = useRef<boolean | null>(null);
  useDialogFocusTrap(open, drawerRef, menuButtonRef);
  const displayName = displayNameForUser(user);
  const initials = initialsForUser(user);
  const activeLabel = resolveActiveNavLabel(pathname, t);

  useEffect(() => {
    // Fecha o drawer ao navegar entre rotas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <QuotesStreamProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,oklch(0.16_0.02_258),oklch(0.12_0.02_258))] lg:flex lg:flex-col">
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
                    <span className="shrink-0 rounded-full border border-primary/25 bg-status-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-status-warning">
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
          <AppShellSidebarNav onLogout={() => void logout()} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col pb-[4.5rem] lg:pb-0">
          {degradedReason ? <SystemDegradationBanner reason={degradedReason} /> : null}
          <header className="hidden items-center justify-between gap-6 border-b border-white/10 bg-background/80 px-6 py-4 backdrop-blur-md lg:flex">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("privateDeskLabel")}
              </p>
              <h1 className="font-heading mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
                {activeLabel}
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
                    <span className="shrink-0 rounded-full border border-primary/25 bg-status-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-status-warning">
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
            <LanguageSwitcher />
          </header>

          <PageEnter
            id={MAIN_CONTENT_ID}
            className="flex-1 bg-[radial-gradient(circle_at_top,color-mix(in oklch, var(--primary) 18%, transparent),transparent_34%)] p-4 outline-none sm:p-6 lg:p-8"
            aria-hidden={open}
            inert={open}
          >
            {children}
          </PageEnter>
        </div>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] lg:hidden"
            aria-label={t("menuClose")}
            onClick={() => setOpen(false)}
          />
        ) : null}

        {open ? (
          <div
            ref={drawerRef}
            id="app-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-mobile-menu-title"
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[min(85dvh,32rem)] overflow-hidden rounded-t-3xl border border-white/10 bg-sidebar shadow-2xl lg:hidden"
          >
            <h2 id="app-mobile-menu-title" className="sr-only">
              {t("mobileMenu")}
            </h2>
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="max-h-[calc(min(85dvh,32rem)-4.5rem)] overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <AppShellSidebarNav
                onNavigate={() => setOpen(false)}
                onLogout={() => void logout()}
              />
            </div>
          </div>
        ) : null}

        <AppShellMobileQuickBar
          ref={menuButtonRef}
          onToggleMenu={() => setOpen((value) => !value)}
          menuOpen={open}
        />
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
