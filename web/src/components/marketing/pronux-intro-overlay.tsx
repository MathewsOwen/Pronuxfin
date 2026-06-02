"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOBILE_INTRO_SERVICE_IDS,
  useIntroMobile,
} from "@/components/marketing/intro-mobile";
import { PronuxIntroSingularity } from "@/components/marketing/pronux-intro-singularity";

const IntroLogoReveal = dynamic(
  () =>
    import("@/components/marketing/intro-logo-reveal").then((mod) => ({
      default: mod.IntroLogoReveal,
    })),
  { ssr: false },
);

/** Intro 3D Singularity — diferencial da marca; `?intro=0` só para E2E. */
function wantsIntro(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("intro") === "0") {
      return false;
    }
  } catch {
    /* ignore */
  }
  return true;
}

const INTRO_EASE = [0.16, 1, 0.3, 1] as const;
const INTRO_EXIT_MS = 480;

const SERVICE_IDS = [
  "ai",
  "automation",
  "forecasts",
  "management",
  "analytics",
  "dashboard",
  "security",
  "insights",
  "monitoring",
  "operations",
] as const;

function syncIntroHtmlLock(locked: boolean) {
  const root = document.documentElement;
  if (locked) {
    root.removeAttribute("data-pronux-intro-pending");
    root.setAttribute("data-pronux-intro", "");
  } else {
    root.removeAttribute("data-pronux-intro");
    root.removeAttribute("data-pronux-intro-pending");
  }
}

function HoverExplainPanel({
  text,
  hint,
  reduceMotion,
  stacked,
}: {
  text: string;
  hint: string;
  reduceMotion: boolean | null;
  stacked?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={cn(
        "pointer-events-auto z-20",
        stacked
          ? "relative w-full"
          : "absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 w-[min(calc(100%-6.5rem),22rem)] sm:left-6 sm:w-[min(calc(100%-8rem),26rem)] md:left-8",
      )}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onClick={() => setRevealed((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed((v) => !v);
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      aria-describedby="pronux-intro-desc"
    >
      <motion.div
        animate={{
          opacity: revealed ? 1 : 0.42,
          backgroundColor: revealed ? "rgba(1, 1, 3, 0.78)" : "rgba(1, 1, 3, 0.22)",
          borderColor: revealed ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.1)",
        }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: INTRO_EASE }}
        className={cn(
          "cursor-default rounded-2xl border px-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
          revealed ? "py-4 sm:px-5 sm:py-5" : "py-3",
        )}
      >
        {!revealed ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 sm:text-[10px]">
            {hint}
          </p>
        ) : null}
        <p
          id="pronux-intro-desc"
          className={cn(
            "text-pretty text-sm leading-[1.75] text-white/82 sm:text-[0.92rem]",
            revealed ? "block" : "hidden",
          )}
        >
          {text}
        </p>
      </motion.div>
    </div>
  );
}

