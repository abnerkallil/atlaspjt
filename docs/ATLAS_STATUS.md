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

QUEST-010 — Infraestrutura restante do usuário único (só falta o item 4, backup, DEC-011).

The authoritative current Task Contract is:

`docs/quests/ACTIVE.md`

---

## Current Priority

P0 — backup e restauração (DEC-011).

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
- Autenticação de usuário único (DEC-007): login por senha + sessão via cookie assinado (`HttpOnly`, `Secure`, stateless), aplicada a todas as páginas de `app/(atlas)/` e a todas as rotas `/api/notes*`. Publicado em produção em `atlas-notes.atlaspjt.workers.dev` — deploy do commit `307e816` (merge do PR #19), 2026-09-30. Validado pelo usuário em produção com credencial real; o Claude Code não verificou de forma independente (sem acesso à conta Cloudflare).
- Bloco 1 do QUEST-009 publicado em produção em `atlas-notes.atlaspjt.workers.dev` — commit `1928e10`, 2026-09-29 (deploy executado e conferido pelo usuário; não verificado de forma independente a partir do ambiente do Claude Code, sem acesso à Cloudflare).
- Fix de navegação client-side (DEC-006, `vinext` 1.0.0 + `@vitejs/plugin-rsc` 0.5.34) publicado em produção em `atlas-notes.atlaspjt.workers.dev` — build a partir de `main` no commit `5c37d0b`, 2026-09-29. Validado pelo usuário: os 6 itens do menu navegam por clique. O Claude Code confirmou pelo código do Worker publicado que o chunk `vinext-*.js` está no manifesto; não verificou a URL nem o console diretamente (sem acesso de rede a ela).
- Rotas reais (Hoje `/`, Estudar `/estudar`, Roadmap `/roadmap`, Notas `/notas`, Quizzes `/quizzes`, Progresso `/progresso`) com cabeçalho compartilhado. Roadmap lê o D1 (fases, pré-requisitos, bloqueios e registro de mudanças, MVP-01). Hoje, Estudar, Quizzes e Progresso ainda usam dados de demonstração (`lib/demo/`), zerados no PR #29 até existir o cálculo real (MVP-07).
- CI (`.github/workflows/ci.yml`): em cada push/PR para `main` roda `typecheck`, `lint`, `test:notes` e `build`, todos bloqueantes. Os primitivos genéricos de `components/ui/*` (kit shadcn) têm 5 regras `jsx-a11y` desligadas em `.oxlintrc.json`, porque o rótulo/conteúdo acessível é fornecido por quem usa o componente e a regra não enxerga isso.
- Validação visual e responsiva (UX-08, todas as 6 rotas): desktop 1920×1080, notebook 1366×768, tablet 768×1024, celular 380×800 e zoom 150%/200% (viewports efetivos de 853 e 640 px) sem rolagem horizontal. Contraste WCAG AA (4,5:1 texto normal, 3:1 texto grande) medido por script em cada rota: corrigidos ~20 textos abaixo do mínimo (rótulos e legendas cinza, módulo bloqueado, contagens, botão "Agora não"). Não medidos por script: texto sobre gradientes (verificado por cálculo no cartão azul de Hoje, cujo gradiente foi levemente escurecido) e botões desabilitados (isentos). Teclado: ordem de tabulação segue a ordem visual (sem `tabindex` positivo) e todo campo tem foco visível (o campo de busca de notas mostra o anel no contêiner). Corrigido: o menu (hambúrguer) não fazia nada, deixando tablet/celular sem navegação entre páginas — agora abre a lista de rotas.
- Anexos reais nas notas (DEC-008): bytes no R2, metadados no D1, acesso só por rotas autenticadas do Worker; servidor no PR #21 e editor no PR #27. Validado pelo usuário em produção com arquivo real.
- Histórico de notas (DEC-012, PR #28): cada salvamento guarda a versão anterior; o usuário vê e restaura a versão anterior (mantém atual + anterior).
- Telas sem números fictícios: os números de demonstração de Hoje, Estudar e Progresso foram zerados (PR #29); o progresso real em produção começa do zero.
- Recuperação de acesso (TEC-03): troca de senha e encerramento de todas as sessões, roteiro em `docs/auth.md`.
- Separação dev/produção (DEC-009): dev só no Miniflare local; todo script remoto exige `--target` explícito.
- Deploy por um comando (`Publicar Atlas.cmd` ou `pnpm run deploy:atlas -- --target production`): pull do `main`, build, migrations e publicação, só depois de digitar `PUBLICAR` (`docs/DEPLOY.md`).

---

## Known Incomplete Capabilities

Update this section only when an incomplete capability may affect upcoming work.

- Backup e restauração (DEC-011): decidido, em implementação.
- Proteção da branch `main`: fora do escopo por decisão do usuário (recurso pago do GitHub para este repositório). O CI continua rodando em todo PR.

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