"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AiChannelId, AudienceKind } from "@/lib/assistant/ai-channels";
import { pickOfflineSnippetKey } from "@/lib/assistant/chat-offline-heuristics";
import type { AiLocale } from "@/lib/assistant/market-ai-locale";
import { isMarketAiApiCode } from "@/lib/auth/api-error-codes";
import type { MarketAiEngineId } from "@/lib/market/market-ai-providers";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

type MarketAiResp =
  | {
      ok: true;
      demo?: boolean;
      reply: string;
      provider?: "pronux-ollama" | "pronux-openai" | "pronux-gemini";
      engine?: MarketAiEngineId;
      ensemble?: boolean;
    }
  | { ok: false; message: string; code?: string };

function TypingDots() {
  return (
    <div className="flex gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-primary/70"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function AssistantChat({
  audience,
  channelId,
  variant = "page",
  welcomeMsg,
  channelTitle,
  channelLead,
  initialPrompt = "",
}: {
  audience: AudienceKind;
  channelId: AiChannelId;
  variant?: "page" | "drawer";
  welcomeMsg: string;
  channelTitle: string;
  channelLead: string;
  initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: welcomeMsg },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isTyping, setIsTyping] = useState(false);
  const [engines, setEngines] = useState<MarketAiEngineId[]>([]);
  const [engine, setEngine] = useState<MarketAiEngineId | "">("");
  const [ensemblePanel, setEnsemblePanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("AiHub");
  const tApiErr = useTranslations("AiApiErrors");
  const uiLocale = useLocale();
  const aiLocale: AiLocale = uiLocale === "en" ? "en" : "pt-BR";

  const refreshEngines = useCallback(() => {
    void fetch("/api/market-ai", { credentials: "same-origin" })
      .then((r) => r.json() as Promise<{ ok?: boolean; engines?: MarketAiEngineId[] }>)
      .then((d) => {
        if (!d.ok || !Array.isArray(d.engines)) return;
        const next = d.engines;
        setEngines(next);
        setEngine((prev) => (prev && next.includes(prev) ? prev : ""));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshEngines();
    const onEngines = () => refreshEngines();
    window.addEventListener("pronux:ai-engines-changed", onEngines);
    return () => window.removeEventListener("pronux:ai-engines-changed", onEngines);
  }, [refreshEngines]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function engineOptionLabel(id: MarketAiEngineId): string {
    switch (id) {
      case "ollama":
        return t("engineOllama");
      case "openai":
        return t("engineOpenai");
      case "gemini":
        return t("engineGemini");
      default:
        return id;
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const nextMsgs: Msg[] = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMsgs);
    setInput("");
    setIsTyping(true);

    try {
      const outbound = nextMsgs.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/market-ai", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: outbound,
          audience,
          channel: channelId,
          locale: aiLocale,
          ...(ensemblePanel && engines.length >= 2 ? { ensemble: true } : {}),
          ...(!ensemblePanel && engine ? { engine } : {}),
        }),
      });

      let data: MarketAiResp;
      try {
        data = (await res.json()) as MarketAiResp;
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: t(pickOfflineSnippetKey(trimmed)),
          },
        ]);
        setIsTyping(false);
        scrollToBottom();
        return;
      }

      if (!res.ok || !data.ok) {
        const code =
          typeof data === "object" &&
          data &&
          "code" in data &&
          typeof (data as { code?: unknown }).code === "string"
            ? (data as { code?: string }).code
            : undefined;
        const baseMsgRaw: string =
          typeof data === "object" &&
          data &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "";
        const baseMsg = baseMsgRaw.trim();

        let fallback = t("chatErrorUnknown");
        if (code && isMarketAiApiCode(code)) {
          fallback = tApiErr(code);
        } else if (baseMsg) {
          fallback = baseMsg;
        }

        const sessionNote =
          res.status === 401 && code !== "MARKET_AI_SESSION_REQUIRED"
            ? t("chatErrorSession401")
            : "";
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `${fallback}${sessionNote}` },
        ]);
      } else {
        let text = data.reply;
        if (!data.demo && !data.ensemble) {
          if (data.provider === "pronux-ollama") text += t("chatOllamaFooter");
          else if (data.provider === "pronux-openai") text += t("chatOpenAiFooter");
          else if (data.provider === "pronux-gemini") text += t("chatGeminiFooter");
        }
        setMessages((m) => [...m, { role: "assistant", text }]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: t(pickOfflineSnippetKey(trimmed)) },
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }

  const scrollH =
    variant === "drawer"
      ? "h-[min(360px,52vh)] sm:h-[min(420px,55vh)]"
      : "h-[min(440px,58vh)]";

  return (
    <Card
      className={cn(
        "glass-panel mx-auto flex flex-col overflow-hidden border-white/12 shadow-none ring-0",
        variant === "drawer"
          ? "max-w-none rounded-none border-0 md:max-w-none"
          : "max-w-3xl",
      )}
    >
      <CardHeader className="border-b border-white/10 bg-black/15">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/15 p-1.5 ring-1 ring-primary/25">
            <Sparkles className="size-4 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="font-heading text-lg">{channelTitle}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{channelLead}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-0 p-0">
        <ScrollArea className={cn("px-4 py-4", scrollH)}>
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.role}-${msg.text.slice(0, 48)}`}
                className={
                  msg.role === "user"
                    ? "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/85 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_8px_32px_color-mix(in oklch, var(--primary) 18%, transparent)] transition-opacity"
                    : "mr-auto max-w-[88%] rounded-2xl rounded-bl-md border border-white/10 bg-black/30 px-4 py-2.5 text-sm leading-relaxed text-muted-foreground backdrop-blur-sm transition-opacity"
                }
              >
                <span className="whitespace-pre-wrap">{msg.text}</span>
              </div>
            ))}
            <AnimatePresence>
              {isTyping ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mr-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-2"
                >
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("chatTypingStatus")}
                  </span>
                  <TypingDots />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="flex flex-col gap-3 border-t border-white/10 bg-muted/25 p-4 backdrop-blur-md">
          {engines.length >= 2 ? (
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <input
                id="pronux-ensemble-panel"
                type="checkbox"
                className="mt-1 size-4 shrink-0 rounded border-white/20 bg-background accent-primary"
                checked={ensemblePanel}
                onChange={(e) => {
                  const on = e.target.checked;
                  setEnsemblePanel(on);
                  if (on) setEngine("");
                }}
              />
              <Label htmlFor="pronux-ensemble-panel" className="cursor-pointer text-sm leading-snug">
                <span className="font-medium text-foreground">{t("ensembleLabel")}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{t("ensembleHint")}</span>
              </Label>
            </div>
          ) : null}
          {engines.length > 1 ? (
            <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {t("engineLabel")}
              </span>
              <select
                value={engine}
                aria-label={t("engineLabel")}
                disabled={ensemblePanel}
                onChange={(e) => {
                  const v = e.target.value;
                  setEnsemblePanel(false);
                  setEngine(v === "" ? "" : (v as MarketAiEngineId));
                }}
                className="h-9 min-w-[12rem] rounded-md border border-white/12 bg-background/70 px-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="">{t("engineAuto")}</option>
                {engines.map((id) => (
                  <option key={id} value={id}>
                    {engineOptionLabel(id)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <form
            onSubmit={(e) => void handleSend(e)}
            className="flex gap-2"
          >
            <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatInputPlaceholder")}
            disabled={isTyping}
            aria-label={t("chatInputLabel")}
            className="h-10 flex-1 border-white/10 bg-background/60"
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={isTyping || !input.trim()}
            aria-label={t("chatSendAria")}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
        </div>
      </CardContent>
    </Card>
  );
}
