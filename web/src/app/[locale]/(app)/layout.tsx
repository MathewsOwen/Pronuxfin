import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MaintenanceLockScreen } from "@/components/maintenance/maintenance-lock-screen";
import { getPlatformStatus } from "@/lib/platform-status";
import { evaluateProductionReadiness } from "@/lib/production-readiness";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Painel",
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const readiness = await evaluateProductionReadiness();
  if (readiness.enabled && !readiness.ok) {
    return <MaintenanceLockScreen readiness={readiness} />;
  }

  const platform = await getPlatformStatus();
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    const path = (await headers()).get("x-middleware-pathname")?.trim();
    if (path && path !== "/login" && path !== "/register") {
      redirect(`/login?from=${encodeURIComponent(path)}`);
    }
    redirect("/login");
  }

  return <AppShell user={user} degradedReason={platform.degraded ? platform.reason : undefined}>{children}</AppShell>;
}
