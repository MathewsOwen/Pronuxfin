# Prompt mestre v2 — Entrada PRONUXFIN (Claude)

**Como usar:** copie apenas o bloco entre `---INÍCIO---` e `---FIM---`.

---

## ---INÍCIO---

Você é **diretor de arte premium + UX writer regulatório** para produto financeiro no Brasil.

### Função objetivo

Gerar **a dobra inicial (hero + placas decorativas + microcopy institucional)** do site **PRONUXFIN**, prontos para implementação (**HTML/CSS puro**, **React** ou **Next.js**), combinando:

- **minimalismo denso:** poucas peças, cada uma com função perceptiva clara  
- **autoridade cálida** (IBM/Capital institucional, não TikTok trader)  
- **zero hype** sobre retorno ou “oportunidades únicas”  
- compatibilidade com **LGPD** e **bom senso sobre produto sob supervisão/regulação pertinente** (não juridiques; não promessa de rentabilidade; não “curso garantido”; não “consultoria privilegiada”; **se incerto sobre classificação, use linguagem factual**)

---

### Contrato editorial (violável = erro)

PROIBIDO: promessa implícita de ganhos, garantias (“sempre”, “nunca perde”), urgency falsa (“últimas vagas”), FOMO com countdown sem contexto auditável, jargões de bomba (“100x”), simulação como “ resultado real garantido ”, menção de “dica privilegiada/inside”.

PERMITIDO: **clareza metodológica**, **cenários**, **gov de dados**, **trilha decisória**, **transparência de fontes**, linguagem sobria tipo “você sintetiza sinais com contexto”.

---

**Slogan canónico PT-BR (hero / meta principal):**

> «O mercado não espera. Você também não deveria.»

(Apresentação em **caixa alta** no Hero via CSS.) Traduções locais devem **preservar o ritmo cortante** nos demais idiomas.

### Marca mental (north star)

PRONUXFIN = **mesa cognitiva**: ordem contra ruído, contexto antes de número, cenários antes de autopiloto — **inteligência de mercado com disciplina institucional**, não autopromoção de “genialidade`.

Use sem alterar sentido estas âncoras (pode remixar palavras, não hype):

> “Clareza institucional. Cenários com disciplina. Dados com rastreio de fonte. IA como assistente soberano pelo usuário, não autopropaganda.”

---

### Paleta obrigatória (espelhar o produto)

Modo **escuro premium**: base **azul profundo** + acento **ciano elétrico** + **âmbar** só em micro-doses (fiapos; nunca bloco dominante).

| Token | Papel | Valor |
|--------|--------|--------|
| `--bg` | fundo | `oklch(0.1 0.038 262)` ≈ `#0B1020` |
| `--surface` | painéis / vidro | `oklch(0.14 0.045 262 / 0.72)` |
| `--fg` | texto principal | `oklch(0.97 0.012 262)` ≈ `#F4F6FA` |
| `--fg-muted` | secundário | `oklch(0.68 0.04 262)` |
| `--primary` | CTA / ênfase | `oklch(0.74 0.14 215)` ≈ `#3CD3F5` |
| `--ring` | foco acessível | primary com **~40%** opacidade em **duplo anel** (outer + inner) |
| `--border` | linhas | branco **10–14%** opacidade |
| `--amber` | micro-acento | tailwind `amber-300/400` em borda fina + fill **8–15%** |

**Texto com gradiente de marca:** no máximo **uma linha curta** do H1; gradiente ~**105deg** ciano → violeta suave; `background-size` ~**200%** para animação **lenta** opcional (respeitar movimento reduzido).

**Tipografia:** títulos **Sora** (ou equivalente geométrico humanista); corpo **Inter**; **mono** só para tickers, horários, labels técnicos.

**Escala sugerida (fluida, desktop-first):** H1 `clamp(2.25rem, 4vw + 1rem, 3.5rem)`; lead `clamp(1rem, 0.5vw + 0.95rem, 1.125rem)`; ritmo vertical **8px base** (múltiplos de 4/8).

---

### Psicologia + narrativa (aplicar na copy, não só listar)

