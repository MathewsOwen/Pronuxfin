import { AppShell } from "@/components/layout/app-shell";
import { QuotesStreamProvider } from "@/components/market/quotes-stream-provider";
import { getPlatformStatus } from "@/lib/platform-status";
import type { SessionUser } from "@/lib/session";

/** Mesa privada em rotas públicas (ex.: notícias) sem perder a sessão. */
export async function AuthenticatedPublicChrome({
  user,
  children,
  quotesStream = false,
}: {
  user: SessionUser;
  children: React.ReactNode;
  /** Rotas com mesa ao vivo (`BolsaLiveHub`, faixa de cotações, etc.). */
  quotesStream?: boolean;
}) {
  const platform = await getPlatformStatus();
  const body = quotesStream ? (
    <QuotesStreamProvider>{children}</QuotesStreamProvider>
  ) : (
    children
  );
  return (
    <AppShell user={user} degradedReason={platform.degraded ? platform.reason : undefined}>
      {body}
    </AppShell>
  );
}
