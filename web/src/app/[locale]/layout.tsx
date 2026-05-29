import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { PronuxIntroBootScript } from "@/components/marketing/pronux-intro-boot";
import { AppMotionRoot } from "@/components/providers/app-motion-root";
import { SkipLink } from "@/components/layout/skip-link";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { WebsiteJsonLd } from "@/lib/seo/website-json-ld";
import { getSiteOrigin } from "@/lib/page-metadata";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { getCspNonce } from "@/lib/security/csp-nonce";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteOrigin = getSiteOrigin();

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PRONUXFIN",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  title: {
    default: "PRONUXFIN",
    template: "%s | PRONUXFIN",
  },
  keywords: [
    "PRONUXFIN",
    "fintech",
    "financial infrastructure",
    "infraestrutura financeira",
    "investimentos",
    "investments",
    "Brazil markets",
    "mercado financeiro",
    "market data",
    "Open Finance",
  ],
  authors: [{ name: "PRONUXFIN" }],
  creator: "PRONUXFIN",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const resolvedLocale = locale as AppLocale;
  const messages = await getMessages();
  const tSeo = await getTranslations("Seo");
  const cspNonce = await getCspNonce();

  return (
    <html
      lang={resolvedLocale}
      className={`dark ${inter.variable} ${sora.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background" suppressHydrationWarning>
        <PronuxIntroBootScript nonce={cspNonce} />
        <OrganizationJsonLd
          siteUrl={siteOrigin}
          description={tSeo("siteDescription")}
          nonce={cspNonce}
        />
        <WebsiteJsonLd
          siteUrl={siteOrigin}
          name="PRONUXFIN"
          description={tSeo("siteDescription")}
          nonce={cspNonce}
        />
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <AppMotionRoot>
            <SkipLink />
            {children}
          </AppMotionRoot>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
