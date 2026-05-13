import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { WatchlistAlertCenterPage } from "@/components/alerts/watchlist-alert-center-page";
import type { AppLocale } from "@/i18n/routing";
import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { buildWatchlistAlertCenter } from "@/lib/user-watchlist/briefing";
import {
  listLatestWatchlistSignalSnapshots,
  listRecentWatchlistSignalSnapshots,
} from "@/lib/user-watchlist/history";
import { buildWatchlistRadarSignal } from "@/lib/user-watchlist/intelligence";
import { listUserWatchlist } from "@/lib/user-watchlist/load";
import { listEffectiveWatchlistAlertRules } from "@/lib/user-watchlist/rules";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const tShell = await getTranslations("AppShell");
  const tAlerts = await getTranslations("AlertsCenter");
  return privateAppMetadata({
    pathname: "/alerts",
    title: tShell("alerts"),
    description: tAlerts("metaDescription"),
    locale,
  });
}

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=%2Falerts");
  }

  const [locale, watchlistItems, effectiveRules, recentSignals] = await Promise.all([
    getLocale(),
    listUserWatchlist(user.id),
    listEffectiveWatchlistAlertRules(user.id),
    listRecentWatchlistSignalSnapshots(user.id, 18),
  ]);

  const trackedSymbols = watchlistItems.slice(0, 12).map((item) => item.symbol);
  const dossiers = (
    await Promise.all(trackedSymbols.map((symbol) => loadAssetDossier(symbol)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const previousSignals = await listLatestWatchlistSignalSnapshots(
    user.id,
    dossiers.map((item) => item.symbol),
  );

  const activeEvents = buildWatchlistAlertCenter(
    dossiers.map((dossier) => ({
      dossier,
      signal: buildWatchlistRadarSignal(dossier, effectiveRules),
      previous: previousSignals[dossier.symbol],
    })),
    effectiveRules,
  );

  return (
    <WatchlistAlertCenterPage
      watchlistItems={watchlistItems}
      initialRules={effectiveRules}
      recentSignals={recentSignals}
      activeEvents={activeEvents}
      locale={locale}
    />
  );
}
