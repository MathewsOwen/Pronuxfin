"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiMutation } from "@/lib/http/api-mutation-fetch";

type Passkey = {
  id: string;
  friendlyName: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export function ProfilePasskeysCard() {
  const t = useTranslations("Profile");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPasskeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/webauthn/credentials", {
        credentials: "same-origin",
      });
      const data = (await res.json()) as Passkey[] | { ok?: boolean };
      if (Array.isArray(data)) {
        setPasskeys(data);
      } else if (res.ok) {
        setPasskeys([]);
      }
    } catch {
      setError(t("passkeysLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/webauthn/credentials", {
          credentials: "same-origin",
        });
        const data = (await res.json()) as Passkey[] | { ok?: boolean };
        if (cancelled) return;
        if (Array.isArray(data)) {
          setPasskeys(data);
        } else if (res.ok) {
          setPasskeys([]);
        }
      } catch {
        if (!cancelled) setError(t("passkeysLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function addPasskey() {
    setPending(true);
    setError(null);
    try {
      const optRes = await apiMutation("/api/user/webauthn/register/options", {
        method: "POST",
      });
      const optJson = (await optRes.json()) as {
        options?: import("@simplewebauthn/browser").PublicKeyCredentialCreationOptionsJSON;
        challengeId?: string;
        message?: string;
      };
      if (!optRes.ok || !optJson.options || !optJson.challengeId) {
        setError(optJson.message ?? t("passkeysRegisterError"));
        setPending(false);
        return;
      }

      const attestation = await startRegistration({ optionsJSON: optJson.options });
      const verifyRes = await apiMutation("/api/user/webauthn/register/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId: optJson.challengeId,
          response: attestation,
          friendlyName: t("passkeysDefaultName"),
        }),
      });
      if (!verifyRes.ok) {
        setError(t("passkeysRegisterError"));
        setPending(false);
        return;
      }
      await refreshPasskeys();
    } catch {
      setError(t("passkeysRegisterError"));
    } finally {
      setPending(false);
    }
  }

  async function removePasskey(id: string) {
    if (!window.confirm(t("passkeysRemoveConfirm"))) return;
    setPending(true);
    setError(null);
    try {
      const res = await apiMutation("/api/user/webauthn/credentials", {
        method: "DELETE",
        body: JSON.stringify({ credentialId: id }),
      });
      if (!res.ok) {
        setError(t("passkeysRemoveError"));
        return;
      }
      await refreshPasskeys();
    } catch {
      setError(t("passkeysRemoveError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel border-white/10 bg-black/15 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-2">
            <Fingerprint className="size-4 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">{t("passkeysTitle")}</CardTitle>
            <CardDescription className="mt-1">{t("passkeysLead")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("passkeysLoading")}</p>
        ) : (
          <>
            {passkeys.length > 0 ? (
              <ul className="space-y-2">
                {passkeys.map((pk) => (
                  <li
                    key={pk.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {pk.friendlyName ?? t("passkeysDefaultName")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pk.deviceType ?? "passkey"}
                        {pk.backedUp ? ` · ${t("passkeysSynced")}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => void removePasskey(pk.id)}
                      className="text-muted-foreground hover:text-market-down"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("passkeysEmpty")}</p>
            )}
            <Button type="button" size="sm" disabled={pending} onClick={() => void addPasskey()}>
              {pending ? t("passkeysAdding") : t("passkeysAdd")}
            </Button>
          </>
        )}
        {error ? (
          <p className="text-sm text-market-down" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
