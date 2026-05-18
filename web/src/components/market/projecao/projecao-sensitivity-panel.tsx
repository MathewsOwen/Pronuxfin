"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Grid3x3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildSensitivityMatrix, type WealthProjectionInput } from "@/lib/projecao/scenario-projection";
import { cn } from "@/lib/utils";

export function ProjecaoSensitivityPanel({ input }: { input: WealthProjectionInput }) {
  const t = useTranslations("ProjecaoHub.sensitivity");
  const locale = useLocale();

  const monthlySteps = useMemo(() => {
    const base = input.monthlyContribution;
    return [0, base * 0.5, base, base * 1.5, base * 2].map((v) => Math.round(v / 50) * 50);
  }, [input.monthlyContribution]);

  const returnSteps = useMemo(() => {
    const base = input.baseAnnualReturnPct;
    return [base - 4, base - 2, base, base + 2, base + 4].map((v) =>
      Math.round(Math.max(-5, Math.min(35, v)) * 10) / 10,
    );
  }, [input.baseAnnualReturnPct]);

  const cells = useMemo(
    () =>
      buildSensitivityMatrix(
        { initial: input.initial, years: input.years },
        monthlySteps,
        returnSteps,
      ),
    [input.initial, input.years, monthlySteps, returnSteps],
  );

  const maxBalance = Math.max(...cells.map((c) => c.finalBalance), 1);

  const money = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      notation: v >= 100_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(v);

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Grid3x3 className="size-5 text-sky-400" aria-hidden />
          <CardTitle className="font-heading">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                {t("colContribution")}
              </th>
              {returnSteps.map((r) => (
                <th
                  key={r}
                  className="px-2 py-2 text-center font-mono text-xs text-muted-foreground"
                >
                  {r.toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlySteps.map((monthly) => (
              <tr key={monthly} className="border-t border-white/5">
                <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                  {money(monthly)}
                  <span className="block text-[10px] opacity-70">{t("perMonth")}</span>
                </td>
                {returnSteps.map((rate) => {
                  const cell = cells.find(
                    (c) => c.monthlyContribution === monthly && c.annualReturnPct === rate,
                  );
                  const value = cell?.finalBalance ?? 0;
                  const intensity = value / maxBalance;
                  return (
                    <td key={`${monthly}-${rate}`} className="px-1 py-1">
                      <div
                        className={cn(
                          "rounded-lg px-2 py-2 text-center font-mono text-[11px] font-semibold tabular-nums",
                          intensity > 0.85
                            ? "bg-emerald-500/25 text-emerald-200"
                            : intensity > 0.55
                              ? "bg-primary/20 text-primary-foreground"
                              : intensity > 0.3
                                ? "bg-white/[0.06] text-foreground"
                                : "bg-white/[0.03] text-muted-foreground",
                        )}
                      >
                        {money(value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted-foreground">{t("footnote")}</p>
      </CardContent>
    </Card>
  );
}
