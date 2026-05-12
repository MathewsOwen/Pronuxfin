"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  formatSaoPauloClock,
  getCashDeskSnapshot,
  type CashDeskPhase,
} from "@/lib/market/cash-desk-session";
import { cn } from "@/lib/utils";

const phaseAccent: Record<CashDeskPhase, string> = {
  weekend: "border-l-zinc-500/70 bg-zinc-950/80",
  pre: "border-l-amber-400/90 bg-amber-950/25",
  regular: "border-l-emerald-400/90 bg-emerald-950/20",
  post: "border-l-sky-400/80 bg-sky-950/20",
};

export function MarketSessionBar() {
  const t = useTranslations("MarketDesk");
  const locale = useLocale();
  const [clock, setClock] = useState("--:--:--");
  const [snapshot, setSnapshot] = useState(() => getCashDeskSnapshot());

  useEffect(() => {
    let id: number | undefined;

    function tick() {
      const now = new Date();
      setClock(formatSaoPauloClock(now, true, locale));
      setSnapshot(getCashDeskSnapshot(now));
    }

    function clearTimer() {
      if (id != null) {
        window.clearInterval(id);
        id = undefined;
      }
    }

    function startTimer() {
      tick();
      id = window.setInterval(tick, 1000);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        clearTimer();
      } else {
        tick();
        if (id == null) startTimer();
      }
    }

    if (!document.hidden) startTimer();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [locale]);

  return (
    <div
      className={cn(
        "relative z-40 border-b border-white/[0.07] backdrop-blur-md",
        phaseAccent[snapshot.phase],
        "border-l-[3px]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] terminal-grid-bg" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-400/95">
            {t("sessionEyebrow")}
          </p>
          <p className="font-heading mt-1 text-sm font-semibold tracking-tight text-foreground">
            {t(`sessionPhases.${snapshot.phase}.title`)}
          </p>
          <p className="mt-0.5 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
            {t(`sessionPhases.${snapshot.phase}.detail`)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 border-t border-white/10 pt-2 font-mono text-[11px] tabular-nums text-muted-foreground sm:border-0 sm:pt-0 sm:text-right">
          <span className="text-[10px] uppercase tracking-wider text-foreground/90">
            {t("clockLabel")}
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {clock}{" "}
            <span className="text-xs font-normal text-muted-foreground">{t("clockTz")}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">{t("clockDetail")}</span>
        </div>
      </div>
    </div>
  );
}
