"use client";

import { LogOut, Menu } from "lucide-react";
import { forwardRef } from "react";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, usePathname } from "@/i18n/navigation";
import { APP_MOBILE_QUICK_LINKS, APP_NAV_GROUPS } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";

type AppShellSidebarNavProps = {
  onNavigate?: () => void;
  onLogout: () => void;
};

export function AppShellSidebarNav({ onNavigate, onLogout }: AppShellSidebarNavProps) {
  const t = useTranslations("AppShell");
  const pathname = usePathname();

  const navLinkClass = (active: boolean) =>
    cn(
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[transform,color,background-color,border-color] duration-200 motion-safe:hover:translate-x-px",
      active
        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_%,transparent)]"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {APP_NAV_GROUPS.map((group) => (
        <div key={group.id} className="mb-2">
          <p className="px-3 pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/80">
            {t(group.labelKey)}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={navLinkClass(active)}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_%,transparent)]" />
                  ) : null}
                  <Icon className="size-4 shrink-0" />
                  {t(labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <Separator className="my-2 bg-white/10" />
      <button
        type="button"
        onClick={onLogout}
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
}

type AppShellMobileQuickBarProps = {
  onToggleMenu: () => void;
  menuOpen?: boolean;
};

export const AppShellMobileQuickBar = forwardRef<HTMLButtonElement, AppShellMobileQuickBarProps>(
  function AppShellMobileQuickBar({ onToggleMenu, menuOpen = false }, menuButtonRef) {
  const t = useTranslations("AppShell");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-md lg:hidden"
      aria-label={t("mobileNavAria")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {APP_MOBILE_QUICK_LINKS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          );
        })}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onToggleMenu}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium",
            menuOpen ? "text-primary" : "text-muted-foreground",
          )}
          aria-expanded={menuOpen}
          aria-controls="app-mobile-sheet"
          aria-label={menuOpen ? t("menuClose") : t("menuOpen")}
        >
          <Menu className="size-5" />
          <span>{menuOpen ? t("menuClose") : t("mobileMenu")}</span>
        </button>
      </div>
    </nav>
  );
  },
);

AppShellMobileQuickBar.displayName = "AppShellMobileQuickBar";

export { resolveActiveNavLabel } from "@/lib/navigation/resolve-active-nav-label";
