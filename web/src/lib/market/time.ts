const DEFAULT_LOCALE = "pt-BR";

function normalizeIntlLocale(locale: string): string {
  const candidate = locale.replace(/_/g, "-").trim();
  if (!candidate) return DEFAULT_LOCALE;
  try {
    /* Validate before building RelativeTimeFormat (throws RangeError for unknown tags). */
    new Intl.RelativeTimeFormat(candidate, { numeric: "auto" });
    return candidate;
  } catch {
    const base = candidate.split("-")[0] ?? "";
    if (base.length > 0) {
      try {
        new Intl.RelativeTimeFormat(base, { numeric: "auto" });
        return base;
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_LOCALE;
  }
}

/** Relative time aligned with UI locale (`useLocale()` from next-intl). */
export function formatRelativeTime(
  iso: string | null,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!iso) return "—";
  const elapsedSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(elapsedSec)) return "—";

  const tag = normalizeIntlLocale(locale);
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });

  const ago = (n: number, u: Intl.RelativeTimeFormatUnit) =>
    rtf.format(-Math.max(1, Math.round(n)), u);

  if (elapsedSec < 45) {
    const s = Math.max(1, elapsedSec);
    return rtf.format(-s, "second");
  }
  const minutes = elapsedSec / 60;
  if (minutes < 60) return ago(minutes, "minute");
  const hours = minutes / 60;
  if (hours < 48) return ago(hours, "hour");
  const days = hours / 24;
  return ago(days, "day");
}

/** @deprecated prefer `formatRelativeTime(iso, locale)` */
export function formatRelativeTimePt(iso: string | null): string {
  return formatRelativeTime(iso, DEFAULT_LOCALE);
}
