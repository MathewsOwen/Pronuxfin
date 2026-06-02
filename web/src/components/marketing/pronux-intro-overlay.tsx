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

const PronuxIntroSingularity = dynamic(
  () =>
    import("@/components/marketing/pronux-intro-singularity").then((mod) => ({
      default: mod.PronuxIntroSingularity,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#010103]" aria-hidden />
    ),
  },
);

const IntroLogoReveal = dynamic(
  () =>
    import("@/components/marketing/intro-logo-reveal").then((mod) => ({
      default: mod.IntroLogoReveal,
    })),
  { ssr: false },
);

const INTRO_SEEN_KEY = "pronux-intro-seen-v3";

function wantsIntro(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "1" || params.get("intro") === "reset") return true;
    if (params.get("intro") === "0") return false;
  } catch {
    /* ignore */
  }
  return !hasSeenIntro();
}

function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
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
}: {
  text: string;
  hint: string;
  reduceMotion: boolean | null;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-20 w-[min(calc(100%-6.5rem),22rem)] sm:left-6 sm:w-[min(calc(100%-8rem),26rem)] md:left-8"
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
  const [open, setOpen] = useState(false);
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
      syncIntroHtmlLock(false);
      return;
    }
    setOpen(true);
    syncIntroHtmlLock(true);
    return () => syncIntroHtmlLock(false);
  }, []);

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
      markIntroSeen();
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
          initial={false}
          animate={{ opacity: exiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.15 : exiting ? INTRO_EXIT_MS / 1000 : 0,
            ease: INTRO_EASE,
          }}
          className="fixed inset-0 z-[200] overflow-hidden bg-[#010103]"
        >
          <PronuxIntroSingularity warpOut={warpOut} offerings={offerings} />

          <IntroLogoReveal visible={!exiting} />

          <div
            className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]"
            aria-hidden
          />

          <div
            className="pointer-events-none fixed inset-0 z-[4] bg-[radial-gradient(circle,transparent_50%,black_150%)]"
            aria-hidden
          />

          <button
            type="button"
            onClick={dismiss}
            className="pointer-events-auto absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 min-h-11 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 backdrop-blur-md transition-colors hover:border-white/[0.14] hover:text-white/80 sm:right-6"
          >
            {t("skip")}
          </button>

          <HoverExplainPanel
            text={t("subline")}
            hint={isMobile ? t("descRevealHintMobile") : t("descRevealHint")}
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
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
