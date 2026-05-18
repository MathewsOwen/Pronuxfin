"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Status = {
  cryptoReady: boolean;
  dbReady: boolean;
  stored: { openai: boolean; gemini: boolean };
};

/** Dispara atualização dos motores disponíveis no chat (listeners no AssistantChat). */
export function notifyAiEnginesRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pronux:ai-engines-changed"));
  }
}

export function AssistantByokCard() {
  const t = useTranslations("AiHub");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openaiDraft, setOpenaiDraft] = useState("");
  const [geminiDraft, setGeminiDraft] = useState("");
  const [clrOpenAi, setClrOpenAi] = useState(false);
  const [clrGemini, setClrGemini] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/ai-keys", { credentials: "same-origin" });
      const data = (await res.json()) as {
        ok?: boolean;
        cryptoReady?: boolean;
        dbReady?: boolean;
        stored?: Status["stored"];
      };
      if (!res.ok || !data.ok) {
        setError(t("byokErrorSave"));
        setStatus(null);
        return;
      }
      setStatus({
        cryptoReady: !!data.cryptoReady,
        dbReady: !!data.dbReady,
        stored: data.stored ?? { openai: false, gemini: false },
      });
    } catch {
      setError(t("byokErrorSave"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!status?.cryptoReady || !status.dbReady || saving) return;
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      const body: Record<string, unknown> = {};
      if (clrOpenAi) body.clearOpenai = true;
      if (clrGemini) body.clearGemini = true;
      if (!clrOpenAi && openaiDraft.trim()) body.openaiKey = openaiDraft.trim();
      if (!clrGemini && geminiDraft.trim()) body.geminiKey = geminiDraft.trim();

      const res = await fetch("/api/user/ai-keys", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? t("byokErrorSave"));
        setSaving(false);
        return;
      }
      setOpenaiDraft("");
      setGeminiDraft("");
      setClrOpenAi(false);
      setClrGemini(false);
      setToast(t("byokSavedToast"));
      await load();
      notifyAiEnginesRefresh();
    } catch {
      setError(t("byokErrorSave"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !status) {
    return (
      <Card className="glass-panel card-shine border-white/10 bg-black/15 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("byokTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">…</p>
        </CardContent>
      </Card>
    );
  }

  if (!status.dbReady || !status.cryptoReady) {
    const msg = !status.cryptoReady ? t("byokErrorCrypto") : t("byokErrorDb");

    return (
      <Card className="glass-panel card-shine border-primary/20 bg-black/15 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("byokTitle")}</CardTitle>
          <CardDescription>{t("byokLead")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-status-warning/90">{msg}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel card-shine border-white/12 bg-black/[0.12] shadow-none">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">{t("byokTitle")}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{t("byokLead")}</CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant={status.stored.openai ? "secondary" : "outline"} className="text-[10px]">
            OpenAI — {status.stored.openai ? t("byokBadgeSaved") : t("byokBadgeEmpty")}
          </Badge>
          <Badge variant={status.stored.gemini ? "secondary" : "outline"} className="text-[10px]">
            Gemini — {status.stored.gemini ? t("byokBadgeSaved") : t("byokBadgeEmpty")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          {toast ? (
            <p className="text-xs font-medium text-market-up/95" role="status">
              {toast}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="byok-openai">
              {t("byokOpenAiField")}
            </label>
            <Input
              id="byok-openai"
              type="password"
              autoComplete="off"
              value={openaiDraft}
              disabled={clrOpenAi}
              onChange={(e) => setOpenaiDraft(e.target.value)}
              className="border-white/12 bg-background/50 font-mono text-xs"
              placeholder={status.stored.openai ? "••••••••" : ""}
            />
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={clrOpenAi}
                onChange={(e) => setClrOpenAi(e.target.checked)}
                className="rounded border-white/20"
              />
              {t("byokClearOpenAi")}
            </label>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="byok-gemini">
              {t("byokGeminiField")}
            </label>
            <Input
              id="byok-gemini"
              type="password"
              autoComplete="off"
              value={geminiDraft}
              disabled={clrGemini}
              onChange={(e) => setGeminiDraft(e.target.value)}
              className="border-white/12 bg-background/50 font-mono text-xs"
              placeholder={status.stored.gemini ? "••••••••" : ""}
            />
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={clrGemini}
                onChange={(e) => setClrGemini(e.target.checked)}
                className="rounded border-white/20"
              />
              {t("byokClearGemini")}
            </label>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? t("byokSaving") : t("byokSave")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
