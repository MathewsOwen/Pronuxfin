const SCHEMA = "https://schema.org";

export function OrganizationJsonLd({
  siteUrl,
  description,
}: {
  siteUrl: string;
  /** Canonical product narrative for the resolved UI locale (e.g. `Seo.siteDescription`). */
  description: string;
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
