import { analyzeDossier } from "@/lib/analytica/map-dossier-to-analytica";
import {
  computeCryptoSelo,
  computeEquitySelo,
} from "@/lib/analytica/pronuxfin-selo-engine";
import type { DossierSeloResult } from "@/lib/analytica/selo-types";
import type { AssetAnalysisBundle, RiskProfileId } from "@/lib/analytica/types";
import type { AssetDossier } from "@/lib/market/types";

export type DossierSeloPayload = {
  selo: DossierSeloResult;
  analyticaBundle: AssetAnalysisBundle | null;
};

export function buildDossierSeloPayload(
  dossier: AssetDossier,
  profile: RiskProfileId = "MODERATE",
): DossierSeloPayload {
  if (dossier.assetClass === "crypto") {
    return {
      selo: computeCryptoSelo(dossier),
      analyticaBundle: null,
    };
  }

  const bundle = analyzeDossier(dossier, profile);
  return {
    selo: computeEquitySelo(dossier, bundle),
    analyticaBundle: bundle,
  };
}
