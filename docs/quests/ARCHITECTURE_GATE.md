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

Status: RESOLVED — FOLLOW-UP TO RESOLVED GATE (não é reabertura — é fato novo + sub-decisão não coberta)

---

# QUEST

Quest 3 — ambiente de desenvolvimento local (Atlas Notes) — Follow-up Alt 3 Bridge (Correlation: ATLAS-HERMES-GATE-20260911-LOCAL-PERSISTENCE-FOLLOWUP)

Reference: Gate anterior Status: RESOLVED — "NO ARCHITECTURAL DECISION REQUIRED. Proceed within the existing architecture." Autorizou sob autoridade local Codex, sem DEC: Alt 1 (status quo D1), Alt 2 (visualizador SQLite local), e condicionalmente Alt 3 (protótipo R2 local, JSON por nota, dev-only, atrás de abstração, D1 como produção, com re-escalada obrigatória se deixar de ser descartável). Decisão do usuário: seguir com Alt 3.

---

# ARCHITECTURAL QUESTION

A introdução de um mecanismo de ponte/sincronização entre o R2 local e arquivos editáveis é algo já coberto pela autorização condicional da Alt 3, ou configura, por si só, um novo Architecture Gate (já que introduz componente/processo não descrito, podendo tocar em "no separate process" / "no D1→R2/KV rewrite without a new Gate")?

Se coberto, qual das opções de ponte deve ser adotada?

---

# GATE TRIGGER

Fato técnico novo verificado após resolução anterior: persistência local do R2 pelo Miniflare (`.wrangler/state/v3/r2/`) não é filesystem legível por chave — é "Miniflare persistence state, not a bucket-shaped filesystem" (blobs opacos + SQLite interno); existe ferramenta de terceiros `r2-local-fs` justamente para criar pasta-espelho. Por contraste, D1 local persiste como `.sqlite` comum em `.wrangler/state/v3/d1/` diretamente editável via DB Browser / `drizzle-kit studio`. Consequência: Alt 3 sozinha não entrega "pasta local editável em tempo real" sem componente adicional de ponte não previsto. Limitação operacional Codex: `device_bash` indisponível (Plan9/virtiofs pós-atualização Windows) — não pode instalar/rodar wrangler, drizzle-kit studio, scripts de sync; apenas ler/escrever arquivos via ponte.

---

# ORIGINAL REQUIREMENT

Ambiente de desenvolvimento totalmente local (localhost), sem hospedagem, onde "banco" seja pastas/arquivos locais editáveis em tempo real, com intenção futura de trocar para D1 real. Sem intenção de alterar contrato público da API de notas nem implementação D1 existente. Para este follow-up: avaliar se ponte R2↔arquivos é extensão coberta ou novo Gate.

---

# RELEVANT REPOSITORY FACTS

1. `app/api/notes/route.ts` declara `export const runtime = 'edge'`.
2. `lib/notes-store.ts` importa `env` de `cloudflare:workers` para `env.DB`; só existe dentro do runtime Workers.
3. `node:fs` no runtime Workers (mesmo com `nodejs_compat` via Miniflare/workerd) é FS virtual em memória; `/tmp` não persiste; sem acesso a disco real do host.
4. Projeto já roda localmente (`pnpm dev` / `vinext dev`) com D1 emulado SQLite via Miniflare, sem hospedagem; `.wrangler/state/` contém arquivos reais no host para D1 (SQLite), R2 (blobs opacos), KV.
5. Novo fato: R2 local não é pasta legível por chave (requer ponte); D1 local é `.sqlite` comum editável direto — verificado via docs Cloudflare + `r2-local-fs`.
6. `.openai/hosting.json`: `d1:"DB"`, `r2:null` (não provisionado).
7. Restante da stack não depende de Workers; apenas rota de notas depende.
8. `device_bash` indisponível no momento (Plan9/virtiofs), apenas leitura/escrita de arquivos individuais via ponte.
9. Resolução anterior impôs constraints: "no separate process", "no D1→R2/KV rewrite without a new Gate".

---

# EXISTING ARCHITECTURAL CONSTRAINTS

Nenhuma DEC-* existente trata de runtime de API ou persistência local de dev. DEC-001/002/003 tratam de formato canônico Atlas Notes e não são afetadas. Gate anterior: NO ARCHITECTURAL DECISION REQUIRED, sem DEC, autorizando Alt 1, Alt 2 e Alt 3 condicional (protótipo dev-only atrás de abstração, D1 permanece produção, re-escalada se deixar de ser descartável).

---

# ALTERNATIVAS MAPEADAS — PONTE R2↔ARQUIVOS

## Opção A — Script de sincronização próprio (custom), fora do Workers

Description: processo Node separado ao lado do `vinext dev`, watcher de pasta JSON, sincronização bidirecional com bucket R2 local via API/CLI Wrangler, lógica de conflito.
Advantages: controle total.
Costs/Risks: novo processo background, manutenção, corridas/divergência, duplica validação `ATLAS_NOTES_FORMAT`, esbarra em "no separate process".

## Opção B — Adotar ferramenta de terceiros (`r2-local-fs`)

Description: dependência dev que cria pasta-espelho sincronizada com R2 local.
Advantages: menos código próprio, rápida.
Costs/Risks: dependência de nicho com risco de manutenção/segurança, menos controle.

## Opção C — Manter R2 só como armazenamento (sem pasta editável)

Description: R2 + JSON por nota sem ponte; edição via aplicação/API.
Advantages: nenhum custo além do já previsto.
Costs/Risks: Alt 3 perde vantagem sobre Alt 2; resta só diferença de formato.

