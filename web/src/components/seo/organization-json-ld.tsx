const SCHEMA = "https://schema.org";

export function OrganizationJsonLd({
  siteUrl,
  description,
  nonce,
}: {
  siteUrl: string;
  /** Canonical product narrative for the resolved UI locale (e.g. `Seo.siteDescription`). */
  description: string;
  nonce?: string;
}) {
  const payload = {
    "@context": SCHEMA,
    "@type": "Organization",
    name: "PRONUXFIN",
    url: siteUrl,
    description,
    logo: `${siteUrl.replace(/\/$/, "")}/icon.svg`,
  };

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
