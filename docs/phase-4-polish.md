# Fase 4 — Polish (performance, a11y, SEO)

Objetivo: experiência **rápida**, **acessível** e **descobrível** em motores de busca — sem sacrificar a mesa privada.

**Critérios 10/10:** [phases-2-3.md](./phases-2-3.md#fase-4--polish) · **Pré-requisitos:** Fases 0–3.

---

## 1. SEO

| Critério | Implementação |
|----------|----------------|
| Sitemap completo | `PUBLIC_SITEMAP_PATHS` → `app/sitemap.ts` |
| Robots | Bloqueia `/api/`, mesa privada e fluxos auth sensíveis; **legal indexável** → `app/robots.ts` |
| JSON-LD | `Organization` + `WebSite` no layout |
| OG/Twitter | Imagem padrão `/opengraph-image` em `marketingMetadata()` |
| Mesa privada | `privateAppMetadata` → `noindex, nofollow` |

Verificar:

```bash
curl -s https://www.seudominio.com.br/sitemap.xml | head
curl -s https://www.seudominio.com.br/robots.txt
```

---

## 2. Performance

| Critério | Implementação |
|----------|----------------|
| Fontes | `display: swap` (Inter, Sora, Geist Mono) |
| Home below-fold | `dynamic()` em `home-below-fold.tsx` |
| Bolsa | `BolsaHubLoader` + skeleton acessível |
| Cotações | Poll pausa com `document.hidden` |
| Motion | `AppMotionRoot` + `useReducedMotion` em `PageEnter` |

Lighthouse (manual): LCP na home (hero) e INP no menu mobile.

---

## 3. Acessibilidade

| Critério | Implementação |
|----------|----------------|
| Skip link | `SkipLink` → `#main-content` |
| Landmark `<main>` | `PageEnter` com `id` único |
| Menu mobile | `role="dialog"`, focus trap, Escape, `inert` no conteúdo |
| Nav | `aria-current="page"` na sidebar e barra inferior |
| Empty states | `role="status"` |
| Reduced motion | Framer `reducedMotion="user"` |

Teste rápido: Tab desde o topo → skip link → conteúdo; mobile → Menu → Tab preso no drawer → Escape.

---

## 4. Verificação

```bash
npm run validate
npm run smoke
```

Produção (opcional SEO smoke):

```bash
WEB_BASE=https://www.seudominio.com.br npm run smoke
# Resposta esperada: OK GET /sitemap.xml
```

---

## Checklist go-live polish

- [ ] `NEXT_PUBLIC_SITE_URL` correto na Vercel
- [ ] `/sitemap.xml` lista rotas públicas (bolsa, ferramentas, notícias…)
- [ ] `/robots.txt` bloqueia `/dashboard`, `/carteira`, `/ativo/`, etc.
- [ ] Partilha social mostra imagem OG (LinkedIn / X debugger)
- [ ] Lighthouse a11y ≥ 90 nas páginas públicas principais
- [ ] Menu mobile: focus trap + conteúdo principal inerte com drawer aberto

---

## Próxima fase

**Fase 5** — Go-live & confiança: ver [phase-5-go-live.md](./phase-5-go-live.md).
