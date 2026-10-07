# ATLAS PROJECT — ARCHITECTURAL DECISIONS

## Purpose

This document records durable architectural decisions for the Atlas Project.

It exists to preserve architectural intent across future development.

It must remain concise.

This document is NOT:

- an implementation diary;
- a commit history;
- a record of routine technical choices;
- a place to document every development task;
- a substitute for source code documentation.

Only decisions with lasting architectural relevance belong here.

---

# AUTHORITY

Atlas owns product requirements.

Raf owns architectural decisions.

Claude Code owns implementation decisions inside the established architecture.

A DEC-* record should normally represent a decision made or validated by Raf.

Claude Code must respect active DEC-* decisions.

Claude Code must not create DEC-* records for routine implementation choices.

---

# WHEN TO CREATE A DECISION

Create a DEC-* only when the decision is:

- architectural;
- durable;
- relevant to future development;
- difficult or expensive to reverse;
- likely to affect multiple future implementations;
- important enough that future agents should understand why the architecture works this way.

Typical DEC-* subjects:

- persistence strategy;
- canonical data model;
- editor engine;
- synchronization architecture;
- authentication architecture;
- security boundaries;
- major subsystem boundaries;
- significant structural dependencies;
- concurrency model;
- long-term integration strategy.

---

# WHEN NOT TO CREATE A DECISION

Do NOT create DEC-* records for:

- CSS choices;
- button behavior;
- local handlers;
- helper functions;
- local component structure;
- routine refactors;
- test organization;
- variable names;
- file names;
- local implementation techniques;
- ordinary bug fixes;
- routine UI behavior.

These belong to Claude Code implementation authority.

---

# DECISION STATES

Use one of the following states:

- PROPOSED
- ACCEPTED
- SUPERSEDED
- REJECTED

Only ACCEPTED decisions constrain implementation.

A SUPERSEDED decision must identify the DEC-* that replaced it.

---

# DECISION FORMAT

Use this format for each architectural decision:

---

## DEC-XXX — Short Decision Title

Status: PROPOSED | ACCEPTED | SUPERSEDED | REJECTED

Date: YYYY-MM-DD

### Context

Briefly describe the architectural problem.

Include only the information necessary to understand why a decision was required.

### Decision

State the architectural decision clearly.

### Rationale

Maximum three concise reasons by default.

1.
2.
3.

### Constraints for Claude Code

List only implementation constraints that must be preserved.

If none:

None.

### Consequences

Describe only meaningful architectural consequences.

Avoid speculative future design.

### Related

Quest: NONE

Supersedes: NONE

Superseded by: NONE

---

# DECISION SCOPE

Each DEC-* should answer the smallest architectural question necessary.

Do not solve unrelated future problems.

Do not expand the decision simply because adjacent architecture exists.

Prefer the smallest durable architectural decision that preserves long-term project integrity.

---

# RAF DECISION PROCESS

When an Architecture Gate is triggered:

1. read the original active quest;
2. identify the precise architectural question;
3. inspect only relevant project context;
4. evaluate alternatives independently;
5. make the smallest necessary architectural decision;
6. determine whether a DEC-* record is actually required.

If the decision is routine or local:

Do not create a DEC-*.

If no architectural decision is required, Raf should return:

NO ARCHITECTURAL DECISION REQUIRED.

Proceed within the existing architecture.

---

# CLAUDE CODE RULE

Claude Code must:

- respect ACCEPTED DEC-* decisions;
- consult relevant DEC-* records only when the current task touches them;
- escalate conflicts instead of silently overriding a decision.

Claude Code must NOT:

- read every DEC-* record for every task;
- create DEC-* records for routine implementation;
- reinterpret architectural decisions without an Architecture Gate.

---

# MAINTENANCE

Keep this document concise.

Do not duplicate:

- Task Contracts;
- implementation plans;
- test reports;
- commit messages;
- daily development notes;
- detailed source-code explanations.

The goal is to answer:

"What architectural decisions must future Atlas development preserve?"

---

## DEC-001 — Atlas Notes Canonical Document v2

Status: ACCEPTED

Date: 2026-09-08

### Context

Atlas Notes persists a canonical structured document (envelope atlas-notes version 1) with a strict allowlist (paragraph, heading 1-3, bullet/ordered lists, blockquote, bold/italic) and an LF-based deterministic body projection used for search/preview/counting. Quest 1 requires evolution to support headings H1-H6, bullet/ordered/task lists, blockquote, bold/italic/strike/highlight/inline code/styled inline comment/link/inline equation, plus horizontal rule, code block, block equation, table, footnote, and callout — without introducing UI, bookmarks/Marcacoes, color palettes, comment collaboration, or callout variants. The envelope stores version inside content_json (nullable TEXT, no separate version column). The server canonicalizer is pure TypeScript and DOM-free. Compatibility must preserve persisted v1, NULL legacy rows, in-memory-only legacy conversion, and structured-to-body-only downgrade protection.

### Decision

Introduce envelope version 2 as the durable canonical representation. Readers accept format "atlas-notes" version 1 and 2; any other version fails INVALID_ENVELOPE. Writers normalize every new structured save to version 2 (even v1-subset content); persisted v1 remains v1 until an explicit structured save migrates it to v2; no implicit mutation on reads. Adopt ProseMirror/Tiptap JSON shapes for conventional nodes with Atlas normalization (strict allowlist, deterministic mark order, adjacent-text merging, editor-boundary adapter); define Atlas-normalized shapes for highlight/comment/equations/footnote/callout with minimum durable semantics. Define LF-based body projection that preserves exact v1 projection for the v1 subset and specifies rules for every new type. Keep all numeric safety limits unchanged and define depth/node counting for new nesting.

### Rationale

