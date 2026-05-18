import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PortfolioClearAllButton } from "@/components/tools/portfolio-clear-all-button";
import { PortfolioEmptyHero } from "@/components/tools/portfolio-empty-hero";
import { PortfolioManager } from "@/components/tools/portfolio-manager";
import { PortfolioSummaryPanel } from "@/components/tools/portfolio-summary-panel";
import { PortfolioWelcomeBanner } from "@/components/tools/portfolio-welcome-banner";
import type { AppLocale } from "@/i18n/routing";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { listUserPortfolioPositions } from "@/lib/user-portfolio/load";
import { buildPortfolioSummary } from "@/lib/user-portfolio/snapshot";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Portfolio");
  return privateAppMetadata({
    pathname: "/carteira",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
  });
}

type CarteiraPageProps = {
  searchParams: Promise<{
    symbol?: string;
    price?: string;
    quantity?: string;
    averageCost?: string;
    welcome?: string;
  }>;
};

export default async function CarteiraPage({ searchParams }: CarteiraPageProps) {
  const t = await getTranslations("Portfolio");
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=%2Fcarteira");

  const query = await searchParams;
  const showWelcome = query.welcome === "1";
  const initialSymbol = query.symbol?.trim().toUpperCase() ?? "";
  const priceRaw = query.price?.trim();
  const initialPrice =
    priceRaw != null && priceRaw !== "" && Number.isFinite(Number(priceRaw))
      ? Number(priceRaw)
      : null;
  const qtyRaw = query.quantity?.trim();
  const initialQuantity =
    qtyRaw != null && qtyRaw !== "" && Number.isFinite(Number(qtyRaw)) && Number(qtyRaw) > 0
      ? Number(qtyRaw)
      : null;
  const costRaw = query.averageCost?.trim();
  const initialAverageCost =
    costRaw != null && costRaw !== "" && Number.isFinite(Number(costRaw)) && Number(costRaw) > 0
      ? Number(costRaw)
      : null;

  const positions = await listUserPortfolioPositions(user.id);
  const isEmpty = positions.length === 0;
  const editingExisting =
    initialSymbol.length > 0 &&
    positions.some((p) => p.symbol === initialSymbol);
  const summary = !isEmpty ? await buildPortfolioSummary(positions) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {showWelcome ? <PortfolioWelcomeBanner /> : null}
      {initialSymbol ? (
        <p className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
          {editingExisting ? t("prefillUpdateHint", { symbol: initialSymbol }) : t("prefillHint", { symbol: initialSymbol })}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("pageLead")}</p>
        </div>
        <PortfolioClearAllButton positionCount={positions.length} />
      </div>

      {isEmpty ? <PortfolioEmptyHero /> : null}

      <PortfolioManager
        key={`${initialSymbol}|${initialQuantity ?? ""}|${initialAverageCost ?? ""}|${editingExisting}|${isEmpty}`}
        initialSymbol={initialSymbol}
        initialPrice={initialPrice}
        initialQuantity={initialQuantity}
        initialAverageCost={initialAverageCost}
        editingExisting={editingExisting}
        isFirstPosition={isEmpty}
      />

      {summary ? <PortfolioSummaryPanel summary={summary} locale={locale} /> : null}
    </div>
  );
}
