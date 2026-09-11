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

Quest 3 — Atlas Notes: Inserir, links e blocos avançados — Nested Lists Practical Depth (Correlation: ATLAS-HERMES-GATE-20260911-NESTED-LISTS-DEPTH)

---

# ARCHITECTURAL QUESTION

Qual é a menor correção arquitetural correta para preservar proteção contra estruturas patologicamente profundas sem tornar hierarquias normais de lista praticamente inutilizáveis, dado que DEC-002 com depth:8 permite apenas 2 níveis funcionais com texto e falha no 3º nível vazio/text9?

---

# GATE TRIGGER

persistent data model limit ineffective; conflict with DEC-002 depth:8 assumption; product requirement (pai→filho→neto editável) incompatible with current structural limit; difficult-to-reverse limit decision; manual validation demonstrated depth consumption 2 per visual level

---

# ORIGINAL REQUIREMENT

Nested lists devem possuir hierarquia estrutural real, permitir Tab repetidamente para níveis adicionais, não possuir limite artificial além de técnico de segurança razoável, e sobreviver a save→reload→reopen. Hierarquia pai→filho→neto é uso normal e deve ser plenamente editável. Caso mínimo validado: • Olá → Tab → • Olá → Tab → • [cursor] já falha com "A estrutura da nota excede a profundidade permitida." com depth:8.

---

# RELEVANT REPOSITORY FACTS

1. DEC-001 (ACCEPTED 2026-09-08): Canonical Document v2, envelope version 2, depth:8, nodes:20_000.
2. DEC-002 (ACCEPTED 2026-09-11): listItem/taskItem = paragraph + 0..N (bulletList|orderedList|taskList), mixing heterogêneo, projeção recursiva LF-only, manteve depth:8 e nodes:20_000.
3. lib/atlas-notes-document.ts: inspectStructure(doc depth1 → block depth2 → listItem3 → paragraph4 → text5 → nested list4→ listItem5→ paragraph6→ text7→ nested list6→ listItem7→ paragraph8→ text9) — cada nível visual consome 2 depth; text9 >8 falha.
4. Validação manual no navegador: N=3 vazio já projeta paragraph8 e N=3 com texto exige text9 → STRUCTURE_TOO_DEEP.
5. Limites atuais: depth:8, nodes:20_000, textNode:100_000, structured:1_048_576, request:1_310_720, visible:100_000.
6. Servidor é pure TypeScript DOM-free; determinístico; sem migration D1.

---

# EXISTING ARCHITECTURAL CONSTRAINTS

DEC-001 — base Canonical v2 (ACCEPTED); DEC-002 — Nested Lists forma estrutural e mixing (ACCEPTED). Esta Gate suplementa apenas o limite depth; restante de DEC-001/002 permanece integralmente vigente.

---

# OPTION A

Aumentar limite global depth (aprovada).

## Description

Elevar ATLAS_NOTES_LIMITS.depth de 8 para valor maior preservando semântica depth+1.

## Architectural Advantages

Menor mudança (1 constante), determinística, retrocompatível, sem nova semântica; nodes permanece proteção primária contra DoS; 12-16 ainda << stack JS.

## Architectural Costs / Risks

Ligeiramente mais permissivo para todas as estruturas, mas ainda tecnicamente seguro.

---

# OPTION B

Preservar depth global mas redefinir semântica de contagem — rejeitada (muda significado para tabelas/callouts, exige revalidação ampla).

---

# OPTION C

Separar depth geral de depth específico de listas — rejeitada (introduz 2 limites e complexidade sem ganho vs A).

---

# OPTION D

Cap visual fixo artificial — rejeitada (viola requisito sem limite artificial).

---

# CODEX RECOMMENDATION

NOT REQUESTED

---

# DECISION REQUIRED

Determinar semântica preservada, limite técnico, níveis representáveis, necessidade de DEC e constraints; Product Authority escolheu depth:16 dentro das alternativas aprovadas.

---

# HERMES DECISION

## Decision

Suplementar DEC-002 elevando o limite técnico global de profundidade estrutural:

- **depth global: 8 → 16** (escolha Product Authority dentro da alternativa A aprovada; 12 permitiria ~4 níveis com texto, 16 permite ~6 níveis e reduz reincidência).
- Semântica de contagem permanece **inalterada**: `inspectStructure` continua usando `depth + 1` recursivamente para cada `content[]` aninhado (envelope 0 → doc 1 → block 2 → listItem/taskItem 3 → paragraph 4 → text 5 → nested list 4 → ...).
- `STRUCTURE_TOO_DEEP` continua quando `depth > limit` (agora >16).
- Aproximadamente **6 níveis de nested list com texto** tornam-se representáveis (`text15` em N=6; vazios até `paragraph16` em N=7); `depth:12` permitiria ~4 níveis.
- `nodes:20_000` permanece inalterado; todos os demais limites permanecem inalterados (`request:1_310_720, structured:1_048_576, textNode:100_000, visible:100_000`).
- Envelope continua `format:"atlas-notes", version:2`; nenhuma migration; nenhuma alteração em canonicalização/projeção de nested lists além do limite.
- DEC-001 continua base; DEC-002 continua válida para forma e mixing; DEC-003 suplementa somente `depth`.

## Rationale

1. `depth:16` dobra `8` preservando `depth+1`, permitindo `N=6` funcional com margem sem reincidência do caso `N=3` validado.
2. Manter `depth` único é a menor mudança (1 constante) vs redefinir contagem ou criar limite separado.
3. `nodes:20_000` e limites de bytes continuam proteção primária; `depth:16` permanece ordens abaixo do stack, preservando segurança e compatibilidade retroativa (docs `depth≤8` idênticos).

## Constraints for Codex

- Alterar apenas `ATLAS_NOTES_LIMITS.depth` de 8 para 16 em implementação futura — **não neste commit arquitetural**.
- Preservar semântica `inspectStructure` (`depth+1` recursivo) e erro `STRUCTURE_TOO_DEEP` quando `depth > 16`.
- Não redefinir contagem, não criar `listDepth`, não introduzir cap artificial visual.
- Não alterar envelope version, canonicalização ou projeção de DEC-002 além do limite.
- Não incluir `lib/atlas-notes-document.ts` ou arquivos da Quest 3 neste commit.

## DEC Required

YES — DEC-003 — Atlas Notes Nested Lists Depth Correction (suplemento a DEC-002) em docs/ATLAS_DECISIONS.md

---

## Resolution Rule

This Gate is RESOLVED. Codex may resume implementation respecting the constraints above; implementação do novo limite depth:16 é tarefa Codex separada.

---

# NON-ARCHITECTURAL RULE

Not applicable — architectural decision was required.

---

# CORE PRINCIPLE

Atlas supplies product requirement. Codex supplies evidence. Hermes supplies architectural judgment. These responsibilities must remain separate.
