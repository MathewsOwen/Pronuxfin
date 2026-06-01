import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";
import { cn } from "@/lib/utils";

export async function MarketStatusBanner() {
  const t = await getTranslations("MarketStatus");
  const caps = evaluateMarketCapabilities();

  const issues: string[] = [];
  // Chaves de mercado ausentes: aviso só para operador (dev ou flag explícita).
  const showOperatorHints =
    process.env.NODE_ENV !== "production" ||
    process.env.SHOW_MARKET_STATUS === "1";

  if (showOperatorHints) {
    if (!caps.brapi.configured) issues.push(t("missingBrapi"));
    if (!caps.fmp.configured) issues.push(t("missingFmp"));
  }
  if (caps.simulationAllowed) issues.push(t("simulationOn"));

  if (issues.length === 0) return null;

  const showInDev = process.env.SHOW_MARKET_STATUS === "1";
  if (process.env.NODE_ENV !== "production" && !showInDev && !caps.simulationAllowed) {
    return null;
  }

  const partial =
    showOperatorHints && (caps.brapi.configured || caps.fmp.configured);

  return (
    <div
      role="status"
      className={cn(
        "border-b px-4 py-3 sm:px-6",
        partial
          ? "border-status-warning/25 bg-status-warning/8"
          : "border-status-degraded/25 bg-status-degraded/10",
      )}
    >
      <div className="mx-auto flex max-w-6xl gap-3 text-sm">
        <AlertTriangle
          className={cn(
            "mt-0.5 size-4 shrink-0",
            partial ? "text-status-warning" : "text-status-degraded",
          )}
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">{t("title")}</p>
          <ul className="list-inside list-disc text-muted-foreground">
            {issues.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
      </div>
    </div>
  );
}
