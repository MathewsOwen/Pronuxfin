/** Referência operacional · fusos em America/Sao_Paulo (BRT, UTC−3). */
export type CashDeskPhase = "weekend" | "pre" | "regular" | "post";

export type CashDeskSnapshot = {
  phase: CashDeskPhase;
};

/** Janela de pregão simplificada para UX — feriados locais não estão no calendário. */
export function getCashDeskSnapshot(now = new Date()): CashDeskSnapshot {
  const weekday = now.toLocaleDateString("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  });

  const hm = now.toLocaleTimeString("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hStr, mStr] = hm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const minutes = h * 60 + m;

  if (weekday === "Sat" || weekday === "Sun") {
    return { phase: "weekend" };
  }

  if (minutes < 10 * 60) {
    return { phase: "pre" };
  }

  if (minutes < 17 * 60 + 55) {
    return { phase: "regular" };
  }

  return { phase: "post" };
}

/** Relógio operacional BRT; `localeTag` segue `useLocale()` da UI (`pt-BR` | `en`). */
export function formatSaoPauloClock(
  now = new Date(),
  withSeconds = true,
  localeTag = "pt-BR",
): string {
  return now.toLocaleTimeString(localeTag, {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  });
}
