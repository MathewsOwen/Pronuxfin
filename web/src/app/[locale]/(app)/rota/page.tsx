import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { FinancialRouteDesk } from "@/components/financial-route/financial-route-desk";
import type { AppLocale } from "@/i18n/routing";
import { MacroRouteBanner } from "@/components/financial-route/macro-route-banner";
import {
  evaluateUserFinancialRoutes,
  listActiveRouteAlerts,
  syncRouteAlerts,
} from "@/lib/financial-route/load";
import { loadMacroRouteContextForUser } from "@/lib/financial-route/macro-route-context";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("FinancialRoute");
  return privateAppMetadata({
    pathname: "/rota",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
  });
}

export default async function RotaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=%2Frota");
  }

  const locale = await getLocale();
  const macro = await loadMacroRouteContextForUser(user.id);
  const evaluated = await evaluateUserFinancialRoutes(user.id, { macro });
  await syncRouteAlerts(user.id, evaluated);
  const alerts = await listActiveRouteAlerts(user.id);

  return (
    <>
      <div className="mx-auto max-w-4xl px-0 pb-4">
        <MacroRouteBanner macro={macro} locale={locale} />
      </div>
      <FinancialRouteDesk
        locale={locale}
        initialRoutes={evaluated}
        initialAlerts={alerts}
        macro={macro}
      />
    </>
  );
}
