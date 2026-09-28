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

MEDIUM (Bloco B, era LARGE); o Bloco A isolado é SMALL

## Raf Gate

Bloco A: NO — coberto por DEC-004.

Bloco B: CONDITIONAL (era YES) — DEC-005 final (ACCEPTED): só escalar ao Raf se surgir um problema arquitetural real durante a execução. Correlation: ATLAS-RAF-GATE-20260928-CLOUDFLARE-OWNERSHIP.

---

## Contexto

- `atlaspjt` é um projeto OpenAI "ChatGPT Sites" (`package.json` tem `vinext` e `@openai/sites-vite-plugin`). Workers, D1 e R2 são hoje provisionados e governados pela OpenAI dentro do workspace do ChatGPT, não pela conta Cloudflare pessoal do usuário.
- O usuário criou a própria conta Cloudflare em 2026-09-28; ela está vazia (0 Workers, 0 bancos D1; R2 ainda não habilitado, e não é necessário).
- O usuário perdeu o acesso administrativo ao workspace ChatGPT/OpenAI; só consegue abrir o site publicado. Os dados reais foram extraídos manualmente (`GET /api/notes` no navegador): 8 notas, nenhuma pasta (pastas nunca foram publicadas). Ver `scripts/seed-data/atlas-export-production-20260928.json`.
- `lib/notes-store.ts`: `listNotes('')` já retorna todas as notas com conteúdo completo (`id`, `title`, `body`, `content`, timestamps, `links`, `syncStatus`, `folderId`, `isPrivate`).
- `GET /api/notes` (sem parâmetros, `app/api/notes/route.ts`) já chama `listNotes('')`: o export completo de notas já existe.
- `GET /api/notes/folders` (`app/api/notes/folders/route.ts`) já existe e retorna `{ folders: await listFolders() }`: o export de pastas já existe.

## Objective

Bloco A: provar que os dados são exportáveis de forma completa e portátil.

Bloco B: ter um deployment funcional do app atual (`main`) rodando na conta Cloudflare própria do usuário (Worker + D1), com o schema migrado e os dados reais de produção (extraídos manualmente do site hospedado pela OpenAI) carregados.

## Required Behavior

- Bloco A: existe um artefato de export consolidado (script/rotina) que chama `GET /api/notes` e `GET /api/notes/folders` e serializa o resultado em formato portátil;
- Bloco B: deployment independente (Worker + D1 novos) na conta Cloudflare do usuário, semeado com os dados extraídos (DEC-005).

## Acceptance Criteria

- [x] Bloco A: o artefato de export consolidado gera notas e pastas completas em formato portátil, usando os endpoints existentes; **nenhum endpoint novo** é criado — `pnpm run export:data` (`scripts/export-data.mjs`, Node puro, sem dependências; `-- --url <site>` para produção, `-- --out <arquivo>` para o destino; padrão `outputs/atlas-export-<data>.json`);
- [x] Bloco A: o export é verificado contra os dados reais — validado no ambiente local: 3 notas e 2 pastas no arquivo, idênticas (deep-equal) à resposta direta de `GET /api/notes` e `GET /api/notes/folders`; o script também relê os endpoints e aborta se as contagens divergirem; `typecheck` limpo, nenhum erro de lint no arquivo novo;
- [x] Bloco B: script de seed (`scripts/seed-notes.mjs`) preserva `id`, `title`, `body`, `createdAt`, `updatedAt` e vínculos — validado em D1 local recém-migrado: `GET /api/notes` devolveu as 8 notas idênticas ao JSON de seed (comparação exata);
- [x] Bloco B: D1 novo `atlas-notes-own` criado na conta Cloudflare do usuário e schema criado com as migrations Drizzle existentes (executado pelo usuário);
- [x] Bloco B: Worker `atlas-notes` implantado, apontando para o D1 novo (sem R2) — https://atlas-notes.atlaspjt.workers.dev;
- [x] Bloco B: D1 novo semeado; `GET /api/notes` do novo deployment retorna 8 notas — **contagem confirmada pelo usuário; a comparação exata de `id`s/`title`s contra o seed NÃO foi feita a partir do deployment** (o ambiente de Claude Code não alcança a Cloudflare). O seed foi validado com comparação exata apenas em D1 local;
- [x] Bloco B: `docs/ATLAS_STATUS.md` atualizado com a URL do novo Worker.

## Non-Goals

- Não migrar/portar nenhum recurso gerenciado pela OpenAI e não alterar nada no site publicado atual;
- Não provisionar R2 (não usado hoje);
- Não criar novos endpoints de export (DEC-004);

## Dependencies

- DEC-004 (aceita) e DEC-005 (versão final, aceita); dados de seed em `scripts/seed-data/`.

## Complexity Budget

Bloco A: Architecture NONE, Documentation NONE, Refactor NONE, Dependencies NONE.

Bloco B: Architecture LIMITED, Raf CONDITIONAL.

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
