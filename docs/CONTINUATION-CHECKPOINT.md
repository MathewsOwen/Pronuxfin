# Checkpoint — continuar depois (PronuxFin)

> Gerado para retomar o trabalho. Última validação: **142/142 testes** passando no `web/`.

---

## O que o utilizador pediu (resumo)

1. **Produto real** — sem modo demo na IA nem cotações inventadas.
2. **Referência de mercado** — máxima cobertura de ações (BR + internacional) e cripto.
3. **Dados atualizados rápido** — polling e cache agressivos.
4. **Deploy produção** — Vercel + Railway (guia em `docs/PRODUCTION-SECURITY-CHECKLIST.md` e `docs/deploy-passo-a-passo.md`).

---

## Estado da IA (`/api/market-ai`)

- **Sem respostas demo** — se não houver motor LLM → `503 MARKET_AI_NO_ENGINE`.
- Se o motor falhar → `503 MARKET_AI_MODEL_UNAVAILABLE`.
- Erros de rede no chat → mensagem real (sem snippets “offline” inventados).
- UI bloqueia envio quando `engines.length === 0`.
- **Produção exige** ≥1 motor na plataforma: `OPENAI_API_KEY`, `GEMINI_API_KEY` ou `PRONUX_MARKET_AI_OLLAMA_ORIGIN`.
- BYOK por utilizador continua disponível (requer `AI_KEYS_ENCRYPTION_KEY` + `DATABASE_URL`).

**Ficheiros-chave:** `web/src/app/api/market-ai/route.ts`, `web/src/components/assistant/assistant-chat.tsx`, `web/src/lib/security/production-security.ts`.

---

## Estado das cotações (sem simulação)

### Política
- Números simulados **removidos** dos fluxos de cotações (servidor + cliente).
- `MARKET_ALLOW_SIMULATION=1` continua **proibido em produção** (`production-security.ts`).
- Em falha de API → payload **degradado vazio**, nunca números fake.

### Cobertura ampliada (defaults)

| Área | Antes | Agora (default) |
|------|-------|-----------------|
| Mesa ao vivo B3 | 58 | **~300** (`PRONUX_LIVE_DESK_BR_MAX`) |
| Mesa ao vivo intl | 0 | **~200** (`PRONUX_LIVE_DESK_INTL_MAX`) |
| Cripto ao vivo | 12 fixos | **Top 250** CoinGecko (`PRONUX_LIVE_DESK_CRYPTO_MAX`) |
| Livro setorial equity | 280/setor | **400/setor** |
| Livro setorial cripto | 60/setor | **120/setor** |
| Lookup em lote | 15 | **50** símbolos |

### Velocidade
- Cache servidor mesa: **15 s** | setores: **20 s**
- Polling cliente: **15 s** (`NEXT_PUBLIC_QUOTES_POLL_MS`, mínimo 15 s)

### Ficheiros alterados (mercado)
- `web/src/lib/market/live-desk-universe.ts` — **novo** (universo mesa ao vivo)
- `web/src/lib/market/market-data-gateway.ts` — BR + intl + cripto, cache v2
- `web/src/lib/market/crypto.ts` — top N CoinGecko por market cap
- `web/src/lib/market/equities-yahoo-quote.ts` — paralelo, sem simulação
- `web/src/lib/market/equities-brapi.ts` — universo ampliado, sem simulação
- `web/src/lib/market/sector-book-cap.ts`, `quotes-poll-interval.ts`
- `web/src/lib/market/quotes-client-fallback.ts` (+ setores/cripto fallbacks)
- `web/src/lib/market/load-asset-dossier.ts` — dossier sem quote simulada

---

## Variáveis de ambiente — copiar para `.env` (web)

```env
# === OBRIGATÓRIO para cobertura B3 real (sem isto fica lento: 3 tickers/request) ===
BRAPI_TOKEN=

# === IA (escolher ≥1) ===
OPENAI_API_KEY=
# GEMINI_API_KEY=
# PRONUX_MARKET_AI_OLLAMA_ORIGIN=http://127.0.0.1:11434

# === Cobertura / velocidade (opcional) ===
PRONUX_LIVE_DESK_BR_MAX=600
PRONUX_LIVE_DESK_INTL_MAX=400
PRONUX_LIVE_DESK_CRYPTO_MAX=500
NEXT_PUBLIC_PRONUX_SECTOR_BOOK_SIZE=400
NEXT_PUBLIC_PRONUX_CRYPTO_SECTOR_BOOK_SIZE=120
NEXT_PUBLIC_QUOTES_POLL_MS=15000

# === Produção (ver checklist) ===
# INTERNAL_API_SECRET, JWT RS256, AI_KEYS_ENCRYPTION_KEY, WEBAUTHN_*, etc.
# Gerar segredos: node scripts/generate-production-secrets.mjs
```

**Nunca usar:** `MARKET_ALLOW_SIMULATION=1` nem `NEXT_PUBLIC_MARKET_ALLOW_SIMULATION=1`.

---

## Segurança (já implementado — não reverter)

- Fail-fast produção: RS256, CSRF, INTERNAL_API_SECRET, BYOK key, WebAuthn, motor IA plataforma.
- Rate limits distribuídos (auth, market-ai, quotes, logout).
- SSRF guard; upstream auth com `ssrfGuard: false` só para `API_URL`.
- Docs: `docs/PRODUCTION-SECURITY-CHECKLIST.md`, `docs/SECURITY-AUDIT.md`.

---

## Deploy infra (atualizado 2026-06-03)

| Peça | Estado |
|------|--------|
| Supabase + migrações Prisma (backend 8 + web 2) | ✅ aplicadas localmente |
| `www.pronuxfin.com.br` + mercado (`/api/health/market`) | ✅ 200 |
| `/api/health/ready` (Vercel) | ❌ 503 — falta API Nest + envs RS256/DB na Vercel |
| `api.pronuxfin.com.br` | ❌ DNS não resolve — backend não deployado |

**Próximo passo manual (bloqueador login):**

1. Push do `render.yaml` → Render **Blueprint** → preencher envs do `.env.production.generated`
2. Vercel Production: colar bloco WEB do ficheiro gerado (`npm run production:setup`) + `BRAPI_TOKEN` / IA
3. Até DNS `api.*`: `API_URL=https://<nome>.onrender.com` na Vercel
4. `npm run production:probe` — alvo: 5 checks ✓

---

## Próximos passos sugeridos (quando retomar)

1. **Render Blueprint** — ver `render.yaml` e `docs/deploy-passo-a-passo.md` Partes 3–7.
2. **Vercel env** — `npm run production:setup` → colar Production → Redeploy.
3. **`npm run production:probe`** — validar readiness remoto.
4. **Opcional escala:** CoinGecko Pro, BRAPI plano pago, FMP no gateway.
5. **Testar ao vivo:** registo → login → watchlist → WebAuthn.

---

## Comandos úteis

```bash
cd web
npm run typecheck
npm run test
npm run dev
node ../scripts/generate-production-secrets.mjs
```

---

## Nota honesta (10/10)

Código ~9.5–10/10 com env correto. Lacunas restantes são **infra** (WAF/Cloudflare, API backend privada) e **limites de APIs gratuitas** (BRAPI/CoinGecko/Yahoo). Impossível garantir imunidade total ou cobertura ilimitada sem provedores pagos.
