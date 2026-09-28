# ATLAS PROJECT — ARCHITECTURE GATE

## Purpose

This file is the temporary communication interface between Claude Code and Raf when a real Architecture Gate is triggered.

It exists to preserve separation of authority:
- Atlas defines the original product requirement;
- Claude Code reports relevant repository facts;
- Raf makes the architectural decision.

This file must NOT be used for routine implementation questions.

If no Architecture Gate exists, this file should remain in the IDLE state.

---

# GATE STATUS

Status: PARTIALLY RESOLVED — DEC-005 é PARTIAL/DRAFT; Bloco B bloqueado por precondição de plataforma (não arquitetural)

---

# QUEST

QUEST-008 — Migração de ownership Cloudflare (Correlation: ATLAS-RAF-GATE-20260928-CLOUDFLARE-OWNERSHIP)

---

# ARCHITECTURAL QUESTION

Como migrar o hosting do `atlaspjt` (hoje projeto OpenAI "ChatGPT Sites", com Workers/D1/R2 governados pela OpenAI) para a conta Cloudflare própria do usuário, e como provar antes disso que os dados são exportáveis?

---

# GATE TRIGGER

Migração de ownership de infraestrutura com dados persistentes (critérios de Gate: mudança de fronteira arquitetural, migração de dados, decisão cara de reverter).

---

# ORIGINAL REQUIREMENT

Ver `docs/quests/ACTIVE.md` (QUEST-008).

---

# RELEVANT REPOSITORY FACTS

1. `package.json` tem `vinext` e `@openai/sites-vite-plugin`: projeto OpenAI "ChatGPT Sites"; Workers/D1/R2 provisionados e governados pela OpenAI.
2. A conta Cloudflare do usuário (criada em 2026-09-28) está vazia (`workers_list`, `d1_databases_list`, `r2_buckets_list` vazios).
3. `lib/notes-store.ts`: `listNotes('')` retorna todas as notas com conteúdo completo (`id`, `title`, `body`, `content`, timestamps, `links`, `syncStatus`, `folderId`, `isPrivate`).
4. `GET /api/notes` (sem parâmetros) já chama `listNotes('')`.
5. `GET /api/notes/folders` (`app/api/notes/folders/route.ts`, não `app/api/folders/route.ts`) já existe e retorna `{ folders: await listFolders() }`.
6. `.openai/hosting.json`: `d1:"DB"`, `r2:null`.

---

# CORRECTIONS TO THE ORIGINAL GATE FORMULATION

- O correlation ID usava o nome errado do papel; o Gate novo usa o prefixo `ATLAS-RAF-GATE-`.
- A afirmação "DEC-004 já resolvida separadamente" estava incorreta: DEC-004 nunca havia sido persistida em `docs/ATLAS_DECISIONS.md`. Agora está (DEC-004 e DEC-005).
- O critério de aceitação do Bloco A que exigia implementar `GET /api/folders` estava errado: o export de pastas já existe em `app/api/notes/folders/route.ts`. O que falta é apenas um artefato de export consolidado.

---

# RAF DECISION

Registro completo em `docs/ATLAS_DECISIONS.md`:

- **DEC-004 (ACCEPTED):** export via `GET /api/notes` e `GET /api/notes/folders`; nenhum endpoint novo.
- **DEC-005 (PARTIAL/DRAFT):** migração blue/green para a conta Cloudflare do usuário; nunca in-place. Bloco B pausado até o usuário confirmar, na UI de publicação/configurações do ChatGPT Sites, se a plataforma permite apontar o projeto para conta Cloudflare própria ou exportar os recursos Workers/D1/R2.

Constraints for Claude Code: Bloco A pode prosseguir; Bloco B não deve ser iniciado (nem provisionamento na conta Cloudflare, nem alteração de `.openai/hosting.json`) até a precondição ser respondida.

DEC Required: YES (já persistidas).

---

# CORE PRINCIPLE

Atlas supplies product requirement. Claude Code supplies evidence. Raf supplies architectural judgment. These responsibilities must remain separate.
