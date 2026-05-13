import type { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

/** Pass-through root layout (see `app/[locale]/layout.tsx`). Required by Next.js App Router. */
export default function RootLayout({ children }: Props) {
  return children;
}
