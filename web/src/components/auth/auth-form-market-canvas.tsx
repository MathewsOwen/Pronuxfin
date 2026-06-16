"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AuthMarketLogoChip } from "@/components/auth/auth-market-logo-chip";
import type { AuthMarketLogo } from "@/lib/market/auth-market-logo-types";
import {
  layoutAuthMarketLogoOrbits,
  logosForMarquee,
} from "@/lib/market/auth-market-logo-types";

const CHART_POINTS =
  "M 0 88 L 28 72 L 52 78 L 78 48 L 104 56 L 128 32 L 152 40 L 176 18 L 200 28 L 224 8 L 248 22 L 272 12 L 296 26 L 320 14";

const CANDLES = [
  { x: 24, o: 70, c: 58, h: 52, l: 74, up: true },
  { x: 48, o: 58, c: 64, h: 54, l: 68, up: false },
  { x: 72, o: 64, c: 48, h: 42, l: 68, up: true },
  { x: 96, o: 48, c: 52, h: 44, l: 58, up: false },
  { x: 120, o: 52, c: 36, h: 30, l: 56, up: true },
  { x: 144, o: 36, c: 42, h: 32, l: 46, up: false },
  { x: 168, o: 42, c: 28, h: 22, l: 46, up: true },
  { x: 192, o: 28, c: 34, h: 26, l: 38, up: false },
  { x: 216, o: 34, c: 20, h: 14, l: 38, up: true },
  { x: 240, o: 20, c: 26, h: 16, l: 30, up: false },
] as const;

const HUB_X = 50;
const HUB_Y = 46;

function LogoTickerMarquee({
  logos,
  direction,
}: {
  logos: AuthMarketLogo[];
  direction: "left" | "right";
}) {
  const prefersReducedMotion = useReducedMotion();
  if (logos.length === 0) return null;

  const duplex = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 py-2 backdrop-blur-sm">
      <motion.div
        className="flex w-max items-center gap-6 px-4"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: direction === "right" ? 34 : 40, repeat: Infinity, ease: "linear" }
        }
      >
        {duplex.map((logo, i) => (
          <AuthMarketLogoChip
            key={`${logo.symbol}-${i}`}
            symbol={logo.symbol}
            imageUrl={logo.imageUrl}
            size={28}
            showSymbol
          />
        ))}
      </motion.div>
    </div>
  );
}

function MarketPulseChart({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 320 96" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="auth-market-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CANDLES.map((c) => {
        const bodyTop = Math.min(c.o, c.c);
        const bodyH = Math.max(Math.abs(c.o - c.c), 2);
        const color = c.up ? "var(--market-up)" : "var(--market-down)";
        return (
          <g key={c.x} opacity={0.45}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth={1} />
            <rect x={c.x - 5} y={bodyTop} width={10} height={bodyH} fill={color} rx={1} />
          </g>
        );
      })}
      <motion.path
        d={`${CHART_POINTS} L 320 96 L 0 96 Z`}
        fill="url(#auth-market-chart-fill)"
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d={CHART_POINTS}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0.4 } : false}
        animate={{ pathLength: 1, opacity: 0.75 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function LogoConstellation({
  logos,
  animate,
}: {
  logos: AuthMarketLogo[];
  animate: boolean;
}) {
  const t = useTranslations("AuthMarketCanvas");
  const orbit = useMemo(() => layoutAuthMarketLogoOrbits(logos), [logos]);

  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        {orbit.map((node) => (
          <motion.line
            key={`line-${node.symbol}`}
            x1={HUB_X}
            y1={HUB_Y}
            x2={node.x}
            y2={node.y}
            stroke="color-mix(in oklch, var(--primary) 22%, transparent)"
            strokeWidth={0.12}
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 0.45 }}
            transition={{ duration: 1.6, delay: node.delay }}
          />
        ))}
      </svg>

      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
        style={{ left: `${HUB_X}%`, top: `${HUB_Y}%` }}
      >
        <div className="rounded-2xl border border-primary/35 bg-primary/12 p-3 shadow-[0_0_40px_color-mix(in_oklch,var(--primary)_20%,transparent)] backdrop-blur-md">
          <Building2 className="size-6 text-primary" aria-hidden />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/80">
          {t("hubLabel")}
        </span>
      </div>

      {orbit.map((node) => (
        <motion.div
          key={node.symbol}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={animate ? { opacity: 0, scale: 0.8 } : false}
          animate={{
            opacity: 1,
            scale: 1,
            y: animate ? [0, node.ring % 2 === 0 ? -4 : 4, 0] : 0,
          }}
          transition={{
            opacity: { duration: 0.45, delay: node.delay },
            scale: { duration: 0.45, delay: node.delay },
            y: { duration: 4.5 + node.delay, repeat: Infinity, ease: "easeInOut" },
          }}
          title={node.shortName ?? node.symbol}
        >
          <AuthMarketLogoChip
            symbol={node.symbol}
            imageUrl={node.imageUrl}
            size={node.category === "bank" || node.category === "exchange" ? 48 : 42}
          />
        </motion.div>
      ))}
    </div>
  );
}

/** Cenário de mercado com logos reais atrás do formulário de auth. */
export function AuthFormMarketCanvas() {
  const t = useTranslations("AuthMarketCanvas");
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;
  const [logos, setLogos] = useState<AuthMarketLogo[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/market-logos", { cache: "force-cache" });
        const json = (await res.json()) as { logos?: AuthMarketLogo[] };
        if (!cancelled && Array.isArray(json.logos)) {
          setLogos(json.logos);
        }
      } catch {
        /* cenário decorativo — falha silenciosa */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const brMarquee = useMemo(
    () => logosForMarquee(logos, ["bank", "br-equity", "exchange"]),
    [logos],
  );
  const cryptoMarquee = useMemo(() => logosForMarquee(logos, "crypto"), [logos]);
  const intlMarquee = useMemo(() => logosForMarquee(logos, "intl"), [logos]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[oklch(0.052_0.026_262)]"
      data-auth-market-stage
      aria-hidden
    >
      <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_6%,transparent)] to-transparent lg:w-52" />
      <div className="terminal-grid-bg absolute inset-0 opacity-[0.04]" />

      <div className="absolute inset-x-0 top-[5%] space-y-2 px-6 sm:px-10">
        <div className="mb-1 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-status-live shadow-[0_0_8px_var(--status-live-glow)] motion-safe:animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-status-live/90">
            {t("liveTag")}
          </span>
        </div>
        <LogoTickerMarquee logos={brMarquee} direction="left" />
        <LogoTickerMarquee logos={cryptoMarquee} direction="right" />
      </div>

      <div className="absolute inset-x-[4%] top-[20%] h-[18%] opacity-75 sm:inset-x-[8%]">
        <MarketPulseChart animate={animate} />
      </div>

      <div className="absolute inset-0">
        <LogoConstellation logos={logos} animate={animate} />
      </div>

      {!prefersReducedMotion
        ? [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[46%] size-[min(520px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
              style={{ margin: i * 28 }}
              animate={{ opacity: [0.1, 0.26, 0.1], scale: [1, 1.02, 1] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
            />
          ))
        : null}

      <div className="absolute inset-x-0 bottom-[6%] space-y-2 px-6 sm:px-10">
        <LogoTickerMarquee logos={intlMarquee} direction="left" />
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/45">
          {t("decorativeNote")}
        </p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_46%,transparent_0%,oklch(0.04_0.022_262/0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_38%_34%_at_50%_44%,oklch(0.05_0.02_262/0.65)_0%,transparent_100%)]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.028]" />
    </div>
  );
}