1. Versioned envelope preserves exact v1 bytes and projection and avoids implicit storage mutation on reads — an in-place v1 allowlist expansion cannot guarantee this.
2. Adopting Tiptap's conventional shapes with Atlas normalization and an editor adapter maximizes interoperability while keeping server validation deterministic and DOM-free.
3. Existing limits already accommodate new nesting (table path depth 6 < 8), so no speculative limit inflation is needed.

### Constraints for Claude Code

- Envelope is { format:"atlas-notes", version:1|2, doc:{ type:"doc", content:Block[] } }; readers accept 1 and 2 only; writers persist 2 only; unsupported versions reject INVALID_ENVELOPE; no read-time rewrite.
- v2 blocks: paragraph, heading 1-6, bulletList/orderedList (attrs start:1 type:null, strict), taskList/taskItem (attrs checked:boolean), blockquote, horizontalRule (atom), codeBlock (attrs language string| null, content text-no-marks), mathBlock (attrs latex), table/tableRow/tableCell/tableHeader (cell content 1+ paragraphs, no colspan/rowspan), footnote (attrs id unique, content 1+ paragraphs), callout (content 1+ paragraphs, no attrs). Inline: text (marks sorted by rank) plus atom mathInline (latex) and footnoteRef (id). Marks: bold(0), italic(1), strike(2), code(3), highlight(4, no attrs), comment(5, no attrs), link(6, attrs href http/https/mailto only, last). Unknown fields/nodes/marks/attrs, duplicate marks, invalid children, nested lists where forbidden → reject. Canonicalize by sorting marks then merging adjacent same-mark text.
- Projection is LF-only: paragraph/heading → inline concat; bullet/ordered/task lists → items joined with LF (checked adds nothing); blockquote/callout → paragraphs with LF; horizontalRule → ""; codeBlock → raw text preserving LF; mathInline/mathBlock → latex; link/highlight/comment/code/strike → visible text only; footnoteRef → ""; footnote definition block → paragraphs with LF; table → cells with tab, rows with LF, cell paragraphs with LF; doc → blocks with LF then trim(). v1 subset projection byte-identical between v1 and v2. Stored body must equal version-specific projection; hydration fails otherwise.
- Preserve legacy invariants: content_json NULL stays readable, legacy conversion in memory only, explicit structured save migrates, structured row downgrade to body-only rejected (STRUCTURED_DOWNGRADE), server derives authoritative body and rejects BODY_PROJECTION_MISMATCH, idempotency via atlas-notes:{operationId}, determinism via TextEncoder JSON byte length and UTF-16 counts.
- No UI, CSS, handlers, component structure, color palettes, comment collaboration/authorship/threads, callout categories/colors/icons, bookmark/Marcacao semantics, or speculative types. Editor-boundary adapter translates Tiptap runtime to canonical JSON; server never depends on DOM/Tiptap.
- Limits unchanged: request 1,310,720, structured 1,048,576, depth 8, nodes 20,000, textNode 100,000, visible 100,000. Depth counted from envelope 0 → doc 1 → block 2 → listItem/taskItem/tableRow 3 → paragraph/cell 4-5 → text/atom 6; nodes = every type-bearing object; marks not counted.

### Consequences

- All future structured saves are version 2; v1 persists only until overwritten, simplifying the write path to one canonical version while reads remain dual-version indefinitely.
- Server validation and projection remain pure TypeScript and deterministic; editor changes require only adapter updates, not persistence changes.
- Footnote definitions, tables, and callouts are searchable via their paragraph text; structural elements (horizontalRule, footnoteRef, task checked) contribute no invented visible tokens.
- No schema migration for D1 (content_json stays TEXT, no version column); version lives in JSON.

### Related

Quest: QUEST 1 — Atlas Notes Canonical Document Evolution (ATLAS-HERMES-GATE-20260908-001)

Supersedes: NONE

Superseded by: NONE

---

## DEC-002 — Atlas Notes Nested Lists

Status: ACCEPTED

Date: 2026-09-11

### Context

DEC-001 definiu o Canonical Document v2 com listas flat: listItem/taskItem com exatamente um parágrafo e sem listas-filhas, rejeitando nesting. Quest 3 exige hierarquia real de listas para bullet, ordered e task lists via Tab (filho do anterior, níveis adicionais, sem limite artificial, estrutural real sobrevivendo a save→reload). Implementar nesting exige evolução da estrutura canônica v2 sem quebrar determinismo, projeção LF-only, compatibilidade v1/v2, limites depth/nodes, leitura sem mutation e servidor DOM-free.

### Decision

Suplementar DEC-001 dentro do envelope version 2, sem nova versão e sem migration, para permitir listas hierárquicas reais:

- Envelope continua `format:"atlas-notes", version:2` (writers persistem 2; readers aceitam 1 e 2 per DEC-001); nenhum envelope version 3.
- `listItem` = `{ type:"listItem", content:[ Paragraph, ...List[] ] }` — exatamente 1 parágrafo obrigatório como primeiro elemento + 0..N listas-filhas.
- `taskItem` = `{ type:"taskItem", attrs:{checked:boolean}, content:[ Paragraph, ...List[] ] }` — attrs.checked obrigatório + mesmo modelo de conteúdo.
- `List` = `bulletList | orderedList | taskList` — válidas como blocos em `doc.content` e como filhas dentro de `listItem/taskItem`.
- Listas-filhas podem ser `bulletList, orderedList ou taskList`; misturas entre tipos são permitidas (bullet⊂bullet, ordered⊂bullet, task⊂bullet, bullet⊂task e todas as combinações).
- Ordem estrita: parágrafo primeiro, apenas listas após; qualquer outro filho ou ordem → rejeitar `INVALID_NODE`/`UNKNOWN_FIELD`.
- Projeção textual recursiva LF-only, sem marcadores/indentação inventados: `projectItem = projectInline(paragraph) + (\n + nested lists recursivas)`; `projectList = items.map(projectItem).join("\n")`; `task checked` projeta nada; doc final `blocks.map(projectBlock).join("\n").trim()`.
- Limites existentes permanecem inalterados: `depth:8, nodes:20_000, textNode:100_000, structured:1_048_576, request:1_310_720, visible:100_000`; depth/nodes aplicados recursivamente (cada nesting incrementa depth; `STRUCTURE_TOO_DEEP` se >8).
- Documentos v1/v2 flat existentes continuam compatíveis (flat é subset válido); nenhuma migration necessária; leitura nunca muta `content_json`.
- Servidor continua DOM/Tiptap-free; Tiptap traduzido via editor-boundary adapter client-side.

