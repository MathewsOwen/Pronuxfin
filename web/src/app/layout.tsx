import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Inter, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/layout/skip-link";
import { AppMotionRoot } from "@/components/providers/app-motion-root";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { getSiteOrigin } from "@/lib/page-metadata";
import "./globals.css";

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

/** Defaults globais; título/descrição/OG específicos ficam nas páginas (`marketingMetadata`, etc.). */
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const tSeo = await getTranslations("Seo");

  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} ${sora.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <OrganizationJsonLd siteUrl={siteOrigin} description={tSeo("siteDescription")} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppMotionRoot>
            <SkipLink />
            {children}
          </AppMotionRoot>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
