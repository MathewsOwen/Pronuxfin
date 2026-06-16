"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Globe2,
  LineChart,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const HIGHLIGHT_ICONS = [TrendingUp, BarChart3, Sparkles] as const;
const MARQUEE_ICONS = [Globe2, LineChart, Shield] as const;

export function AuthBrandShowcase() {
  const t = useTranslations("AuthLayout");
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const highlights = [
    { title: t("highlight1Title"), body: t("highlight1Body") },
    { title: t("highlight2Title"), body: t("highlight2Body") },
    { title: t("highlight3Title"), body: t("highlight3Body") },
  ];

  const marquee = [t("marquee1"), t("marquee2"), t("marquee3"), t("marquee4")];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % highlights.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [highlights.length, prefersReducedMotion]);

  const Icon = HIGHLIGHT_ICONS[active] ?? TrendingUp;
  const slide = highlights[active]!;

  return (
    <div className="flex shrink-0 flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] p-5 shadow-[0_24px_80px_oklch(0_0_0/0.35)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          aria-hidden
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-primary/30 bg-primary/12 p-2.5 text-primary shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_18%,transparent)]">
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {slide.title}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex gap-1.5" role="tablist" aria-label={slide.title}>
          {highlights.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={item.title}
              onClick={() => setActive(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === active ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md xl:block">
        <motion.div
          className="flex w-max gap-10 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-primary/90"
          animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 28, repeat: Infinity, ease: "linear" }
          }
        >
          {[...marquee, ...marquee].map((item, index) => {
            const MarqueeIcon = MARQUEE_ICONS[index % MARQUEE_ICONS.length]!;
            return (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-2 whitespace-nowrap"
              >
                <MarqueeIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                {item}
              </span>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
