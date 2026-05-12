import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PrivateComparatorPage } from "@/components/market/private-comparator-page";
import type { AppLocale } from "@/i18n/routing";
import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { listLatestWatchlistSignalSnapshots } from "@/lib/user-watchlist/history";
import {
  isValidWatchlistSymbol,
  listUserWatchlist,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";
import { listEffectiveWatchlistAlertRules } from "@/lib/user-watchlist/rules";

export const dynamic = "force-dynamic";

type ComparePageProps = {
  searchParams: Promise<{
    symbols?: string | string[];
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const tShell = await getTranslations("AppShell");
  const tCompare = await getTranslations("Comparator");
  return privateAppMetadata({
    pathname: "/compare",
    title: tShell("compare"),
    description: tCompare("metaDescription"),
    locale,
  });
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=%2Fcompare");
  }

  const [locale, params, watchlistItems, effectiveRules] = await Promise.all([
    getLocale(),
    searchParams,
    listUserWatchlist(user.id),
    listEffectiveWatchlistAlertRules(user.id),
  ]);

  const selectedSymbols = resolveSelectedSymbols(params.symbols, watchlistItems);
  const dossiers = (
    await Promise.all(selectedSymbols.map((symbol) => loadAssetDossier(symbol)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const previousSignals = await listLatestWatchlistSignalSnapshots(
    user.id,
    dossiers.map((item) => item.symbol),
  );

  return (
    <PrivateComparatorPage
      watchlistItems={watchlistItems}
      selectedSymbols={dossiers.map((item) => item.symbol)}
      dossiers={dossiers}
      previousSignals={previousSignals}
      effectiveRules={effectiveRules}
      locale={locale}
    />
  );
}

function resolveSelectedSymbols(
  raw: string | string[] | undefined,
  watchlistItems: Array<{ symbol: string }>,
) {
  const incoming = Array.isArray(raw) ? raw.join(",") : raw ?? "";
  const parsed = incoming
    .split(/[,\s]+/)
    .map(normalizeWatchlistSymbol)
    .filter(isValidWatchlistSymbol);

  const unique = [...new Set(parsed)].slice(0, 4);
  if (unique.length > 0) return unique;
  return watchlistItems.slice(0, 4).map((item) => item.symbol);
}
