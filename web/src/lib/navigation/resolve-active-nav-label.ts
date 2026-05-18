import { APP_NAV_GROUPS, flattenAppNavItems } from "@/lib/navigation/app-nav";

export function resolveActiveNavLabel(pathname: string, t: (key: string) => string): string {
  const match = flattenAppNavItems().find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  if (match) return t(match.labelKey);
  const segment = pathname.split("/").filter(Boolean).pop();
  return segment ? segment : t("unknownPage");
}
