# ATLAS PROJECT — ACTIVE QUEST

## Purpose

This file contains the current active Task Contract for Atlas development.

It is the operational source of truth for the task currently being implemented.

Atlas defines the product requirement.

Claude Code implements the requirement.

Raf reads this same requirement only when an Architecture Gate is triggered.

The active quest must remain concise and focused on observable requirements.

Do not use this file as a development diary.

Do not accumulate completed quests here.

---

# ACTIVE QUEST

## QUEST-009 — Cadeia de tarefas em escada, Bloco 1 (itens sem bloqueio)

Complexity: MEDIUM · Raf Gate: NO (item 5 CONDITIONAL, só se surgir pergunta arquitetural real sobre Server Components do vinext).

Executar na ordem, um commit por item. Páginas novas usam dados de demonstração (mesmo padrão de Hoje/Estudar).

- [x] 1. UX-07 — Documentação do sistema de componentes (`docs/DESIGN_SYSTEM.md`)
- [x] 2. UX-02 — Página Roadmap
- [x] 3. UX-04 — Página Quizzes
- [x] 4. UX-05 — Página Progresso
- [ ] 5. TEC-01 — Rotas reais, cabeçalho compartilhado, componentes comuns, dados demo isolados, estado local por rota
- [ ] 6. UX-08 — Validação visual e responsiva (resultado em `docs/ATLAS_STATUS.md`)
- [ ] 7. TEC-07 — CI (`.github/workflows/`) e proteção da branch principal (documentar se sem permissão)

Fora de escopo: os 17 itens do Bloco 2 (dependem de DEC-*).

---

# USAGE RULES

When a new development quest begins, Atlas should replace the ACTIVE QUEST section with the current Task Contract.

Claude Code should use this file as the primary product specification for implementation.

Claude Code must not reinterpret explicit observable requirements without approval.

If the task is classified as SMALL, Raf should normally not be involved.

If Claude Code discovers a real Architecture Gate, the original requirement in this file must remain the common reference for both Claude Code and Raf.

When the quest is complete:

1. validate the acceptance criteria;

2. archive the quest if historical retention is useful;

3. reset this file before the next active quest.

This file should contain only one active quest at a time.
