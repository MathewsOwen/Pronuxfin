"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pronuxfin_soft_cta_dismiss";

/** CTA único e recusável — reciprocidade clara, sem bloquear conteúdo. */
export function EngagementSoftCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setVisible(!sessionStorage.getItem(STORAGE_KEY));
      } catch {
        setVisible(true);
      }
    });
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <motion.div
      role="dialog"
      aria-label="Convite para criar conta"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-lg"
    >
      <div className="glass-panel glow-ring flex items-start gap-3 rounded-2xl border-primary/25 p-4 shadow-2xl">
        <div className="rounded-xl bg-primary/15 p-2 text-primary">
          <Sparkles className="size-5 shrink-0" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-snug">
            Salve o que importa para você
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Crie sua conta e transforme leitura em hábito: alertas, painel e trilhas no
            mesmo ecossistema — gratuito para começar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "h-8 gap-1")}
            >
              Começar grátis
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 text-muted-foreground",
              )}
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar convite"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}
