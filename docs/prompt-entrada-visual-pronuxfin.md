# Script (prompt) — Entrada visual PRONUXFIN

Copie **tudo** entre as linhas `<<<COPIAR AQUI>>>` e `<<<FIM>>>` e cole no Claude (ou outro modelo).  
Objetivo: orientar componentes React/Next (**não HTML estático**) da **entrada / hero**, bonita e institucional. No repositório, a marca d’água vive em `src/components/marketing/hero-watermarks.tsx` e é usada pelo `Hero`.

---

<<<COPIAR AQUI>>>

Preciso da **entrada principal** do site **PRONUXFIN** (financeiro, sério).

## Estilo que eu quero

- **Sensação:** autoridade, confiabilidade, respeito — como mesa institucional, **nunca** cara de cassino ou “milagre de dinheiro”.
- **Minimalismo:** poucos elementos fortes à frente; **muito detalhe “escondido”** atrás, em marca d’água.
- **Slogan (obrigatório, texto exato):**  
  «O mercado não espera. Você também não deveria.»  
  Pode aparecer em **maiúsculas** no layout (`text-transform: uppercase`) e quebrar em **duas linhas** se ficar mais legível.

## Logo da marca

- Use o logotipo **PRONUXFIN** junto ao hero (topo ou canto discreto — não competir com o slogan).
- Se estiver só em modo texto/descrição, use **marca textual** elegante ou referência a um SVG em `/web/public/pronuxfin-mark.svg` e `/web/public/pronuxfin-logo-horizontal.svg` (importar como `<img>` com alt “PRONUXFIN”).

## Cores (têm que combinar com o site)

Fundo **escuro premium**: azul bem profundo. Acento **ciano elétrico**. **Âmbar** só em **detalhes pequenos** (bordas finas, um selo, brilho suave) — **não** pintar a tela de laranja.

Valores de referência (pode usar em CSS):

- Fundo: `oklch(0.1 0.038 262)` ou ~`#0B1020`
- Texto claro: `oklch(0.97 0.012 262)` ou ~`#F4F6FA`
- Cor de destaque / CTA / parte do slogan: `oklch(0.74 0.14 215)` (ciano) ~`#3CD3F5`
- Bordas suaves: branco com **10–14%** de opacidade
- Âmbar mínimo: bordas tipo `amber-400/30` e fundo `amber-950/20` só em **badge** pequeno

Gradiente no slogan (opcional na **segunda frase**): de ciano para um **azul-violeta suave**, ângulo ~105deg.

## Marca d’água de fundo (isso é o mais importante)

Atrás de tudo, em **camadas** com `pointer-events: none` e **opacidade bem baixa** (quase subliminar — se der para ver demais, está forte demais):

1. **Símbolos de ativos** (grandes, espalhados, desfocados levemente): referências visuais a **Bitcoin**, **Ethereum**, **dólar (USD)**, **petróleo** — podem ser **silhuetas geométricas simplificadas** ou ícones estilizados (evite poluir com desenhos infantis). Nada de preço ou percentual inventado.
2. **Gráficos:** linhas de tendência, velas **abstratas**, grade fina tipo terminal — tudo como **marca d’água**, sem números de mentira nos eixos (pode deixar eixos vazios ou “•••”).
3. **Textura:** um **noise** leve (granulação) 3–6% para dar sensação premium.

Ordem sugerida (z-index): grid → marcas d’água (cripto, USD, óleo) → grain → conteúdo.

## Conteúdo da frente (simples)

- Slogan + **uma frase curta** explicando que é uma mesa cognitiva para mercados (sem prometer lucro).
- **Dois botões:** primário (ex.: “Começar”) e secundário outline com vidro (`backdrop-blur`).
- Tipografia: títulos fortes e limpos; corpo legível; **monospace** só em detalhes técnicos pequenos.

## O que NÃO fazer

- Não prometer rentabilidade, não “garantir” nada, não usar contagem regressiva falsa.
- Não usar imagens PNG gigantes pesadas sem necessidade — preferir **SVG** para marcas d’água onde der.

## Entrega

Envie:

1. **HTML completo de uma página** + **CSS** (ou um componente React) já com as camadas de fundo.  
2. **Lista das opacidades** que usou em cada camada (para eu afinar).

<<<FIM>>>

---

### Observação rápida (marcas registradas)

Símbolos de Bitcoin/Ethereum e marcas institucionais têm uso regulado em alguns casos; para o modelo gerar código seguro no dia a dia, o prompt já pediu **silhuetas / versões simplificadas**. Se for publicar comercialmente, vale conferir as **diretrizes oficiais** de cada marca.
