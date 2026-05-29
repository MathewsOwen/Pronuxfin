"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EVENT_KEYS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGIN_NEW_DEVICE",
  "LOGOUT",
  "LOGOUT_ALL",
  "REFRESH_REUSE",
  "REFRESH_BIND_MISMATCH",
  "PASSWORD_RESET",
  "SESSION_REVOKED",
  "SESSION_REVOKED_ALL",
  "WEBAUTHN_REGISTERED",
  "WEBAUTHN_REMOVED",
  "WEBAUTHN_LOGIN_SUCCESS",
] as const;

function eventLabel(
  eventType: string,
  t: (key: string) => string,
): string {
  const map: Record<string, string> = Object.fromEntries(
    EVENT_KEYS.map((k) => [k, t(`securityEvent_${k}`)]),
  );
  return map[eventType] ?? eventType;
}

type SecurityEventRow = {
  id: string;
  eventType: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function ProfileSecurityEventsCard({ locale }: { locale: string }) {
  const t = useTranslations("Profile");
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/security-events", { credentials: "same-origin" });
        const data = (await res.json()) as { ok?: boolean; events?: SecurityEventRow[] };
        if (!cancelled) {
          setEvents(data.ok && data.events ? data.events : []);
        }
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatWhen(iso: string) {
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <Card className="glass-panel border-white/10 bg-black/15 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <ScrollText className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">{t("securityLogTitle")}</CardTitle>
            <CardDescription className="mt-1">{t("securityLogLead")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("securityLogLoading")}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("securityLogEmpty")}</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs"
              >
                <p className="font-medium text-foreground">
                  {eventLabel(ev.eventType, t)}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {formatWhen(ev.createdAt)}
                  {ev.ip ? ` · ${ev.ip}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
