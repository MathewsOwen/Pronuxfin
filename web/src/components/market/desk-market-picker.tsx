"use client";

import { CountryFlag } from "@/components/market/country-flag";
import {
  DESK_MARKET_META,
  DESK_MARKET_ORDER,
  type DeskMarketId,
} from "@/lib/market/world-markets";
import { cn } from "@/lib/utils";

type DeskMarketPickerProps = {
  market: DeskMarketId;
  locale: string;
  onSelect: (market: DeskMarketId) => void;
};

function marketLabel(locale: string, id: DeskMarketId): string {
  const meta = DESK_MARKET_META[id];
  return locale === "pt-BR" ? meta.namePt : meta.nameEn;
}

function marketExchange(locale: string, id: DeskMarketId): string {
  const meta = DESK_MARKET_META[id];
  return locale === "pt-BR" ? meta.exchangeLabelPt : meta.exchangeLabelEn;
}

function activeMarketClasses(id: DeskMarketId, active: boolean): string {
  if (!active) {
    return "border-white/15 bg-transparent text-muted-foreground hover:border-primary/25 hover:text-foreground";
  }
  if (id === "br") {
    return "border-primary/35 bg-status-warning/12 text-status-warning ring-1 ring-primary/25";
  }
  return "border-teal-500/50 bg-teal-950/35 text-teal-100 ring-1 ring-teal-500/30";
}

export function DeskMarketPicker({ market, locale, onSelect }: DeskMarketPickerProps) {
  const selectedMeta = DESK_MARKET_META[market];
  const selectedLabel = marketLabel(locale, market);
  const selectedExchange = marketExchange(locale, market);

  return (
    <div className="flex flex-col gap-2">
      {/* Mobile: grade compacta — todos os 20 mercados visíveis sem scroll horizontal */}
      <div
        className="grid grid-cols-5 gap-1.5 sm:hidden"
        role="group"
        aria-label={selectedLabel}
      >
        {DESK_MARKET_ORDER.map((id) => {
          const meta = DESK_MARKET_META[id];
          const label = marketLabel(locale, id);
          const exchange = marketExchange(locale, id);
          const active = market === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={active}
              aria-label={`${label} · ${exchange}`}
              title={`${label} · ${exchange}`}
              className={cn(
                "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 transition-colors",
                activeMarketClasses(id, active),
              )}
            >
              <CountryFlag
                countryCode={meta.countryCode}
                emojiFallback={meta.flag}
                size={18}
              />
              <span className="font-mono text-[8px] font-semibold leading-none tracking-wide opacity-80">
                {meta.countryCode}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop: pílulas com bandeira + nome */}
      <div className="hidden flex-wrap gap-2 sm:flex">
        {DESK_MARKET_ORDER.map((id) => {
          const meta = DESK_MARKET_META[id];
          const label = marketLabel(locale, id);
          const exchange = marketExchange(locale, id);
          const active = market === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={active}
              title={`${label} · ${exchange}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors",
                activeMarketClasses(id, active),
              )}
            >
              <CountryFlag
                countryCode={meta.countryCode}
                emojiFallback={meta.flag}
                size={13}
                title={label}
              />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: confirma mercado ativo por nome (bandeira sozinha não basta para todos) */}
      <p className="flex flex-col items-center gap-0.5 sm:hidden">
        <span className="flex items-center justify-center gap-1.5 text-center text-xs">
          <CountryFlag
            countryCode={selectedMeta.countryCode}
            emojiFallback={selectedMeta.flag}
            size={14}
          />
          <span className="font-medium text-foreground">{selectedLabel}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{selectedExchange}</span>
        </span>
        <span className="text-[10px] text-muted-foreground">{selectedMeta.benchmarkIndex}</span>
      </p>
    </div>
  );
}
