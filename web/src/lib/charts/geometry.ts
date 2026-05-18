export type ChartPadding = { top: number; right: number; bottom: number; left: number };

export const DEFAULT_CHART_PAD: ChartPadding = {
  top: 16,
  right: 12,
  bottom: 32,
  left: 52,
};

export function chartInnerSize(
  width: number,
  height: number,
  pad: ChartPadding = DEFAULT_CHART_PAD,
) {
  return {
    width: Math.max(width - pad.left - pad.right, 1),
    height: Math.max(height - pad.top - pad.bottom, 1),
    pad,
  };
}

export function linearScale(value: number, min: number, max: number, range: number) {
  if (max <= min) return range / 2;
  return ((value - min) / (max - min)) * range;
}

export function niceAxisMax(value: number, padding = 1.08) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const raw = value * padding;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return Math.ceil(raw / magnitude) * magnitude;
}

export function formatAxisNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
  }).format(value);
}

export function formatAxisPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}
