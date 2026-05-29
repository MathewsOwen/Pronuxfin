"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiMutation } from "@/lib/http/api-mutation-fetch";

export function LoginWebAuthnStep({
  challengeId,
  locale,
  onCancel,
  onSuccess,
}: {
  challengeId: string;
  locale: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Login");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setPending(true);
    setError(null);
    try {
      const optRes = await apiMutation("/api/auth/webauthn/login/options", {
        method: "POST",
        body: JSON.stringify({ challengeId }),
      });
      const optJson = (await optRes.json()) as {
        ok?: boolean;
        options?: import("@simplewebauthn/browser").PublicKeyCredentialRequestOptionsJSON;
        message?: string;
      };
      if (!optRes.ok || !optJson.options) {
        setError(optJson.message ?? t("webauthnError"));
        setPending(false);
        return;
      }

      const assertion = await startAuthentication({ optionsJSON: optJson.options });
      const verifyRes = await apiMutation("/api/auth/webauthn/login/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId,
          response: assertion,
          locale: locale === "en" ? "en" : "pt-BR",
        }),
      });
      if (!verifyRes.ok) {
        const verifyJson = (await verifyRes.json()) as { message?: string };
        setError(verifyJson.message ?? t("webauthnError"));
        setPending(false);
        return;
      }
      onSuccess();
    } catch {
      setError(t("webauthnError"));
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{t("webauthnLead")}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => void verify()}>
          {pending ? t("webauthnPending") : t("webauthnCta")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          {t("webauthnBack")}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-market-down" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
