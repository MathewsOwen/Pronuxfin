import { CalendarDays, FileSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { WatchlistBriefingItem } from "@/lib/user-watchlist/briefing";
import { cn } from "@/lib/utils";

type BriefingTranslator = (key: string, values?: Record<string, string | number>) => string;

function formatBriefingLine(item: WatchlistBriefingItem, t: BriefingTranslator) {
  switch (item.kind) {
    case "attention_up":
      return t("briefingAttentionUp", {
        symbol: item.symbol,
        value: item.delta ?? item.priority,
      });
    case "fresh_news":
      return t("briefingFreshNews", {
        symbol: item.symbol,
        value: item.newsCount,
      });
    case "range_extreme":
      return t("briefingRangeExtreme", { symbol: item.symbol });
    case "steady_high":
      return t("briefingSteadyHigh", { symbol: item.symbol });
    default:
      return t("briefingBaseline", { symbol: item.symbol });
  }
}

function attentionBadgeClass(level: WatchlistBriefingItem["attentionLevel"]) {
  switch (level) {
    case "high":
      return "border-status-warning/35 bg-status-warning/10 text-status-warning";
    case "medium":
      return "border-cognitive/35 bg-cognitive/10 text-cognitive";
    default:
      return "border-white/12 bg-white/[0.04] text-muted-foreground";
  }
}

function attentionLabelKey(level: WatchlistBriefingItem["attentionLevel"]) {
  switch (level) {
    case "high":
      return "radarAttentionHigh";
    case "medium":
      return "radarAttentionMedium";
    default:
      return "radarAttentionBaseline";
  }
}

export async function DailyBriefingList({
  items,
}: {
  items: WatchlistBriefingItem[];
}) {
  const t = await getTranslations("Dashboard");

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("briefingEmpty")}</p>;
  }

  return (
    <ul className="space-y-3" aria-label={t("briefingTitle")}>
      {items.map((item) => (
        <li
          key={item.symbol}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground">{item.symbol}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {formatBriefingLine(item, t)}
              </p>
            </div>
            <Badge className={cn("shrink-0", attentionBadgeClass(item.attentionLevel))}>
              {t(attentionLabelKey(item.attentionLevel))}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/ativo/${encodeURIComponent(item.symbol)}`}
              className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <FileSearch className="size-3" aria-hidden />
              {t("briefingOpenDossier")}
            </Link>
            <Link
              href="/calendario?mesa=1"
              className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <CalendarDays className="size-3" aria-hidden />
              {t("briefingOpenCalendar")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
