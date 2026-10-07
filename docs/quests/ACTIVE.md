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

## QUEST-010 — Infraestrutura restante do usuário único (autenticação, storage de anexos, dev/produção, backup)

Priority: P0 · Complexity: LARGE · Raf Gate: YES (um Gate por área arquitetural, um de cada vez)

### Objective

Fechar os 4 itens de infraestrutura ainda em aberto do card DEC-06 (banco e limites do plano gratuito já fechados), dentro da conta Cloudflare pessoal do usuário (Worker `atlas-notes`, D1 `atlas-notes-own`, DEC-005): autenticação real, armazenamento durável de anexos (limites do DEC-07), separação segura dev/produção e rotina mínima de backup.

### Required Behavior

- Usuário consegue se autenticar (login) para acessar seus próprios dados; a sessão persiste entre visitas sem exigir novo login a cada acesso.
- Usuário consegue anexar imagem (PNG/JPG/JPEG) ou documento (PDF/DOCX) até 10MB (DEC-07); o arquivo fica armazenado de forma durável e só o próprio usuário consegue acessá-lo.
- É possível desenvolver/testar mudanças sem afetar ou corromper os dados reais de produção.
- Existe uma forma (mesmo manual/documentada) de gerar backup dos dados e restaurá-los em caso de perda.

### Acceptance Criteria

- [x] Login/logout funcional, sessão persistente validada manualmente — validado pelo usuário em produção (`atlas-notes.atlaspjt.workers.dev`, deploy do commit `307e816`, 2026-09-30): login aceita apenas a senha correta; sessão persiste entre navegação de páginas e reload sem novo login.
- [x] Upload de anexo funcional (10MB; PNG/JPG/JPEG/PDF/DOCX), com storage durável — arquivo continua acessível após reload/nova sessão. Servidor no PR #21 e editor no PR #27, ambos em `main`; validado pelo usuário em produção com arquivo real.
- [x] Ambiente de desenvolvimento comprovadamente isolado de produção (dado de teste enviado em dev não aparece em produção). Em `main` desde o commit `708e94b` (DEC-009): dev roda só no Miniflare local e todo script remoto exige `--target` explícito, sem valor padrão.
- [ ] Rotina de backup documentada e testada ao menos uma vez (executar backup, simular restauração). Em implementação (DEC-011).
- [x] Toda decisão arquitetural registrada em `docs/quests/ARCHITECTURE_GATE.md` e, quando `DEC Required: YES`, também em `docs/ATLAS_DECISIONS.md`. *(Gates 1 a 4 registrados — DEC-007, DEC-008, DEC-009, DEC-011)*
- Nenhum critério conta como implementado só porque o código existe: precisa ser validado funcionando de verdade (login com credencial real, upload com arquivo real, backup restaurado de verdade).

### UX Constraints

Nenhuma constraint visual nova além do já decidido: rótulo de formatos aceitos no upload (DEC-07: "Anexe uma foto ou documento (PNG, JPG, JPEG, PDF ou DOCX suportados)") e popup de consentimento de dados na primeira nota (DEC-08).

### Non-Goals

- Autenticação/arquitetura multiusuário (Atlas Business).
- Criptografia ponta a ponta de notas privadas (item futuro do DEC-08).
- Redesenho de telas existentes.
- Itens do Bloco 2 do QUEST-009 que dependam de outros DEC-*.
- Deploy automático a cada merge em `main`.

### Dependencies

DEC-005 (infra provisionada), DEC-06 (banco e limites fechados), DEC-07 (anexos: 10MB, PNG/JPG/JPEG/PDF/DOCX), DEC-08 (retenção de 3 dias após exclusão de conta; popup de consentimento).

### Complexity Budget (LARGE)

Architecture: OPEN · Raf: AS REQUIRED · Documentation: ALLOWED · Refactor: conforme a decisão aprovada em cada Gate · Dependencies: conforme decisão arquitetural.

### Validation

Teste funcional real de login/logout; upload/download real de anexo; isolamento dev/produção; backup + restauração simulada; build final e revisão de diff; cada Gate aberto documentado e, se resolvido, com `Status: RESOLVED`.

### Delivery rules

Sem push direto em `main`; branch própria + Pull Request; o usuário revisa e mescla.

### Gate tracking (um Gate por vez)

- [x] 1. Autenticação — Gate RESOLVIDO (DEC-007); implementada, deployada e validada em produção pelo usuário (`atlas-notes.atlaspjt.workers.dev`)
- [x] 2. Storage de anexos — Gate RESOLVIDO (DEC-008: bytes em R2 + metadados em D1, acesso só via Worker); PR #21 (servidor) e PR #27 (editor) em `main`, validado pelo usuário com arquivo real
- [x] 3. Dev/produção — Gate RESOLVIDO (DEC-009: dev exclusivamente local via Miniflare, sem staging remoto; scripts remotos exigem ambiente explícito); implementado em `main` (commit `708e94b`), incluindo o comando único de deploy (`docs/DEPLOY.md`)
- [ ] 4. Backup — Gate RESOLVIDO (DEC-011: dump SQL remoto do D1 + cópia do R2 no mesmo passo, destino fora da conta, disparo manual, restauração de teste no Miniflare); implementado em `scripts/backup.mjs` e `scripts/restore-local.mjs` (docs/BACKUP.md), falta o usuário rodar um backup de produção e a restauração de teste

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
