import { getTranslations } from "next-intl/server";
import { AuthMobileBrand } from "@/components/auth/auth-mobile-brand";
import { AuthFormStage } from "@/components/auth/auth-form-stage";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Link } from "@/i18n/navigation";

export async function AuthBrandPanel() {
  const t = await getTranslations("AuthLayout");
  const tNav = await getTranslations("Nav");

  return (
    <div className="relative hidden overflow-hidden border-r border-white/10 bg-[oklch(0.08_0.04_262)] lg:flex lg:w-[42%] lg:flex-col lg:justify-between xl:w-[44%]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.74_0.14_215/0.2),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] motion-safe:animate-pulse-soft">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
            linear-gradient(oklch(0.74 0.14 215 / 0.07) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.74 0.14 215 / 0.07) 1px, transparent 1px)
          `,
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(black 40%, transparent)",
          }}
        />
      </div>
      <div className="relative z-10 p-10 xl:p-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex w-fit text-foreground"
            aria-label={tNav("brandHomeAria")}
          >
            <PronuxFinLogo variant="compact" />
          </Link>
          <LanguageSwitcher className="hidden xl:block" />
        </div>
        <h2 className="font-heading mt-14 max-w-md text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          {t("headlineLead")}{" "}
          <span className="text-gradient-brand">{t("headlineAccent")}</span>
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <AuthSignalCard
            label={t("signalSecurityLabel")}
            value={t("signalSecurityValue")}
            accentClass="border-amber-500/25 bg-amber-950/18"
          />
          <AuthSignalCard
            label={t("signalStackLabel")}
            value={t("signalStackValue")}
            accentClass="border-sky-500/25 bg-sky-950/18"
          />
          <AuthSignalCard
            label={t("signalFlowLabel")}
            value={t("signalFlowValue")}
            accentClass="border-teal-500/25 bg-teal-950/18"
          />
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10 p-10 xl:p-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
          {t("footerTech")}
        </div>
      </div>
    </div>
  );
}

import { MAIN_CONTENT_ID } from "@/lib/content-anchor";

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
      className="relative flex min-h-screen overflow-hidden outline-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.74_0.14_215/0.12),transparent_42%)] lg:hidden" />
      <AuthBrandPanel />
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <AuthMobileBrand />
          <LanguageSwitcher />
        </div>
        <div className="mb-6 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.04)] lg:hidden">
          <div className="flex flex-wrap gap-2 font-mono uppercase tracking-[0.14em]">
            <span className="rounded-full border border-amber-500/25 bg-amber-950/20 px-2.5 py-1 text-amber-200">
              {t("signalSecurityLabel")}
            </span>
            <span className="rounded-full border border-sky-500/25 bg-sky-950/20 px-2.5 py-1 text-sky-200">
              JWT
            </span>
            <span className="rounded-full border border-teal-500/25 bg-teal-950/20 px-2.5 py-1 text-teal-200">
              {t("signalFlowLabel")}
            </span>
          </div>
        </div>
        <AuthFormStage>{children}</AuthFormStage>
      </div>
    </div>
  );
}

function AuthSignalCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)] ${accentClass}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
