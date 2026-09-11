# ATLAS PROJECT — ARCHITECTURE GATE

## Purpose

This file is the temporary communication interface between Codex and Hermes when a real Architecture Gate is triggered.

It exists to preserve separation of authority:
- Atlas defines the original product requirement;
- Codex reports relevant repository facts;
- Hermes makes the architectural decision.

This file must NOT be used for routine implementation questions.

If no Architecture Gate exists, this file should remain in the IDLE state.

---

# GATE STATUS

Status: RESOLVED

---

# QUEST

Quest 3 — Atlas Notes: Inserir, links e blocos avançados — Nested Lists (Correlation: ATLAS-HERMES-GATE-20260911-NESTED-LISTS)

---

# ARCHITECTURAL QUESTION

Qual é a menor evolução correta do Atlas Notes Canonical Document v2 (DEC-001) que permita listas hierárquicas reais em bulletList/listItem, orderedList/listItem e taskList/taskItem, preservando determinismo do canonicalizer, projeção textual, compatibilidade com documentos v1/v2 existentes, limites de profundidade e nós, comportamento de leitura sem mutation, escrita estruturada v2 e servidor DOM/Tiptap-free?

---

# GATE TRIGGER

persistent data model change; conflict with accepted DEC-001 (flat lists only); product requirement incompatible with current allowlist; difficult-to-reverse structural decision

---

# ORIGINAL REQUIREMENT

O Atlas Notes deve suportar hierarquia real de listas para bullet, ordered e task lists:
- Tab em um item transforma o item atual em filho do item imediatamente anterior;
- um item filho pode receber Tab novamente para criar níveis adicionais;
- não deve haver limite artificial de níveis além dos limites técnicos do documento;
- a hierarquia deve ser estrutural real, não apenas indentação visual;
- ela deve sobreviver a save → reload → reopen.

Exemplo:
• Item 1
    ◦ Filho do Item 1
        ▪ Neto do Item 1
    ◦ Segundo filho
• Item 2
Mesmo princípio vale para task lists.

---

# RELEVANT REPOSITORY FACTS

1. DEC-001 (ACCEPTED 2026-09-08) define Canonical Document v2: envelope { format: "atlas-notes", version:1|2, doc:{type:"doc", content:Block[]} }, readers aceitam 1 e 2, writers persistem 2, sem mutação em leitura.
2. v2 allowlist atual: listItem {type:"listItem", content:[Paragraph]} exatamente 1 parágrafo, taskItem {type:"taskItem", attrs:{checked:boolean}, content:[Paragraph]} exatamente 1 parágrafo, ambos sem listas-filhas; canonicalizer rejeita nested lists (lib/atlas-notes-document.ts:489-554,691-719).
3. Canonicalizer é pure TypeScript, DOM-free, determinístico (markRank sort + sameMarks merge), rejeita UNKNOWN_FIELD/INVALID_NODE/INVALID_MARK.
4. Projeção é LF-only: bullet/ordered/task lists → items join "\n" sem marcadores, doc → blocks join "\n" then trim(); stored body deve igualar projeção version-specific.
5. Limites inalterados por DEC-001: request 1_310_720, structured 1_048_576, depth 8, nodes 20_000, textNode 100_000, visible 100_000; depth contado de envelope 0 → doc 1 → block 2 → listItem/taskItem 3 → paragraph 4 → text 6.
6. Tiptap 3.31.3 usado no editor; servidor nunca depende de DOM/Tiptap; editor-boundary adapter traduz Tiptap runtime para canonical JSON.
7. Docs v1/v2 flat existentes e NULL legacy rows devem permanecer compatíveis; nenhuma migration D1 (content_json TEXT, sem coluna version).

---

# EXISTING ARCHITECTURAL CONSTRAINTS

DEC-001 — Atlas Notes Canonical Document v2 (ACCEPTED) — base durável do Canonical Document v2. Esta Gate suplementa DEC-001 apenas em nesting de listas; restante de DEC-001 permanece integralmente vigente.

---

# OPTION A

Indentação visual via attrs.indent / indentLevel.

## Description

Adicionar atributo numérico de indentação ao listItem/taskItem, sem estrutura aninhada.

## Architectural Advantages

Mudança mínima de tipos; projeção poderia ignorar atributo.

## Architectural Costs / Risks

Viola requisito "hierarquia estrutural real, não apenas indentação visual"; não persiste árvore real; quebra determinismo de validação e sobrevive a save/reload apenas como flat + atributo visual; incompatível com modelo ProseMirror de nested lists.

---

# OPTION B

listItem/taskItem com paragraph + nested lists heterogêneas (escolhida).

## Description

Estender listItem para content:[Paragraph, ...List[]] e taskItem para content:[Paragraph, ...List[]] onde List = bulletList|orderedList|taskList, com ordem estrita parágrafo primeiro.

## Architectural Advantages

Menor evolução estrutural real; reusa tipos existentes; sem novo nó wrapper; permite mixing heterogêneo com regra única determinística; compatível com Tiptap sem torná-lo source of truth.

## Architectural Costs / Risks

Aumenta profundidade teórica (2 níveis por nesting); rejeição STRUCTURE_TOO_DEEP para nesting muito profundo (comportamento esperado dentro do limite técnico 8); canonicalizer e projeção precisam de extensão recursiva.

---

# ADDITIONAL OPTION

