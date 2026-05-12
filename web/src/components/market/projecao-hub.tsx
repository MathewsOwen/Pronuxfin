"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookMarked,
  Gauge,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProjecaoHub() {
  const [bias, setBias] = useState<"alta" | "baixa">("alta");
  const t = useTranslations("ProjecaoHub");
  const bullPoints = t.raw("bullPoints") as string[];
  const bearPoints = t.raw("bearPoints") as string[];
  const activePoints = bias === "alta" ? bullPoints : bearPoints;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="surface-rise card-shine relative overflow-hidden rounded-3xl border border-amber-500/20 bg-zinc-950/55 p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] terminal-grid-bg" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4 border-l-[3px] border-amber-400/80 pl-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-400/95">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {t("h1Lead")}{" "}
              <span className="text-gradient-brand">{t("h1Accent")}</span>
            </h1>
            <p className="max-w-3xl text-muted-foreground leading-relaxed">{t("lead")}</p>
          </div>
          <div className="glass-panel card-shine flex w-full max-w-xl flex-col gap-3 rounded-2xl px-4 py-3 font-mono text-[11px] lg:w-auto lg:max-w-none">
            <div className="grid gap-2 sm:grid-cols-3">
              <ProjectionSignalCard
                label={t("signalRealtimeRails")}
                value="3"
                accentClass="border-amber-500/25 bg-amber-950/18"
              />
              <ProjectionSignalCard
                label={t("signalBiasModes")}
                value="2"
                accentClass="border-emerald-500/25 bg-emerald-950/18"
              />
              <ProjectionSignalCard
                label={t("signalChecklistItems")}
                value={String(activePoints.length)}
                accentClass={
                  bias === "alta"
                    ? "border-emerald-500/25 bg-emerald-950/18"
                    : "border-rose-500/25 bg-rose-950/18"
                }
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  bias === "alta"
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                    : "border-rose-500/30 bg-rose-950/30 text-rose-200",
                )}
              >
                {bias === "alta" ? t("biasHigh") : t("biasLow")}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("checklistHint")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-panel card-shine mt-8 rounded-2xl border border-rose-500/25 bg-rose-950/[0.14] p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex gap-3">
          <Scale className="mt-0.5 size-4 shrink-0 text-rose-400" aria-hidden />
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("warnTitle")}</p>
            <p>{t("warnBody")}</p>
          </div>
        </div>
      </div>

      <section className="surface-rise card-shine mt-10 rounded-2xl border border-white/10 bg-black/25 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Gauge className="size-5 text-amber-400/80" aria-hidden />
          <h2 className="font-heading text-lg font-semibold tracking-tight">{t("sensHeading")}</h2>
        </div>
        <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">{t("sensBr")}</li>
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">{t("sensCrypto")}</li>
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:col-span-2">
            {t("sensNews")}
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-400/90">
              {t("boardEyebrow")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("boardLead")}</p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-black/30 p-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setBias("alta")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                bias === "alta"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/35"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowUpRight className="size-4" aria-hidden />
              {t("biasHigh")}
            </button>
            <button
              type="button"
              onClick={() => setBias("baixa")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                bias === "baixa"
                  ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/35"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowDownRight className="size-4" aria-hidden />
              {t("biasLow")}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "card-shine rounded-2xl border p-6 sm:p-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]",
            bias === "alta"
              ? "border-emerald-500/25 bg-emerald-950/[0.12]"
              : "border-rose-500/25 bg-rose-950/[0.12]",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border font-mono text-[10px] uppercase tracking-wider",
                bias === "alta"
                  ? "border-emerald-500/40 text-emerald-300"
                  : "border-rose-500/40 text-rose-300",
              )}
            >
              {bias === "alta" ? t("checklistBull") : t("checklistBear")}
            </Badge>
            <span className="text-xs text-muted-foreground">{t("checklistHint")}</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {activePoints.map((item, idx) => (
              <li key={item} className="flex gap-3">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted-foreground">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-rise card-shine mt-12 rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <BookMarked className="size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-3">
            <h3 className="font-heading text-lg font-semibold tracking-tight">{t("roadmapTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("roadmapBody")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
                {t("ctaRegister")}
              </Link>
              <Link
                href="/bolsa"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/15 bg-transparent",
                )}
              >
                {t("ctaLiveDesk")}
              </Link>
              <Link
                href="/login?from=%2Feducation"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
              >
                {t("ctaEducation")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto mt-12 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("deployFoot")}
      </p>
    </div>
  );
}

function ProjectionSignalCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]",
        accentClass,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
