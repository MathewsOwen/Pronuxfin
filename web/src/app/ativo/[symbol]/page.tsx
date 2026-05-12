import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AssetTerminalPage } from "@/components/market/asset-terminal-page";
import { AppShell } from "@/components/layout/app-shell";
import type { AppLocale } from "@/i18n/routing";
import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
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

  const [dossier, watchlisted] = await Promise.all([
    loadAssetDossier(clean),
    isInUserWatchlist(user.id, clean),
  ]);
  if (!dossier) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  return (
    <AppShell user={user}>
      <AssetTerminalPage dossier={dossier} locale={locale} watchlisted={watchlisted} />
    </AppShell>
  );
}
