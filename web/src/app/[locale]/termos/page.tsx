import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Legal.terms");
  return marketingMetadata({
    pathname: "/termos",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
  });
}

export default function TermsPage() {
  return <LegalDocumentLayout kind="terms" />;
}
