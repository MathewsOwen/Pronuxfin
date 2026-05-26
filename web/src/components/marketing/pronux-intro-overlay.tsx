"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Move3d, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { PronuxIntroCosmos } from "@/components/marketing/pronux-intro-cosmos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INTRO_EASE = [0.16, 1, 0.3, 1] as const;

function IntroLogoHalo({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative flex items-center justify-center">
      {!reduceMotion
        ? [0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className={cn(
                "pointer-events-none absolute rounded-full",
                i === 0 ? "border border-[#ede4d4]/35" : "border border-primary/25",
              )}
              style={{
                width: `${8.5 + i * 3.2}rem`,
                height: `${2.9 + i * 1}rem`,
              }}
              animate={{
                opacity: [0.12, i === 0 ? 0.55 : 0.38, 0.12],
                scale: [0.95, 1.04 + i * 0.008, 0.95],
              }}
              transition={{
                duration: 4.2 + i * 0.45,
                repeat: Infinity,
                delay: i * 0.28,
                ease: "easeInOut",
              }}
              aria-hidden
            />
          ))
        : null}
      {!reduceMotion ? (
        <>
          <motion.div
            className="absolute inset-0 -z-10 blur-3xl"
            animate={{ opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 48%, transparent) 0%, color-mix(in oklch, var(--cognitive) 22%, transparent) 42%, transparent 72%)",
            }}
            aria-hidden
          />
          <motion.div
            className="absolute -inset-8 -z-10 rounded-full blur-2xl"
            animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(212,196,168,0.2) 0%, transparent 70%)",
            }}
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative z-10 drop-shadow-[0_0_40px_color-mix(in_oklch,var(--primary)_40%,transparent)]">
        <PronuxFinLogo
          variant="full"
          className="h-[4.75rem] w-auto sm:h-[5.25rem] md:h-24"
        />
      </div>
    </div>
  );
}

function FilmGrain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] opacity-[0.035] mix-blend-soft-light"
      aria-hidden
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "160px 160px",
      }}
    />
  );
}

