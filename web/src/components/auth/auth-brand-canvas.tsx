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

export function AuthBrandCanvas() {
  const t = useTranslations("AuthLayout");
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const highlights = [
    { title: t("highlight1Title"), body: t("highlight1Body") },
    { title: t("highlight2Title"), body: t("highlight2Body") },
    { title: t("highlight3Title"), body: t("highlight3Body") },
  ];

  const marquee = [
    t("marquee1"),
    t("marquee2"),
    t("marquee3"),
    t("marquee4"),
  ];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % highlights.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [highlights.length, prefersReducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-16 size-[420px] rounded-full bg-primary/20 blur-[100px] motion-safe:animate-pulse-soft" />
      <div className="absolute bottom-0 right-0 size-[360px] rounded-full bg-cognitive/15 blur-[90px] motion-safe:animate-pulse-soft [animation-delay:1.2s]" />
      <div className="absolute left-1/3 top-1/2 size-[280px] -translate-y-1/2 rounded-full bg-teal-400/10 blur-[80px]" />

      {!prefersReducedMotion ? (
        <>
          <motion.div
            className="absolute -left-16 top-[28%] size-[320px] rounded-full bg-[radial-gradient(circle,color-mix(in oklch,var(--primary)_20%,transparent),transparent_68%)] blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
            transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[18%] right-[-4rem] size-[280px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.18_265/0.14),transparent_68%)] blur-3xl"
            animate={{ x: [0, -32, 0], y: [0, 16, 0] }}
            transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : null}

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in oklch, var(--primary) 8%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in oklch, var(--primary) 8%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 72%)",
        }}
      />

      <div className="absolute bottom-24 left-10 right-10 hidden xl:block">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
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
              const Icon = MARQUEE_ICONS[index % MARQUEE_ICONS.length]!;
              return (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  {item}
                </span>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-32 left-10 right-10 hidden max-w-md lg:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-white/12 bg-white/[0.04] p-5 shadow-[0_24px_80px_oklch(0_0_0/0.35)] backdrop-blur-xl"
          >
            {(() => {
              const Icon = HIGHLIGHT_ICONS[active] ?? TrendingUp;
              const slide = highlights[active]!;
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-primary/25 bg-primary/10 p-2.5 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                      {slide.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{slide.body}</p>
                  <div className="mt-4 flex gap-1.5">
                    {highlights.map((_, index) => (
                      <span
                        key={index}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          index === active ? "w-8 bg-primary" : "w-2 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
