"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroPreview() {
  const t = useTranslations("HeroPreview");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-lg lg:mx-0"
    >
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-cognitive/8 blur-2xl motion-reduce:hidden" />

      <div className="glass-panel card-shine glow-ring relative overflow-hidden rounded-[1.75rem] border-white/15 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] terminal-grid-bg" />

        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-md border border-status-live/35 bg-status-live/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-status-live">
          <Radio className="size-3" aria-hidden />
          {t("badge")}
        </div>

        <p className="absolute left-4 top-4 max-w-[55%] font-mono text-[9px] leading-snug text-muted-foreground">
          {t("disclaimerCorner")}
        </p>

        <div className="relative mt-14 grid gap-4 px-6 pb-6 pt-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("patrimony")}</p>
              <p className="font-heading mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                {t("maskedValue")}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] font-medium text-muted-foreground">
              {t("deltaBadge")}
              <ArrowUpRight className="size-3 opacity-60" aria-hidden />
            </span>
          </div>

          <div className="flex h-28 items-end gap-1.5 pt-2" aria-hidden>
            {[44, 62, 53, 76, 58, 82, 71, 91, 67].map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-end">
                <motion.div
                  className="w-full rounded-md bg-gradient-to-t from-primary/35 to-primary/80 shadow-[0_0_20px_color-mix(in oklch, var(--primary) 18%, transparent)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    duration: 0.65,
                    delay: 0.45 + i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-black/35 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("cognitiveTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("cognitiveBody")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