DEC-001 permanece como decisão base do Canonical Document v2; esta DEC suplementa apenas o comportamento de listas aninhadas.

### Rationale

1. `paragraph + 0..N nested lists` é a menor evolução que converte indentação visual em hierarquia estrutural real persistente, preservando determinismo e compatibilidade.
2. Mixing heterogêneo total com regra única evita limite artificial de tipo sem custo adicional e cobre todos os casos do Gate.
3. Reuso do limite `depth:8` como teto técnico satisfaz "sem limite artificial além dos limites técnicos" sem inflação especulativa.

### Constraints for Claude Code

- Não criar envelope version 3; não alterar `ATLAS_NOTES_VERSION`; não redefinir DEC-001 fora de nesting.
- Canonicalizer deve validar `content[0]=paragraph` + `content[1..]=bulletList|orderedList|taskList` canônicos com `assertKeys` estrito; rejeitar qualquer outro filho ou lista vazia; manter sort de marks e merge de texto de DEC-001.
- Projeção deve ser recursiva LF-only; não inventar `-`, `*`, números, `[x]` ou indentação; tarefa `checked` projeta apenas texto visível.
- Aplicar `depth`/`nodes` recursivamente via `inspectStructure`; não aumentar limites numéricos.
- `prepareAtlasNotesForSave` e `canonicalizeAtlasNotesContentV2` aceitam flat e nested; flat persiste idêntico; nested persiste como v2.
- Servidor permanece pure TypeScript DOM-free; adapter Tiptap↔canonical apenas client-side.
- Não implementar UI/CSS/handlers como decisão arquitetural; não expandir para outros recursos da Quest 3.

### Consequences

- Aninhamento real persiste canonicamente e sobrevive a save→reload→reopen; Tab no editor deve produzir este shape.
- Projeção de documentos flat permanece byte-identical; aninhados projetam todos os textos em ordem depth-first com LF.
- Nesting muito profundo falha deterministicamente com `STRUCTURE_TOO_DEEP` dentro do limite técnico existente, sem necessidade de limite artificial por tipo.
- Nenhuma migration D1; version vive em JSON; compatibilidade v1/v2 preservada.

### Related

Quest: Quest 3 — Atlas Notes: Inserir, links e blocos avançados — Nested Lists (ATLAS-HERMES-GATE-20260911-NESTED-LISTS)

Supersedes: NONE

Superseded by: NONE

---

## DEC-003 — Atlas Notes Nested Lists Depth Correction

Status: ACCEPTED

Date: 2026-09-11

### Context

DEC-002 suplementou DEC-001 para permitir hierarquia real `listItem/taskItem = paragraph + 0..N nested lists` com mixing heterogêneo e projeção recursiva LF-only, mantendo `depth:8`. Validação manual demonstrou que cada nível visual consome 2 depth (list + listItem) + paragraph/text, de modo que `depth:8` permite apenas 2 níveis funcionais com texto; o 3º nível (`paragraph8/text9`) já excede o limite e falha com `STRUCTURE_TOO_DEEP` antes de digitar. A alternativa aprovada pelo Gate foi elevar o limite global preservando a semântica de contagem; Product Authority escolheu `depth:16` para garantir ~6 níveis funcionais e evitar reincidência imediata.

### Decision

Suplementar DEC-002 somente quanto ao limite estrutural de profundidade, sem alterar forma canônica, mixing, projeção ou envelope:

- Limite global `depth: 8 → 16`.
- Semântica de contagem permanece inalterada: `inspectStructure` continua usando `depth + 1` recursivamente para cada `content[]` aninhado (envelope 0 → doc 1 → block 2 → listItem/taskItem 3 → paragraph 4 → text 5 → nested list 4 → ...).
- `STRUCTURE_TOO_DEEP` continua quando `depth > limit` (agora >16).
- Aproximadamente 6 níveis de nested list com texto tornam-se representáveis (`text15` em N=6; vazios até `paragraph16` em N=7).
- `nodes:20_000` permanece inalterado; todos os demais limites permanecem inalterados (`request:1_310_720, structured:1_048_576, textNode:100_000, visible:100_000`).
- Envelope continua `format:"atlas-notes", version:2`; nenhuma migration; nenhuma alteração em canonicalização/projeção de nested lists além do limite.
- DEC-001 continua base do Canonical Document v2; DEC-002 continua válida para forma estrutural e mixing; DEC-003 suplementa somente `depth`.

### Rationale

1. `depth:16` dobra o limite anterior preservando a mesma semântica `depth+1`, permitindo `N=6` funcional com margem sem reincidência imediata do caso `N=3` validado.
2. Manter `depth` como único limite global é a menor mudança (1 constante) vs redefinir contagem ou criar limite separado para listas.
3. `nodes:20_000` e limites de bytes continuam como proteção primária contra documentos patologicamente grandes; `depth:16` permanece ordens de magnitude abaixo do stack JS, preservando segurança determinística e compatibilidade retroativa.

### Constraints for Claude Code

