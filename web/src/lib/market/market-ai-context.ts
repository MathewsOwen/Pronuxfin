import type { AiLocale } from "@/lib/assistant/market-ai-locale";
import type { QuotesPayload } from "@/lib/market/types";
import { sortQuotesForDesk } from "@/lib/market/indices";

const labels = {
  "pt-BR": {
    updated: "Atualização (unix ms)",
    warnBr: "Aviso: amostragem BR pode estar simulada ou parcial neste ciclo.",
    warnCrypto: "Aviso: cripto em modo fallback/simulado.",
    warnPartial: "Aviso: algumas linhas BR ausentes nesta rodada.",
    brDesk: "BR desk ·",
    cryptoBrl: "Crypto BRL ·",
    headlines: "Manchetes RSS recentes (títulos apenas):",
    ctxUnavailable: "(contexto indisponível neste ciclo)",
    demoDefault:
      "Resposta em modo demonstração — sem modelo remoto configurado. Trato apenas educação e enquadramento de risco.",
    demoRates:
      "Juros e COPOM mexem diretamente no custo do capital e no desconto de fluxos futuros — em mesa, você olha política monetária, inflação esperada e prêmios de crédito/soberano.",
    demoFx:
      "FX reflete diferentes taxas, diferencial de juros real, percepção soberana e liquidez global — cenários sempre vêm com dois lados.",
    demoCrypto:
      "Cripto traz alta volatilidade, correlações variando com fluxo institucional e liquidez — position sizing e governança de risco aparecem antes de entrada.",
    demoBolsa:
      "Bolsa brasileira reúne empresa, macro e política num só preço — o painel sintetiza futuros, commodities e expectativa de taxa.",
    demoInfla:
      "Inflação atravessa todas as carteiras via curva, real e política monetária — operacionalização passa por revisões cadenciadas, não por previsões pontuais.",
    demoPortfolio:
      "Construção de carteira institucional costuma partir de objetivo temporal, liquidez contratável e limites por risco/regulatório — sem promessa de trajetória garantida.",
    demoTrade:
      "Sem perfil/registro/regulatória completos não indico entrada/saída em ativos; posso apenas listar perguntas e checagens típicas de mesa (liquidez, stress, cenários).",
    radar: "Radar (snapshot do servidor):",
    ollamaHint:
      "Para modelo de linguagem: suba um Ollama e defina PRONUX_MARKET_AI_OLLAMA_ORIGIN — o app usa só o protocolo nativo (/api/chat), não API estilo provedores OpenAI-compat.",
    remoteFail:
      "Falha ao contatar modelo remoto neste ciclo — resposta de demonstração apenas.",
  },
  en: {
    updated: "Snapshot timestamp (unix ms)",
    warnBr: "Notice: Brazilian equity sample may be simulated or degraded this cycle.",
    warnCrypto: "Notice: crypto quotes may be in fallback/demo mode.",
    warnPartial: "Notice: some Brazilian equity rows missing this poll.",
    brDesk: "BR desk ·",
    cryptoBrl: "Crypto BRL ·",
    headlines: "Recent RSS headlines (titles only):",
    ctxUnavailable: "(no desk context returned this cycle)",
    demoDefault:
      "Demo pathway — remote LLM not configured yet. Guidance covers education plus explicit risk framing only.",
    demoRates:
      "Policy rates reshape the equity discount rate curve — desks pair central-bank narratives with sovereign and credit spreads, not anecdotes.",
    demoFx:
      "Foreign exchange reacts to inflation differentials, real rates, geopolitics and global liquidity regimes — narratives should stay two-sided.",
    demoCrypto:
      "Digital assets amplify volatility regimes; correlations shift with ETF flows and funding stress — risk governance precedes position sizing.",
    demoBolsa:
      "Brazil’s cash market folds corporate fundamentals, macro impulses and positioning into prints — snapshots below keep you tethered to the same desk context.",
    demoInfla:
      "Inflation propagates via the curve, wages and resets — disciplined investors schedule reviews instead of debating a single CPI point estimate.",
    demoPortfolio:
      "Institutional portfolios start from horizons, contractual liquidity gates and compliant risk buckets — nobody serious promises a guaranteed glide path.",
    demoTrade:
      "Without disclosures, onboarding and supervisory cover I cannot prescribe trade tickets; share the checklist desks use (liquidity, stress, disclosures).",
    radar: "Desk snapshot (server):",
    ollamaHint:
      "To enable a local LLM, run Ollama and set PRONUX_MARKET_AI_OLLAMA_ORIGIN — this build calls the native /api/chat route only (not an OpenAI-compatible shim).",
    remoteFail:
      "Remote model unavailable this round — showing demo reply only.",
  },
} as const;

