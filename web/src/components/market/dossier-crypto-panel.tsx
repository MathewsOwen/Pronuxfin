import { Link } from "@/i18n/navigation";
import type { AssetDossier } from "@/lib/market/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatCompact(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 font-mono text-sm font-semibold text-foreground", accent)}>{value}</p>
    </div>
  );
}

export function DossierCryptoProfileSection({
  dossier,
  locale,
  labels,
}: {
  dossier: AssetDossier;
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    marketRank: string;
    supplyCirculating: string;
    supplyTotal: string;
    supplyMax: string;
    fdv: string;
    ath: string;
    atl: string;
    change7d: string;
    change30d: string;
    change1y: string;
    community: string;
    developers: string;
    algorithm: string;
    genesis: string;
    links: string;
    notAvailable: string;
  };
}) {
  const profile = dossier.cryptoProfile;
  if (!profile) return null;

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <CardTitle className="font-heading">{labels.title}</CardTitle>
        <CardDescription>{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={labels.marketRank}
            value={profile.marketCapRank != null ? `#${profile.marketCapRank}` : labels.notAvailable}
          />
          <Metric
            label={labels.supplyCirculating}
            value={formatCompact(profile.circulatingSupply, locale)}
          />
          <Metric
            label={labels.supplyTotal}
            value={formatCompact(profile.totalSupply, locale)}
          />
          <Metric
            label={labels.supplyMax}
            value={formatCompact(profile.maxSupply, locale)}
          />
          <Metric label={labels.fdv} value={formatMoney(profile.fullyDilutedValuation, locale)} />
          <Metric label={labels.ath} value={formatMoney(profile.athPrice, locale)} />
          <Metric label={labels.atl} value={formatMoney(profile.atlPrice, locale)} />
          <Metric
            label={labels.change7d}
            value={formatPct(profile.priceChange7d)}
            accent={
              profile.priceChange7d != null
                ? profile.priceChange7d >= 0
                  ? "text-market-up"
                  : "text-market-down"
                : undefined
            }
          />
          <Metric
            label={labels.change30d}
            value={formatPct(profile.priceChange30d)}
            accent={
              profile.priceChange30d != null
                ? profile.priceChange30d >= 0
                  ? "text-market-up"
                  : "text-market-down"
                : undefined
            }
          />
          <Metric
            label={labels.change1y}
            value={formatPct(profile.priceChange1y)}
            accent={
              profile.priceChange1y != null
                ? profile.priceChange1y >= 0
                  ? "text-market-up"
                  : "text-market-down"
                : undefined
            }
          />
          <Metric
            label={labels.community}
            value={formatCompact(profile.twitterFollowers, locale)}
          />
          <Metric
            label={labels.developers}
            value={formatCompact(profile.githubStars, locale)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.algorithm}
            </p>
            <p className="mt-1 text-foreground">
              {profile.hashingAlgorithm ?? labels.notAvailable}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.genesis}
            </p>
            <p className="mt-1 text-foreground">
              {profile.genesisDate
                ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(profile.genesisDate),
                  )
                : labels.notAvailable}
            </p>
          </div>
        </div>

        {(profile.homepageUrl || profile.githubUrl || profile.blockchainUrls.length > 0) && (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.links}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.homepageUrl ? (
                <a
                  href={profile.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground hover:border-primary/30"
                >
                  Site
                </a>
              ) : null}
              {profile.githubUrl ? (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground hover:border-primary/30"
                >
                  GitHub
                </a>
              ) : null}
              {profile.blockchainUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground hover:border-primary/30"
                >
                  Explorer
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DossierCryptoPeersSection({
  dossier,
  labels,
}: {
  dossier: AssetDossier;
  labels: { title: string; subtitle: string; open: string };
}) {
  if (dossier.comparablePeers.length === 0) return null;
  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <CardTitle className="font-heading">{labels.title}</CardTitle>
        <CardDescription>{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {dossier.comparablePeers.map((peer) => (
            <Link
              key={peer}
              href={`/ativo/${peer}`}
              className="rounded-full border border-teal-500/30 bg-teal-950/30 px-3 py-1 font-mono text-xs text-teal-100 hover:border-teal-400/50"
            >
              {peer}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
