import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { RegisterForm } from "@/components/auth/register-form";
import type { AppLocale } from "@/i18n/routing";
import { marketingMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Seo.register");
  return marketingMetadata({
    pathname: "/register",
    title: t("title"),
    description: t("description"),
    locale,
  });
}

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <RegisterForm />
    </AuthPageLayout>
  );
}