- Alterar apenas `ATLAS_NOTES_LIMITS.depth` de 8 para 16; não alterar `nodes`, `textNodeLength`, `structuredBytes`, `requestBytes`, `visibleLength`.
- Preservar semântica `inspectStructure` (`depth+1` recursivo) e erro `STRUCTURE_TOO_DEEP` quando `depth > 16`.
- Não redefinir contagem de depth, não criar `listDepth` separado, não introduzir cap artificial de níveis visuais.
- Não alterar envelope version, canonicalização ou projeção de nested lists de DEC-002 além do limite.
- Implementação do novo limite é separada deste commit arquitetural (não incluir `lib/atlas-notes-document.ts` neste commit).

### Consequences

- Hierarquias `pai→filho→neto` e até ~6 níveis passam a ser plenamente editáveis e persistentes via `save→reload→reopen`.
- Documentos `depth 9-16` antes rejeitados tornam-se válidos como `version:2`; documentos `depth ≤8` permanecem idênticos; `depth >16` ainda falha deterministicamente.
- Nenhuma migration D1; compatibilidade v1/v2 preservada; servidor continua DOM/Tiptap-free.

### Related

Quest: Quest 3 — Atlas Notes: Inserir, links e blocos avançados — Nested Lists Practical Depth (ATLAS-HERMES-GATE-20260911-NESTED-LISTS-DEPTH)

Supersedes: NONE

Superseded by: NONE

---

## DEC-004 — Estratégia de export de dados (Bloco A da migração Cloudflare)

Status: ACCEPTED

Date: 2026-09-28

### Context

Antes de qualquer migração de hosting, é necessário provar que os dados de produção (notas e pastas) podem ser exportados de forma completa e portátil.

### Decision

Usar os endpoints já existentes `GET /api/notes` (sem parâmetros) e `GET /api/notes/folders` como caminho canônico de export. Nenhum endpoint novo é necessário para satisfazer o export de dados.

### Rationale

Inspeção direta do código-fonte confirmou que `listNotes('')` em `lib/notes-store.ts` já retorna o conteúdo completo de todas as notas (`id`, `title`, `body`, `content`, timestamps, `links`, `syncStatus`, `folderId`, `isPrivate`), e `app/api/notes/folders/route.ts` já envolve `listFolders()`.

### Constraints for Claude Code

- Não criar novos endpoints para export de dados.
- O trabalho restante do Bloco A do QUEST-008 é produzir um artefato de export consolidado (script/rotina que chama os dois endpoints e serializa o resultado em formato portátil).

### Consequences

Export de dados fica desacoplado do hosting e pode prosseguir independentemente do Bloco B.

### Related

Quest: QUEST-008 — Migração de ownership Cloudflare (Bloco A) (ATLAS-RAF-GATE-20260928-CLOUDFLARE-OWNERSHIP)

Supersedes: NONE

Superseded by: NONE

---

## DEC-005 — Estratégia final de migração de ownership Cloudflare: deploy independente + seed de dados (substitui a versão draft)

Status: ACCEPTED

Date: 2026-09-28

### Context

O Bloco B do QUEST-008 dependia de confirmar se a plataforma ChatGPT Sites da OpenAI permitia portar os recursos Workers/D1/R2 geridos por ela para a conta Cloudflare própria do usuário. O usuário perdeu acesso administrativo a essa conta/workspace ChatGPT antes de conseguir confirmar essa precondição — só consegue abrir o site publicado normalmente no navegador, nada além disso.

### Decision

Abandonar a tentativa de migrar/portar a infraestrutura gerenciada pela OpenAI. O caminho passa a ser:

1. extrair os dados reais de produção manualmente, via o próprio navegador autenticado do usuário, acessando `GET /api/notes` diretamente (já feito — `scripts/seed-data/atlas-export-production-20260928.json`);
2. provisionar um deployment novo e independente (Worker + D1) na conta Cloudflare própria do usuário, a partir do código já existente em `main`;
3. rodar as migrations Drizzle já estabelecidas para criar o schema;
4. semear esse D1 novo com os dados extraídos.

### Rationale

Essa abordagem não depende de nenhuma cooperação ou permissão adicional da OpenAI — só precisa dos dados, que já foram obtidos. Ela também é objetivamente mais simples e menos arriscada que a migração in-place originalmente cogitada: é um deploy padrão de um projeto vinext/Cloudflare já documentado, não uma operação sobre um sistema de terceiros em produção.

### Constraints for Claude Code

- Não alterar nada no site publicado atual (ChatGPT Sites).
- Não provisionar R2 (binding é `null` em `.openai/hosting.json`; o app não usa R2 hoje).
- Preservar os `id`s originais das notas no seed.
- Escalar ao Raf apenas se surgir problema genuinamente arquitetural (ex.: schema incompatível); provisionar D1/Worker em si não é motivo de Gate.

### Consequences

O site publicado atual (ChatGPT Sites, gerenciado pela OpenAI) permanece como está, sem nenhuma alteração — não é mais alvo de migração. O novo ambiente na Cloudflare própria do usuário passa a ser o ambiente de produção daqui em diante.

### Related

Quest: QUEST-008 — Migração de ownership Cloudflare (Bloco B) (ATLAS-RAF-GATE-20260928-CLOUDFLARE-OWNERSHIP)

Supersedes: DEC-005 (versão PARTIAL/DRAFT)

Superseded by: NONE

---

## DEC-006 — Upgrade de vinext (1.0.0-beta.5 → 1.0.0) para corrigir navegação client-side quebrada em produção

Status: ACCEPTED

Date: 2026-09-29

### Context

