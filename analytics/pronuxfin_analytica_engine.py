#!/usr/bin/env python3
"""
PRONUXFIN CORE ANALYTICA ENGINE (V2.0-ULTRA)
Advanced Quant-Mentalist Asset Screener & Predictive Apportionment Motor.

Modules:
  1. Dynamic Quantitative Risk Engine (Detox Core)
  2. Matricial Qualitative Trust Engine (Mentalist Layer)
  3. Predictive Cash Rebalancing & Optimal Apportionment
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Final, List, Mapping, Optional, Tuple


# ---------------------------------------------------------------------------
# Enumerations & immutable data carriers
# ---------------------------------------------------------------------------


class RiskProfile(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"


class RiskClassification(str, Enum):
    ELITE_COMPOUNDER = "ELITE_COMPOUNDER"
    QUALITY_GROWTH = "QUALITY_GROWTH"
    TURNAROUND = "TURNAROUND"
    CYCLICAL = "CYCLICAL"
    WATCHLIST = "WATCHLIST"
    TOXIC_BOMB = "TOXIC_BOMB"


@dataclass(frozen=True)
class AssetQuantData:
    ticker: str
    net_debt_ebitda: Optional[float]
    net_margin: Optional[float]
    roe: Optional[float]
    consecutive_profitable_years: int
    revenue_cagr_5y: Optional[float]


@dataclass(frozen=True)
class AssetQualitativeData:
    ticker: str
    sector_perenniality: float
    governance_score: float
    competitive_moat: float
    management_execution: float


@dataclass(frozen=True)
class RiskProfileConfig:
    debt_ebitda_threshold: float
    min_net_margin: float
    min_roe: float
    min_profitable_years: int
    debt_penalty_multiplier: float
    margin_weight: float
    roe_weight: float
    growth_weight: float


@dataclass(frozen=True)
class QuantRiskResult:
    ticker: str
    health_score: float
    debt_penalty: float
    is_toxic_bomb: bool
    risk_classification: RiskClassification
    diagnostics: Tuple[str, ...]


@dataclass(frozen=True)
class QualitativeResult:
    ticker: str
    qualitative_score: float
    pci: float
    is_toxic_bomb: bool
    risk_classification: RiskClassification


@dataclass(frozen=True)
class PortfolioPosition:
    ticker: str
    current_value_brl: float


@dataclass(frozen=True)
class ApportionmentLine:
    ticker: str
    target_pct: float
    current_pct: float
    delta_pct: float
    allocation_brl: float
    post_trade_pct: float
    risk_classification: RiskClassification
    pci: float


@dataclass(frozen=True)
class ApportionmentReport:
    fresh_cash_brl: float
    portfolio_value_before_brl: float
    portfolio_value_after_brl: float
    lines: Tuple[ApportionmentLine, ...]
    execution_notes: Tuple[str, ...]


# ---------------------------------------------------------------------------
# Profile registry
# ---------------------------------------------------------------------------

PROFILE_CONFIGS: Final[Mapping[RiskProfile, RiskProfileConfig]] = {
    RiskProfile.CONSERVATIVE: RiskProfileConfig(
        debt_ebitda_threshold=2.0,
        min_net_margin=0.08,
        min_roe=0.12,
        min_profitable_years=3,
        debt_penalty_multiplier=25.0,
        margin_weight=0.22,
        roe_weight=0.22,
        growth_weight=0.16,
    ),
    RiskProfile.MODERATE: RiskProfileConfig(
        debt_ebitda_threshold=3.0,
        min_net_margin=0.05,
        min_roe=0.08,
        min_profitable_years=2,
        debt_penalty_multiplier=20.0,
        margin_weight=0.20,
        roe_weight=0.20,
        growth_weight=0.18,
    ),
    RiskProfile.AGGRESSIVE: RiskProfileConfig(
        debt_ebitda_threshold=4.5,
        min_net_margin=0.02,
        min_roe=0.05,
        min_profitable_years=1,
        debt_penalty_multiplier=15.0,
        margin_weight=0.18,
        roe_weight=0.18,
        growth_weight=0.22,
    ),
}

QUAL_WEIGHTS: Final[Tuple[float, float, float, float]] = (0.35, 0.25, 0.20, 0.20)
PCI_QUANT_WEIGHT: Final[float] = 0.60
PCI_QUAL_WEIGHT: Final[float] = 0.40
TOXIC_THRESHOLD: Final[float] = 50.0


# ---------------------------------------------------------------------------
# Defensive numerics
# ---------------------------------------------------------------------------


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _safe_float(value: Optional[float], default: float = 0.0) -> float:
    if value is None:
        return default
    if not isinstance(value, (int, float)):
        return default
    if value != value:  # NaN
        return default
    return float(value)


def _pct(value: float, total: float) -> float:
    if total <= 0.0:
        return 0.0
    return value / total


# ---------------------------------------------------------------------------
# MODULE 1 — Dynamic Quantitative Risk Engine
# ---------------------------------------------------------------------------


class QuantitativeRiskEngine:
  """Detox Core: continuous penalties, bounded health score, toxic quarantine."""

  def __init__(self, profile: RiskProfile = RiskProfile.MODERATE) -> None:
      self._profile = profile
      self._config = PROFILE_CONFIGS[profile]

  @property
  def profile(self) -> RiskProfile:
      return self._profile

  def evaluate(self, data: AssetQuantData) -> QuantRiskResult:
      cfg = self._config
      diagnostics: List[str] = []

      debt = _safe_float(data.net_debt_ebitda, default=99.0)
      margin = _safe_float(data.net_margin)
      roe = _safe_float(data.roe)
      cagr = _safe_float(data.revenue_cagr_5y)
      years = max(0, int(data.consecutive_profitable_years or 0))

      debt_penalty = 0.0
      if debt > cfg.debt_ebitda_threshold:
          debt_penalty = (debt - cfg.debt_ebitda_threshold) * cfg.debt_penalty_multiplier
          diagnostics.append(
              f"Dívida líquida/EBITDA {debt:.2f}x excede limite {cfg.debt_ebitda_threshold:.2f}x "
              f"(penalidade contínua {debt_penalty:.1f} pts)."
          )

      margin_score = _clamp((margin / max(cfg.min_net_margin, 1e-6)) * 100.0, 0.0, 100.0)
      roe_score = _clamp((roe / max(cfg.min_roe, 1e-6)) * 100.0, 0.0, 100.0)
      growth_score = _clamp(((cagr + 0.05) / 0.25) * 100.0, 0.0, 100.0)
      longevity_score = _clamp((years / max(cfg.min_profitable_years, 1)) * 100.0, 0.0, 100.0)

      if years == 0:
          diagnostics.append("Armadilha de ferro: zero anos consecutivos de lucro.")

      if margin < cfg.min_net_margin:
          diagnostics.append(f"Margem líquida {margin:.1%} abaixo do piso {cfg.min_net_margin:.1%}.")
      if roe < cfg.min_roe:
          diagnostics.append(f"ROE {roe:.1%} abaixo do piso {cfg.min_roe:.1%}.")

      base = (
          longevity_score * 0.28
          + margin_score * cfg.margin_weight
          + roe_score * cfg.roe_weight
          + growth_score * cfg.growth_weight
      )
      health_score = _clamp(base - debt_penalty, 0.0, 100.0)

      is_toxic = health_score < TOXIC_THRESHOLD or years == 0
      classification = self._classify(health_score, years, margin, cagr, is_toxic)

      return QuantRiskResult(
          ticker=data.ticker,
          health_score=round(health_score, 2),
          debt_penalty=round(debt_penalty, 2),
          is_toxic_bomb=is_toxic,
          risk_classification=classification,
          diagnostics=tuple(diagnostics),
      )

  @staticmethod
  def _classify(
      health: float,
      years: int,
      margin: float,
      cagr: float,
      is_toxic: bool,
  ) -> RiskClassification:
      if is_toxic:
          return RiskClassification.TOXIC_BOMB
      if health >= 82 and years >= 5 and margin >= 0.12:
          return RiskClassification.ELITE_COMPOUNDER
      if health >= 68 and cagr >= 0.10:
          return RiskClassification.QUALITY_GROWTH
      if years <= 2 and health >= 55:
          return RiskClassification.TURNAROUND
      if cagr < 0.03 and health >= 50:
          return RiskClassification.CYCLICAL
      return RiskClassification.WATCHLIST


# ---------------------------------------------------------------------------
# MODULE 2 — Matricial Qualitative Trust Engine
# ---------------------------------------------------------------------------


class QualitativeTrustEngine:
  """Mentalist Layer: AHP ponderation + PCI synthesis."""

  def synthesize(
      self,
      quant: QuantRiskResult,
      qual: AssetQualitativeData,
  ) -> QualitativeResult:
      p = _clamp(_safe_float(qual.sector_perenniality), 0.0, 10.0)
      g = _clamp(_safe_float(qual.governance_score), 0.0, 10.0)
      m = _clamp(_safe_float(qual.competitive_moat), 0.0, 10.0)
      e = _clamp(_safe_float(qual.management_execution), 0.0, 10.0)

      w_p, w_g, w_m, w_e = QUAL_WEIGHTS
      s_l = (p * w_p) + (g * w_g) + (m * w_m) + (e * w_e)

      pci = (quant.health_score * PCI_QUANT_WEIGHT) + ((s_l * 10.0) * PCI_QUAL_WEIGHT)
      if quant.is_toxic_bomb:
          pci = 0.0

      return QualitativeResult(
          ticker=qual.ticker,
          qualitative_score=round(s_l, 2),
          pci=round(_clamp(pci, 0.0, 100.0), 2),
          is_toxic_bomb=quant.is_toxic_bomb,
          risk_classification=quant.risk_classification,
      )


# ---------------------------------------------------------------------------
# MODULE 3 — Predictive Cash Rebalancing
# ---------------------------------------------------------------------------


class CashRebalancingEngine:
  """Smart apportionment: buy-only vector restoring equilibrium toward PCI targets."""

  def apportion(
      self,
      pci_by_ticker: Mapping[str, float],
      classifications: Mapping[str, RiskClassification],
      positions: List[PortfolioPosition],
      fresh_cash_brl: float,
  ) -> ApportionmentReport:
      cash = max(0.0, _safe_float(fresh_cash_brl))
      eligible_pci = {
          t: max(0.0, pci)
          for t, pci in pci_by_ticker.items()
          if classifications.get(t) != RiskClassification.TOXIC_BOMB
      }
      pci_sum = sum(eligible_pci.values())

      position_map: Dict[str, float] = {p.ticker: max(0.0, p.current_value_brl) for p in positions}
      for ticker in eligible_pci:
          position_map.setdefault(ticker, 0.0)

      portfolio_before = sum(position_map.values())
      notes: List[str] = []

      if pci_sum <= 0.0:
          notes.append("Nenhum ativo elegível com PCI > 0 — caixa mantido em liquidez.")
          return ApportionmentReport(
              fresh_cash_brl=cash,
              portfolio_value_before_brl=portfolio_before,
              portfolio_value_after_brl=portfolio_before + cash,
              lines=tuple(),
              execution_notes=tuple(notes),
          )

      target_pct = {t: pci / pci_sum for t, pci in eligible_pci.items()}
      current_pct = {t: _pct(position_map[t], portfolio_before) for t in target_pct}
      delta_pct = {t: target_pct[t] - current_pct[t] for t in target_pct}

      underweight = {t: d for t, d in delta_pct.items() if d > 1e-9}
      if not underweight:
          notes.append("Carteira já em equilíbrio ou acima do alvo — sem compras sugeridas.")
          lines = tuple(
              ApportionmentLine(
                  ticker=t,
                  target_pct=round(target_pct[t] * 100, 2),
                  current_pct=round(current_pct[t] * 100, 2),
                  delta_pct=round(delta_pct[t] * 100, 2),
                  allocation_brl=0.0,
                  post_trade_pct=round(current_pct[t] * 100, 2),
                  risk_classification=classifications.get(t, RiskClassification.WATCHLIST),
                  pci=round(eligible_pci[t], 2),
              )
              for t in sorted(target_pct.keys())
          )
          return ApportionmentReport(
              fresh_cash_brl=cash,
              portfolio_value_before_brl=portfolio_before,
              portfolio_value_after_brl=portfolio_before + cash,
              lines=lines,
              execution_notes=tuple(notes),
          )

      total_delta = sum(underweight.values())
      raw_alloc = {t: cash * (underweight[t] / total_delta) for t in underweight}

      portfolio_after = portfolio_before + cash
      lines: List[ApportionmentLine] = []
      for ticker in sorted(target_pct.keys()):
          alloc = raw_alloc.get(ticker, 0.0)
          new_value = position_map[ticker] + alloc
          lines.append(
              ApportionmentLine(
                  ticker=ticker,
                  target_pct=round(target_pct[ticker] * 100, 2),
                  current_pct=round(current_pct[ticker] * 100, 2),
                  delta_pct=round(delta_pct[ticker] * 100, 2),
                  allocation_brl=round(alloc, 2),
                  post_trade_pct=round(_pct(new_value, portfolio_after) * 100, 2),
                  risk_classification=classifications.get(ticker, RiskClassification.WATCHLIST),
                  pci=round(eligible_pci[ticker], 2),
              )
          )

      notes.append("Regra crítica respeitada: nenhuma operação de venda sugerida.")
      notes.append(
          f"Caixa distribuído entre {len(underweight)} ativo(s) subalocados "
          f"(peso proporcional ao Δ até o alvo PCI)."
      )

      return ApportionmentReport(
          fresh_cash_brl=cash,
          portfolio_value_before_brl=portfolio_before,
          portfolio_value_after_brl=portfolio_after,
          lines=tuple(lines),
          execution_notes=tuple(notes),
      )


# ---------------------------------------------------------------------------
# Master aggregator
# ---------------------------------------------------------------------------


@dataclass
class AssetAnalysisBundle:
    quant: AssetQuantData
    qual: AssetQualitativeData
    quant_result: QuantRiskResult = field(repr=False)
    qual_result: QualitativeResult = field(repr=False)


class PronuxfinAnalyticaEngine:
    """Unified façade orchestrating Detox → Mentalist → Apportionment."""

    def __init__(self, profile: RiskProfile = RiskProfile.MODERATE) -> None:
        self._risk_engine = QuantitativeRiskEngine(profile)
        self._trust_engine = QualitativeTrustEngine()
        self._cash_engine = CashRebalancingEngine()
        self._profile = profile

    @property
    def risk_profile(self) -> RiskProfile:
        return self._profile

    def analyze_asset(
        self,
        quant: AssetQuantData,
        qual: AssetQualitativeData,
    ) -> AssetAnalysisBundle:
        if quant.ticker != qual.ticker:
            raise ValueError(f"Ticker mismatch: {quant.ticker} vs {qual.ticker}")
        q_result = self._risk_engine.evaluate(quant)
        l_result = self._trust_engine.synthesize(q_result, qual)
        return AssetAnalysisBundle(
            quant=quant,
            qual=qual,
            quant_result=q_result,
            qual_result=l_result,
        )

    def analyze_universe(
        self,
        quant_rows: List[AssetQuantData],
        qual_rows: List[AssetQualitativeData],
    ) -> List[AssetAnalysisBundle]:
        qual_map = {q.ticker: q for q in qual_rows}
        return [
            self.analyze_asset(q, qual_map[q.ticker])
            for q in quant_rows
            if q.ticker in qual_map
        ]

    def recommend_cash_deployment(
        self,
        bundles: List[AssetAnalysisBundle],
        positions: List[PortfolioPosition],
        fresh_cash_brl: float,
    ) -> ApportionmentReport:
        pci = {b.qual_result.ticker: b.qual_result.pci for b in bundles}
        classes = {b.qual_result.ticker: b.qual_result.risk_classification for b in bundles}
        return self._cash_engine.apportion(pci, classes, positions, fresh_cash_brl)


# ---------------------------------------------------------------------------
# Terminal dashboard (PT-BR)
# ---------------------------------------------------------------------------


def _brl(value: float) -> str:
    s = f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def _bar(score: float, width: int = 24) -> str:
    filled = int(round(_clamp(score, 0, 100) / 100 * width))
    return "#" * filled + "." * (width - filled)


def render_portuguese_dashboard(
    engine: PronuxfinAnalyticaEngine,
    bundles: List[AssetAnalysisBundle],
    report: ApportionmentReport,
) -> str:
    lines: List[str] = []
    sep = "=" * 72
    thin = "-" * 72

    lines.append(sep)
    lines.append("  PRONUXFIN CORE ANALYTICA · RELATÓRIO INSTITUCIONAL")
    lines.append(f"  Perfil de risco: {engine.risk_profile.value}  |  Motor V2.0-ULTRA")
    lines.append(sep)
    lines.append("")
    lines.append(">> CAMADA 1 — DETOX QUANTITATIVO (S_q)")
    lines.append(thin)

    for b in bundles:
        qr = b.quant_result
        lines.append(f"  [{qr.ticker}]  S_q = {qr.health_score:5.1f}  {_bar(qr.health_score)}")
        lines.append(f"           Classificação: {qr.risk_classification.value}")
        lines.append(f"           Penalidade dívida: {qr.debt_penalty:.1f} pts")
        if qr.is_toxic_bomb:
            lines.append("           [!] ARMADILHA DE FERRO — TOXIC_BOMB (alocacao bloqueada)")
        for d in qr.diagnostics:
            lines.append(f"           · {d}")
        lines.append("")

    lines.append(">> CAMADA 2 — MENTALISTA QUALITATIVO (S_l -> PCI)")
    lines.append(thin)

    for b in bundles:
        lr = b.qual_result
        lines.append(
            f"  [{lr.ticker}]  S_l = {lr.qualitative_score:4.1f}/10  "
            f"PCI = {lr.pci:5.1f}  {_bar(lr.pci)}"
        )
        lines.append("")

    lines.append(">> CAMADA 3 — APORTE PREDITIVO (SOMENTE COMPRAS)")
    lines.append(thin)
    lines.append(f"  Caixa novo:        {_brl(report.fresh_cash_brl)}")
    lines.append(f"  Carteira antes:    {_brl(report.portfolio_value_before_brl)}")
    lines.append(f"  Carteira depois:   {_brl(report.portfolio_value_after_brl)}")
    lines.append("")
    lines.append(
        f"  {'TICKER':<8} {'PCI':>6} {'ALVO%':>7} {'ATUAL%':>7} {'Δ%':>7} "
        f"{'APORTE':>14} {'POS%':>7}  CLASSIFICACAO"
    )
    lines.append(f"  {thin}")

    for row in report.lines:
        flag = "X" if row.risk_classification == RiskClassification.TOXIC_BOMB else "OK"
        lines.append(
            f"  {row.ticker:<8} {row.pci:6.1f} {row.target_pct:6.1f}% "
            f"{row.current_pct:6.1f}% {row.delta_pct:+6.1f}% "
            f"{_brl(row.allocation_brl):>14} {row.post_trade_pct:6.1f}%  "
            f"{flag} {row.risk_classification.value}"
        )

    lines.append("")
    lines.append(">> NOTAS DE EXECUCAO")
    lines.append(thin)
    for note in report.execution_notes:
        lines.append(f"  · {note}")
    lines.append("")
    lines.append(sep)
    lines.append("  PRONUXFIN — Evolução do mercado financeiro. Dados ≠ recomendação.")
    lines.append(sep)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Demonstration pipeline — 4 assets + R$ 15.000
# ---------------------------------------------------------------------------


def _stdout_utf8() -> None:
    import sys

    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8")
            except Exception:
                pass


def run_demonstration() -> None:
    _stdout_utf8()
    engine = PronuxfinAnalyticaEngine(profile=RiskProfile.MODERATE)

    quant_universe = [
        AssetQuantData(
            ticker="WEGE3",
            net_debt_ebitda=0.4,
            net_margin=0.18,
            roe=0.28,
            consecutive_profitable_years=12,
            revenue_cagr_5y=0.14,
        ),
        AssetQuantData(
            ticker="MRFG3",
            net_debt_ebitda=2.8,
            net_margin=0.03,
            roe=0.06,
            consecutive_profitable_years=1,
            revenue_cagr_5y=0.09,
        ),
        AssetQuantData(
            ticker="CSNA3",
            net_debt_ebitda=3.6,
            net_margin=0.04,
            roe=0.07,
            consecutive_profitable_years=4,
            revenue_cagr_5y=0.02,
        ),
        AssetQuantData(
            ticker="AMER3",
            net_debt_ebitda=8.5,
            net_margin=-0.12,
            roe=-0.35,
            consecutive_profitable_years=0,
            revenue_cagr_5y=-0.18,
        ),
    ]

    qual_universe = [
        AssetQualitativeData(
            ticker="WEGE3",
            sector_perenniality=9.2,
            governance_score=9.0,
            competitive_moat=9.5,
            management_execution=9.3,
        ),
        AssetQualitativeData(
            ticker="MRFG3",
            sector_perenniality=7.0,
            governance_score=6.5,
            competitive_moat=6.0,
            management_execution=7.2,
        ),
        AssetQualitativeData(
            ticker="CSNA3",
            sector_perenniality=6.5,
            governance_score=6.0,
            competitive_moat=5.5,
            management_execution=5.8,
        ),
        AssetQualitativeData(
            ticker="AMER3",
            sector_perenniality=4.0,
            governance_score=3.0,
            competitive_moat=2.5,
            management_execution=2.0,
        ),
    ]

    bundles = engine.analyze_universe(quant_universe, qual_universe)

    positions = [
        PortfolioPosition(ticker="WEGE3", current_value_brl=28_000.0),
        PortfolioPosition(ticker="MRFG3", current_value_brl=8_500.0),
        PortfolioPosition(ticker="CSNA3", current_value_brl=11_000.0),
        PortfolioPosition(ticker="AMER3", current_value_brl=4_500.0),
    ]

    report = engine.recommend_cash_deployment(
        bundles=bundles,
        positions=positions,
        fresh_cash_brl=15_000.0,
    )

    print(render_portuguese_dashboard(engine, bundles, report))


if __name__ == "__main__":
    run_demonstration()
