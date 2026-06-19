import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  needsFullI18nCatalog,
  pickMessageNamespaces,
  PUBLIC_I18N_NAMESPACES,
  stripLocalePathname,
} from "@/i18n/message-scopes";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const allMessages = (await import(`../../messages/${locale}.json`)).default;
  const pathname = (await headers()).get("x-middleware-pathname")?.trim() ?? "/";
  const barePath = stripLocalePathname(pathname, routing.locales);
  const messages = needsFullI18nCatalog(barePath)
    ? allMessages
    : pickMessageNamespaces(allMessages, PUBLIC_I18N_NAMESPACES);

  return {
    locale,
    messages,
  };
});
