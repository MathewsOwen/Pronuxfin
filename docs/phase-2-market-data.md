# Fase 2 — Dados reais de mercado

Objetivo: mesa, bolsa e calendário com **fontes reais** em produção, sem cotações inventadas silenciosamente.

**Critérios 10/10:** [phases-2-3.md](./phases-2-3.md) · **Pré-requisitos:** [Fases 0–1](./phases-0-1.md) (`npm run validate`, `npm run smoke:strict`).

---

## 1. Política de simulação

| Ambiente | Comportamento |
|----------|----------------|
| **Desenvolvimento** | Fallback simulado permitido (demo rápida) |
| **Produção** | Sem simulação silenciosa — falha vira livro vazio + aviso |
| **Demo interna** | `MARKET_ALLOW_SIMULATION=1` na Vercel (não usar em go-live) |

Implementação: `web/src/lib/market/market-data-policy.ts`

---

## 2. Variáveis na Vercel (`web`)

| Variável | Efeito |
|----------|--------|
| `BRAPI_TOKEN` | Cotações B3 na strip, bolsa e setores BR |
| `FMP_API_KEY` | Dossiê internacional, earnings no calendário, métricas FMP |
| `MARKET_ALLOW_SIMULATION` | Se `1`, permite demo simulada em produção (evitar) |

CoinGecko (cripto) não exige chave — rate limits públicos aplicam-se.

---

## 3. Endpoints de verificação

| Endpoint | Esperado em go-live |
|----------|---------------------|
| `GET /api/health/market` | `200`, `capabilities.readyForLiveDesk: true` |
| `GET /api/quotes` | `dataMode: "live"`, `simulated: false` |
| Calendário logado | `mode: "hybrid"` com `FMP_API_KEY` |

Probe detalhado de mercado:

```bash
curl -s https://www.seudominio.com.br/api/health/market | jq .
```

---

## 4. Smoke test (produção)

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_MARKET_LIVE=1 \
EXPECT_PASSWORD_RESET=1 \
npm run smoke:strict
```

---

## 5. UI — o que o utilizador vê

| Estado | Strip / bolsa |
|--------|----------------|
| `dataMode: live` | “ações brapi” / “cripto CoinGecko” |
| `dataMode: simulated` | Badge âmbar “demo” (só dev ou `MARKET_ALLOW_SIMULATION`) |
| `dataMode: degraded` | “cotações indisponíveis — configure BRAPI_TOKEN” |

Calendário: eventos `source: curated` com badge **Ilustrativo**; com FMP, banner **Agenda híbrida**.

---

## 6. Checklist go-live mercado

- [ ] `BRAPI_TOKEN` na Vercel + redeploy
- [ ] `FMP_API_KEY` na Vercel (calendário + dossiê intl.)
- [ ] `MARKET_ALLOW_SIMULATION` **ausente** ou `0` em produção
- [ ] `GET /api/health/market` → 200
- [ ] Abrir `/bolsa` — sem badge “simulação” na mesa principal
- [ ] Abrir `/calendario` logado — earnings FMP quando na watchlist
- [ ] `npm run smoke:strict` com `EXPECT_MARKET_LIVE=1`

---

## Próxima fase

**Fase 3 — UX 10/10:** onboarding, menu agrupado, estados vazios.
