"use client";

import { Loader2, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { CountryFlag } from "@/components/market/country-flag";
import { Link } from "@/i18n/navigation";
import { useGlobalAssetSearch } from "@/hooks/use-global-asset-search";
import type { GlobalAssetSearchHit } from "@/lib/market/global-asset-search-types";
import { cn } from "@/lib/utils";

function hitLabel(hit: GlobalAssetSearchHit, locale: string) {
  if (hit.assetClass === "crypto") {
    return locale === "pt-BR" ? "Cripto" : "Crypto";
  }
  return hit.exchangeLabel ?? (locale === "pt-BR" ? "Ação" : "Equity");
}

export function GlobalAssetSearch({
  className,
  inputClassName,
  autoFocus = false,
  mode = "navigate",
  onSelect,
}: {
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  /** navigate abre /ativo/SYMBOL; select só dispara callback (ex.: carteira). */
  mode?: "navigate" | "select";
  onSelect?: (hit: GlobalAssetSearchHit) => void;
}) {
  const t = useTranslations("GlobalAssetSearch");
  const locale = useLocale();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading, error, hasQuery } = useGlobalAssetSearch(query, open || query.length > 0);

  const showPanel = open && hasQuery;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 140);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className={cn(
            "border-white/15 bg-black/25 pl-10 pr-10 font-mono text-sm",
            inputClassName,
          )}
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label={t("clear")}
          >
            <X className="size-4" />
          </button>
        ) : null}
        {loading ? (
          <Loader2
            className={cn(
              "absolute top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground",
              query ? "right-10" : "right-3",
            )}
            aria-hidden
          />
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-white/12 bg-[oklch(0.14_0.04_262/0.98)] p-2 shadow-2xl backdrop-blur-md"
        >
          {error ? (
            <p className="px-3 py-2 text-xs text-market-down">{t("error")}</p>
          ) : null}
          {!loading && results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{t("empty")}</p>
          ) : null}
          <ul className="space-y-1">
            {results.map((hit) => {
              const row = (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {hit.countryCode ? (
                        <CountryFlag
                          countryCode={hit.countryCode}
                          emojiFallback={hit.flag ?? undefined}
                          size={14}
                        />
                      ) : (
                        <span className="text-base" aria-hidden>
                          {hit.flag ?? "🪙"}
                        </span>
                      )}
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {hit.symbol}
                      </span>
                      {hit.marketCapRank != null ? (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{hit.marketCapRank}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{hit.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {hitLabel(hit, locale)}
                  </span>
                </>
              );

              const className =
                "flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]";

              return (
                <li key={`${hit.assetClass}-${hit.symbol}`}>
                  {mode === "select" ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelect?.(hit);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={className}
                    >
                      {row}
                    </button>
                  ) : (
                    <Link
                      href={`/ativo/${encodeURIComponent(hit.symbol)}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelect?.(hit);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={className}
                    >
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 border-t border-white/[0.06] px-3 pt-2 text-[10px] text-muted-foreground">
            {t("hint")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
