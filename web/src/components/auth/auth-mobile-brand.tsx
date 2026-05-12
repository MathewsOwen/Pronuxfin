"use client";

import { useTranslations } from "next-intl";
import { PronuxFinLogo } from "@/components/brand/pronux-fin-logo";
import { Link } from "@/i18n/navigation";

export function AuthMobileBrand() {
  const t = useTranslations("Nav");
  return (
    <Link href="/" className="inline-flex w-fit text-foreground" aria-label={t("brandHomeAria")}>
      <PronuxFinLogo variant="compact" />
    </Link>
  );
}