O menu principal (`atlas-shell.tsx`, `next/link`) não navega por clique em produção nem em `pnpm run build` + `pnpm start` (funciona em `pnpm run dev`, sem bundle). Diagnóstico isolou a causa em `vinext@1.0.0-beta.5`: o chunk de shims `vinext-*.js` que deveria conter `navigateClientSide`, `getPrefetchInterceptionContext`, `createRscRequestUrl` etc. não é gerado pelo build; esses exports ficam ausentes do chunk de entrada, causando `TypeError` no runtime de navegação do cliente. Testado em cópia descartável fora do repositório: `vinext@1.0.0` + `@vitejs/plugin-rsc@0.5.34` (peer exigido) gera o chunk corretamente e os 6 itens do menu navegam sem os erros observados.

### Decision

Atualizar a dependência `vinext` de `1.0.0-beta.5` para `1.0.0`, e `@vitejs/plugin-rsc` de `0.5.26` para `0.5.34` (peer exigido pelo vinext 1.0.0). Nenhuma outra mudança de código de navegação.

### Rationale

1. Causa raiz confirmada e isolada na versão da dependência, não no código do app; a versão estável corrige o problema de forma verificada.
2. As alternativas (workaround de chunking manual, ou evitar `next/link`) não corrigem a causa real do runtime de navegação quebrado e/ou violam o requisito explícito de navegação client-side.
3. A cadeia de build/deploy já validada localmente (`vinext build` + `wrangler`) é a mesma usada pelo deploy de produção real (Worker independente na Cloudflare do usuário, DEC-005), reduzindo o risco de incompatibilidade de deploy.

### Constraints for Claude Code

- `vinext` fixado em `1.0.0` (sem `^`); `@vitejs/plugin-rsc` em `0.5.34`.
- Não alterar `atlas-shell.tsx` nem substituir `next/link` por `<a>`/`router.push` como parte desta correção.
- Revalidar client-side navigation (desktop + mobile, sem novos erros de console) após o upgrade, antes de mergear/deploy.
- Deploy apenas no Worker independente (`atlas-notes.atlaspjt.workers.dev`); não tocar o site antigo da OpenAI.

### Consequences

`vinext` passa a ser tratado como dependência estável (não mais beta); futuras mudanças de versão do vinext continuam sujeitas a Architecture Gate por regra do quest. Nenhuma mudança de schema, persistência ou paradigma de navegação.

### Related

Quest: BUG P0 — navegação por clique do menu principal (ATLAS-RAF-GATE-20260929-VINEXT-NAV)

Supersedes: NONE

Superseded by: NONE

---

## DEC-007 — Autenticação de usuário único: aplicação + cookie assinado stateless

Status: ACCEPTED

Date: 2026-09-29

### Context

As rotas `/api/notes` e `/api/notes/folders` estão completamente públicas em produção: qualquer requisição chega ao D1 sem verificação de identidade. Não existe tabela de usuário, middleware de sessão, nem mecanismo de login. QUEST-010 exige login/logout funcional com sessão persistente entre visitas, para um único usuário (não-goal: multiusuário/Atlas Business), na conta Cloudflare própria do usuário (Worker `atlas-notes`, D1 `atlas-notes-own`, DEC-005).

### Decision

Autenticação implementada na própria aplicação (Worker), não na borda Cloudflare (Access) e sem provedor OAuth de terceiro. Sessão via cookie assinado, HttpOnly, Secure, com expiração/renovação — stateless, sem tabela de sessão no D1. Credencial (hash) e secret de assinatura do cookie vivem apenas como Worker secrets, fora do repositório e fora do D1. Verificação aplicada uniformemente a todas as páginas de `app/(atlas)/` e a todas as rotas `/api/notes*`.

### Rationale

1. Menor mecanismo suficiente para um único usuário: elimina a superfície pública atual sem depender de serviço externo (Access) com disponibilidade/limites não verificados, nem de biblioteca OAuth com compatibilidade não verificada em vinext/Workers.
2. Cookie assinado stateless satisfaz persistência de sessão sem nova tabela de usuário/sessão no D1 — coerente com o non-goal de multiusuário.
3. Segredos fora do repo/D1 preserva o padrão já existente no projeto (nenhum secret versionado hoje).

### Constraints for Claude Code

- Nenhuma tabela `user`/`session` nova em `db/schema.ts` para esta decisão.
- Hash de credencial e secret de assinatura do cookie como Worker secrets; nunca no repositório, nunca no D1.
- Cookie `HttpOnly`, `Secure`, com expiração e renovação; nenhum token de sessão acessível via JS no cliente.
- Verificação de sessão obrigatória em todas as páginas de `app/(atlas)/`, `app/notes-spike/` e em todas as rotas `/api/notes*`; nenhuma rota pode depender apenas de checagem client-side.
- Sem Cloudflare Access, sem provedor OAuth de terceiro.
- Separação de credencial dev/produção é escopo do Gate de dev/produção (item 3 do QUEST-010), não desta decisão.

### Consequences

Fecha o security boundary do produto: rotas de API e páginas deixam de ser publicamente acessíveis. Desbloqueia os Gates 2 (storage de anexos — "só o próprio usuário consegue acessá-lo"), 3 (dev/produção) e 4 (backup) do QUEST-010, que dependiam desta decisão. Nenhuma migration de schema D1 é necessária para autenticação em si.

### Related

Quest: QUEST-010 — Infraestrutura restante do usuário único, item 1: autenticação (ATLAS-RAF-GATE-20260929-AUTH)

Supersedes: NONE

Superseded by: NONE

---

## DEC-008 — Storage de anexos: R2 para bytes + metadados no D1, acesso só via Worker

Status: ACCEPTED

Date: 2026-09-30

### Context

QUEST-010 exige anexar imagem/documento até 10MB (DEC-07) de forma durável e acessível só ao usuário autenticado (DEC-007). Hoje não existe armazenamento de bytes (bloco "Anexos" é demonstrativo); único binding de dados em produção é D1 (`atlas-notes-own`, DEC-005), sem R2 configurado. O limite de linha/valor do D1 (~2MB) é menor que os 10MB exigidos. DEC-007 protege rotas do próprio Worker via `proxy.ts`, não URLs externas de um serviço de storage.

