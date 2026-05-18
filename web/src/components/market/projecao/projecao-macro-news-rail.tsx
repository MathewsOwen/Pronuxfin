"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Newspaper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { NewsArticle } from "@/lib/market/types";

export function ProjecaoMacroNewsRail() {
  const t = useTranslations("ProjecaoHub.newsRail");
  const locale = useLocale();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) throw new Error("news");
        const json = (await res.json()) as { articles?: NewsArticle[] };
        if (!cancelled) setArticles((json.articles ?? []).slice(0, 5));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Newspaper className="size-5 text-sky-400/90" aria-hidden />
          <h3 className="font-heading text-base font-semibold">{t("title")}</h3>
        </div>
        <Link href="/noticias" className="font-mono text-[10px] uppercase tracking-wider text-primary hover:underline">
          {t("cta")}
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      {error ? (
        <p className="mt-4 text-sm text-rose-300">{t("error")}</p>
      ) : articles.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {articles.map((article) => (
            <li key={article.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {article.title}
              </a>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {article.source}
                {article.publishedAt
                  ? ` · ${new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(article.publishedAt))}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