/** Texto compacto para system prompt — evita payloads enormes ao modelo. */
export function summarizeQuotesForAi(
  p: QuotesPayload,
  headlineHints: string[],
  locale: AiLocale,
  maxChars = 2200,
): string {
  const L = labels[locale];
  const lines: string[] = [];

  lines.push(`${L.updated}: ${p.fetchedAt}`);
  if (p.simulated) lines.push(L.warnBr);
  if (p.cryptoSimulated) lines.push(L.warnCrypto);
  if (p.equitiesPartial) lines.push(L.warnPartial);

  const eq = sortQuotesForDesk(p.results ?? []).slice(0, 14);
  for (const row of eq) {
    const name = row.shortName ?? row.symbol;
    const px = row.regularMarketPrice;
    const ch = row.regularMarketChangePercent;
    lines.push(
      `${L.brDesk} ${name} (${row.symbol}) — px ${px ?? "—"}, var% ${ch != null ? ch.toFixed(2) : "—"}`,
    );
  }

  const crypto = (p.crypto ?? []).slice(0, 10);
  for (const row of crypto) {
    const px = row.regularMarketPrice;
    const ch = row.regularMarketChangePercent;
    lines.push(
      `${L.cryptoBrl} ${row.symbol} — px ${px ?? "—"}, var% ${ch != null ? ch.toFixed(2) : "—"}`,
    );
  }

  if (headlineHints.length) {
    lines.push(L.headlines);
    lines.push(...headlineHints.slice(0, 8));
  }

  let text = lines.join("\n");
  if (text.length > maxChars) text = `${text.slice(0, maxChars)}…`;
  return text;
}

export function demoMarketReply(
  userText: string,
  contextSummary: string,
  locale: AiLocale,
): string {
  const L = labels[locale];
  const lower = userText.toLowerCase();
  let lead: string = L.demoDefault;

  if (
    lower.includes("juro") ||
    lower.includes("copom") ||
    lower.includes("selic") ||
    lower.includes("interest") ||
    lower.includes("fed") ||
    lower.includes("rate")
  ) {
    lead = L.demoRates;
  } else if (
    lower.includes("dólar") ||
    lower.includes("dolar") ||
    lower.includes("câmbio") ||
    lower.includes("cambio") ||
    lower.includes("fx") ||
    lower.includes("usd")
  ) {
    lead = L.demoFx;
  } else if (
    lower.includes("cripto") ||
    lower.includes("bitcoin") ||
    lower.includes("btc") ||
    lower.includes("crypto") ||
    lower.includes("ethereum")
  ) {
    lead = L.demoCrypto;
  } else if (
    lower.includes("bolsa") ||
    lower.includes("b3") ||
    lower.includes("ibov") ||
    lower.includes("stock") ||
    lower.includes("equity")
  ) {
    lead = L.demoBolsa;
  } else if (lower.includes("infla") || lower.includes("inflation") || lower.includes("cpi")) {
    lead = L.demoInfla;
  } else if (
    lower.includes("invest") ||
    lower.includes("portfolio") ||
    lower.includes("carteira") ||
    lower.includes("allocation")
  ) {
    lead = L.demoPortfolio;
  } else if (
    lower.includes("compra") ||
    lower.includes("vendo") ||
    lower.includes("operação") ||
    lower.includes("operacao") ||
    lower.includes("buy") ||
    lower.includes("sell") ||
    lower.includes("trade")
  ) {
    lead = L.demoTrade;
  }

  const ctxSnippet =
    contextSummary.length > 900
      ? `${contextSummary.slice(0, 900)}…`
      : contextSummary;

  return `${lead}\n\n— ${L.radar}\n${ctxSnippet || L.ctxUnavailable}\n\n${L.ollamaHint}`;
}

export function remoteModelFailureSuffix(locale: AiLocale): string {
  return labels[locale].remoteFail;
}
