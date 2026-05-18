"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  HeaderMarketNavDesktop,
  HeaderMarketNavMobile,
} from "@/components/marketing/header-market-menus";
import {
  HeaderNewsNavDesktop,
  HeaderNewsNavMobile,
} from "@/components/marketing/header-news-menus";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { SessionUser } from "@/lib/session";
import { displayNameForUser } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const navLinkClass =
  "relative text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform motion-reduce:after:transition-none motion-reduce:hover:after:scale-x-100 hover:text-foreground hover:after:scale-x-100";

function NavLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const merged = cn(navLinkClass, className);
  if (href.startsWith("#")) {
    return (
      <a href={href} className={merged} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={merged} prefetch={false} onClick={onClick}>
      {label}
    </Link>
  );
}

export function SiteHeader({
  showLanguageSwitcher = false,
  user = null,
}: {
  showLanguageSwitcher?: boolean;
  user?: SessionUser | null;
}) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = useMemo(
    () =>
      [
        { href: "/bolsa", label: t("market") },
        { href: "/projecao", label: t("projecao") },
        { href: "/noticias", label: t("news") },
        { href: "/ferramentas", label: t("tools") },
        /** Âncoras da home: usar `/#…` para funcionar em qualquer rota (ex.: `#ia` virava `/noticias#ia`). */
        { href: "/assistant", label: t("ia") },
        { href: "/#beneficios", label: t("benefits") },
        { href: "/#recursos", label: t("features") },
        { href: "/#dashboard", label: t("product") },
      ] as const,
    [t],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,border-color] duration-300 supports-[backdrop-filter]:bg-background/55",
        scrolled
          ? "border-white/[0.12] bg-background/[0.88] shadow-[0_22px_64px_oklch(0_0_0/0.42)]"
          : "border-white/[0.06] bg-background/60 shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center text-foreground transition-opacity hover:opacity-90"
          aria-label={t("brandHomeAria")}
        >
          <PronuxFinLogo variant="compact" priority />
        </Link>

        <nav aria-label={t("navPrimaryAria")} className="hidden items-center gap-7 lg:gap-8 md:flex">
          {navItems.map((item) =>
            item.href === "/bolsa" ? (
              <HeaderMarketNavDesktop
                key="mercado"
                navLinkClass={navLinkClass}
                label={item.label}
              />
            ) : item.href === "/noticias" ? (
              <HeaderNewsNavDesktop
                key="noticias"
                navLinkClass={navLinkClass}
                label={item.label}
              />
            ) : (
              <NavLink key={item.href + item.label} href={item.href} label={item.label} />
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex md:gap-3">
          {showLanguageSwitcher ? <LanguageSwitcher /> : null}
          {user ? (
            <>
              <span className="max-w-[140px] truncate text-sm text-muted-foreground">
                {displayNameForUser(user) || user.email}
              </span>
              <Link href="/dashboard" className={cn(buttonVariants({ size: "sm" }))}>
                {t("product")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {t("login")}
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                {t("start")}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {showLanguageSwitcher ? <LanguageSwitcher /> : null}
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? t("menuClose") : t("menuOpen")}
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div
        id="site-mobile-nav"
        className={cn(
          "border-t border-white/10 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label={t("navPrimaryAria")} className="flex flex-col gap-1 px-4 py-4">
          {navItems.map((item) =>
            item.href === "/bolsa" ? (
              <HeaderMarketNavMobile
                key="mercado"
                navLinkClass={navLinkClass}
                label={item.label}
                onNavigate={() => setOpen(false)}
              />
            ) : item.href === "/noticias" ? (
              <HeaderNewsNavMobile
                key="noticias"
                navLinkClass={navLinkClass}
                label={item.label}
                onNavigate={() => setOpen(false)}
              />
            ) : (
              <NavLink
                key={item.href + item.label}
                href={item.href}
                label={item.label}
                className="rounded-lg px-3 py-2 after:hidden hover:bg-muted"
                onClick={() => setOpen(false)}
              />
            ),
          )}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
            {user ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "w-full justify-center",
                )}
                onClick={() => setOpen(false)}
              >
                {t("product")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full justify-center",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "w-full justify-center",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {t("start")}
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
