import { buildArticleJsonLd, buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/article-schema";
import { getCspNonce } from "@/lib/security/csp-nonce";

type ArticleJsonLdProps = {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  breadcrumbs?: BreadcrumbItem[];
};

export async function ArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  breadcrumbs,
}: ArticleJsonLdProps) {
  const nonce = await getCspNonce();
  const article = buildArticleJsonLd({ headline, description, url, datePublished });
  const breadcrumb = breadcrumbs?.length
    ? buildBreadcrumbJsonLd(breadcrumbs)
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(article).replace(/</g, "\\u003c"),
        }}
      />
      {breadcrumb ? (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
    </>
  );
}
