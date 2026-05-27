import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Raiz sem segmento `[locale]` — encaminha para a home localizada. */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
