import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AssetTerminalPage } from "@/components/market/asset-terminal-page";
import type { AppLocale } from "@/i18n/routing";
import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { getUserPortfolioPosition } from "@/lib/user-portfolio/load";
import { buildPositionSnapshot } from "@/lib/user-portfolio/snapshot";
import { isInUserWatchlist } from "@/lib/user-watchlist/load";

export const dynamic = "force-dynamic";

type AssetPageProps = {
  params: Promise<{ symbol: string }>;
};

export async function generateMetadata({
  params,
}: AssetPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("AssetTerminal");
  const clean = symbol.trim().toUpperCase();
  return privateAppMetadata({
    pathname: `/ativo/${clean}`,
    title: t("metaTitle", { symbol: clean }),
    description: t("metaDescription", { symbol: clean }),
    locale,
  });
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { symbol } = await params;
  const clean = symbol.trim().toUpperCase();
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?from=${encodeURIComponent(`/ativo/${clean}`)}`);
  }

  const [dossier, watchlisted, portfolioPosition] = await Promise.all([
    loadAssetDossier(clean),
    isInUserWatchlist(user.id, clean),
    getUserPortfolioPosition(user.id, clean),
  ]);
  const portfolioSnapshot = portfolioPosition
    ? await buildPositionSnapshot(portfolioPosition)
    : null;
  if (!dossier) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  return (
    <AssetTerminalPage
      dossier={dossier}
      locale={locale}
      watchlisted={watchlisted}
      portfolioPosition={portfolioPosition}
      portfolioSnapshot={portfolioSnapshot}
    />
  );
}
