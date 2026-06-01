"use client";

import { useTranslations } from "next-intl";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { RevealBlock, RevealSection } from "@/components/marketing/landing-reveal";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.08] bg-black/25 px-4 py-14 backdrop-blur-sm sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <RevealSection className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-5">
        <RevealBlock className="lg:col-span-2">
          <Link
            href="/"
            className="-ml-0.5 inline-block w-fit hover:opacity-90"
            aria-label={tNav("brandHomeAria")}
          >
            <PronuxFinLogo variant="full" className="-translate-y-0.5" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
        </RevealBlock>
        <RevealBlock className="flex flex-col gap-3 text-sm">
          <span className="font-medium text-foreground">{t("product")}</span>
          <a
            href="#recursos"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksFeatures")}
          </a>
          <Link
            href="/sobre"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksAbout")}
          </Link>
          <Link
            href="/bolsa"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksMarket")}
          </Link>
          <Link
            href="/noticias"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksNews")}
          </Link>
          <Link
            href="/projecao"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksProjecao")}
          </Link>
          <a
            href="#produto"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksProduct")}
          </a>
          <Link
            href="/aprenda"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("linksEducation")}
          </Link>
        </RevealBlock>
        <RevealBlock className="flex flex-col gap-3 text-sm">
          <span className="font-medium text-foreground">{t("legal")}</span>
          <Link
            href="/privacidade"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/termos"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("terms")}
          </Link>
        </RevealBlock>
        <RevealBlock className="flex flex-col gap-3 text-sm">
          <span className="font-medium text-foreground">{t("account")}</span>
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("register")}
          </Link>
          <Link
            href="/forgot-password"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            {t("forgot")}
          </Link>
        </RevealBlock>
      </RevealSection>
      <RevealBlock className="mx-auto mt-12 max-w-6xl rounded-2xl border border-border bg-black/20 px-5 py-5 sm:px-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("trustTitle")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("notAdvice")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("dataSources")}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/90">{t("latencyNote")}</p>
      </RevealBlock>
      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-muted-foreground sm:flex-row">
        <p>{t("stack", { year })}</p>
        <p className="max-w-xl text-center sm:text-right">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
