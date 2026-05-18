"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type PronuxFinLogoVariant = "compact" | "full";

type MarkProps = {
  variant: PronuxFinLogoVariant;
  gid: string;
  reduceMotion: boolean | null;
};

/** Tracks theme primary (cyan in dark, per globals.css). */
const FIN_FILL = "var(--primary)";

/** Inner bars inside letter O: bottom-aligned, animated heights (local coords after translate). */
const O_BAR_BOTTOM = 44;
const O_BARS = [
  { x: 12, maxH: 12, delay: 0 },
  { x: 19, maxH: 18, delay: 0.14 },
  { x: 26, maxH: 24, delay: 0.28 },
  { x: 33, maxH: 30, delay: 0.42 },
] as const;

/** Solid gold bars inside O (gradient + motion.rect can fail to tint in some engines). */
const O_BAR_FILL = "#d8caa8";
const O_BAR_STROKE = "#9e8658";

function OChartBars({
  reduceMotion,
}: {
  reduceMotion: boolean | null;
}) {
  return (
    <>
      {O_BARS.map(({ x, maxH, delay }) => {
        const minH = Math.max(4, maxH * 0.38);
        const midH = maxH * 0.62;
        const dipH = maxH * 0.82;
        const heights = reduceMotion
          ? [maxH]
          : [minH, maxH, midH, dipH, maxH];
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
            initial={false}
            animate={
              reduceMotion
                ? { height: maxH, y: O_BAR_BOTTOM - maxH }
                : { height: heights, y: ys }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 3.25,
                    delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.42, 0.6, 1],
                  }
            }
          />
        );
      })}
    </>
  );
}

function PronuxFinLogoMark({ variant, gid, reduceMotion }: MarkProps) {
  const gold = `url(#${gid}-gold)`;
  const tagline =
    variant === "full" ? (
      <text
        textAnchor="middle"
        x={140}
        y={94}
        fill="#c9b896"
        fontSize={10.75}
        fontWeight={520}
        letterSpacing="0.22em"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        WHERE UNDERSTANDING BECOMES ADVANTAGE
      </text>
    ) : null;

  const sparkPath = "M5 34 L11 37 L17 25 L23 29 L29 16 L35 20";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={variant === "full" ? "0 0 280 108" : "0 0 280 68"}
      fill="none"
      role="img"
      aria-hidden
      className={cn(
        "pointer-events-none h-7 w-auto sm:h-8",
        variant === "full" && "h-12 sm:h-14",
      )}
      preserveAspectRatio="xMinYMid meet"
    >
      <defs>
        <linearGradient id={`${gid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ede4d4" />
          <stop offset="50%" stopColor="#d4c4a8" />
          <stop offset="100%" stopColor="#b8a67e" />
        </linearGradient>
      </defs>
      <g fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.08em">
        <text
          x={0}
          y={48}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          P
        </text>
        <text
          x={22}
          y={48}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          R
        </text>
      </g>
      <g transform="translate(44, 6)">
        <ellipse cx={26} cy={28} rx={23} ry={27} stroke={gold} strokeWidth={5} />
        <OChartBars reduceMotion={reduceMotion} />
      </g>
      <g fill={gold} fontSize={42} fontWeight={650} letterSpacing="-0.09em">
        <text
          x={98}
          y={48}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          N
        </text>
        <text
          x={125}
          y={48}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          U
        </text>
      </g>
      <g transform="translate(152, 9)">
        <motion.g
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.22, 0.38, 0.22],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <path d="M2 41 L42 11" stroke={gold} strokeWidth={1.5} />
          <path d="M2 11 L42 41" stroke={gold} strokeWidth={1.5} />
        </motion.g>
        <path
          d="M4 35 H41 M4 35 V14"
          stroke={gold}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.42}
        />
        <motion.path
          d={sparkPath}
          fill="none"
          stroke={FIN_FILL}
          strokeWidth={4.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduceMotion ? 1 : undefined }}
          animate={
            reduceMotion ? { pathLength: 1 } : { pathLength: [0, 1, 1, 0] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 4,
                  times: [0, 0.38, 0.58, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
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
          initial={false}
          animate={
            reduceMotion
              ? { r: 3, opacity: 1 }
              : { r: [2.6, 3.5, 2.6], opacity: [0.75, 1, 0.75] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </g>
      <g
        fill={FIN_FILL}
        fontSize={42}
        fontWeight={650}
        letterSpacing="-0.08em"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <text x={200} y={48}>
          F
        </text>
        <text x={228} y={48}>
          I
        </text>
        <text x={242} y={48}>
          N
        </text>
      </g>
      {tagline}
    </svg>
  );
}

export function PronuxFinLogo({
  variant = "compact",
  className,
  priority,
}: {
  variant?: PronuxFinLogoVariant;
  className?: string;
  /** Kept for API compatibility; inline SVG ignores LCP priority. */
  priority?: boolean;
}) {
  void priority;
  const reduceMotion = useReducedMotion();
  const gid = `pfn-${useId().replace(/:/g, "")}`;

  return (
    <motion.span
      className={cn(
        "relative inline-flex items-center text-foreground",
        "motion-safe:hover:brightness-110 motion-safe:transition-[filter] motion-safe:duration-300",
        "motion-safe:hover:drop-shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_%,transparent)]",
        className,
      )}
      {...(reduceMotion
        ? {}
        : {
            whileHover: { scale: 1.02 },
            transition: { type: "spring", stiffness: 420, damping: 28 },
          })}
    >
      <PronuxFinLogoMark variant={variant} gid={gid} reduceMotion={reduceMotion} />
    </motion.span>
  );
}
