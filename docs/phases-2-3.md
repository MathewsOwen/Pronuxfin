# Fases 2 e 3 — critérios 10/10

Checklist de maturidade para **dados reais de mercado** (Fase 2) e **UX da mesa privada** (Fase 3).

**Pré-requisitos:** [Fases 0–1](./phases-0-1.md) (`npm run validate`).

---

## Fase 2 — Dados reais

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Política anti-simulação silenciosa | Testes `market-data-policy` | `market-data-policy.ts` |
| Gateway unificado + `dataMode` | `GET /api/quotes` | `market-data-gateway.ts`, `load-quotes-payload.ts` |
| Cliente sem preços inventados em prod | Testes `quotes-client-fallback` | `quotes-client-fallback.ts`, `desk-bootstrap-quotes.ts` |
| Strip honesta (live/demo/degraded) | UI `/` strip | `live-market-strip.tsx` |
| Health de mercado | `GET /api/health/market` | `market-capabilities.ts`, route |
| Smoke go-live | `EXPECT_MARKET_LIVE=1` | `scripts/smoke.mjs` (+ `/api/quotes`) |
| Env documentado | `npm run verify:env` | `web/.env.example` |

**Comando (repo, sem serviços):**

```bash
npm run validate
```

**Go-live mercado (produção):**

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_MARKET_LIVE=1 \
EXPECT_PASSWORD_RESET=1 \
npm run smoke:strict
```

Detalhe operacional: [phase-2-market-data.md](./phase-2-market-data.md).

---

## Fase 3 — UX

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Menu agrupado (4 secções) | Sidebar logado | `app-nav.ts`, `app-shell-nav.tsx` |
| Mobile: barra + drawer | `< lg` | `app-shell.tsx` (overlay, Escape) |
| Onboarding 3 passos | Dashboard, dispensar | `app-onboarding-panel.tsx`, `storage.ts` |
| Empty states unificados | Carteira, alertas, comparador, radar | `empty-state.tsx` |
| i18n PT/EN | `Onboarding`, `AppShell` | `messages/*.json` |
| Testes navegação + onboarding | Vitest | `app-nav.test.ts`, `storage.test.ts`, `app-shell-nav.test.ts` |

**Manual rápido (logado):**

1. Dashboard → guia → dispensar → F5 (não reaparece).
2. Sidebar: Mesa / Mercado / Ferramentas / Conta.
3. Mobile: barra inferior → Menu → drawer; backdrop fecha.
4. `/carteira` vazio, `/alerts` sem watchlist, `/compare` sem itens.

Detalhe: [phase-3-ux.md](./phase-3-ux.md).

---

## Matriz de testes (web)

| Área | Ficheiros de teste |
|------|-------------------|
| Mercado | `market-data-policy`, `market-capabilities`, `health/market`, `quotes-client-fallback` |
| UX | `app-nav`, `app-shell-nav`, `onboarding/storage` |

---

## Fase 4 — Polish

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Sitemap / robots | `curl /sitemap.xml` | `lib/seo/public-routes.ts`, `sitemap.ts`, `robots.ts` |
| OG social | Debugger LinkedIn/X | `defaultOpenGraphImages()` |
| JSON-LD | View source | `OrganizationJsonLd`, `WebsiteJsonLd` |
| Code-split home/bolsa | Network tab | `home-below-fold.tsx`, `bolsa-hub-loader.tsx` |
| A11y menu mobile | Tab + Escape | `useDialogFocusTrap`, `PageEnter` inert |
| Testes | `npm run validate` | `public-routes.test.ts`, `page-metadata.test.ts` |

Detalhe: [phase-4-polish.md](./phase-4-polish.md).

---

## Fase 5 — Go-live & confiança

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Páginas legais | `/privacidade`, `/termos` | `LegalDocumentLayout` |
| Cadastro com aceite | Checkbox no register | `register-form.tsx` + schema |
| SECURITY.md | Raiz do repo | Política de reporte |
| ARCHITECTURE.md | Portfolio / onboarding dev | Diagrama monorepo |
| Release check | `npm run release:check` | `scripts/release-readiness.mjs` |

Detalhe: [phase-5-go-live.md](./phase-5-go-live.md).

---

## Referências

- [phase-2-market-data.md](./phase-2-market-data.md)
- [phase-3-ux.md](./phase-3-ux.md)
- [phase-4-polish.md](./phase-4-polish.md)
- [phase-5-go-live.md](./phase-5-go-live.md)
- [smoke-test.md](./smoke-test.md)
- [phases-0-1.md](./phases-0-1.md)