### Decision

Bytes dos anexos em bucket Cloudflare R2; metadados (id, nota associada, nome original, mime type, tamanho em bytes, chave do objeto R2, timestamp) em nova tabela no D1, sem bytes na tabela. Upload e download exclusivamente por rotas do Worker, sob a mesma verificação de sessão de DEC-007. O bucket R2 não tem acesso público nem URL assinada exposta ao cliente.

### Rationale

1. O limite de linha do D1 (~2MB) é menor que os 10MB do DEC-07; guardar bytes no D1 exigiria fragmentação artificial só para contornar um limite de plataforma, além de inflar o banco compartilhado com notas.
2. R2 é o par natural do D1/Worker já provisionados na mesma conta (DEC-005), resolvendo durabilidade sem dependência ou credencial externas à conta do usuário.
3. DEC-007 só protege rotas do Worker; o requisito de acesso restrito ao próprio usuário só se sustenta se os bytes forem servidos exclusivamente por rota do Worker, nunca por link direto/assinado do R2.

### Constraints for Claude Code

- Nova tabela de metadados em `db/schema.ts`, sem coluna de bytes; bytes só no R2.
- Bucket R2 sem acesso público e sem presigned URLs entregues ao cliente; todo upload/download passa por rota do Worker.
- Rotas de upload/download de anexos sob a mesma verificação de sessão de DEC-007 (fail-closed via `proxy.ts`); não entram nas exceções de rota pública.
- Limite de 10MB por arquivo validado no Worker no caminho de upload, não no D1.
- Nome de rotas, nome do binding R2, streaming vs. buffer, formato de resposta são decisão de implementação.

### Consequences

Introduz R2 como segundo local de persistência de dados do usuário, além do D1. Backup (Gate 4) precisa cobrir D1 e R2. Isolamento dev/produção (Gate 3) precisa decidir se há bucket R2 separado para dev. Nenhuma mudança em DEC-001/002/003 (documento canônico de notas) nem em DEC-007 (autenticação).

### Related

Quest: QUEST-010 — Infraestrutura restante do usuário único, item 2: storage de anexos (ATLAS-RAF-GATE-20260929-STORAGE)

Supersedes: NONE

Superseded by: NONE

---

## DEC-009 — Isolamento dev/produção: dev exclusivamente local, sem staging remoto

Status: ACCEPTED

Date: 2026-10-06

### Context

QUEST-010 exige desenvolver/testar sem afetar dados reais de produção, com dado de teste em dev nunca aparecendo em produção. Dev local já usa Miniflare (D1 e R2 emulados) sem referenciar os IDs de produção; o build sempre gera `wrangler.json` com IDs placeholder, só substituídos manualmente por `prepare-own-deploy.mjs` no momento do deploy (DEC-005). DEC-007 deferiu a separação de credencial dev/produção para este Gate; DEC-008 deferiu a decisão sobre bucket R2 separado para dev.

### Decision

Dev/teste permanece exclusivamente local (Miniflare para D1 e R2, credenciais em `.dev.vars`); nenhum Worker/D1/R2 remoto de staging é criado. Produção continua sendo o único ambiente remoto. Secrets de produção existem só como Worker secrets na conta do usuário, nunca copiados para `.dev.vars` ou arquivo versionável. Scripts que podem tocar recursos remotos exigem o identificador de ambiente explicitamente a cada execução, nunca como default de produção.

### Rationale

1. O requisito só exige que dado de teste em dev não apareça em produção; isolamento local via Miniflare já satisfaz isso sem recurso novo — staging remoto resolveria um problema não exigido, consumindo cota e configuração adicionais sem necessidade concreta.
2. O fluxo de build/deploy já separa dev de produção por construção (IDs placeholder no build, substituição manual só no deploy); formalizar que essa substituição nunca é default fecha a lacuna real de segurança sem mudar o fluxo existente.
3. Secrets de produção existirem só na conta Cloudflare, nunca em `.dev.vars`, é a menor extensão de DEC-007 que satisfaz "credencial de produção nunca necessária localmente".

### Constraints for Claude Code

- Não criar Worker, D1 ou bucket R2 remotos adicionais de staging/dev; dev permanece exclusivamente local via Miniflare.
- `.dev.vars` contém apenas valores de dev, nunca secrets reais de produção.
- `prepare-own-deploy.mjs`, `seed-notes.mjs`, `export-data.mjs` e scripts futuros equivalentes exigem identificador de ambiente remoto explícito a cada execução, nunca default implícito de produção, nunca lido de `.dev.vars`.
- Nenhum desses scripts roda automaticamente via `vinext dev`/`wrangler dev`/build padrão.
- `scripts/seed-data/atlas-export-production-20260928.json` (histórico de DEC-005) não é afetado retroativamente.

### Consequences

Fecha a separação dev/produção exigida pelo item 3 do QUEST-010 sem novo binding ou custo adicional. Confirma, como consequência registrada em DEC-008, que não haverá bucket R2 remoto separado para dev. Desbloqueia o Gate 4 (backup), que precisará cobrir apenas o único ambiente de produção (D1 + R2).

### Related

Quest: QUEST-010 — Infraestrutura restante do usuário único, item 3: dev/produção (ATLAS-RAF-GATE-20260930-DEVPROD)

Supersedes: NONE

Superseded by: NONE

---

## DEC-010 — Modelo de dados canônico: D1 como fonte da verdade, estado + auditoria separada, migração por espinha

Status: ACCEPTED

Date: 2026-10-06

### Context

