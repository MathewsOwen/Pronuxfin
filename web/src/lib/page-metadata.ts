import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import { resolvePublicSiteUrl } from "@/lib/site-url";

/** Open Graph `locale` field for known app locales */
export function openGraphLocaleFor(locale: string): string {
  const map: Record<string, string> = {
    "pt-BR": "pt_BR",
    en: "en_US",
  };
  return map[locale] ?? "pt_BR";
}

/** Descrição canónica do produto — meta principal da home e Schema.org `Organization`. */
export const SITE_META_DESCRIPTION =
  "O mercado não espera — você também não deveria. Onde mercados, finanças pessoais e educação se encontram numa mesma mesa: dados em tempo útil, fontes visíveis, IA sob disciplina e linguagem institucional — precisão sem hype, transparência por desenho.";

export function getSiteOrigin(): string {
  try {
    return new URL(resolvePublicSiteUrl()).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(pathname: string): string {
  const origin = getSiteOrigin();
  const normalized =
    pathname === "/" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${normalized}`;
}

/**
 * Canonical absoluto + og:url.
 * Com `localePrefix: "never"`, todos os idiomas compartilham a mesma URL; usar vários
 * hreflangs apontando para o mesmo URL prejudica SEO. Mantemos só `x-default` até haver
 * prefixos ou rotas distintas por locale (ex.: /en/bolsa).
 */
export function withCanonical(pathname: string, meta: Metadata = {}): Metadata {
  const canonical = absoluteUrl(pathname);
  const prevLang = meta.alternates?.languages;
  const extraLang =
    prevLang && typeof prevLang === "object" && !Array.isArray(prevLang)
      ? prevLang
      : {};

  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      canonical,
      languages: {
        ...extraLang,
        "x-default": canonical,
      },
    },
    openGraph: meta.openGraph
      ? { ...meta.openGraph, url: canonical }
      : { url: canonical },
  };
}

export function marketingMetadata(opts: {
  pathname: string;
  title: string;
  /** Evita aplicar `title.template` do layout (ex.: home com título já completo). */
  absoluteTitle?: boolean;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: Metadata["robots"];
  /** Resolved UI locale (`getLocale()`), for Open Graph. */
  locale?: AppLocale | string;
}): Metadata {
  const ogTitle = opts.ogTitle ?? `${opts.title} | PRONUXFIN`;
  const ogDescription = opts.ogDescription ?? opts.description;
  const locale = opts.locale ? openGraphLocaleFor(opts.locale) : "pt_BR";

  return withCanonical(opts.pathname, {
    title:
      opts.absoluteTitle === true ? { absolute: opts.title } : opts.title,
    description: opts.description,
    ...(opts.robots !== undefined ? { robots: opts.robots } : {}),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName: "PRONUXFIN",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  });
}

export function privateAppMetadata(opts: {
  pathname: string;
  title: string;
  description?: string;
  locale?: AppLocale | string;
}): Metadata {
  const ogLocale = opts.locale ? openGraphLocaleFor(opts.locale) : undefined;

  const openGraph =
    opts.description !== undefined && ogLocale
      ? {
          title: opts.title,
          description: opts.description,
          siteName: "PRONUXFIN",
          locale: ogLocale,
          type: "website" as const,
        }
      : undefined;

  return withCanonical(opts.pathname, {
    title: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    robots: { index: false, follow: false },
    ...(openGraph ? { openGraph } : {}),
  });
}
