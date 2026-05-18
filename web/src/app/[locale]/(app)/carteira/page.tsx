import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PortfolioManager } from "@/components/tools/portfolio-manager";
import { PortfolioSummaryPanel } from "@/components/tools/portfolio-summary-panel";
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
  searchParams: Promise<{ symbol?: string; price?: string; quantity?: string; averageCost?: string }>;
};

export default async function CarteiraPage({ searchParams }: CarteiraPageProps) {
  const t = await getTranslations("Portfolio");
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=%2Fcarteira");

  const query = await searchParams;
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
  const editingExisting =
    initialSymbol.length > 0 &&
    positions.some((p) => p.symbol === initialSymbol);
  const summary = positions.length > 0 ? await buildPortfolioSummary(positions) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {initialSymbol ? (
        <p className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
          {t("prefillHint", { symbol: initialSymbol })}
        </p>
      ) : null}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("pageLead")}</p>
      </div>

      <PortfolioManager
        key={`${initialSymbol}|${initialQuantity ?? ""}|${initialAverageCost ?? ""}|${editingExisting}`}
        initialSymbol={initialSymbol}
        initialPrice={initialPrice}
        initialQuantity={initialQuantity}
        initialAverageCost={initialAverageCost}
        editingExisting={editingExisting}
      />

      {summary ? (
        <PortfolioSummaryPanel summary={summary} locale={locale} />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
