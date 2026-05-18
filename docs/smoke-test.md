# Smoke test — PRONUXFIN

Roteiro profissional para validar **local**, **staging** e **produção** antes de abrir o produto ou após cada deploy relevante.

**Tempo estimado:** 15–25 min (manual completo) · **~30 s** (automático HTTP, ver scripts abaixo).

---

## Pré-requisitos

| Ambiente | Serviços |
|----------|----------|
| **Local** | `npm run db:up` (opcional) · `npm run dev` na raiz (API `:4000` + web `:3000`) |
| **Produção** | Vercel (`web`) + API Nest + PostgreSQL + variáveis em `web/.env.example` e `backend/.env.example` |

Documentação de variáveis: [`web/.env.example`](../web/.env.example), [`backend/.env.example`](../backend/.env.example), [`PRONUXFIN_OPERATOR_CHECKLIST.md`](./PRONUXFIN_OPERATOR_CHECKLIST.md).

---

## 1. Checks automáticos (HTTP)

Com a stack no ar:

```bash
# Qualquer SO (recomendado)
npm run smoke

# Produção / CI rigoroso (503 em ready = FAIL)
npm run smoke:strict
```

Variáveis opcionais:

| Variável | Padrão | Uso |
|----------|--------|-----|
| `WEB_BASE` | `http://127.0.0.1:3000` | Front Next |
| `API_BASE` | (vazio) | Se definido, testa `/health/*` da API Nest |
| `HEALTH_PROBE_SECRET` | (vazio) | Bearer para corpo detalhado de `/api/health/ready` |
| `SMOKE_STRICT` | `0` | `1` ou `CI=true` → 503 em ready conta como FAIL |
| `EXPECT_PASSWORD_RESET` | `0` | `1` → exige `password_reset_mode: smtp` na API |
| `EXPECT_MARKET_LIVE` | `0` | `1` → exige `/api/health/market` ready + `/api/quotes` com `dataMode: live` (use contra **produção** com `BRAPI_TOKEN`) |

**Saída esperada:**

- **Dev:** `OK` no liveness; `READY` pode ser `WARN` sem Postgres/API.
- **Produção:** `npm run smoke:strict` → **ALL CHECKS PASSED** (zero FAIL, zero WARN).

---

## 2. Checks técnicos (readiness)

Execute na ordem. Em produção, **todos** devem passar antes de divulgar o link.

| # | Endpoint | Esperado | Notas |
|---|----------|----------|-------|
| 1 | `GET {WEB}/api/health` | `200`, `status: "ok"` | Liveness do Next (não consulta DB) |
| 2 | `GET {WEB}/api/health/ready` | `200`, `ok: true` | Exige `API_URL`, site URL, backend e `DATABASE_URL` |
| 3 | `GET {API}/health/live` | `200`, `ok: true` | Liveness Nest |
| 4 | `GET {API}/health/ready` | `200`, `database: "up"` | Readiness Nest + Postgres |

Com segredo de probe (opcional):

```http
GET /api/health/ready
Authorization: Bearer <HEALTH_PROBE_SECRET>
```

O corpo inclui `checks` com `api_url_configured`, `backend_ready`, `database_ready`, etc.

---

## 3. Fluxo manual — visitante (não logado)

Marque cada item após validar no navegador.

- [ ] **Home** `/pt-BR` — hero, slogan, links; sem erro no console crítico
- [ ] **Bolsa** `/bolsa` — mesa carrega; se houver badge “simulado”, é aceitável em dev sem `BRAPI_TOKEN`
- [ ] **Projeção** `/projecao` — página abre e interage
- [ ] **Notícias** `/noticias` — feed RSS carrega (pelo menos uma fonte)
- [ ] **Ferramentas** `/ferramentas` — hub e calculadora de juros compostos
- [ ] **Calendário público** `/ferramentas/calendario` — eventos visíveis
- [ ] **Idioma** — alternar PT ↔ EN no header
- [ ] **Registo** `/register` — criar conta de teste
- [ ] **Login** `/login` — entrar com a conta criada

---

## 4. Fluxo manual — utilizador logado

- [ ] **Dashboard** `/dashboard` — briefing, agenda, links; sem banner de degradação permanente
- [ ] **Watchlist** — adicionar símbolo (ex. `PETR4`, `AAPL`); remover; limite respeitado
- [ ] **Carteira** `/carteira` — adicionar posição; resumo atualiza
- [ ] **Alertas** `/alerts` — central abre; regras listadas ou estado vazio claro
- [ ] **Comparador** `/compare` — abrir com ativos da watchlist
- [ ] **Ativo** `/ativo/PETR4` (ou outro) — dossiê carrega
- [ ] **Assistente** `/assistant` — chat responde (com chave BYOK ou env de IA)
- [ ] **GPS financeiro** `/rota` — criar/editar rota
- [ ] **Perfil** `/perfil` — nome e preferências persistem
- [ ] **Logout** — sessão termina; rotas privadas redirecionam

---

## 5. Auth e e-mail

- [ ] **Esqueci a senha** `/forgot-password` — pedido aceite (e-mail real se `SMTP_URL` configurado)
- [ ] **Reset** — link do e-mail ou log do backend em dev (`AUTH_RESET_DEV_LOG_ONLY`)

---

## 6. CI local (antes de push)

Na raiz do repositório:

```bash
npm run test
```

Inclui testes unitários do **web** (Vitest) e **backend** (Jest + e2e health).

---

## 7. Critério de go-live (produção)

**Não abrir ao público** se qualquer item abaixo falhar:

1. `GET /api/health/ready` → **200** no domínio público
2. `GET /health/ready` na API → **200**
3. Login + dashboard + watchlist funcionam com conta real
4. `JWT_SECRET` **idêntico** entre Vercel e backend
5. Migrações Prisma aplicadas no Postgres de produção
6. Sem dependência silenciosa só de dados simulados na mesa principal (configurar `BRAPI_TOKEN` / FMP)

---

## 8. Registo de execução (opcional)

| Data | Ambiente | Executor | Automático | Manual | Notas |
|------|----------|----------|------------|--------|-------|
| | local / staging / prod | | OK / FAIL | OK / FAIL | |

---

## Referências

- **Critérios 10/10 Fases 0+1:** [`phases-0-1.md`](./phases-0-1.md)
- Checklist GitHub + produção: [`github-production-checklist.md`](./github-production-checklist.md)
- **Fase 1 (SMTP, CORS, readiness):** [`phase-1-production.md`](./phase-1-production.md)
- Deploy front: [`web/DEPLOY.md`](../web/DEPLOY.md)
