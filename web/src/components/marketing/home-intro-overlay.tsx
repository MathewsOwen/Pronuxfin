"use client";

import { PronuxIntroOverlay } from "@/components/marketing/pronux-intro-overlay";

/** Import direto — evita tela vazia quando o chunk lazy falha ou atrasa em produção. */
export function HomeIntroOverlay() {
  return <PronuxIntroOverlay />;
}
