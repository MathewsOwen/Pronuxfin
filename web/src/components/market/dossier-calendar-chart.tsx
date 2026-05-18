"use client";

import { useMemo } from "react";
import { ProfessionalBarChart } from "@/components/charts/professional-charts";
import type { CalendarYearReturn } from "@/lib/market/types";

export function DossierCalendarChart({
  rows,
  locale,
  ariaLabel,
  emptyLabel,
}: {
  rows: CalendarYearReturn[];
  locale: string;
  ariaLabel: string;
  emptyLabel: string;
}) {
  const data = useMemo(
    () =>
      [...rows]
        .sort((a, b) => a.year - b.year)
        .map((row) => ({
          label: String(row.year),
          value: row.returnPct,
          tone: row.returnPct >= 0 ? ("emerald" as const) : ("rose" as const),
        })),
    [rows],
  );

  const formatPct = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      signDisplay: "exceptZero",
      maximumFractionDigits: 1,
    }).format(value / 100);

  return (
    <ProfessionalBarChart
      data={data}
      locale={locale}
      ariaLabel={ariaLabel}
      valueMode="number"
      accent="primary"
      formatValue={formatPct}
      emptyLabel={emptyLabel}
    />
  );
}
