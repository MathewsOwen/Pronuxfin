"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

const GOLD = "#d4c4a8";
const GOLD_LIGHT = "#ede4d4";
const FIN_FILL = "#2dd4bf";
const O_BAR_FILL = "#d8caa8";
const O_BAR_STROKE = "#9e8658";
const O_BAR_BOTTOM = 44;
const FONT = "var(--font-inter), system-ui, sans-serif";

const O_BARS = [
  { x: 12, maxH: 12, delay: 0 },
  { x: 19, maxH: 18, delay: 0.14 },
  { x: 26, maxH: 24, delay: 0.28 },
  { x: 33, maxH: 30, delay: 0.42 },
] as const;

const DELAYS = {
  P: 0.15,
  R: 0.28,
  N: 0.41,
  U: 0.54,
  F: 0.67,
  I: 0.8,
  N2: 0.93,
  O: 1.35,
  X: 1.65,
} as const;

const INTRO_EASE = [0.16, 1, 0.3, 1] as const;
const SLOGAN_DELAY = 2.05;
const sparkPath = "M5 34 L11 37 L17 25 L23 29 L29 16 L35 20";

function RevealGroup({
  children,
  delay,
  reduceMotion,
}: {
  children: React.ReactNode;
  delay: number;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.g
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.5,
        delay: reduceMotion ? 0 : delay,
        ease: INTRO_EASE,
      }}
    >
      {children}
    </motion.g>
  );
}

function OChartBars({ reduceMotion, active }: { reduceMotion: boolean | null; active: boolean }) {
  if (!active) return null;

  return (
    <>
      {O_BARS.map(({ x, maxH, delay }) => {
        const minH = Math.max(4, maxH * 0.38);
        const midH = maxH * 0.62;
        const dipH = maxH * 0.82;
        const heights = reduceMotion ? [maxH] : [minH, maxH, midH, dipH, maxH];
        const ys = heights.map((h) => O_BAR_BOTTOM - h);
        return (
          <motion.rect
            key={x}
            x={x}
            width={6.5}
            rx={1}
            fill={O_BAR_FILL}
            stroke={O_BAR_STROKE}
            strokeWidth={0.65}
            paintOrder="stroke fill"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0, height: 0, y: O_BAR_BOTTOM }}
            animate={
              reduceMotion
                ? { opacity: 1, height: maxH, y: O_BAR_BOTTOM - maxH }
                : { opacity: 1, height: heights, y: ys }
            }
            transition={
              reduceMotion
                ? { duration: 0.3 }
                : {
                    opacity: { duration: 0.35, delay: 0.1 + delay },
                    height: {
                      duration: 3.25,
                      delay: 0.15 + delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.42, 0.6, 1],
                    },
                    y: {
                      duration: 3.25,
                      delay: 0.15 + delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.42, 0.6, 1],
                    },
                  }
            }
          />
        );
      })}
    </>
  );
}

function IntroSlogan({ reduceMotion }: { reduceMotion: boolean | null }) {
  const t = useTranslations("SiteIntro");
  const locale = useLocale();
  const isPt = locale === "pt-BR";
  const primary = isPt ? t("taglinePt") : t("taglineSubEn");
  const secondary = isPt ? t("taglineSubEn") : t("taglineSubPt");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.85,
        delay: reduceMotion ? 0 : SLOGAN_DELAY,
        ease: INTRO_EASE,
      }}
      className="mt-3 max-w-[17rem] text-center sm:mt-5 sm:max-w-lg"
    >
      <p
        className="font-heading text-balance text-[0.95rem] font-light leading-[1.45] tracking-[0.015em] sm:text-xl md:text-[1.35rem]"
        style={{
          background: "linear-gradient(105deg, #ede4d4 0%, #f5f0e8 42%, #d4c4a8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {primary}
      </p>
      <p className="font-heading mt-2 text-pretty text-[0.72rem] font-extralight italic leading-relaxed tracking-[0.06em] text-white/38 sm:text-[0.82rem]">
        {secondary}
      </p>
    </motion.div>
  );
}