function PremiumHud({
  labels,
}: {
  labels: { nux: string; ai: string; markets: string };
}) {
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/28 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#d6c5a4]/70 backdrop-blur-md sm:text-[10px]">
          <span className="relative inline-flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary/80" />
          </span>
          Live Intro Session
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-24 z-20 hidden w-52 space-y-2.5 md:block lg:right-8">
        {[labels.nux, labels.ai, labels.markets].map((item, idx) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + idx * 0.12, duration: 0.55, ease: INTRO_EASE }}
            className="rounded-xl border border-white/[0.08] bg-black/22 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d9c9ab]/72">{item}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export function PronuxIntroOverlay() {
  const t = useTranslations("SiteIntro");
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  const offerings = [
    {
      label: t("offeringAi"),
      colorIndex: 3,
      ring: 0,
      phase: 2.45,
      emphasis: "inner" as const,
    },
    { label: t("offeringMarkets"), colorIndex: 0, ring: 1 },
    { label: t("offeringProjection"), colorIndex: 1, ring: 2 },
    { label: t("offeringNews"), colorIndex: 2, ring: 2 },
    { label: t("offeringPortfolio"), colorIndex: 4, ring: 3 },
    { label: t("offeringTools"), colorIndex: 5, ring: 4 },
  ];
  const hudLabels = {
    nux: t("offeringNux"),
    ai: t("offeringAi"),
    markets: t("offeringMarkets"),
  };

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setOpen(true);
    });
  }, []);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    const delay = reduceMotion ? 180 : 900;
    window.setTimeout(() => {
      setOpen(false);
      setExiting(false);
    }, delay);
  }, [exiting, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.setAttribute("data-pronux-intro", "");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.removeAttribute("data-pronux-intro");
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!mounted) return null;

  const hintPulse =
    reduceMotion
      ? {}
      : {
          animate: { opacity: [0.55, 0.95, 0.55], scale: [1, 1.02, 1] },
          transition: { duration: 2.8, repeat: Infinity, ease: INTRO_EASE },
        };

  const panelShimmer =
    reduceMotion
      ? {}
      : {
          initial: { x: "-120%" },
          animate: { x: ["-120%", "120%"] },
          transition: { duration: 2.4, repeat: Infinity, ease: INTRO_EASE },
        };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pronux-intro-tagline"
          aria-describedby="pronux-intro-desc"
          initial={{ opacity: 0 }}
          animate={{
            opacity: exiting ? 0 : 1,
            scale: exiting ? 1.14 : 1,
            filter: exiting ? "blur(18px) brightness(1.4)" : "blur(0px) brightness(1)",
          }}
          exit={{ opacity: 0, scale: 1.12, filter: "blur(12px)" }}
          transition={{
            duration: reduceMotion ? 0.2 : exiting ? 0.9 : 0.7,
            ease: INTRO_EASE,
          }}
          className="fixed inset-0 z-[200] overflow-hidden bg-[#030508]"
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.2 }}
            animate={{ scale: exiting ? 1.26 : 1 }}
            transition={{
              duration: reduceMotion ? 0 : exiting ? 0.9 : 2.8,
              ease: INTRO_EASE,
            }}
          >
            <PronuxIntroCosmos offerings={offerings} />
          </motion.div>

          <div
            className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_80%_60%_at_50%_38%,transparent_0%,rgba(3,5,8,0.25)_45%,rgba(3,5,8,0.94)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(125deg,transparent_30%,color-mix(in_oklch,var(--primary)_8%,transparent)_48%,color-mix(in_oklch,#d4c4a8_6%,transparent)_52%,transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[4] opacity-[0.045] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(237,228,212,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,212,191,0.25) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
            aria-hidden
          />
          <FilmGrain />
          <PremiumHud labels={hudLabels} />

          <button
            type="button"
            onClick={dismiss}
            className="pointer-events-auto absolute right-4 top-4 z-30 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c9b896]/40 transition-colors hover:text-[#ede4d4] sm:right-6 sm:top-6"
          >
            {t("skip")}
          </button>

          <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-5 pb-28 pt-14 text-center sm:px-8 sm:pb-32">
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: INTRO_EASE }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#c9b896]/70 backdrop-blur-md sm:text-[10px]"
            >
              <Sparkles className="size-3 text-primary/70" aria-hidden />
              {t("eyebrow")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: INTRO_EASE }}
            >
              <IntroLogoHalo reduceMotion={reduceMotion} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: INTRO_EASE }}
              className="mt-4 rounded-xl border border-[#ede4d4]/25 bg-black/28 px-4 py-2 backdrop-blur-lg"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#faf3e2]">
                {t("offeringNux")}
              </p>
              <p className="mt-1 font-mono text-[9px] tracking-[0.12em] text-[#c9b896]/75">
                {t("offeringNuxSub")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: INTRO_EASE }}
              className="mt-9 max-w-4xl sm:mt-11"
            >
              <p
                id="pronux-intro-tagline"
                className="font-heading bg-gradient-to-b from-[#faf6ee] via-[#ede4d4] to-[#c9b896] bg-clip-text text-balance text-[0.68rem] font-semibold uppercase leading-snug tracking-[0.22em] text-transparent sm:text-xs sm:tracking-[0.2em] md:text-sm md:tracking-[0.17em]"
              >
                {t("taglineEn")}
              </p>
              <p className="mt-2.5 font-mono text-[10px] tracking-[0.14em] text-primary/90 sm:text-[11px]">
                {t("taglinePt")}
              </p>
            </motion.div>

          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: INTRO_EASE }}
              className="pointer-events-none max-w-[min(100%,17rem)]"
            >
              <motion.p
                {...hintPulse}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-2.5 font-mono text-[9px] uppercase leading-snug tracking-[0.17em] text-[#c9b896]/50 backdrop-blur-md sm:text-[10px]"
              >
                <Move3d className="size-3 shrink-0 text-primary/45" aria-hidden />
                {t("interactionHint")}
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.85, ease: INTRO_EASE }}
              className="pointer-events-auto group relative mx-2 hidden max-w-2xl flex-1 rounded-2xl border border-white/[0.08] bg-black/26 px-6 py-5 shadow-[0_0_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl lg:block"
            >
              <motion.div
                {...panelShimmer}
                className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#ede4d4]/45 to-transparent"
              />
              <p
                id="pronux-intro-desc"
                className="text-pretty text-sm leading-[1.75] text-[#e8dcc8]/20 transition-opacity duration-300 group-hover:text-[#e8dcc8]/92 sm:text-[0.95rem]"
              >
                {t("subline")}
              </p>
            </motion.div>

            <motion.button
              key="interactive-cta"
              type="button"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.05, duration: 0.65, ease: INTRO_EASE }}
              onClick={dismiss}
              className={cn(
                buttonVariants({ size: "lg" }),
                "pointer-events-auto group relative h-12 overflow-hidden gap-2.5 border border-[#d4c4a8]/35 bg-gradient-to-b from-[#141a22]/90 to-[#0a0e14]/95 px-9 text-sm font-medium tracking-wide text-[#faf6ee] shadow-[0_0_64px_color-mix(in_oklch,var(--primary)_18%,transparent),0_0_32px_rgba(212,196,168,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[#ede4d4]/50 hover:shadow-[0_0_80px_color-mix(in_oklch,var(--primary)_28%,transparent),0_0_40px_rgba(212,196,168,0.2)] sm:h-[3.35rem]",
              )}
            >
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#ede4d4]/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                aria-hidden
              />
              {t("enterSite")}
              <ArrowRight
                className="relative size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
