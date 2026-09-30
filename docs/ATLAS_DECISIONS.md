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
