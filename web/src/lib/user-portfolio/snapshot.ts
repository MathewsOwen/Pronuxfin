import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import type { UserPortfolioPositionView } from "@/lib/user-portfolio/load";

export type PortfolioPositionSnapshot = {
  position: UserPortfolioPositionView;
  companyName: string;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number;
  totalPnl: number | null;
  totalPnlPercent: number | null;
  dayPnl: number | null;
  dayPnlPercent: number | null;
  changePercent: number | null;
};

export type PortfolioSummary = {
  currency: string;
  positionCount: number;
  marketValue: number;
  costBasis: number;
  totalPnl: number;
  totalPnlPercent: number | null;
  dayPnl: number;
  gainers: PortfolioPositionSnapshot[];
  losers: PortfolioPositionSnapshot[];
  positions: PortfolioPositionSnapshot[];
};

function readDayChange(price: number | null, previousClose: number | null) {
  if (price == null || previousClose == null || previousClose <= 0) return null;
  return price - previousClose;
}

export async function buildPortfolioSummary(
  positions: UserPortfolioPositionView[],
): Promise<PortfolioSummary | null> {
  if (positions.length === 0) return null;

  const dossiers = await Promise.all(
    positions.map((p) => loadAssetDossier(p.symbol)),
  );

  const snapshots: PortfolioPositionSnapshot[] = [];

  for (let i = 0; i < positions.length; i += 1) {
    const position = positions[i]!;
    const dossier = dossiers[i];
    const price = dossier?.quote.regularMarketPrice ?? null;
    const previousClose =
      dossier?.regularMarketPreviousClose ?? dossier?.history.at(-2)?.close ?? null;
    const costBasis = position.quantity * position.averageCost;
    const marketValue = price != null ? position.quantity * price : null;
    const totalPnl = marketValue != null ? marketValue - costBasis : null;
    const totalPnlPercent =
      totalPnl != null && costBasis > 0 ? (totalPnl / costBasis) * 100 : null;
    const dayDelta = readDayChange(price, previousClose);
    const dayPnl = dayDelta != null ? dayDelta * position.quantity : null;
    const dayPnlPercent =
      dayDelta != null && previousClose != null && previousClose > 0
        ? (dayDelta / previousClose) * 100
        : null;

    snapshots.push({
      position,
      companyName: dossier?.companyName ?? position.symbol,
      currentPrice: price,
      marketValue,
      costBasis,
      totalPnl,
      totalPnlPercent,
      dayPnl,
      dayPnlPercent,
      changePercent: dossier?.quote.regularMarketChangePercent ?? dayPnlPercent,
    });
  }

  const primaryCurrency = positions[0]?.currency ?? "BRL";
  let marketValue = 0;
  let costBasis = 0;
  let dayPnl = 0;

  for (const s of snapshots) {
    if (s.marketValue != null) marketValue += s.marketValue;
    costBasis += s.costBasis;
    if (s.dayPnl != null) dayPnl += s.dayPnl;
  }

  const totalPnl = marketValue - costBasis;
  const totalPnlPercent = costBasis > 0 ? (totalPnl / costBasis) * 100 : null;

  const sortedByDay = [...snapshots].sort(
    (a, b) => (b.dayPnlPercent ?? -999) - (a.dayPnlPercent ?? -999),
  );
  const gainers = sortedByDay.filter((s) => (s.dayPnlPercent ?? 0) > 0).slice(0, 3);
  const losers = [...sortedByDay]
    .reverse()
    .filter((s) => (s.dayPnlPercent ?? 0) < 0)
    .slice(0, 3);

  return {
    currency: primaryCurrency,
    positionCount: snapshots.length,
    marketValue,
    costBasis,
    totalPnl,
    totalPnlPercent,
    dayPnl,
    gainers,
    losers,
    positions: snapshots,
  };
}

export async function buildPositionSnapshot(
  position: UserPortfolioPositionView,
): Promise<PortfolioPositionSnapshot> {
  const summary = await buildPortfolioSummary([position]);
  const snap = summary?.positions[0];
  if (snap) return snap;

  const costBasis = position.quantity * position.averageCost;
  return {
    position,
    companyName: position.symbol,
    currentPrice: null,
    marketValue: null,
    costBasis,
    totalPnl: null,
    totalPnlPercent: null,
    dayPnl: null,
    dayPnlPercent: null,
    changePercent: null,
  };
}
