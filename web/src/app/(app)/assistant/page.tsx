import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AssistantAiHub } from "@/components/assistant/assistant-ai-hub";
import type { AppLocale } from "@/i18n/routing";
import { privateAppMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.assistant");
  return privateAppMetadata({
    pathname: "/assistant",
    title: t("title"),
    description: t("description"),
    locale,
  });
}

export default function AssistantPage() {
  return <AssistantAiHub />;
}