Card TEC-02 exige desenhar o modelo de dados para as entidades de estudo do MVP, suportando a hierarquia do DEC-05, a máquina de estados do DEC-03 e a auditoria do TEC-06. Hoje só Notas persistem no D1; catálogo de conteúdo é um snapshot estático de planilha sem FK; `atlas_sync_operations` é fila nunca conectada à planilha; roadmap/fases/disciplinas/sessões/quiz/progresso existem só como dados demonstrativos sem persistência; não há entidade de usuário (DEC-007) nem histórico de notas.

### Decision

D1 passa a ser a fonte da verdade do catálogo curado e de todo o progresso/estado do produto; a planilha oficial permanece superfície de curadoria do catálogo, não dona do progresso. Estado pedagógico (DEC-03) é representado em colunas/tabela de estado atual, com uma tabela de auditoria separada (autor, momento, estado anterior, estado novo, motivo, evidência relacionada — TEC-06). Migração agora cobre só a espinha: hierarquia do DEC-05, estado do DEC-03 e auditoria do TEC-06; demais entidades (sessão, questão, tentativa, revisão, avaliação) são migradas junto do respectivo card MVP. Histórico de notas (MVP-03) e entidade de usuário/preferências ficam fora desta decisão.

### Rationale

1. DEC-03 exige transições automáticas e com confirmação irreversível avaliadas por código; só D1 como fonte da verdade viabiliza isso — a planilha nunca teve integração de escrita conectada.
2. TEC-06 já pede literalmente o formato "estado atual + auditoria separada"; event-sourcing resolveria um requisito que nenhum card pede, com custo de leitura adicional no D1 Free.
3. Fixar só a espinha agora é a menor decisão que destrava TEC-02 e seus dependentes diretos, sem migrar entidades antes de existir uso real.

### Constraints for Claude Code

- D1 é a fonte da verdade de progresso/estado; nenhuma transição de estado depende de leitura síncrona da planilha.
- `atlas_sync_operations`, se mantida, serve só como import planilha → D1 do catálogo; nunca o caminho inverso para estado/progresso.
- Migrar agora: hierarquia DEC-05 (roadmap, fase, disciplina, conteúdo, subtópico, evidência) com chaves estáveis, estado atual (DEC-03), tabela de auditoria (TEC-06).
- Não migrar ainda sessão, questão, tentativa, revisão, avaliação; migrar cada uma junto do card MVP correspondente, respeitando as chaves da espinha.
- Nenhuma tabela de usuário/autenticação além de DEC-007; preferências (TEC-04) são decisão daquele card.
- Histórico de notas (MVP-03) não decidido aqui.
- Nomes de tabelas/colunas, índices, ordem das migrations e forma de importação planilha→D1 são detalhe de implementação.

### Consequences

Desbloqueia TEC-02 e os cards que dele dependem (TEC-04, TEC-06, MVP-01, MVP-02, MVP-04 a MVP-09). A planilha oficial deixa de ser, na arquitetura, a dona do progresso — textos de UI que afirmam o contrário precisarão ser corrigidos na implementação. Entidades fora da espinha (sessão, questão, tentativa, revisão, avaliação) continuam sem schema até o card MVP correspondente ser implementado; histórico de notas e entidade de usuário permanecem decisões futuras, não deste Gate.

### Related

Quest: Card TEC-02 — Desenhar o modelo de dados (ATLAS-RAF-GATE-20261006-DATAMODEL)

Supersedes: NONE

Superseded by: NONE

---

## DEC-011 — Backup e restauração: dump remoto D1 + cópia R2 no mesmo passo, destino fora da conta, disparo manual

Status: ACCEPTED

Date: 2026-10-07

### Context

QUEST-010 exige uma forma, mesmo manual/documentada, de gerar backup dos dados de produção e restaurá-los em caso de perda, testada ao menos uma vez. Produção é o único ambiente remoto (DEC-009): D1 `atlas-notes-own` e o bucket R2 de anexos (DEC-008). Hoje não existe nenhuma rotina de backup: `scripts/export-data.mjs` cobre só notas/pastas via API, não cobre anexos, estado pedagógico, evidências nem auditoria (DEC-010); `scripts/seed-notes.mjs` não restaura conteúdo estruturado nem pastas; não há Cron Trigger no Worker. D1 Time Travel e dump via `wrangler d1 export` são nativos da plataforma; R2 não tem versionamento nativo. DEC-08 (produto) exige exclusão de dados em até 3 dias, incluindo notas privadas gravadas em texto no D1.

### Decision

Backup manual, disparado pelo usuário, cobrindo D1 e R2 na mesma execução, para que as duas cópias representem o mesmo instante. D1 é copiado por dump SQL remoto completo (`wrangler d1 export --remote` ou export nativo equivalente) — não por D1 Time Travel isolado, não por export de aplicação tabela-a-tabela. Bytes do R2 são copiados para o mesmo destino do dump do D1, na mesma execução — não para um segundo bucket na mesma conta Cloudflare. O destino do backup fica fora da conta Cloudflare que hospeda produção. Retenção das cópias é limitada/rotativa, nunca indefinida. A restauração de teste exigida pelo critério de aceite é executada no D1/R2 locais do Miniflare (dev, DEC-009), nunca em produção.

### Rationale

1. O requisito aceita explicitamente backup manual/documentado, e o QUEST-010 já trata deploy automático como non-goal; backup automático (Cron Trigger) resolveria um problema não exigido, com infraestrutura nova desnecessária.
2. Dump SQL remoto completo captura todas as tabelas do D1 (incluindo estado/auditoria do DEC-010) num comando nativo único, sem exigir manter um caminho de export/restore de aplicação sincronizado com cada migration futura; D1 Time Travel isolado não produz cópia fora da conta, não atendendo ao requisito de proteção contra perda do próprio ambiente/conta.
3. DEC-08 compromete exclusão de dados do usuário em até 3 dias; retenção de backup indefinida violaria esse compromisso para qualquer dado capturado numa cópia — retenção limitada é a menor restrição que preserva DEC-08 sem reabri-lo.

