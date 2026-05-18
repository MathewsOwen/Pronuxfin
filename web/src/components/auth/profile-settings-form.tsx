"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { displayNameForUser } from "@/lib/user-display";

type ProfileSettingsFormProps = {
  email?: string;
  initialName?: string;
  variant?: "banner" | "page";
};

export function ProfileSettingsForm({
  email,
  initialName = "",
  variant = "page",
}: ProfileSettingsFormProps) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("nameSaveError"));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const preview = displayNameForUser({ name: name.trim() || null });
  const isBanner = variant === "banner";

  const nameField = (
    <div className="grid gap-2">
      <Label htmlFor="profile-name">
        {t("nameLabel")} <span className="text-destructive">*</span>
      </Label>
      <Input
        id="profile-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        required
        minLength={2}
        className="border-white/15 bg-black/20"
        placeholder={t("namePlaceholder")}
      />
      {!isBanner && preview ? (
        <p className="text-xs text-muted-foreground">
          {t("greetingPreview", { name: preview })}
        </p>
      ) : null}
    </div>
  );

  if (isBanner) {
    return (
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-amber-500/30 bg-amber-950/15 px-5 py-4"
      >
        <p className="font-medium text-foreground">{t("nameRequiredTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("nameRequiredLead")}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">{nameField}</div>
          <button
            type="submit"
            disabled={pending || name.trim().length < 2}
            className={cn(buttonVariants({ size: "sm" }), pending && "opacity-60")}
          >
            {pending ? t("nameSaving") : t("nameSaveCta")}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </form>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-heading text-lg">{t("accountSectionTitle")}</CardTitle>
        <CardDescription>{t("accountSectionLead")}</CardDescription>
      </CardHeader>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <CardContent className="space-y-4">
          {email ? (
            <div className="grid gap-2">
              <Label htmlFor="profile-email">{t("emailLabel")}</Label>
              <Input
                id="profile-email"
                value={email}
                readOnly
                disabled
                className="border-white/15 bg-black/20 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
            </div>
          ) : null}
          {nameField}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {saved ? <p className="text-xs text-emerald-400">{t("nameSaved")}</p> : null}
        </CardContent>
        <CardFooter className="border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={pending || name.trim().length < 2}
            className={cn(buttonVariants({ size: "sm" }), pending && "opacity-60")}
          >
            {pending ? t("nameSaving") : t("nameSaveCta")}
          </button>
        </CardFooter>
      </form>
    </Card>
  );
}
