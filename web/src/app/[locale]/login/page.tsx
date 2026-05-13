import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { LoginForm } from "@/components/auth/login-form";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.login");
  return marketingMetadata({
    pathname: "/login",
    title: t("title"),
    description: t("description"),
    locale,
  });
}

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <Suspense
        fallback={<div className="skeleton-shimmer h-96 rounded-xl bg-muted/25 ring-1 ring-white/10" />}
      >
        <LoginForm />
      </Suspense>
    </AuthPageLayout>
  );
}
