import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ShieldCheck, UserRound } from "lucide-react";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import type { AppLocale } from "@/i18n/routing";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { displayNameForUser, initialsForUser } from "@/lib/user-display";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Profile");
  return privateAppMetadata({
    pathname: "/perfil",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
  });
}

export default async function PerfilPage() {
  const t = await getTranslations("Profile");
  const user = await getCurrentUser();
  if (!user) return null;

  const displayName = displayNameForUser(user);
  const initials = initialsForUser(user);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("pageEyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="max-w-lg leading-relaxed text-muted-foreground">{t("pageLead")}</p>
      </header>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/35 to-primary/5 text-sm font-bold text-primary ring-2 ring-primary/25">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">
            {displayName || t("nameMissing")}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <ProfileSettingsForm
        key={user.name?.trim() ?? "empty"}
        email={user.email}
        initialName={user.name?.trim() ?? ""}
        variant="page"
      />

      <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>{t("sessionNote")}</p>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <UserRound className="size-3.5" aria-hidden />
        {t("privacyNote")}
      </p>
    </div>
  );
}
