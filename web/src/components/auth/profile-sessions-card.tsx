"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Laptop, LogOut, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiMutation } from "@/lib/http/api-mutation-fetch";
import type { UserSessionView } from "@/lib/auth/user-sessions";
import { sessionDeviceParts } from "@/lib/auth/user-sessions";
import { useRouter } from "@/i18n/navigation";

function sessionLabel(
  session: UserSessionView,
  unknownLabel: string,
): string {
  const { browser, ip } = sessionDeviceParts(session);
  const parts = [browser, ip].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : unknownLabel;
}

function formatWhen(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProfileSessionsCard({ locale }: { locale: string }) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/sessions", { credentials: "same-origin" });
        const data = (await res.json()) as {
          ok?: boolean;
          sessions?: UserSessionView[];
        };
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.sessions) {
          setError(t("sessionsLoadError"));
          setSessions([]);
          return;
        }
        setSessions(data.sessions);
      } catch {
        if (!cancelled) setError(t("sessionsLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function revokeFamily(familyId: string) {
    if (!window.confirm(t("sessionsRevokeConfirm"))) return;
    setPending(familyId);
    setError(null);
    try {
      const res = await apiMutation("/api/user/sessions/revoke", {
        method: "POST",
        body: JSON.stringify({ familyId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        signedOut?: boolean;
        sessions?: UserSessionView[];
      };
      if (!res.ok || !data.ok) {
        setError(t("sessionsRevokeError"));
        return;
      }
      if (data.signedOut) {
        router.push("/login?from=%2Fperfil");
        router.refresh();
        return;
      }
      setSessions(data.sessions ?? []);
    } catch {
      setError(t("sessionsRevokeError"));
    } finally {
      setPending(null);
    }
  }

  async function revokeAll() {
    if (!window.confirm(t("sessionsRevokeAllConfirm"))) return;
    setPending("all");
    setError(null);
    try {
      const res = await apiMutation("/api/user/sessions/revoke-all", {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(t("sessionsRevokeError"));
        return;
      }
      router.push("/login?from=%2Fperfil");
      router.refresh();
    } catch {
      setError(t("sessionsRevokeError"));
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="glass-panel border-white/10 bg-black/15 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-2">
            <Shield className="size-4 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">{t("sessionsTitle")}</CardTitle>
            <CardDescription className="mt-1">{t("sessionsLead")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("sessionsLoading")}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("sessionsEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.familyId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Laptop className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {sessionLabel(session, t("sessionsUnknownDevice"))}
                      {session.current ? (
                        <span className="ml-2 text-xs font-normal text-primary">
                          {t("sessionsCurrent")}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("sessionsSince", {
                        when: formatWhen(session.createdAt, locale),
                      })}
                    </p>
                  </div>
                </div>
                {!session.current && sessions.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending !== null}
                    onClick={() => void revokeFamily(session.familyId)}
                    className="text-muted-foreground hover:text-market-down"
                  >
                    {pending === session.familyId ? t("sessionsRevoking") : t("sessionsRevoke")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {sessions.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending !== null}
            onClick={() => void revokeAll()}
            className="border-white/15"
          >
            <LogOut className="size-3.5" aria-hidden />
            {pending === "all" ? t("sessionsRevokingAll") : t("sessionsRevokeAll")}
          </Button>
        ) : null}

        {error ? (
          <p className="text-sm text-market-down" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
