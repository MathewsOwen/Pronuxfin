# Fases 0 e 1 — critérios 10/10

Checklist de maturidade para considerar **Fase 0** (base) e **Fase 1** (produção) concluídas no repositório e no ambiente.

---

## Fase 0 — Base operacional

| Critério | Como verificar | Estado no repo |
|----------|----------------|----------------|
| Templates `.env` | `npm run verify:env` | `web/.env.example`, `backend/.env.example` |
| Testes web no CI | Job `web` → Unit tests | Vitest (rotas + libs críticas) |
| Testes API no CI | Job `backend` → Unit + E2E + Postgres | Jest + e2e health/throttle |
| Smoke HTTP cross-platform | `npm run smoke` | `scripts/smoke.mjs` |
| Roteiro manual | `docs/smoke-test.md` | Checklists visitante + logado |
| Scripts raiz | `npm run test`, `validate` | `package.json` |

**Comando único (sem serviços no ar):**

```bash
npm run validate
```

**Com stack local (`npm run dev` + `npm run db:up`):**

```bash
npm run smoke
# Produção / CI rigoroso:
npm run smoke:strict
```

---

## Fase 1 — Produção confiável

| Critério | Como verificar | Implementação |
|----------|----------------|---------------|
| Readiness unificado | Mesma lógica em manutenção e `/api/health/ready` | `web/src/lib/health/web-readiness.ts` |
| Gate do painel | Todos os checks OK em `NODE_ENV=production` | `evaluateProductionReadiness()` |
| Degradação com retry | API com 2 tentativas + cache 45s | `platform-status.ts` |
| SMTP / reset | `GET {API}/health` → `password_reset_mode: smtp` | `AuthMailerService` + capabilities |
| CORS multi-domínio | `FRONTEND_URL` + `FRONTEND_URLS` | `bootstrap/cors-origins.ts` |
| Avisos no arranque da API | Logs em produção sem SMTP/JWT/DB | `log-production-warnings.ts` |
| Guia operador | `docs/phase-1-production.md` | SMTP, probes, go-live |

**Go-live (ambiente real):**

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_PASSWORD_RESET=1 \
npm run smoke:strict
```

Resultado esperado: **ALL CHECKS PASSED** (zero FAIL, zero WARN).

---

## Matriz de endpoints

| Endpoint | Liveness | Readiness |
|----------|----------|-----------|
| `GET /api/health` | Web | — |
| `GET /api/health/ready` | — | Web (config + DB + API) |
| `GET /health/live` | API | — |
| `GET /health/ready` | — | API (Postgres) |
| `GET /health` | — | Capabilities (SMTP, etc.) |

---

## Fases 2 e 3

Ver [phases-2-3.md](./phases-2-3.md) (critérios 10/10 mercado + UX).

## Referências

- [smoke-test.md](./smoke-test.md)
- [phase-1-production.md](./phase-1-production.md)
- [phase-2-market-data.md](./phase-2-market-data.md)
- [github-production-checklist.md](./github-production-checklist.md)
