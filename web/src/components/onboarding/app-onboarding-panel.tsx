"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { dismissOnboarding, isOnboardingDismissed } from "@/lib/onboarding/storage";
import { cn } from "@/lib/utils";

const STEPS = [
  { titleKey: "step1Title", leadKey: "step1Lead", href: "/bolsa", ctaKey: "step1Cta" },
  { titleKey: "step2Title", leadKey: "step2Lead", href: "/carteira", ctaKey: "step2Cta" },
  { titleKey: "step3Title", leadKey: "step3Lead", href: "/ferramentas", ctaKey: "step3Cta" },
] as const;

export function AppOnboardingPanel({ userId }: { userId: string }) {
  const t = useTranslations("Onboarding");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    setVisible(!isOnboardingDismissed(userId));
  }, [userId]);

  if (!mounted || !visible) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function close() {
    dismissOnboarding(userId);
    setVisible(false);
  }

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border border-primary/25 bg-[linear-gradient(135deg,oklch(0.74_0.14_215/0.12),oklch(0.16_0.03_258))] px-5 py-6 md:px-7"
      aria-labelledby="app-onboarding-title"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <Sparkles className="size-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/90">
              {t("eyebrow")}
            </p>
            <h2 id="app-onboarding-title" className="font-heading text-lg font-semibold tracking-tight">
              {t("title")}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label={t("dismiss")}
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t("intro")}
      </p>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("stepLabel", { current: step + 1, total: STEPS.length })}
        </p>
        <p className="mt-2 font-medium text-foreground">{t(current.titleKey)}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(current.leadKey)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!isLast ? (
            <button
              type="button"
              className={buttonVariants({ size: "sm" })}
              onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
            >
              {t("next")}
              <ArrowRight className="ml-1 size-3.5" />
            </button>
          ) : null}
          <Link
            href={current.href}
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={() => {
              if (isLast) close();
            }}
          >
            {t(current.ctaKey)}
          </Link>
          {step > 0 ? (
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t("back")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        {STEPS.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={t("stepDot", { step: index + 1 })}
            aria-current={index === step ? "step" : undefined}
            onClick={() => setStep(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === step ? "w-8 bg-primary" : "w-3 bg-white/20 hover:bg-white/35",
            )}
          />
        ))}
        <button
          type="button"
          onClick={close}
          className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("skip")}
        </button>
      </div>
    </section>
  );
}
