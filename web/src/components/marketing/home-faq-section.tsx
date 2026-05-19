"use client";

import { useTranslations } from "next-intl";
import {
  RevealBlock,
  RevealSection,
} from "@/components/marketing/landing-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

const FAQ_KEYS = ["live", "advice", "sources", "account", "ai"] as const;

export function HomeFaqSection() {
  const t = useTranslations("HomeFaq");

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6"
      aria-label={t("title")}
    >
      <div className="mx-auto max-w-3xl">
        <RevealSection>
          <RevealBlock>
            <SectionHeading
              eyebrow={t("eyebrow")}
              align="center"
              title={t("title")}
              description={t("description")}
            />
          </RevealBlock>
          <RevealBlock className="mt-10 space-y-3">
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="group rounded-2xl border border-border bg-black/20 px-4 py-3 sm:px-5"
              >
                <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    <span>{t(`items.${key}.q`)}</span>
                    <span
                      className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.a`)}
                </p>
              </details>
            ))}
          </RevealBlock>
        </RevealSection>
      </div>
    </section>
  );
}
