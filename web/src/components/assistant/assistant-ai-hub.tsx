"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Building2,
  FileText,
  GraduationCap,
  LineChart,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Table2,
  Terminal,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { AssistantByokCard } from "@/components/assistant/assistant-byok-card";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import {
  AI_CHANNEL_IDS,
  AI_EXTERNAL_BY_CHANNEL,
  type AiChannelId,
  type AudienceKind,
  SPREADSHEET_SECONDARY_URL,
  TUTOR_QUICK_EXTERNAL,
} from "@/lib/assistant/ai-channels";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { cn } from "@/lib/utils";

const CHANNEL_ICON = {
  research: Newspaper,
  docs: FileText,
  equities: LineChart,
  spreadsheets: Table2,
  quant: Terminal,
  tutor: GraduationCap,
} as const satisfies Record<AiChannelId, typeof Newspaper>;

function tutorShortcutLabel(
  brandKey: (typeof TUTOR_QUICK_EXTERNAL)[number]["brandKey"],
  tHub: (key: string) => string,
): string {
  switch (brandKey) {
    case "gemini":
      return tHub("brands.gemini");
    case "chatgpt":
      return tHub("brands.chatgpt");
    default:
      return tHub("brands.copilot");
  }
}

export function AssistantAiHub() {
  const tHub = useTranslations("AiHub");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const drawerRef = useRef<HTMLElement | null>(null);
  const panelReturnFocusRef = useRef<HTMLElement | null>(null);
  const initialChannel = parseAssistantChannel(searchParams.get("channel"));
  const initialAudience = parseAssistantAudience(searchParams.get("audience"));
  const [audience, setAudience] = useState<AudienceKind>(initialAudience);
  const [activeChannel, setActiveChannel] = useState<AiChannelId>(initialChannel);
  const [panelOpen, setPanelOpen] = useState(searchParams.get("open") === "1");

  useEffect(() => {
    if (!panelOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  useDialogFocusTrap(panelOpen, drawerRef, panelReturnFocusRef);

  const titlesDesc = useMemo(
    () =>
      ({
        research: {
          title: tHub("channels.research.title"),
          desc: tHub("channels.research.desc"),
        },
        docs: {
          title: tHub("channels.docs.title"),
          desc: tHub("channels.docs.desc"),
        },
        equities: {
          title: tHub("channels.equities.title"),
          desc: tHub("channels.equities.desc"),
        },
        spreadsheets: {
          title: tHub("channels.spreadsheets.title"),
          desc: tHub("channels.spreadsheets.desc"),
        },
        quant: {
          title: tHub("channels.quant.title"),
          desc: tHub("channels.quant.desc"),
        },
        tutor: {
          title: tHub("channels.tutor.title"),
          desc: tHub("channels.tutor.desc"),
        },
      }) satisfies Record<AiChannelId, { title: string; desc: string }>,
    [tHub],
  );

  const welcomeComputed = useMemo(
    () =>
      tHub("chatIntro", {
        channel: titlesDesc[activeChannel].title,
      }),
    [activeChannel, tHub, titlesDesc],
  );
  const signalCards = [
    {
      label: tHub("signalCoverageLabel"),
      value: tHub("signalCoverageValue"),
      icon: Activity,
      tone: "border-cognitive/25 bg-cognitive/10",
    },
    {
      label: tHub("signalEngineLabel"),
      value: tHub("signalEngineValue"),
      icon: Sparkles,
      tone: "border-primary/20 bg-status-warning/8",
    },
    {
      label: tHub("signalSecurityLabel"),
      value: tHub("signalSecurityValue"),
      icon: ShieldCheck,
      tone: "border-status-live/25 bg-status-live/10",
    },
  ];
  const assistantPrompt = searchParams.get("prompt")?.trim() ?? "";
  const assistantAsset = searchParams.get("asset")?.trim().toUpperCase() ?? "";

  function openChat(id: AiChannelId, triggerEl: HTMLElement | null) {
    panelReturnFocusRef.current =
      triggerEl ?? (document.activeElement as HTMLElement | null);
    setActiveChannel(id);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
  }

  function externalLabel(id: AiChannelId): string {
    switch (id) {
      case "research":
        return tHub("brands.research");
      case "docs":
        return tHub("brands.docs");
      case "equities":
        return tHub("brands.equities");
      case "spreadsheets":
        return tHub("brands.sheetsExcel");
      case "quant":
        return tHub("brands.quant");
      default:
        return tHub("official");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div inert={panelOpen ? true : undefined}>
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary">
                {tHub("heroPillLiveContext")}
              </Badge>
              <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                {tHub("heroPillOptionalKeys")}
              </Badge>
              <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                {tHub("heroPillPrivateAccess")}
              </Badge>
            </div>
            <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight">
              {tHub("pageTitle")}
            </h1>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {tHub("pageLead")}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {tHub("audienceLabel")}
            </span>
            <div
              role="group"
              aria-label={tHub("audienceLabel")}
              className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1"
            >
              <button
                type="button"
                onClick={() => setAudience("pf")}
                aria-pressed={audience === "pf"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                  audience === "pf"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="size-4 shrink-0" aria-hidden />
                {tHub("pf")}
              </button>
              <button
                type="button"
                onClick={() => setAudience("institution")}
                aria-pressed={audience === "institution"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                  audience === "institution"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Building2 className="size-4 shrink-0" aria-hidden />
                {tHub("institution")}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {signalCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className={`glass-panel card-shine rounded-3xl border px-5 py-4 shadow-none ring-0 ${tone}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                    {value}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-foreground">
                  <Icon className="size-4" aria-hidden />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
          {tHub("footnote")}
        </div>

        {assistantAsset ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm text-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.03)]">
            <p className="font-medium">{tHub("contextTitle", { symbol: assistantAsset })}</p>
            <p className="mt-1 leading-relaxed text-primary/90">
              {tHub("contextLead")}
            </p>
          </div>
        ) : null}

        <AssistantByokCard />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {AI_CHANNEL_IDS.map((id) => {
            const Icon = CHANNEL_ICON[id];
            const ext = AI_EXTERNAL_BY_CHANNEL[id];
            return (
              <Card
                key={id}
                className="glass-panel card-shine border-white/12 bg-black/[0.15] shadow-none transition-transform duration-300 hover:-translate-y-0.5"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-primary/12 p-2.5 text-primary ring-1 ring-primary/25">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] uppercase tracking-[0.14em]"
                        >
                          PRONUX
                        </Badge>
                        {ext ? (
                          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                            {tHub("official")}
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="text-base leading-snug">
                        {titlesDesc[id].title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="min-h-[3.5rem] text-xs leading-relaxed">
                    {titlesDesc[id].desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  <Button
                    type="button"
                    variant="secondary"
                    className="justify-between gap-2"
                    onClick={(e) => openChat(id, e.currentTarget)}
                  >
                    {tHub("openPromptChat")}
                    <ArrowUpRight className="size-4 opacity-70" aria-hidden />
                  </Button>

                  {id === "tutor" ? (
                    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {tHub("tutorExtra")}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        {TUTOR_QUICK_EXTERNAL.map((ln) => (
                          <a
                            key={ln.href}
                            href={ln.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {tutorShortcutLabel(ln.brandKey, tHub)}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {ext ? (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={ext}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "inline-flex h-8 shrink-0 items-center px-2.5",
                        )}
                      >
                        {tHub("official")} · {externalLabel(id)}
                      </a>
                      {id === "spreadsheets" ? (
                        <a
                          href={SPREADSHEET_SECONDARY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "inline-flex h-8 shrink-0 items-center px-2",
                          )}
                        >
                          {tHub("sheetsSecondary")}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {panelOpen ? (
          <motion.div
            key="ai-chat-dock"
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label={tHub("closePanel")}
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={closePanel}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-dock-heading"
              aria-describedby="ai-dock-description"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/12 bg-[oklch(0.125_0.041_262/0.97)] backdrop-blur-xl md:max-w-xl"
            >
              <span id="ai-dock-heading" className="sr-only">
                {titlesDesc[activeChannel].title}
              </span>
              <span id="ai-dock-description" className="sr-only">
                {titlesDesc[activeChannel].desc}
              </span>
              <button
                type="button"
                data-initial-dialog-focus
                aria-label={tHub("closePanel")}
                onClick={closePanel}
                className="absolute right-3 top-3 z-[2] rounded-lg border border-white/10 bg-black/35 p-2 text-muted-foreground transition-colors hover:border-white/18 hover:bg-black/55 hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </button>
              <div className="flex-1 overflow-y-auto px-3 pb-4 pt-14">
                <AssistantChat
                  key={`${audience}-${activeChannel}-${locale}-${assistantPrompt}`}
                  audience={audience}
                  channelId={activeChannel}
                  variant="drawer"
                  welcomeMsg={welcomeComputed}
                  channelTitle={titlesDesc[activeChannel].title}
                  channelLead={titlesDesc[activeChannel].desc}
                  initialPrompt={assistantPrompt}
                />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function parseAssistantChannel(value: string | null): AiChannelId {
  return value && AI_CHANNEL_IDS.includes(value as AiChannelId)
    ? (value as AiChannelId)
    : "tutor";
}

function parseAssistantAudience(value: string | null): AudienceKind {
  return value === "institution" ? "institution" : "pf";
}