1. **Jobs-to-be-done (usuário B2C sofisticado):** “Quando o mercado dispara em ruído, eu quero **colapsar sinais em narrativa auditável** para **decidir com calma**, sem culpar a ferramenta.”  
2. **PAS institucional:** Problema = **sobrecarga e viés**; Agitação = **custo de contexto perdido** (sem catastrofe emocional); Solução = **ritmo + governança + fonte** — **sem prometer resultado financeiro**.  
3. **Prova hierárquica (ordem):** (a) método/linhagem da informação → (b) transparência/gov → (c) experiência do produto (UI) → (d) terceiros só se verificáveis (evite logos genéricos “1000+ empresas” sem nome).

---

### Três planos simbólicos (implementação obrigatória)

Ordem `z-index` crescente: **grid** < **marca d’água** < **grain** < **conteúdo**. Todos decorativos: `pointer-events: none`, `user-select: none`.

| Plano | Conteúdo | Opacidade | Função mental |
|--------|-----------|-----------|----------------|
| **A** | grid terminal (dots 1px ou linhas 1px) | **4–7%** | rigor, auditoria |
| **B** | silhuetas grandes: candle genérico, onda de série, arco “nexo”, grade de preço **sem números inventados** | **2–5%** + blur **0.5–2px** opcional | multi-ativo, continuidade |
| **C** | film grain (SVG noise ou CSS) | **3–6%** | tacto premium, anti-“flat frio” |

**Regra de ouro:** se nota o plano B em **<3s**, está forte demais.

**Proibido em B:** logos de corretoras/CEX, marcas de terceiros, screenshot com PII, gráfico com ticks numéricos fabricados.

---

### Anatomia da seção (estrutura mínima)

1. **Skip link** (acessível) — se stack permitir.  
2. **Region** `role="region"` `aria-labelledby` no hero.  
3. **Badge técnico** (uma linha, mono pequeno, âmbar **contido**): ex. “Mesa cognitiva · multi-ativo · fonte rastreável”.  
4. **H1** único + **lead** (máx. **2 frases** ou **280 caracteres**).  
5. **Como funciona em 3 passos** (títulos **≤6 palavras** cada + micro linha **≤14 palavras**).  
6. **CTA primário** + **CTA secundário** (outline + `backdrop-blur`).  
7. **Micro-legenda sob CTAs** (10–12px): LGPD, sessão/segurança básica, **sem prometer** retorno.  
8. **“Evidência” inline** (uma linha): ex. “Metodologia documentada · dados com trilha de origem” — só se verdadeiro no produto real; caso contrário ajuste para factual neutra.  

---

### Critérios de aceite (o Claude deve auto-checar antes de entregar)

- [ ] Contraste texto/fundo ≥ **WCAG AA** (4.5:1 corpo normal; 3:1 grandes).  
- [ ] `:focus-visible` visível nos interativos (duplo anel).  
- [ ] `@media (prefers-reduced-motion: reduce)` desliga animações não essenciais.  
- [ ] `@media (prefers-reduced-transparency: reduce)` reduz/desliga blur/backdrop forte.  
- [ ] Âmbar **≤5%** da área pixel da primeira dobra (estimativa declarada).  
- [ ] Zero números de performance ou ROI inventados.

---

### Performance e implementação

- Imagens hero: **SVG preferencial** ou **webp** pequeno; **sem hero PNG 4MB**.  
- Evite sombras gigantes em excesso no mobile (GPU).  
- Se Next.js: **sem** `layout shift` no carregamento de fonte (use `size-adjust` ou fallbacks similares se aplicável).  
- **LCP:** conteúdo prioritário = H1 + CTAs (não vídeo pesado na primeira dobra).

---

### Formato de saída (obrigatório — nesta ordem)

**1) Checklist de compliance editorial** (5 bullets: o que foi evitado).  
**2) Arquitetura** (árvore de elementos + `z-index`).  
**3) Tokens CSS** (`:root` ou `theme`).  
**4) Código completo** (HTML ou componente React/Next + CSS).  
**5) Copy final PT-BR** (H1, lead, 3 passos, CTAs, micro-legenda, badge).  
**6) Duas variantes de H1** (A/B) — **ambas** compliance, tom ligeiramente diferente.  
**7) Notas de teste manual** (teclado, leitor de tela básico, zoom 200%).

Se faltar dado real (rotas, produto exato, pricing), **liste suposições num parágrafo** antes do código.

**Agora execute.**

## ---FIM---

---

### Arquivos de marca (referência no repo)

- `web/public/pronuxfin-logo-horizontal.svg`  
- `web/public/pronuxfin-mark.svg`  

Peça ao modelo para referenciar por caminho relativo ao importar.
