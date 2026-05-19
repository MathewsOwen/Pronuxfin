import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteOrigin } from "@/lib/page-metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
};

type Props = {
  children: ReactNode;
};

/** Pass-through root layout (see `app/[locale]/layout.tsx`). Required by Next.js App Router. */
export default function RootLayout({ children }: Props) {
  return children;
}
