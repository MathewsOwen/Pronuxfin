# Operações de segurança — PRONUXFIN

Runbook para rotação de segredos, CSRF e validação pós-deploy. Complementa [SECURITY-AUDIT.md](./SECURITY-AUDIT.md).

---

## Cadência recomendada

| Segredo | Onde | Cadência | Impacto da rotação |
|---------|------|----------|-------------------|
| `INTERNAL_API_SECRET` | `web/.env` + `backend/.env` | 90 dias ou após incidente | BFF ↔ Nest: janela de deploy coordenado |
| `JWT_SECRET` (HS256) | web + backend | 180 dias ou incidente | Todas as sessões invalidadas |
| Par RS256 (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`) | backend privada / web pública | 180 dias | Novos tokens com par novo; ver abaixo |
| `AI_KEYS_ENCRYPTION_KEY` | web | Só com migração BYOK | Chaves BYOK existentes ficam ilegíveis sem reimport |
| `HEALTH_PROBE_SECRET` | web | Anual | Probes de readiness deixam de autenticar até atualizar |

---

## Gestão de sessões (utilizador)

Em **Perfil → Sessões ativas** o utilizador vê famílias de refresh token ativas e pode:

- Revogar outro dispositivo (`POST /api/user/sessions/revoke` com `familyId`)
- Terminar todas (`POST /api/user/sessions/revoke-all`) — incrementa `tokenVersion` e limpa cookies

Operador: após suspeita de comprometimento, pedir ao utilizador “Terminar todas” ou executar `UPDATE "User" SET "tokenVersion" = "tokenVersion" + 1` + revogar `RefreshToken` na BD.

---

## P10 — WebAuthn, alertas e auditoria

1. **Passkeys:** Perfil → Adicionar passkey; login passa a exigir verificação após password.
2. **SMTP:** `SMTP_URL` + `SMTP_FROM` no backend; `AUTH_LOGIN_NOTIFY=1` (omitir `=0` para desligar).
3. **WebAuthn produção:** `WEBAUTHN_RP_ID` = hostname público; `WEBAUTHN_ORIGIN` = URL do site (sem barra final).
4. **Migração:** `cd backend && npx prisma migrate deploy` (tabelas `SecurityEvent`, `WebAuthnCredential`, `WebAuthnChallenge`).
5. **Readiness:** em produção, `evaluateEnterpriseSecurityHints()` recomenda RS256 + `REFRESH_STRICT_BIND`.

---

## Variáveis P9 (endurecimento)

| Variável | Onde | Efeito |
|----------|------|--------|
| `AUTH_SESSION_VERSION_CHECK=0` | web | Desliga validação `ver` vs BD (só testes) |
| `REFRESH_STRICT_BIND=1` | backend | Refresh com IP/UA diferente → revoga família |
| `COOKIE_SAMESITE_STRICT=1` | web | Cookie refresh `SameSite=Strict` |
| `USER_MUTATION_RATE_LIMIT_MAX` | web | Teto global mutações utilizador/min (padrão 40) |

---

## CSRF (double-submit)

**Implementação:** cookie legível `pronuxfin_csrf` + header `x-csrf-token` em POST/PATCH/DELETE autenticados. O middleware emite o cookie nas páginas; login roda novo token; logout limpa.

**Cliente:** usar `apiMutation()` de `web/src/lib/http/api-mutation-fetch.ts` em todas as mutações browser → `/api/*`.

**Desligar temporariamente (debug):** `CSRF_ENFORCE=0` no web. Em `NODE_ENV=test` o enforcement fica off automaticamente.

**Auth público (login/register/forgot/reset):** validação por `Origin`/`Referer` + `Sec-Fetch-Site`, não pelo cookie CSRF (utilizador ainda não tem sessão).

**Checklist após deploy CSRF:**
1. Login → DevTools → cookie `pronuxfin_csrf` presente
2. PATCH perfil ou POST carteira → request com header `x-csrf-token` igual ao cookie
3. Request manual sem header → `403` com corpo `{ "error": "csrf" }`

---

## Rotacionar `INTERNAL_API_SECRET`

Objetivo: garantir que só o BFF Next chama `/auth/*` no Nest.

1. Gerar novo valor (≥ 32 bytes aleatórios):  
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
2. **Staging:** definir o mesmo valor em `web` e `backend`; redeploy backend primeiro, depois web (ou simultâneo).
3. **Produção:** janela curta (< 5 min):
   - Atualizar secret no backend (Vercel/Railway/etc.) e reiniciar
   - Atualizar secret no web e redeploy
   - Remover valor antigo dos stores de secrets
4. Verificar: `POST /api/auth/login` com credenciais válidas → 200; chamada direta ao Nest sem `x-internal-auth` → 403 em produção

**Rollback:** reverter para o par anterior nos dois serviços na mesma ordem.

---

## Rotacionar JWT (HS256)

1. Gerar `JWT_SECRET` novo (≥ 32 caracteres) em ambos os ambientes.
2. Deploy backend + web com o **mesmo** secret novo.
3. Efeito: todos os access/refresh tokens anteriores deixam de validar; utilizadores fazem login de novo (middleware pode tentar refresh — falha → redirect login).

**Opcional — transição suave HS256:** não suportada nativamente; aceitar logout global ou manter janela de manutenção.

---

## Rotacionar JWT (RS256)

1. Gerar par:  
   `openssl genrsa -out jwt-private.pem 2048`  
   `openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem`
2. Backend: `JWT_ALGORITHM=RS256`, `JWT_PRIVATE_KEY` (PEM com `\n` ou multiline no painel).
3. Web: `JWT_ALGORITHM=RS256`, **apenas** `JWT_PUBLIC_KEY` (nunca a chave privada no frontend).
4. Deploy backend → web.
5. Incrementar `tokenVersion` no utilizador **não** é necessário só por troca de chave; tokens antigos assinados com chave antiga falham até refresh/login.

**Rotação sem downtime longo:** publicar backend que aceita **duas** chaves públicas não está implementado — planeie logout global ou janela noturna.

---

## Rotacionar `AI_KEYS_ENCRYPTION_KEY`

Chaves BYOK são cifradas com AES-256-GCM na base (`UserAiKeys`). Trocar a chave sem migração **destró** a capacidade de desencriptar.

**Procedimento:**
1. Avisar utilizadores com BYOK ativo (perfil → IA).
2. Gerar nova chave 64 hex:  
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Script de migração (operacional): para cada registo, desencriptar com chave antiga e reencriptar com nova — *não há script no repo; executar offline com backup da BD.*
4. Alternativa simples: limpar tabela `UserAiKeys`, pedir reintrodução das chaves no perfil.

---

## Rotação de cookies de sessão (nomes)

Prefixos `__Host-` / `__Secure-` em HTTPS. Renomear cookies é deploy-only; utilizadores com cookies legado continuam suportados até expirarem. Não exige runbook de secret.

---

## Pós-deploy (checklist rápido)

- [ ] `INTERNAL_API_SECRET` idêntico web + backend
- [ ] Migrações Prisma aplicadas (refresh tokens, rate limit)
- [ ] `CSP_MODE=report-only` → monitorar relatórios → `enforce`
- [ ] `npm run csp:check` no staging (`CSP_CHECK_URL=…`)
- [ ] RS256: chave privada só no backend
- [ ] `AI_KEYS_ENCRYPTION_KEY` definida se BYOK em produção
- [ ] CSRF: mutações do painel passam com `apiMutation`
- [ ] Smoke: login → dashboard → logout

---

## Incidente (comprometimento de secret)

1. Rotacionar **imediatamente** o segredo afetado (ordem acima).
2. Se `JWT_*` ou refresh comprometido: deploy com novo secret + script/SQL para incrementar `tokenVersion` em todos os utilizadores (invalida JWTs em circulação) — ver `backend` `UsersService` / auth reset.
3. Revisar logs de `InternalApiGuard` e rate-limit auth.
4. Documentar no ticket: data, segredo, utilizadores afetados.
