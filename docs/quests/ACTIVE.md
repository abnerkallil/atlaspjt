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

## Quest

QUEST-008 — Migração de ownership Cloudflare (Bloco A: export de dados; Bloco B: hosting)

## Priority

A confirmar por Atlas

## Complexity

LARGE (Bloco B); o Bloco A isolado é SMALL

## Raf Gate

Bloco A: NO — coberto por DEC-004.

Bloco B: YES — DEC-005 (parcial/draft), execução pausada até a precondição de plataforma ser respondida (ver `docs/quests/ARCHITECTURE_GATE.md`). Correlation: ATLAS-RAF-GATE-20260928-CLOUDFLARE-OWNERSHIP.

---

## Contexto

- `atlaspjt` é um projeto OpenAI "ChatGPT Sites" (`package.json` tem `vinext` e `@openai/sites-vite-plugin`). Workers, D1 e R2 são hoje provisionados e governados pela OpenAI dentro do workspace do ChatGPT, não pela conta Cloudflare pessoal do usuário.
- O usuário criou a própria conta Cloudflare em 2026-09-28; ela está vazia (`workers_list`, `d1_databases_list`, `r2_buckets_list` vazios).
- `lib/notes-store.ts`: `listNotes('')` já retorna todas as notas com conteúdo completo (`id`, `title`, `body`, `content`, timestamps, `links`, `syncStatus`, `folderId`, `isPrivate`).
- `GET /api/notes` (sem parâmetros, `app/api/notes/route.ts`) já chama `listNotes('')`: o export completo de notas já existe.
- `GET /api/notes/folders` (`app/api/notes/folders/route.ts`) já existe e retorna `{ folders: await listFolders() }`: o export de pastas já existe.

## Objective

Provar que os dados de produção são exportáveis de forma completa e portátil (Bloco A) e, quando a precondição de plataforma permitir, migrar o hosting para a conta Cloudflare do usuário sem migração destrutiva in-place (Bloco B).

## Required Behavior

- Bloco A: existe um artefato de export consolidado (script/rotina) que chama `GET /api/notes` e `GET /api/notes/folders` e serializa o resultado em formato portátil;
- Bloco B: migração blue/green (DEC-005) para a conta Cloudflare do usuário — bloqueado.

## Acceptance Criteria

- [x] Bloco A: o artefato de export consolidado gera notas e pastas completas em formato portátil, usando os endpoints existentes; **nenhum endpoint novo** é criado — `pnpm run export:data` (`scripts/export-data.mjs`, Node puro, sem dependências; `-- --url <site>` para produção, `-- --out <arquivo>` para o destino; padrão `outputs/atlas-export-<data>.json`);
- [x] Bloco A: o export é verificado contra os dados reais — validado no ambiente local: 3 notas e 2 pastas no arquivo, idênticas (deep-equal) à resposta direta de `GET /api/notes` e `GET /api/notes/folders`; o script também relê os endpoints e aborta se as contagens divergirem; `typecheck` limpo, nenhum erro de lint no arquivo novo;
- [ ] Bloco B (bloqueado): só inicia depois que o usuário confirmar se o ChatGPT Sites permite apontar o projeto para conta Cloudflare própria ou exportar os recursos Workers/D1/R2.

## Non-Goals

- Não provisionar recursos na conta Cloudflare do usuário nem alterar `.openai/hosting.json` antes da precondição do Bloco B;
- Não criar novos endpoints de export (DEC-004);
- Não fazer migração destrutiva in-place.

## Dependencies

- DEC-004 (aceita) e DEC-005 (parcial/draft).

## Complexity Budget

Bloco A: Architecture NONE, Documentation NONE, Refactor NONE, Dependencies NONE.

Bloco B: Architecture OPEN, Raf AS REQUIRED.

## Validation

- Bloco A: executar o export contra o app local e conferir contagens;
- `pnpm run typecheck` e `pnpm run lint` se código for adicionado.

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
