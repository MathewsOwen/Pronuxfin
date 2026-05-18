import { getCurrentUser } from "@/lib/session";
import { SiteHeader } from "@/components/marketing/site-header";

export async function SiteHeaderShell({
  showLanguageSwitcher = false,
}: {
  showLanguageSwitcher?: boolean;
}) {
  const user = await getCurrentUser();
  return <SiteHeader showLanguageSwitcher={showLanguageSwitcher} user={user} />;
}