export function IntroLogoReveal({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();
  const gid = `intro-logo-${useId().replace(/:/g, "")}`;
  const gold = `url(#${gid}-gold)`;
  const [oActive, setOActive] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      setOActive(true);
      return;
    }
    const timer = window.setTimeout(() => setOActive(true), DELAYS.O * 1000);
    return () => window.clearTimeout(timer);
  }, [visible, reduceMotion]);

  if (!visible) return null;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-[max(0.85rem,env(safe-area-inset-top))] z-[5] flex flex-col items-center px-4 sm:top-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 md:top-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 280 68"
        fill="none"
        role="img"
        aria-label="PRONUXFIN"
        className="h-9 w-auto sm:h-[3.25rem] md:h-16"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`${gid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GOLD_LIGHT} />
            <stop offset="50%" stopColor={GOLD} />
            <stop offset="100%" stopColor="#b8a67e" />
          </linearGradient>
        </defs>

        <RevealGroup delay={DELAYS.P} reduceMotion={reduceMotion}>
          <text x={0} y={48} fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.08em" style={{ fontFamily: FONT }}>
            P
          </text>
        </RevealGroup>

        <RevealGroup delay={DELAYS.R} reduceMotion={reduceMotion}>
          <text x={22} y={48} fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.08em" style={{ fontFamily: FONT }}>
            R
          </text>
        </RevealGroup>

        <g transform="translate(44, 6)">
          <RevealGroup delay={DELAYS.O} reduceMotion={reduceMotion}>
            <ellipse cx={26} cy={28} rx={23} ry={27} stroke={gold} strokeWidth={5} fill="none" />
            <OChartBars reduceMotion={reduceMotion} active={oActive} />
          </RevealGroup>
        </g>

        <RevealGroup delay={DELAYS.N} reduceMotion={reduceMotion}>
          <text x={98} y={48} fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.09em" style={{ fontFamily: FONT }}>
            N
          </text>
        </RevealGroup>

        <RevealGroup delay={DELAYS.U} reduceMotion={reduceMotion}>
          <text x={125} y={48} fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.09em" style={{ fontFamily: FONT }}>
            U
          </text>
        </RevealGroup>

        <g transform="translate(152, 9)">
          <RevealGroup delay={DELAYS.X} reduceMotion={reduceMotion}>
            <motion.g
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={reduceMotion ? undefined : { opacity: [0.22, 0.38, 0.22] }}
              transition={
                reduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <path d="M2 41 L42 11" stroke={gold} strokeWidth={1.5} />
              <path d="M2 11 L42 41" stroke={gold} strokeWidth={1.5} />
            </motion.g>
            <path d="M4 35 H41 M4 35 V14" stroke={gold} strokeWidth={2.2} strokeLinecap="round" opacity={0.42} />
            <motion.path
              d={sparkPath}
              fill="none"
              stroke={FIN_FILL}
              strokeWidth={4.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={
                reduceMotion
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: [0, 1, 1, 0], opacity: 1 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 4,
                      delay: DELAYS.X,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.38, 0.58, 1],
                    }
              }
            />
            <motion.circle
              cx={35}
              cy={20}
              r={3}
              fill={FIN_FILL}
              stroke={gold}
              strokeWidth={0.9}
              animate={reduceMotion ? undefined : { r: [2.6, 3.5, 2.6], opacity: [0.75, 1, 0.75] }}
              transition={
                reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </RevealGroup>
        </g>

        <RevealGroup delay={DELAYS.F} reduceMotion={reduceMotion}>
          <text x={200} y={48} fill={FIN_FILL} fontSize={42} fontWeight={650} style={{ fontFamily: FONT }}>
            F
          </text>
        </RevealGroup>

        <RevealGroup delay={DELAYS.I} reduceMotion={reduceMotion}>
          <text x={228} y={48} fill={FIN_FILL} fontSize={42} fontWeight={650} style={{ fontFamily: FONT }}>
            I
          </text>
        </RevealGroup>

        <RevealGroup delay={DELAYS.N2} reduceMotion={reduceMotion}>
          <text x={242} y={48} fill={FIN_FILL} fontSize={42} fontWeight={650} style={{ fontFamily: FONT }}>
            N
          </text>
        </RevealGroup>
      </svg>

      <IntroSlogan reduceMotion={reduceMotion} />
    </header>
  );
}
