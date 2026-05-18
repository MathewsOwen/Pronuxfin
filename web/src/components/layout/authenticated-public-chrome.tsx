import { AppShell } from "@/components/layout/app-shell";
import { getPlatformStatus } from "@/lib/platform-status";
import type { SessionUser } from "@/lib/session";

/** Mesa privada em rotas públicas (ex.: notícias) sem perder a sessão. */
export async function AuthenticatedPublicChrome({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const platform = await getPlatformStatus();
  return (
    <AppShell user={user} degradedReason={platform.degraded ? platform.reason : undefined}>
      {children}
    </AppShell>
  );
}
