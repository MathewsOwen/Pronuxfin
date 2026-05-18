"use client";

import { motion } from "framer-motion";
import { ArrowRight, Binary, Cpu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroLiveDesk } from "@/components/marketing/hero-live-desk";
import { HeroWatermarks } from "@/components/marketing/hero-watermarks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("Hero");

  const pillars = [
    {
      id: "ritmo",
      k: t("pillarRitmo"),
      v: t("pillarRitmoVal"),
      d: t("pillarRitmoDesc"),
    },
    {
      id: "gov",
      k: t("pillarGov"),
      v: t("pillarGovVal"),
      d: t("pillarGovDesc"),
    },
    {
      id: "stack",
      k: t("pillarStack"),
      v: t("pillarStackVal"),
      d: t("pillarStackDesc"),
    },
  ];

  return (
    <section
      className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 md:pt-28"
      aria-labelledby="hero-title"
    >
      <HeroWatermarks />

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] terminal-grid-bg" />

      <div className="pointer-events-none absolute inset-0 -z-10 md:hidden">
        <div className="absolute left-1/2 top-0 h-[480px] w-full max-w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_%,transparent),transparent_68%)]" />
      </div>

      <div className="landing-tech-rail mx-auto mb-10 max-w-6xl rounded-full motion-reduce:hidden" aria-hidden />

      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary"
          >
            <Cpu className="size-3.5 shrink-0 text-cognitive" aria-hidden />
            {t("badge")}
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="font-heading max-w-3xl text-balance text-4xl font-semibold uppercase leading-[1.12] tracking-[0.06em] text-foreground sm:text-5xl sm:tracking-[0.055em] md:text-[3.05rem] md:leading-[1.1] md:tracking-[0.05em] lg:text-[3.2rem]"
          >
            {t("titleLead")}{" "}
            <span className="text-gradient-brand animate-gradient-shift bg-[length:200%_auto]">
              {t("titleAccent")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t.rich("subtitle", {
              highlight: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-11 px-7 text-sm glow-ring gap-2 transition-[transform,box-shadow] hover:-translate-y-0.5",
              )}
            >
              {t("ctaPrimary")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="#dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 border-white/15 bg-white/[0.03] px-7 text-sm backdrop-blur-md transition-colors hover:border-cognitive/30 hover:bg-cognitive/8",
              )}
            >
              {t("ctaSecondary")}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {pillars.map((stat) => (
              <span
                key={`${stat.id}-pill`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {stat.k}: <span className="text-foreground">{stat.v}</span>
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-14 grid gap-4 sm:grid-cols-3"
          >
            {pillars.map((stat, idx) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.06 }}
                className="glass-panel card-shine surface-rise group rounded-2xl border-border px-5 py-4 transition-colors duration-300 hover:border-primary/20"
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.k}
                </p>
                <p className="font-heading mt-2 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                  {stat.v}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{stat.d}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-8 flex items-start gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/90"
          >
            <Binary className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            {t("ethicsNote")}
          </motion.p>
        </div>

        <HeroLiveDesk />
      </div>
    </section>
  );
}
