import type { ReactNode } from "react";
import { AuthenticatedPublicChrome } from "@/components/layout/authenticated-public-chrome";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getCurrentUser } from "@/lib/session";

/** Chrome persistente para mesas públicas — evita remontar header, ticker e backdrop a cada rota. */
export default async function MarketingDeskLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    return (
      <AuthenticatedPublicChrome user={user}>{children}</AuthenticatedPublicChrome>
    );
  }

  return (
    <MarketingShell ticker>
      {children}
    </MarketingShell>
  );
}
