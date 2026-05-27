import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteOrigin } from "@/lib/page-metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      "msvalidate.01":
        process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
    },
  },
};

type Props = {
  children: ReactNode;
};

/** Pass-through root layout (see `app/[locale]/layout.tsx`). Required by Next.js App Router. */
export default function RootLayout({ children }: Props) {
  return children;
}
