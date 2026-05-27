# Go-live + SEO + Conversão

Checklist único para lançar o site com estabilidade operacional, indexação real e melhor conversão da home.

## 1) Go-live operacional (bloqueante)

- [ ] Vercel com `Root Directory = web`
- [ ] `API_URL`, `NEXT_PUBLIC_SITE_URL`, `JWT_SECRET`, `DATABASE_URL` alinhados entre web + backend
- [ ] SMTP configurado no backend (reset de senha funcional)
- [ ] `npm run release:check` sem falhas
- [ ] Smoke de produção:

```bash
WEB_BASE=https://www.seudominio.com.br \
API_BASE=https://api.seudominio.com.br \
EXPECT_PASSWORD_RESET=1 \
EXPECT_MARKET_LIVE=1 \
npm run smoke:strict
```

## 2) SEO técnico (indexação)

- [ ] `NEXT_PUBLIC_SITE_URL` definido para domínio final
- [ ] `sitemap.xml` e `robots.txt` públicos e coerentes
- [ ] Meta de verificação configurada em produção:
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  - `NEXT_PUBLIC_BING_SITE_VERIFICATION`
- [ ] Search Console: propriedade validada e sitemap enviado
- [ ] Bing Webmaster: propriedade validada e sitemap enviado

## 3) Conversão da home

- [ ] CTA primário para cadastro
- [ ] CTA de retorno para login (usuário já cadastrado)
- [ ] Blocos de confiança com promessas não infladas
- [ ] Fluxo de registro funcional em produção (`/register`)
- [ ] Telemetria ativa para medir clique de CTA e início de cadastro

## 4) Métricas mínimas para operar como empresa

- [ ] Conversão Home -> Register
- [ ] Conversão Register -> Login bem-sucedido
- [ ] Retenção D1/D7
- [ ] Erros 5xx por rota crítica (`/api/auth/*`, `/api/health/ready`)
- [ ] Tempo médio para primeira ação útil no produto