## Opção D — Abandonar R2; sincronizar pasta ↔ D1 diretamente

Description: sincronizador fora do Workers lendo/escrevendo `.sqlite` do D1 local via `better-sqlite3`, espelhando para JSON.
Advantages: alcança pasta editável sem introduzir R2.
Costs/Risks: toca arquivo D1 por fora (risco corrupção), esbarra em ambas restrições, watcher + mapeamento canônico.

## Opção E — Adiar/abandonar "pasta editável" por agora

Description: nenhuma ponte; manter Alt 1 ou Alt 2.
Advantages: 0 custo, sem novo componente.
Costs/Risks: não entrega experiência que motivou Alt 3.

Se houver alternativa fora destas cinco, Hermes deve apontar.

---

# CODEX RECOMMENDATION

NOT REQUESTED

---

# DECISION REQUIRED

1. Este mecanismo de ponte configura um novo Architecture Gate, ou está dentro do escopo já autorizado da Alt 3 condicional?
2. Caso esteja dentro do escopo já autorizado, qual das opções acima (ou outra não listada) deve ser adotada?

---

# HERMES DECISION

## Decision

**1. O mecanismo de ponte/sincronização NÃO estava coberto pela autorização condicional da Alt 3. Ele configura, por si só, um novo Architecture Gate estreito.**

A resolução anterior autorizou condicionalmente apenas: *R2 local binding, JSON-per-note, dev-only, atrás de abstração, D1 como sistema de produção, descartável, com re-escalada obrigatória se deixar de ser descartável*.

Ela **não descreveu nem autorizou**: processo Node separado com watcher, lógica de sincronização bidirecional e resolução de conflitos, dependência de terceiros de nicho (`r2-local-fs`), nem acesso direto ao `.sqlite` do Miniflare por fora da aplicação. Todos tocam exatamente as restrições já estabelecidas — *"no separate process"* e *"no D1→R2/KV rewrite without a new Gate"* — e introduzem nova fronteira (Workers → Node) + nova dependência estrutural + trade-offs reais. Pelos critérios de `AGENTS.md` § ARCHITECTURE GATE (2,3,8,9), isso é Gate. O fato novo sobre R2 local ("not a bucket-shaped filesystem") confirma que Alt 3 sozinha não entrega "pasta editável em tempo real".

**2. Decisão sobre a sub-questão da ponte (menor correção correta): NÃO introduzir ponte agora.**

Escolhida **Opção E — Adiar/abandonar "pasta editável" por agora** (com fallback **Opção C** se protótipo R2 já estiver iniciado — manter R2 sem ponte).

Na prática: permanecer com o autorizado **Alt 1 (status quo D1) + Alt 2 (visualizador SQLite local: `drizzle-kit studio` / DB Browser em `.wrangler/state/v3/d1/`)** até que `device_bash` seja restabelecido e haja valor comprovado além do visualizador.

Nenhuma das opções de ponte (A, B, D) é adotada neste Gate.

## Rationale

1. Ponte é Gate, mas não é arquitetura durável: todos os designs de ponte adicionam processo extra, watcher e lógica de conflito apenas para conveniência de dev temporária e reversível — custo de manutenção e risco de corrida/divergência desproporcional ao requisito, que Alt 2 já resolve com 0 linhas de persistência.
2. Menor risco técnico: D1 local já persiste como `.sqlite` comum em `.wrangler/state/v3/d1/` diretamente editável via GUI; Alt 2 entrega "ver mudanças sem reiniciar" sem reescrever `lib/notes-store.ts`, sem binding novo e sem sair do `runtime='edge'`.
3. Restrição operacional atual reforça adiamento: com `device_bash` indisponível, qualquer ponte (A/B/D) exigiria instalação/configuração manual pelo usuário, sem validação automatizada por Codex — adiar evita introduzir componente não-verificável.

## Constraints for Codex

- Não implementar Opção A, B ou D sem novo Gate — todas violam *"no separate process"* da resolução anterior e, no caso de D, tocam o arquivo D1 por fora, arriscando corrupção e violação de `STRUCTURED_DOWNGRADE`/projeção.
- Não provisionar `r2` em `.openai/hosting.json` e não reescrever `lib/notes-store.ts` para R2/KV além de protótipo descartável já autorizado; se protótipo R2 já existe, mantê-lo sem ponte (Opção C) ou removê-lo.
- Não adicionar dependência `r2-local-fs` ou watcher custom neste momento.
- Permitido (autoridade local Codex, sem DEC): Alt 1 e Alt 2; instruções manuais ao usuário para abrir o `.sqlite` de `.wrangler/state/` com ferramenta local — sem `git add` de estado do Miniflare.
- Se no futuro "pasta JSON editável" voltar a ser perseguido, re-escalar antes com prova de que Alt 2 é insuficiente e com design explícito de resolução de conflitos.

## DEC Required

NO — é decisão de ferramental de desenvolvimento local, reversível, sem relevância arquitetural durável para produção. DEC-001/002/003 permanecem inalteradas e não afetadas.

---

## Resolution Rule

This Gate is RESOLVED (follow-up). Codex may resume implementation respecting the constraints above. Status: RESOLVED — FOLLOW-UP.

---

# NON-ARCHITECTURAL RULE

Follow-up resolvido como ferramenta de dev local — não requer DEC-* per docs/ATLAS_DECISIONS.md "WHEN NOT TO CREATE A DECISION" (routine local tooling, reversible, non-durable).

---

# CORE PRINCIPLE

Atlas supplies product requirement. Codex supplies evidence. Hermes supplies architectural judgment. These responsibilities must remain separate.
