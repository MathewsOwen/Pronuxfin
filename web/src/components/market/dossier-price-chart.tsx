"use client";

import { useMemo } from "react";
import { ProfessionalAreaChart } from "@/components/charts/professional-charts";
import type { AssetHistoryPoint } from "@/lib/market/types";

const MAX_POINTS = 160;
const LABEL_EVERY = 24;

export function DossierPriceChart({
  history,
  locale,
  positive,
  ariaLabel,
  emptyLabel,
}: {
  history: AssetHistoryPoint[];
  locale: string;
  positive: boolean;
  ariaLabel: string;
  emptyLabel: string;
}) {
  const series = useMemo(() => buildPriceSeries(history, locale), [history, locale]);

  return (
    <ProfessionalAreaChart
      data={series}
      locale={locale}
      ariaLabel={ariaLabel}
      accent={positive ? "primary" : "rose"}
      emptyLabel={emptyLabel}
      formatValue={(value) =>
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      }
    />
  );
}

function buildPriceSeries(history: AssetHistoryPoint[], locale: string) {
  if (history.length < 2) return [];
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const step = Math.max(1, Math.floor(sorted.length / MAX_POINTS));
  const sampled = sorted.filter((_, i) => i % step === 0 || i === sorted.length - 1);
  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" });

  return sampled.map((p, i) => ({
    label: i % LABEL_EVERY === 0 || i === sampled.length - 1 ? dateFmt.format(new Date(p.date)) : "",
    value: p.close,
    hint: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(p.date)),
  }));
}
