# PRONUXFIN — checklist do operador (o que só você faz)

Este ficheiro lista o que **não está no código**: contas externas, chaves de API, variáveis de ambiente e verificações manuais. O repositório já inclui a lógica; falta configurar o ambiente e os fornecedores.

---

## 1. Contas e alojamento (uma vez)

| O quê | Onde | Notas |
|--------|------|--------|
| Repositório Git | GitHub (ou outro) | Push da `main` / branch de produção. |
| Frontend Next.js | **Vercel** | Root directory = `web`. |
| API NestJS | **Render** (ou VM/Docker) | Deve ouvir `0.0.0.0` na porta do host. |
| Base PostgreSQL | **Supabase** (ou Postgres gerido) | Mesma base para auth + dados de utilizador usados pelo Next (BYOK, etc.). |

---

## 2. Variáveis obrigatórias (sem isto o produto quebra)

### Vercel (`web`)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `API_URL` | Sim | URL HTTPS pública da API Nest (ex.: `https://pronuxfin.onrender.com`). |
| `JWT_SECRET` | Sim | **Exatamente o mesmo** valor que no backend (≥32 caracteres aleatórios). |
| `NEXT_PUBLIC_SITE_URL` | Recomendado | URL pública do site (domínio ou `*.vercel.app`). |

### Backend (Render / host da API)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | `postgresql://…` da Supabase (pooler ou direct, conforme documentação Prisma). |
| `JWT_SECRET` | Sim | Igual ao da Vercel. |
| `FRONTEND_URL` | Recomendado | Origem do front (CORS / links em e-mails). |

---

## 3. Mercado e dossiê (qualidade “mesa”)

Configurar na **Vercel** (rotas `/api/*` e carregamento do dossiê no servidor).

| Variável | Obrigatório | Efeito |
|----------|-------------|--------|
| `BRAPI_TOKEN` | Muito recomendado (BR) | Cotações B3 mais estáveis; menos fallback simulado. |
| `FMP_API_KEY` ou `FINANCIAL_MODELING_PREP_API_KEY` | Muito recomendado (exterior) | Perfil da empresa, **métricas TTM**, **DRE / balanço / fluxo (último ano anual)** no terminal do ativo. |
| `MARKET_PROVIDER_FMP_ENABLED` | Opcional | Só use `false`/`0` se quiser **desligar** o FMP. |

**O que você faz:** criar conta em [financialmodelingprep.com](https://financialmodelingprep.com), copiar a API key, colar na Vercel, redeploy.

**Limites:** cada pedido ao dossiê internacional pode disparar várias chamadas FMP (perfil + TTM + 3 demonstrações). Escolha um plano FMP compatível com o tráfego esperado.

---

## 4. IA (deixar de ser só “demo”)

Na **Vercel** e/ou chaves do utilizador (BYOK):

| Variável / ação | Efeito |
|-----------------|--------|
| `OPENAI_API_KEY` | Motor OpenAI no chat de mercado. |
| `GOOGLE_GENERATIVE_AI_API_KEY` ou `GEMINI_API_KEY` | Motor Gemini. |
| `PRONUX_MARKET_AI_OLLAMA_ORIGIN` | Ollama auto-hospedado (URL base). |
| BYOK na app | Utilizador guarda chaves; exige `DATABASE_URL` + `AI_KEYS_ENCRYPTION_KEY` (hex 64) no Next — ver `web/DEPLOY.md`. |

**Painel multi-IA (opcional):** com ≥2 motores ativos, o utilizador pode marcar “Painel multi-IA” no chat. Consome mais tokens. Desligar no servidor: `MARKET_AI_ENSEMBLE_DISABLED=1`. Limite de motores: `MARKET_AI_ENSEMBLE_MAX_ENGINES` (predefinição 3).

---

## 5. Admin e e-mail (opcional)

| O quê | Onde |
|--------|------|
| `PLATFORM_ADMIN_EMAILS` | Env do **backend** — e-mails com acesso admin. |
| SMTP / reset de palavra-passe | Variáveis de mail no backend (se usar recuperação de conta). |

---

## 6. Depois de configurar — verificação mínima

1. `GET https://<sua-api>/health/live` e `/health/ready` — OK.  
2. Registo e login no site.  
3. Abrir um ativo **internacional** (ex.: `AAPL`) logado — ver secções **Fundamental TTM** e **Demonstrações financeiras** se o FMP estiver ativo.  
4. Abrir **Central de IA** — enviar mensagem; se houver chave, `demo: false` na resposta JSON.  
5. Se alterou variáveis na Vercel: **Redeploy** do projeto.

---

## 7. O que a PRONUXFIN **não** faz por si

- Não audita demonstrações financeiras nem substitui filings SEC, IFRS ou auditoria.  
- Não garante disponibilidade nem exatidão de Yahoo, BRAPI ou FMP (são terceiros).  
- Não presta assessoria de investimento; o produto é infraestrutura e leitura informativa.

Para deploy passo a passo mais longo, veja também `docs/deploy-passo-a-passo.md` e `docs/github-production-checklist.md`.