export function PronuxIntroOverlay() {
  const t = useTranslations("SiteIntro");
  const reduceMotion = useReducedMotion();
  const isMobile = useIntroMobile();
  const [clientReady, setClientReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [warpOut, setWarpOut] = useState(0);
  const warpRafRef = useRef(0);

  const offerings = useMemo(() => {
    const ids = isMobile ? MOBILE_INTRO_SERVICE_IDS : SERVICE_IDS;
    return ids.map((id) => ({
      label: t(`services.${id}.label`),
      colorIndex: SERVICE_IDS.indexOf(id),
    }));
  }, [t, isMobile]);

  useLayoutEffect(() => {
    setClientReady(true);
    if (!wantsIntro()) {
      setOpen(false);
      syncIntroHtmlLock(false);
      document.documentElement.removeAttribute("data-pronux-intro-pending");
      return;
    }
    setOpen(true);
    syncIntroHtmlLock(true);
    return () => syncIntroHtmlLock(false);
  }, []);

  useEffect(() => {
    if (open) return;
    document.documentElement.removeAttribute("data-pronux-intro-pending");
  }, [open]);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    const duration = reduceMotion ? 180 : INTRO_EXIT_MS;

    if (reduceMotion) {
      setWarpOut(1);
    } else {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setWarpOut(1 - Math.pow(1 - progress, 3));
        if (progress < 1) {
          warpRafRef.current = requestAnimationFrame(tick);
        }
      };
      warpRafRef.current = requestAnimationFrame(tick);
    }

    window.setTimeout(() => {
      setOpen(false);
      setExiting(false);
      setWarpOut(0);
      syncIntroHtmlLock(false);
    }, duration);
  }, [exiting, reduceMotion]);

  useEffect(() => {
    return () => {
      if (warpRafRef.current) cancelAnimationFrame(warpRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  if (!clientReady) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#010103]" data-pronux-intro-root aria-hidden />
    );
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-describedby="pronux-intro-desc"
          data-pronux-intro-root
          data-pronux-intro-variant="singularity"
          initial={false}
          animate={{ opacity: exiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.15 : exiting ? INTRO_EXIT_MS / 1000 : 0,
            ease: INTRO_EASE,
          }}
          className="fixed inset-0 z-[200] overflow-hidden overscroll-none bg-[#010103] max-md:touch-none supports-[min-height:100dvh]:min-h-[100dvh] min-h-screen"
        >
          <PronuxIntroSingularity warpOut={warpOut} offerings={offerings} />

          <IntroLogoReveal visible={!exiting} compact={isMobile} />

          <div
            className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(circle,transparent_42%,black_120%)] max-md:bg-[radial-gradient(ellipse_90%_70%_at_50%_38%,transparent_0%,rgba(0,0,0,0.55)_55%,black_100%)]"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[min(48vh,22rem)] bg-gradient-to-t from-[#010103] via-[#010103]/92 to-transparent md:h-40"
            aria-hidden
          />

          <button
            type="button"
            onClick={dismiss}
            className="pointer-events-auto absolute right-3 top-[max(0.65rem,env(safe-area-inset-top))] z-30 max-w-[42vw] truncate rounded-full border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 backdrop-blur-md transition-colors hover:border-white/[0.14] hover:text-white/80 sm:right-6 sm:max-w-none sm:px-4 sm:py-2.5 sm:text-[10px]"
          >
            {t("skip")}
          </button>

          {isMobile ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex max-h-[46dvh] flex-col justify-end gap-2 overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <HoverExplainPanel
                text={t("subline")}
                hint={t("descRevealHintMobile")}
                reduceMotion={reduceMotion}
                stacked
              />
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5, ease: INTRO_EASE }}
                onClick={dismiss}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "pointer-events-auto h-11 w-full max-w-full shrink-0 gap-2 rounded-xl border border-white/[0.12] bg-white/[0.08] px-4 text-[0.8125rem] font-medium text-white shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl active:scale-[0.98]",
                )}
              >
                {t("enterSite")}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </motion.button>
            </div>
          ) : (
            <>
              <HoverExplainPanel
                text={t("subline")}
                hint={t("descRevealHint")}
                reduceMotion={reduceMotion}
              />

              <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-20 sm:right-6 md:right-8">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.5, ease: INTRO_EASE }}
                  onClick={dismiss}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "pointer-events-auto group relative h-12 shrink-0 overflow-hidden gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-5 text-[0.8125rem] font-medium tracking-[0.02em] text-white shadow-[0_20px_60px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[transform,box-shadow,border-color,background-color] active:scale-[0.98] hover:-translate-y-0.5 hover:border-[#2dd4bf]/40 hover:bg-white/[0.09] sm:h-[3.5rem] sm:gap-2.5 sm:px-10 sm:text-sm",
                  )}
                >
                  {!reduceMotion ? (
                    <span
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                      aria-hidden
                    />
                  ) : null}
                  {t("enterSite")}
                  <ArrowRight
                    className="relative size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
