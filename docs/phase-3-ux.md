# Fase 3 — UX da mesa privada

Objetivo: reduzir fricção após o login com **navegação agrupada**, **onboarding** e **estados vazios** consistentes.

**Critérios 10/10:** [phases-2-3.md](./phases-2-3.md) · **Pré-requisitos:** [Fases 0–1](./phases-0-1.md), [Fase 2](./phase-2-market-data.md).

---

## 1. Navegação agrupada

| Grupo | Rotas |
|-------|--------|
| **Mesa** | Painel, Carteira, Calendário, GPS, Alertas, Comparador |
| **Mercado** | Bolsa, Projeção, Notícias |
| **Ferramentas** | Ferramentas, IA, Educação |
| **Conta** | Perfil |

Implementação: `web/src/lib/navigation/app-nav.ts`, `web/src/components/layout/app-shell-nav.tsx`.

**Mobile:** barra inferior com Painel, Mercado, Alertas + botão Menu (sheet com navegação completa).

---

## 2. Onboarding pós-login

- Painel de 3 passos no **dashboard** (`AppOnboardingPanel`).
- Dispensa persistente por utilizador: `localStorage` `pronuxfin_onboarding_v3:{userId}`.
- Traduções: namespace `Onboarding` em `web/messages/*.json`.

---

## 3. Estados vazios

Componente: `web/src/components/ui/empty-state.tsx`.

| Área | Uso |
|------|-----|
| Carteira | Sem posições simuladas |
| Alertas | Eventos ativos / histórico vazio |

---

## 4. Verificação

```bash
cd web && npm run typecheck && npm test
```

Manual (logado):

1. Dashboard — painel “Primeiros passos”; dispensar e recarregar (não deve reaparecer).
2. Sidebar — secções Mesa / Mercado / Ferramentas / Conta.
3. Mobile — barra inferior + menu completo.
4. `/carteira` sem posições — empty state com ícone.
5. `/alerts` sem eventos — empty states compactos nos cards.

---

## 5. Próximo passo

**Fase 4** — concluída: ver [phase-4-polish.md](./phase-4-polish.md).
