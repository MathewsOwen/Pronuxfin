"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Building2,
  CandlestickChart,
  Coins,
  Landmark,
  LineChart,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

const BR_TICKERS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "WEGE3",
  "ABEV3",
  "B3SA3",
  "SUZB3",
  "RENT3",
  "MGLU3",
] as const;

const CRYPTO_TICKERS = [
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "AVAX",
  "LINK",
  "DOT",
  "MATIC",
] as const;

const INTL_TICKERS = ["SPY", "QQQ", "AAPL", "NVDA", "MSFT", "AMZN", "META", "TSLA"] as const;

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

type OrbitNode = {
  id: string;
  labelKey: "nodeBrDesk" | "nodeCrypto" | "nodeDossier" | "nodeAi" | "nodeBanks" | "nodePortfolio";
  Icon: LucideIcon;
  x: number;
  y: number;
  delay: number;
};

const ORBIT_NODES: OrbitNode[] = [
  { id: "br", labelKey: "nodeBrDesk", Icon: CandlestickChart, x: 14, y: 26, delay: 0 },
  { id: "crypto", labelKey: "nodeCrypto", Icon: Coins, x: 86, y: 22, delay: 0.4 },
  { id: "dossier", labelKey: "nodeDossier", Icon: LineChart, x: 12, y: 72, delay: 0.8 },
  { id: "ai", labelKey: "nodeAi", Icon: Bot, x: 88, y: 66, delay: 1.2 },
  { id: "banks", labelKey: "nodeBanks", Icon: Landmark, x: 24, y: 84, delay: 0.6 },
  { id: "portfolio", labelKey: "nodePortfolio", Icon: Wallet, x: 78, y: 80, delay: 1 },
];

const HUB_X = 50;
const HUB_Y = 46;

function TickerMarquee({
  items,
  direction,
  variant,
}: {
  items: readonly string[];
  direction: "left" | "right";
  variant: "br" | "crypto" | "intl";
}) {
  const prefersReducedMotion = useReducedMotion();
  const duplex = [...items, ...items];
  const variantClass =
    variant === "br"
      ? "text-primary/90"
      : variant === "crypto"
        ? "text-cognitive/90"
        : "text-sky-400/80";

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 py-2 backdrop-blur-sm">
      <motion.div
        className="flex w-max gap-8 px-4 font-mono text-[11px] font-medium tracking-wide"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: variant === "crypto" ? 32 : 38, repeat: Infinity, ease: "linear" }
        }
      >
        {duplex.map((symbol, i) => (
          <span key={`${symbol}-${i}`} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className={variantClass}>{symbol}</span>
            <span
              className={`text-[10px] ${i % 3 === 0 ? "text-market-up/70" : i % 3 === 1 ? "text-market-down/70" : "text-muted-foreground/50"}`}
              aria-hidden
            >
              {i % 3 === 0 ? "▲" : i % 3 === 1 ? "▼" : "·"}
            </span>
          </span>
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

function EcosystemHub({ animate }: { animate: boolean }) {
  const t = useTranslations("AuthMarketCanvas");

  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        {ORBIT_NODES.map((node) => (
          <motion.line
            key={`line-${node.id}`}
            x1={HUB_X}
            y1={HUB_Y}
            x2={node.x}
            y2={node.y}
            stroke="color-mix(in oklch, var(--primary) 30%, transparent)"
            strokeWidth={0.15}
            strokeDasharray="1 1.2"
            vectorEffect="non-scaling-stroke"
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 1.8, delay: node.delay }}
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

      {ORBIT_NODES.map((node) => {
        const Icon = node.Icon;
        return (
          <motion.div
            key={node.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-2.5 py-1.5 backdrop-blur-md"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={animate ? { opacity: 0, scale: 0.85 } : false}
            animate={{
              opacity: 1,
              scale: 1,
              y: animate ? [0, -5, 0] : 0,
            }}
            transition={{
              opacity: { duration: 0.5, delay: node.delay },
              scale: { duration: 0.5, delay: node.delay },
              y: { duration: 5 + node.delay, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Icon className="size-3.5 shrink-0 text-primary/90" aria-hidden />
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-foreground/85">
              {t(node.labelKey)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Cenário de mercado financeiro atrás do formulário de auth. */
export function AuthFormMarketCanvas() {
  const t = useTranslations("AuthMarketCanvas");
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;

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
        <TickerMarquee items={BR_TICKERS} direction="left" variant="br" />
        <TickerMarquee items={CRYPTO_TICKERS} direction="right" variant="crypto" />
      </div>

      <div className="absolute inset-x-[4%] top-[20%] h-[20%] opacity-80 sm:inset-x-[8%]">
        <MarketPulseChart animate={animate} />
      </div>

      <div className="absolute inset-0">
        <EcosystemHub animate={animate} />
      </div>

      {!prefersReducedMotion
        ? [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[46%] size-[min(520px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
              style={{ margin: i * 28 }}
              animate={{ opacity: [0.12, 0.3, 0.12], scale: [1, 1.02, 1] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
            />
          ))
        : null}

      <div className="absolute inset-x-0 bottom-[6%] space-y-2 px-6 sm:px-10">
        <TickerMarquee items={INTL_TICKERS} direction="left" variant="intl" />
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/45">
          {t("decorativeNote")}
        </p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_46%,transparent_0%,oklch(0.04_0.022_262/0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_36%_at_50%_44%,oklch(0.05_0.02_262/0.6)_0%,transparent_100%)]" />
      <div className="noise-overlay absolute inset-0 opacity-[0.028]" />
    </div>
  );
}
