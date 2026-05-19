import { getTranslations } from "next-intl/server";
import { buildFaqPageJsonLd } from "@/lib/seo/faq-schema";
import { absoluteUrl } from "@/lib/page-metadata";

const FAQ_KEYS = ["live", "advice", "sources", "account", "ai"] as const;

export async function HomeFaqJsonLd() {
  const t = await getTranslations("HomeFaq");
  const items = FAQ_KEYS.map((key) => ({
    question: t(`items.${key}.q`),
    answer: t(`items.${key}.a`),
  }));

  const json = buildFaqPageJsonLd(items, absoluteUrl("/"));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
