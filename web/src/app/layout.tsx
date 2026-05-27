import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteOrigin } from "@/lib/page-metadata";
import "./globals.css";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  ...(googleSiteVerification || bingSiteVerification
    ? {
        verification: {
          ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
          ...(bingSiteVerification
            ? { other: { "msvalidate.01": bingSiteVerification } }
            : {}),
        },
      }
    : {}),
};

type Props = {
  children: ReactNode;
};

/** Pass-through root layout (see `app/[locale]/layout.tsx`). Required by Next.js App Router. */
export default function RootLayout({ children }: Props) {
  return children;
}
