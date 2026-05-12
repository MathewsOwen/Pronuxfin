"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_SHORT_LABEL, type AppLocale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function select(next: string) {
    startTransition(() => {
      if (next !== locale) {
        router.replace(pathname, { locale: next });
      }
      setOpen(false);
    });
  }

  return (
    <div ref={panelRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="language-locale-menu"
        aria-label={t("switchAria")}
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground backdrop-blur-md transition-colors hover:border-amber-500/35 hover:bg-amber-950/20",
          pending && "opacity-60",
        )}
      >
        <Globe className="size-3.5 shrink-0 text-amber-400/90" aria-hidden />
        <span className="tabular-nums">{LOCALE_SHORT_LABEL[locale as AppLocale] ?? locale}</span>
        <span className="text-muted-foreground" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id="language-locale-menu"
          role="listbox"
          aria-label={t("listAria")}
          className="absolute right-0 z-[100] mt-1.5 min-w-[9rem] rounded-xl border border-white/12 bg-zinc-950/98 py-1 shadow-xl backdrop-blur-xl"
        >
          {routing.locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === locale}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wide transition-colors hover:bg-white/[0.06]",
                  loc === locale ? "text-amber-400" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => select(loc)}
              >
                <span>{t(`names.${loc}`)}</span>
                <span className="text-[10px] opacity-70">{LOCALE_SHORT_LABEL[loc]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
