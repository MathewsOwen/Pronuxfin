import { describe, expect, it } from "vitest";
import { PronuxfinAnalyticaEngine } from "@/lib/analytica/pronuxfin-analytica-engine";
import type { AssetQualitativeInput, AssetQuantInput } from "@/lib/analytica/types";

const eliteQuant: AssetQuantInput = {
  ticker: "WEGE3",
  netDebtEbitda: 0.4,
  netMargin: 0.18,
  roe: 0.28,
  consecutiveProfitableYears: 12,
  revenueCagr5y: 0.14,
};

const eliteQual: AssetQualitativeInput = {
  ticker: "WEGE3",
  sectorPerenniality: 9.2,
  governanceScore: 9,
  competitiveMoat: 9.5,
  managementExecution: 9.3,
};

const toxicQuant: AssetQuantInput = {
  ticker: "AMER3",
  netDebtEbitda: 8.5,
  netMargin: -0.12,
  roe: -0.35,
  consecutiveProfitableYears: 0,
  revenueCagr5y: -0.18,
};

const toxicQual: AssetQualitativeInput = {
  ticker: "AMER3",
  sectorPerenniality: 4,
  governanceScore: 3,
  competitiveMoat: 2.5,
  managementExecution: 2,
};

describe("PronuxfinAnalyticaEngine", () => {
  it("scores elite compounder with high PCI", () => {
    const engine = new PronuxfinAnalyticaEngine("MODERATE");
    const bundle = engine.analyzeAsset(eliteQuant, eliteQual);
    expect(bundle.quantResult.healthScore).toBeGreaterThan(75);
    expect(bundle.qualResult.pci).toBeGreaterThan(75);
    expect(bundle.quantResult.isToxicBomb).toBe(false);
  });

  it("zeros PCI for toxic bomb regardless of qualitative scores", () => {
    const engine = new PronuxfinAnalyticaEngine("MODERATE");
    const bundle = engine.analyzeAsset(toxicQuant, toxicQual);
    expect(bundle.quantResult.isToxicBomb).toBe(true);
    expect(bundle.qualResult.pci).toBe(0);
  });

  it("apportions cash only to underweight names without sells", () => {
    const engine = new PronuxfinAnalyticaEngine("MODERATE");
    const wege = engine.analyzeAsset(eliteQuant, eliteQual);
    const mrfgQuant: AssetQuantInput = {
      ticker: "MRFG3",
      netDebtEbitda: 2.8,
      netMargin: 0.03,
      roe: 0.06,
      consecutiveProfitableYears: 1,
      revenueCagr5y: 0.09,
    };
    const mrfgQual: AssetQualitativeInput = {
      ticker: "MRFG3",
      sectorPerenniality: 7,
      governanceScore: 6.5,
      competitiveMoat: 6,
      managementExecution: 7.2,
    };
    const mrfg = engine.analyzeAsset(mrfgQuant, mrfgQual);

    const report = engine.recommendCashDeployment(
      [wege, mrfg],
      [
        { ticker: "WEGE3", currentValueBrl: 28_000 },
        { ticker: "MRFG3", currentValueBrl: 8_500 },
      ],
      15_000,
    );

    expect(report.lines.some((l) => l.ticker === "MRFG3" && l.allocationBrl > 0)).toBe(true);
    expect(report.executionNotes.some((n) => n.includes("venda"))).toBe(true);
    const totalAlloc = report.lines.reduce((s, l) => s + l.allocationBrl, 0);
    expect(totalAlloc).toBeCloseTo(15_000, 0);
  });
});
