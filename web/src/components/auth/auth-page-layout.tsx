import { getTranslations } from "next-intl/server";
import { AuthBrandCanvas } from "@/components/auth/auth-brand-canvas";
import { AuthBrandShowcase } from "@/components/auth/auth-brand-showcase";
import { AuthFormAmbient } from "@/components/auth/auth-form-ambient";
import { AuthFormStage } from "@/components/auth/auth-form-stage";
import { AuthMobileBrand } from "@/components/auth/auth-mobile-brand";
import { AuthValueTile } from "@/components/auth/auth-value-tile";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Link } from "@/i18n/navigation";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";

export async function AuthBrandPanel() {
  const t = await getTranslations("AuthLayout");
  const tNav = await getTranslations("Nav");

  return (
    <div className="relative hidden min-h-screen overflow-hidden border-r border-white/10 bg-[oklch(0.07_0.035_262)] lg:flex lg:w-[44%] lg:flex-col xl:w-[46%]">
      <AuthBrandCanvas />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-8 xl:p-12">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex w-fit text-foreground"
            aria-label={tNav("brandHomeAria")}
          >
            <PronuxFinLogo variant="compact" />
          </Link>
          <LanguageSwitcher className="hidden xl:block" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-8 py-8 xl:gap-10">
          <div className="max-w-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary/80">
              {t("eyebrow")}
            </p>
            <h2 className="font-heading mt-4 text-3xl font-semibold leading-[1.08] tracking-tight xl:text-[2.75rem]">
              {t("headlineLead")}{" "}
              <span className="text-gradient-brand">{t("headlineAccent")}</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <ul className="grid max-w-lg gap-3 lg:grid-cols-1 xl:grid-cols-3">
            <AuthValueTile title={t("tileMarketsTitle")} value={t("tileMarketsValue")} />
            <AuthValueTile title={t("tileIntelTitle")} value={t("tileIntelValue")} />
            <AuthValueTile title={t("tileControlTitle")} value={t("tileControlValue")} />
          </ul>

          <div className="max-w-lg">
            <AuthBrandShowcase />
          </div>
        </div>

        <p className="shrink-0 text-xs leading-relaxed text-muted-foreground/90">
          {t("trustLine")}
        </p>
      </div>
    </div>
  );
}

export async function AuthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("AuthLayout");

  return (
    <div
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="relative flex min-h-screen overflow-hidden bg-[oklch(0.06_0.03_262)] outline-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in oklch,var(--primary)_14%,transparent),transparent_50%)] lg:hidden" />
      <AuthBrandPanel />
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <AuthFormAmbient />
        <div className="relative z-10 mb-8 flex w-full max-w-[440px] items-center justify-between lg:hidden">
          <AuthMobileBrand />
          <LanguageSwitcher />
        </div>
        <p className="relative z-10 mb-5 w-full max-w-[440px] text-center text-xs text-muted-foreground lg:hidden">
          {t("trustLine")}
        </p>
        <div className="relative z-10 w-full">
          <AuthFormStage>{children}</AuthFormStage>
        </div>
      </div>
    </div>
  );
}