Wrapper novo (listGroup/nestedList) — rejeitado por introduzir tipo especulativo desnecessário e divergir do shape ProseMirror sem ganho.

---

# CODEX RECOMMENDATION

NOT REQUESTED

---

# DECISION REQUIRED

Resolver: estrutura canônica mínima para nesting, combinações permitidas, mixing, projeção recursiva, limites de profundidade, necessidade de DEC e constraints.

---

# HERMES DECISION

## Decision

Suplementar o Atlas Notes Canonical Document v2 (DEC-001) dentro do envelope version 2 para permitir hierarquia real de listas, sem nova versão de envelope e sem migration.

- Envelope continua `format:"atlas-notes", version:2` (writers persistem 2; readers aceitam 1 e 2 — DEC-001 inalterado).
- `listItem` = `{ type:"listItem", content:[ Paragraph, ...List[] ] }` — exatamente 1 parágrafo obrigatório como primeiro elemento, seguido de 0..N listas-filhas.
- `taskItem` = `{ type:"taskItem", attrs:{checked:boolean}, content:[ Paragraph, ...List[] ] }` — attrs.checked obrigatório, mesmo modelo de conteúdo.
- `List` = `bulletList | orderedList | taskList` — válidas tanto como blocos em `doc.content` quanto como filhas dentro de `listItem/taskItem`.
- Listas-filhas podem ser `bulletList, orderedList ou taskList` em qualquer combinação; misturas entre tipos são permitidas (bullet⊂bullet, ordered⊂bullet, task⊂bullet, bullet⊂task e recíprocas) — regra única heterogênea.
- Ordem estrita: parágrafo primeiro; apenas listas após; qualquer outro bloco/texto direto → rejeitar.
- Projeção textual recursiva LF-only, sem marcadores/indentação inventados: cada `listItem/taskItem` projeta `projectInline(paragraph)` + (`\n` + listas-filhas projetadas recursivamente); listas projetam `items.map(projectItem).join("\n")`; `task checked` projeta nada; doc final `blocks.map(projectBlock).join("\n").trim()`.
- Limites existentes permanecem inalterados (`depth:8, nodes:20_000, textNode:100_000, structured:1_048_576, request:1_310_720, visible:100_000`); `depth` e `nodes` aplicados recursivamente (cada nesting adiciona depth; `STRUCTURE_TOO_DEEP` / `TOO_MANY_NODES` se exceder).
- Documentos v1/v2 flat existentes continuam compatíveis (flat é subset válido do novo shape); nenhuma migration necessária; leitura nunca muta `content_json` ou `body`.
- Servidor continua DOM/Tiptap-free; Tiptap é traduzido via editor-boundary adapter antes de `prepareAtlasNotesForSave`.

Esta Gate não expande para outros recursos da Quest 3 (links, inserção, outros blocos, UI, CSS, handlers).

## Rationale

1. `paragraph + 0..N nested lists` é a menor evolução que converte indentação visual em hierarquia estrutural real persistente, preservando determinismo e compatibilidade de DEC-001.
2. Permitir mixing heterogêneo total evita limite artificial de tipo com regra única e determinística; proibir mixing criaria especialização sem benefício e bloquearia conversão legítima de tipo do filho.
3. Reusar `depth:8` como teto técnico satisfaz "sem limite artificial além dos limites técnicos" sem inflação especulativa de limites.

## Constraints for Codex

- Não criar envelope version 3; não alterar `ATLAS_NOTES_VERSION`; não marcar DEC-001 inteira como SUPERSEDED.
- Canonicalizer (`canonicalizeListItem`, `canonicalizeTaskItem`, `inspectStructure`) deve aceitar `content[0]=paragraph` + `content[1..]=bulletList|orderedList|taskList` canônicos; validar `assertKeys` estrito, rejeitar qualquer outro filho, ordem incorreta ou lista vazia; manter sort de marks e merge de texto idênticos a DEC-001.
- Projeção (`projectBlockV2`, `projectList`, `projectItem`) deve ser recursiva LF-only; não inventar `-`, `*`, números, `[x]`, espaços ou indentação; tarefa `checked` projeta apenas texto.
- Limites: aplicar `depth` e `nodes` recursivamente via `inspectStructure`; não aumentar valores numéricos; `STRUCTURE_TOO_DEEP` para nesting que exceda 8.
- Compatibilidade: `canonicalizeAtlasNotesContentV2` e `prepareAtlasNotesForSave` devem aceitar flat e nested; flat persiste idêntico; nested persiste como version 2; sem read-time rewrite.
- Servidor permanece pure TypeScript DOM-free; adapter Tiptap↔canonical roda apenas client-side antes do save.
- Não implementar UI, CSS, Tab handler como decisão arquitetural; handler é detalhe de implementação que deve produzir o shape canônico acima.
- Não expandir para outros recursos da Quest 3 (links/inserção/outros blocos) nesta Gate.

## DEC Required

YES

D Durável deve ser registrada como DEC-002 — Atlas Notes Nested Lists (suplemento a DEC-001) em docs/ATLAS_DECISIONS.md

---

## Resolution Rule

This Gate is RESOLVED. Codex may resume implementation respecting the constraints above.

---

# NON-ARCHITECTURAL RULE

Not applicable — architectural decision was required.

---

# CORE PRINCIPLE

Atlas supplies product requirement. Codex supplies evidence. Hermes supplies architectural judgment. These responsibilities must remain separate.
