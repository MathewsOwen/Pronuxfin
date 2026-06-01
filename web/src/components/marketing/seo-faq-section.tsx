import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SeoFaqSectionProps = {
  namespace: string;
  keys: readonly string[];
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export async function SeoFaqSection({
  namespace,
  keys,
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
}: SeoFaqSectionProps) {
  const t = await getTranslations(namespace);

  return (
    <section
      className="mt-14 border-t border-white/10 pt-12"
      aria-label={title ?? "FAQ"}
    >
      {eyebrow ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      ) : null}
      {title ? (
        <h2 className="font-heading mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-8 space-y-3">
        {keys.map((key) => (
          <details
            key={key}
            className="group rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:px-5"
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
      </div>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-8")}>
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
