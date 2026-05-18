const SCHEMA = "https://schema.org";

export function WebsiteJsonLd({
  siteUrl,
  name,
  description,
}: {
  siteUrl: string;
  name: string;
  description: string;
}) {
  const origin = siteUrl.replace(/\/$/, "");
  const payload = {
    "@context": SCHEMA,
    "@type": "WebSite",
    name,
    url: origin,
    description,
    publisher: {
      "@type": "Organization",
      name,
      url: origin,
      logo: `${origin}/icon.svg`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
