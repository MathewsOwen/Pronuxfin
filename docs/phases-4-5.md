# Critérios 10/10 — Fases 4 e 5

Resumo único para auditoria de **polish** (Fase 4) e **go-live** (Fase 5). Detalhe operacional: [phase-4-polish.md](./phase-4-polish.md), [phase-5-go-live.md](./phase-5-go-live.md).

**Pré-requisitos:** Fases 0–3 concluídas ([phases-0-1.md](./phases-0-1.md), [phases-2-3.md](./phases-2-3.md)).

---

## Fase 4 — Polish

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Sitemap público | `npm run smoke` → OK `/sitemap.xml` | `PUBLIC_SITEMAP_PATHS`, `app/sitemap.ts` |
| Robots mesa privada | `/robots.txt` bloqueia `/dashboard`, `/ativo/`, `/api/` | `ROBOTS_DISALLOW_EXTRA` |
| Legal indexável | Sitemap inclui `/privacidade`, `/termos`; robots **não** bloqueia | `public-routes.test.ts` |
| OG / JSON-LD | View source / debugger social | `marketingMetadata()`, `WebsiteJsonLd` |
| Performance | Network: chunks abaixo da dobra | `home-below-fold.tsx`, `bolsa-hub-loader.tsx` |
| A11y | Tab → skip link; drawer com focus trap | `SkipLink`, `useDialogFocusTrap`, `PageEnter` |
| Testes automáticos | `npm run validate` | `public-routes.test.ts`, `page-metadata.test.ts` |
| E2E Playwright (web) | Job `web-e2e` no CI | `web/playwright.config.ts`, `web/e2e/*.spec.ts` |

---

## Fase 5 — Go-live & confiança

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Páginas legais | Smoke `GET /privacidade`, `/termos` (200) | `LegalDocumentLayout` |
| Cadastro com aceite | Checkbox + Zod `acceptTerms` | `register-form.tsx`, `auth-schemas-dynamic.test.ts` |
| Footer legal | Links no rodapé | `SiteFooter` em `landing-sections.tsx` |
| Segurança | `SECURITY.md` na raiz | Reporte responsável |
| Arquitetura | `ARCHITECTURE.md` | Monorepo web + API |
| Release único | `npm run release:check` | `scripts/release-readiness.mjs` |

---

## Comandos de verificação (repo)

```bash
npm run validate
npm run release:check
```

Com servidor local (`npm run dev`):

```bash
npm run smoke
```

Produção:

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_PASSWORD_RESET=1 EXPECT_MARKET_LIVE=1 \
npm run smoke:strict
```

---

## Checklist go-live (operador)

- [ ] `NEXT_PUBLIC_SITE_URL` correto (Vercel)
- [ ] `/sitemap.xml` com rotas públicas + legais
- [ ] `/robots.txt` bloqueia mesa privada, **não** bloqueia `/privacidade` nem `/termos`
- [ ] Cadastro exige aceite dos termos
- [ ] `npm run release:check` sem falhas
- [ ] `npm run smoke:strict` em produção — **ALL CHECKS PASSED**