### Constraints for Claude Code

- Backup permanece processo manual; nenhum Cron Trigger/Worker agendado é criado para este Gate.
- D1: dump SQL remoto completo via `wrangler d1 export --remote` (ou export nativo equivalente); D1 Time Travel não substitui essa cópia; nenhum export de aplicação tabela-a-tabela como mecanismo primário.
- R2: bytes copiados para o mesmo destino do dump do D1, na mesma execução; nenhum segundo bucket R2 criado na conta de produção como destino de backup.
- Destino do backup sempre fora da conta Cloudflare de produção.
- Credenciais do processo seguem a regra do DEC-009: explícitas a cada execução, nunca default, nunca em `.dev.vars` ou arquivo versionável.
- Retenção limitada/rotativa, nunca indefinida, compatível com a exclusão em 3 dias do DEC-08; quantidade exata é detalhe de implementação.
- Restauração de teste só no D1/R2 locais do Miniflare; nunca em produção.
- Nome de scripts, flags, formato de arquivo de dump e cadência exata são detalhe de implementação.

### Consequences

Fecha o último item do QUEST-010 (os 4 Gates de infraestrutura de usuário único ficam todos resolvidos: DEC-007, DEC-008, DEC-009, DEC-011). Nenhuma mudança em DEC-007/008/009/010; a restrição de retenção limitada passa a se aplicar também a qualquer cópia de dados de usuário gerada por este processo, não só ao D1/R2 de produção em si.

### Related

Quest: QUEST-010 — Infraestrutura restante do usuário único, item 4: backup (ATLAS-RAF-GATE-20261007-BACKUP)

Supersedes: NONE

Superseded by: NONE

---

## DEC-012 — Histórico de notas: snapshot integral por gravação, só conteúdo, retenção limitada

Status: ACCEPTED

Date: 2026-10-07

### Context

Card MVP-03 pede o item "Histórico" (versionamento de notas), deixado explicitamente fora do modelo canônico pelo DEC-010 ("decidido quando o MVP-03 for retomado"). Hoje `atlas_notes` guarda só o estado atual: `saveNote` sobrescreve `title`/`body`/`content_json`/`folder_id`/`is_private` a cada gravação (`INSERT ... ON CONFLICT DO UPDATE`), sem preservar nada da versão anterior. O conteúdo estruturado vive no envelope versionado do DEC-001 (limite 1 MiB estruturado); anexos (DEC-008) têm ciclo de vida próprio em R2+D1; notas privadas (`is_private`) ficam em texto no D1 e DEC-08 compromete exclusão de dados em até 3 dias. O card não especifica o comportamento observável do histórico (visualizar, comparar, restaurar) — isso permanece decisão de produto do Atlas.

### Decision

Uma versão é um snapshot integral (título, `body`, `content_json` com o envelope exatamente como persistido) guardado em nova tabela no D1, criado a cada gravação explícita da nota (mesmo evento que hoje dispara `saveNote`). O escopo da versão é só conteúdo — pasta, privacidade, vínculos e anexos não são versionados. A retenção deve ser limitada (por quantidade e/ou idade), nunca ilimitada, e nunca pode reter versão de nota privada além do compromisso de exclusão em 3 dias do DEC-08. O comportamento observável do histórico (visualizar, comparar, restaurar, e a semântica exata de uma eventual restauração) não é decidido por este Gate — permanece decisão de produto do Atlas, ainda pendente.

### Rationale

1. Snapshot integral preserva o envelope original do DEC-001 sem acoplar o histórico à evolução do formato (diff) e sem criar um segundo local de consistência D1↔R2 para um dado que já cabe numa linha do D1 dentro do limite de 1 MiB do próprio DEC-001.
2. Versionar a cada gravação explícita reaproveita o único evento de escrita já existente hoje, sem inventar regra de agrupamento nem nova interação de produto.
3. DEC-08 já compromete exclusão de dados em até 3 dias; retenção ilimitada de versões de nota privada reabriria esse compromisso — o piso "limitada, nunca ilimitada" é necessário independente de o número exato ainda depender de definição de produto.

### Constraints for Claude Code

- Nova tabela no D1 com snapshots integrais (título, `body`, `content_json` tal como persistido, sem reescrita de envelope na captura); nenhum diff/patch, nenhum objeto R2.
- Versão criada no mesmo evento de `saveNote`; nenhuma heurística de agrupamento por tempo/sessão nesta decisão; cadência a revisitar se auto-save for reintroduzido.
- Escopo = título + `body` + `content_json` apenas; pasta, `is_private`, vínculos e anexos fora do escopo da versão.
- Retenção limitada (quantidade e/ou idade), nunca ilimitada; nunca além do compromisso de 3 dias do DEC-08 para notas privadas; número exato depende de definição de produto do Atlas sobre o comportamento observável do histórico.
- Nenhuma rota de restauração/reversão de versão implementada até o Atlas definir o comportamento observável do histórico.
- Tabela de versões passa a integrar o escopo de dados do Gate 4 (backup), quando resolvido.
- Nome de tabela/colunas, índices e ordem de migration são detalhe de implementação.

### Consequences

Destrava o item "Histórico" do card MVP-03 para implementação da camada de persistência (captura de snapshot a cada gravação), mas não autoriza ainda a implementação de UI de histórico (listar/visualizar/comparar/restaurar), que depende de definição de produto do Atlas. Aumenta o volume de dados do D1 proporcionalmente ao número de gravações, mitigado pelo piso de retenção limitada exigido aqui. Nenhuma mudança em DEC-001, DEC-008 ou DEC-010.

### Related

Quest: Card MVP-03 — Implementar Atlas Notes, item "Histórico" (ATLAS-RAF-GATE-20261007-NOTEHISTORY)

Supersedes: NONE

Superseded by: NONE
