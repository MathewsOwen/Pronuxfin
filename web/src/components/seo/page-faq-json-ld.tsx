import { getTranslations } from "next-intl/server";
import { absoluteUrl } from "@/lib/page-metadata";
import { buildFaqPageJsonLd, type FaqItem } from "@/lib/seo/faq-schema";
import { getCspNonce } from "@/lib/security/csp-nonce";

type PageFaqJsonLdProps = {
  pathname: string;
  /** Namespace next-intl com `items.{key}.q` e `items.{key}.a`. */
  namespace: string;
  keys: readonly string[];
};

export async function PageFaqJsonLd({ pathname, namespace, keys }: PageFaqJsonLdProps) {
  const nonce = await getCspNonce();
  const t = await getTranslations(namespace);
  const items: FaqItem[] = keys.map((key) => ({
    question: t(`items.${key}.q`),
    answer: t(`items.${key}.a`),
  }));

  const json = buildFaqPageJsonLd(items, absoluteUrl(pathname));

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(json).replace(/</g, "\\u003c"),
      }}
    />
  );
}
