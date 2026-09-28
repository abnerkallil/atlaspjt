# QUEST-008 — Migração de ownership Cloudflare (ARQUIVADA)

Status: COMPLETE (encerrada em 2026-09-28)

## Resultado final

- Bloco A (export de dados) e Bloco B (hosting) concluídos.
- Worker `atlas-notes` e D1 `atlas-notes-own` provisionados na conta Cloudflare própria do usuário: https://atlas-notes.atlaspjt.workers.dev.
- 8 notas de produção migradas (dados extraídos manualmente do site antigo; nenhuma pasta existia lá).
- O site antigo (OpenAI / ChatGPT Sites) foi preservado sem alterações e está fora de escopo de migração (DEC-005).
- Decisões relacionadas: DEC-004 e DEC-005 em `docs/ATLAS_DECISIONS.md` (registro permanente).

## Nota sobre a validação

A comparação exata `id` a `id` contra o deployment novo não foi feita a partir do ambiente local do Claude Code (sem acesso à Cloudflare). O seed foi validado com comparação exata em D1 local; a contagem de 8 notas no deployment novo foi confirmada pelo usuário; e o Atlas confirmou de forma independente, por chamada direta ao endpoint de produção do novo deployment, que `GET /api/notes` retorna as 8 notas esperadas. O Atlas também verificou na conta Cloudflare a existência do Worker `atlas-notes` (criado em 2026-09-28T22:33:24Z) e do D1 `atlas-notes-own` (criado em 2026-09-28T22:14:35Z).

---

## Task Contract (como estava em `docs/quests/ACTIVE.md` no encerramento)

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
