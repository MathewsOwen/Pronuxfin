import { getTranslations } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const PRIVACY_SECTIONS = [
  "scope",
  "dataCollected",
  "usage",
  "sharing",
  "retention",
  "rights",
  "contact",
] as const;

const TERMS_SECTIONS = [
  "scope",
  "notAdvice",
  "accounts",
  "marketData",
  "ai",
  "liability",
  "changes",
  "contact",
] as const;

type LegalKind = "privacy" | "terms";

export async function LegalDocumentLayout({ kind }: { kind: LegalKind }) {
  const t = await getTranslations("Legal");
  const sectionKeys = kind === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <MarketingShell showLanguageSwitcher>
      <article className="mx-auto max-w-3xl py-10 sm:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/90">
          {t(`${kind}.eyebrow`)}
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {t(`${kind}.title`)}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t(`${kind}.updated`)}</p>
        <p className="mt-6 leading-relaxed text-muted-foreground">{t(`${kind}.intro`)}</p>

        <div className="mt-10 space-y-8">
          {sectionKeys.map((key) => (
            <section key={key} aria-labelledby={`legal-${kind}-${key}`}>
              <h2
                id={`legal-${kind}-${key}`}
                className="font-heading text-lg font-semibold tracking-tight text-foreground"
              >
                {t(`${kind}.sections.${key}.title`)}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`${kind}.sections.${key}.body`)}
              </p>
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  );
}
