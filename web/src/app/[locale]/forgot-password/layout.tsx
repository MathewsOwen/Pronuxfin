import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.forgot");
  return marketingMetadata({
    pathname: "/forgot-password",
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: true },
    locale,
  });
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
