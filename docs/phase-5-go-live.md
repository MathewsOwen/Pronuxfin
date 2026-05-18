# Fase 5 — Go-live & confiança

Objetivo: deixar o produto **publicável** com base legal, segurança documentada e checklist operacional único — pronto para Vercel + API + Postgres em produção.

**Critérios 10/10:** [phases-2-3.md](./phases-2-3.md#fase-5--go-live--confiança) · **Pré-requisitos:** Fases 0–4.

---

## 1. Confiança & legal

| Critério | Implementação |
|----------|----------------|
| Política de privacidade | `/privacidade` |
| Termos de uso | `/termos` |
| Footer | Links Legal |
| Cadastro | Checkbox obrigatório + links |
| Sitemap | Rotas legais indexáveis |

Conteúdo informativo (não substitui assessoria jurídica local). Revise com advogado antes de escala comercial.

---

## 2. Segurança & repositório

| Artefacto | Ficheiro |
|-----------|----------|
| Política de segurança | `SECURITY.md` (raiz) |
| Arquitetura (portfolio) | `ARCHITECTURE.md` |
| Auditoria CI | `npm audit --audit-level=critical` no workflow |
| Robots | Mesa privada bloqueada |

---

## 3. Release readiness (comando único)

```bash
npm run release:check
```

Executa:

1. `npm run verify:env` — templates `.env.example`
2. `npm run validate` — testes + typecheck
3. Imprime checklist de go-live (variáveis, smoke, legal)

**Antes de abrir o site ao público:**

```bash
# Staging / produção
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_PASSWORD_RESET=1 \
EXPECT_MARKET_LIVE=1 \
npm run smoke:strict
```

---

## 4. Checklist operador (resumo)

- [ ] `NEXT_PUBLIC_SITE_URL`, `API_URL`, `JWT_SECRET` (iguais web + API)
- [ ] `DATABASE_URL` (web + backend)
- [ ] `BRAPI_TOKEN`, `FMP_API_KEY` (mercado real)
- [ ] SMTP no backend (reset de senha)
- [ ] `/privacidade` e `/termos` acessíveis
- [ ] Cadastro exige aceite dos termos
- [ ] `npm run release:check` sem falhas
- [ ] `npm run smoke:strict` em produção — **ALL CHECKS PASSED**

Detalhe completo: [PRONUXFIN_OPERATOR_CHECKLIST.md](./PRONUXFIN_OPERATOR_CHECKLIST.md), [deploy-passo-a-passo.md](./deploy-passo-a-passo.md).

---

## 5. Portfolio GitHub

Para recrutadores e revisores:

- README com links às fases 0–5
- `ARCHITECTURE.md` com diagrama
- CI verde (`validate` + build)
- Commits por fase (0 base → 5 go-live)

---

## Próximo passo (opcional)

- Domínio custom + e-mail de suporte dedicado
- Playwright E2E no CI
- Status page pública (`/status`) com probes agregados
