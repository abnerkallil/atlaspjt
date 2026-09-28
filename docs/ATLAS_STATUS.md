# ATLAS PROJECT — CURRENT STATUS

## Purpose

This document represents the current operational state of the Atlas Project.

It is not a development diary.

It should remain short and contain only information that may affect current or near-term work.

Historical information belongs elsewhere.

---

## Project Phase

MVP

---

## Active Quest

NONE

The authoritative current Task Contract is:

`docs/quests/ACTIVE.md`

---

## Current Priority

NONE

Project priority order:

P0 > P1 > P2

---

## Current Blockers

None.

---

## Open Architectural Decisions

None.

Only list unresolved DEC-* items that currently block or materially affect development.

---

## Current Relevant Risks

None identified.

Only include risks that may affect current implementation decisions.

---

## Stable Capabilities

Update this section only with capabilities that are already implemented and considered stable.

Do not describe implementation details.

- Atlas Notes: formatação via menu contextual (negrito, itálico, riscado, código, comentário, destaque, links).
- Atlas Notes: listas aninhadas, com limite de profundidade e aviso visual ao atingir o limite.
- Atlas Notes: notas de rodapé, tabelas configuráveis, blocos de matemática e callouts.
- Ambiente de desenvolvimento local com D1 (Miniflare) e visualização/edição via drizzle-kit studio.
- Deployment próprio e independente na Cloudflare do usuário (Worker `atlas-notes` + D1 `atlas-notes-own`): https://atlas-notes.atlaspjt.workers.dev — com as 8 notas de produção semeadas (DEC-005). O site antigo hospedado pela OpenAI não foi alterado.
- Rotas reais (Hoje `/`, Estudar `/estudar`, Roadmap `/roadmap`, Notas `/notas`, Quizzes `/quizzes`, Progresso `/progresso`) com cabeçalho compartilhado; Roadmap, Quizzes e Progresso usam dados de demonstração (`lib/demo/`).
- CI (`.github/workflows/ci.yml`): em cada push/PR para `main` roda `typecheck`, `test:notes` e `build` (bloqueantes) e `lint` (visível, não bloqueante: há 21 erros de lint anteriores em `components/ui/*`, `hooks/use-mobile.ts`, `notes-editor.tsx` e `notes-workspace.tsx`; remover `continue-on-error` quando forem corrigidos).
- Validação visual e responsiva (UX-08, todas as 6 rotas): desktop 1920×1080, notebook 1366×768, tablet 768×1024, celular 380×800 e zoom 150%/200% (viewports efetivos de 853 e 640 px) sem rolagem horizontal. Contraste WCAG AA (4,5:1 texto normal, 3:1 texto grande) medido por script em cada rota: corrigidos ~20 textos abaixo do mínimo (rótulos e legendas cinza, módulo bloqueado, contagens, botão "Agora não"). Não medidos por script: texto sobre gradientes (verificado por cálculo no cartão azul de Hoje, cujo gradiente foi levemente escurecido) e botões desabilitados (isentos). Teclado: ordem de tabulação segue a ordem visual (sem `tabindex` positivo) e todo campo tem foco visível (o campo de busca de notas mostra o anel no contêiner). Corrigido: o menu (hambúrguer) não fazia nada, deixando tablet/celular sem navegação entre páginas — agora abre a lista de rotas.

---

## Known Incomplete Capabilities

Update this section only when an incomplete capability may affect upcoming work.

- Proteção da branch `main`: não configurada (ação manual do usuário, exige admin do repositório). Em GitHub → Settings → Branches → Add branch ruleset/protection rule para `main`: exigir pull request antes do merge; exigir status check `verify` (job do CI) e branch atualizada antes do merge; bloquear force-push e exclusão da branch; (opcional) exigir 1 aprovação.

- To be reviewed.

---

## Next Planned Work

No next quest defined here.

Quest sequencing and roadmap belong to:

`docs/ATLAS_CAMPAIGN.md`

The current implementation task belongs to:

`docs/quests/ACTIVE.md`

---

# UPDATE POLICY

Keep this document concise.

Update it only when one of the following changes:

- project phase;
- active blocker;
- relevant risk;
- unresolved architectural decision;
- stable capability;
- incomplete capability that affects current work.

Do not add:

- detailed implementation history;
- commit logs;
- completed quest narratives;
- daily development notes;
- large architectural explanations;
- future feature descriptions;
- information already defined in ACTIVE.md or ATLAS_CAMPAIGN.md.

The purpose of this file is to answer:

"What is the relevant state of Atlas right now?"