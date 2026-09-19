# ATLAS PROJECT — ACTIVE QUEST

## Purpose

This file contains the current active Task Contract for Atlas development.

It is the operational source of truth for the task currently being implemented.

Atlas defines the product requirement.

Claude Code implements the requirement.

Hermes reads this same requirement only when an Architecture Gate is triggered.

The active quest must remain concise and focused on observable requirements.

Do not use this file as a development diary.

Do not accumulate completed quests here.

---

# ACTIVE QUEST

## Quest

QUEST-007 — Finalizar UX-03: página Notas (pastas, mapa de cobertura, anexos, indicação de conteúdo privado)

## Priority

P0

## Complexity

MEDIUM

## Hermes Gate

NO — a menos que uma mudança real de arquitetura/schema necessária seja identificada; se identificada, a implementação para antes de prosseguir (ver Non-Goals).

---

## Contexto

O card UX-03 do quadro kanban ("Desenhar a página Notas") está ~75% concluído. Já implementado e testado (QUEST-003/004/005/006, ver docs/ATLAS_STATUS.md e docs/archive/): editor rico (Tiptap), salvamento automático, busca, filtros, ordenação, bloco de notas recentes, favoritos e vínculo com o catálogo de conteúdo (lib/content-catalog.ts). Componente principal: components/notes-workspace.tsx (+ notes-editor.tsx, notes-panel-filters.ts, notes-recent-list.ts).

Faltam 4 itens do checklist original de UX-03, todos no nível de **experiência visual** (esta lista do kanban é sobre UX/UI demonstrativa — não sobre persistência real de backend além do já usado por atlasNotes/atlasNoteLinks, que pertence aos cards TEC-02/TEC-04/TEC-05/MVP-03):

1. Árvore de pastas para organizar notas;
2. Mapa de cobertura (visualizar quanto do conteúdo do catálogo está coberto por notas);
3. Anexos (representação visual de anexos na nota, reaproveitando o primitivo já existente em components/ui/attachment.tsx);
4. Indicação visual de conteúdo privado.

## Objective

Fechar os 4 itens pendentes do checklist de UX-03 ao nível de experiência visual/demonstrativa, seguindo o mesmo padrão já usado no restante do painel de Notas (reaproveitar `.note-list-item` e classes existentes, lógica pura extraída em módulos testáveis como `notes-panel-filters.ts`).

## Required Behavior

- usuário pode organizar notas em pastas (criar pasta, mover nota para pasta, ver notas dentro de uma pasta, ver notas sem pasta);
- existe uma visualização (mesmo que simples) mostrando quanto do catálogo de conteúdo (lib/content-catalog.ts) está coberto por pelo menos uma nota vinculada — não precisa ser um cálculo pedagógico real (isso é MVP-07/TEC-02, fora de escopo), apenas a razão simples "conteúdos com nota vinculada / total de conteúdos", por assunto;
- é possível anexar uma referência de arquivo a uma nota e vê-la listada na nota (usar components/ui/attachment.tsx como base visual; NÃO implementar upload real para storage — isso é TEC-05, ainda 0% e fora de escopo desta quest; se simulado, deixar claro no código e na UI que é demonstrativo, sem prometer persistência real de arquivo);
- notas marcadas como privadas exibem um indicador visual claro (ícone/badge) na lista e no editor.

## Acceptance Criteria

- [x] pastas: criar, renomear, mover nota entre pastas e "sem pasta" funcionam e persistem entre reloads (via API/D1, seguindo o padrão já usado por atlasNotes/atlasNoteLinks em db/schema.ts) — validado com teste automatizado (lógica pura, sem DOM: 6 casos novos em `notes-panel-filters.test.ts` cobrindo o filtro por pasta, incluindo o sentinel "sem pasta" e a combinação AND com o filtro de conteúdo vinculado) e manualmente no navegador real: criei 2 pastas, renomeei uma delas, movi uma nota entre pastas via o seletor do editor + Salvar, e confirmei por `curl` direto na API que `folderId` e o nome renomeado sobreviveram a uma releitura de `/api/notes` e `/api/notes/folders` (equivalente a um reload) — ver Implementation Notes para o detalhe de onde a persistência acontece;
- [x] mapa de cobertura mostra a proporção correta e atualiza quando uma nota é criada/vinculada/desvinculada de um conteúdo — validado com teste automatizado (10 casos em `notes-coverage.test.ts`, incluindo catálogo vazio, notas vazias, duplicidade de vínculo não inflar contagem, e a atualização ao ganhar/perder um vínculo) e manualmente: com 1 nota vinculada a `CG-001`, o painel "Cobertura" mostrou corretamente 1/157 no total e 1/40 em "Contabilidade Geral" com a barra proporcional;
- [x] anexos: adicionar/remover referência de anexo numa nota e vê-la listada, com clareza visual de que é uma representação demonstrativa (sem persistência de arquivo real) — validado manualmente: selecionei um arquivo real pelo seletor de arquivos do navegador, confirmei que nome e tamanho aparecem listados com o selo "Demonstrativo — sem upload real" e o aviso explicando que o arquivo não é enviado nem salvo, removi o anexo pelo botão (X) e confirmei que a lista esvazia; note o **escopo decidido** documentado em Implementation Notes;
- [x] indicação de conteúdo privado aparece consistentemente na lista de notas e no editor quando a nota está marcada como privada — validado manualmente: ativei "Marcar como privada" no editor, salvei, e o ícone de cadeado apareceu tanto em "Notas recentes" quanto no painel "Todas as notas", em telas largas e em 380px;
- [x] nenhuma regressão nos testes existentes (`pnpm run test:notes`) — a suíte já estava em 91 testes (não 65 — número desatualizado no card do kanban; confirmado com `git stash -u` + rebuild limpo do `.notes-spike-dist` antes desta quest) e passa em 107/107 depois (91 herdados, sem nenhuma alteração, + 16 novos: 6 casos de filtro por pasta em `notes-panel-filters.test.ts` e 10 em `notes-coverage.test.ts`);
- [x] `pnpm run typecheck` limpo;
- [x] `pnpm run lint` sem novos erros introduzidos — comparei a lista de erros antes/depois por arquivo:linha; a única variação foi o achado pré-existente `Date.now()` em `notes-workspace.tsx` (já registrado nas quests anteriores) mudando de número de linha por causa do código inserido acima dele — mesmo código, não uma regressão nova;
- [x] responsivo (sem quebrar em ~380px), seguindo o mesmo padrão já validado no painel "Todas as notas" (QUEST-006) — validado com Playwright em viewport 380×820: `document.documentElement.scrollWidth === clientWidth` (sem overflow horizontal) nos 4 estados (índice, painel Pastas, painel Cobertura, editor com nota privada+pasta+anexo abertos).

## UX Constraints

- reaproveitar o padrão visual já existente (`.note-list-item`, cores e tokens de app/globals.css, componentes de components/ui/) — não introduzir um novo sistema de estilo;
- pastas e mapa de cobertura devem caber na estrutura atual da página Notas (coluna esquerda / editor central / painel "Todas as notas") sem redesenhar o layout inteiro.

## Non-Goals

- NÃO implementar upload/storage real de anexos (isso é TEC-05, bloqueado, fora de escopo);
- NÃO implementar a política de privacidade completa nem decidir o que a IA pode ou não acessar (isso é DEC-08, decisão de produto em aberto) — apenas o indicador visual de uma nota já marcada como privada, mais o campo mínimo (`isPrivate`) necessário para marcá-la, sem regras de acesso além disso;
- NÃO tocar em UX-01, UX-02, UX-04 a UX-08, nem em nenhum card TEC-*/MVP-* além do estritamente necessário para os 4 itens acima;
- NÃO refatorar partes do editor/workspace que já funcionam e não estão no escopo desta quest.

## Dependencies

- QUEST-003/004/005/006 (já concluídas — esta quest constrói sobre elas);
- TEC-05 (armazenamento de anexos) — bloqueia persistência real de arquivo, não bloqueia a representação visual demonstrativa pedida aqui;
- DEC-08 (escopo de privacidade do MVP) — bloqueia a política de acesso, não bloqueia o indicador visual simples.

## Complexity Budget

Architecture: LIMITED (novas colunas/tabela simples em db/schema.ts para pastas e para o campo isPrivate; nenhuma mudança maior)

Hermes: 0

Documentation: UPDATE EXISTING (docs/quests/ACTIVE.md ao final, seguindo o mesmo padrão das quests anteriores)

Refactor: RELATED CODE ONLY (components/notes-workspace.tsx e módulos irmãos)

Dependencies: NONE unless technically required

## Validation

- `pnpm run test:notes` (suíte completa, sem regressão);
- `pnpm run typecheck`;
- `pnpm run lint`;
- validação manual no navegador real (`pnpm run dev`) de cada um dos 4 itens, incluindo estados vazio/poucos/muitos dados e viewport estreito;
- revisão do diff final antes de considerar concluído.

---

## Implementation Notes

Decisões tomadas:

- **Schema (Architecture: LIMITED, conforme previsto)**: nova tabela `atlas_note_folders` (id, name, createdAt, updatedAt) e duas colunas novas em `atlas_notes`: `folder_id` (nullable, FK para `atlas_note_folders.id` com `onDelete: 'set null'` — uma nota nunca fica "presa" a uma pasta apagada) e `is_private` (boolean, default false). Migração gerada via `drizzle-kit generate` (`drizzle/0003_little_amazoness.sql`) e aplicada localmente via `pnpm run db:migrate:local`, mesmo fluxo já usado nas migrações anteriores do projeto — nenhuma mudança de arquitetura além do que o Complexity Budget já previa, então nenhuma consulta a Hermes foi necessária;
- **Persistência de pastas via endpoint próprio, não via `/api/notes`**: o Task Contract pede que a persistência siga "o padrão já usado por atlasNotes/atlasNoteLinks em db/schema.ts" (ou seja, D1 via API), mas pastas são uma entidade própria (CRUD independente de notas), então criei `app/api/notes/folders` (GET lista, POST cria, PATCH renomeia) em vez de sobrecarregar o endpoint de notas existente. **Interpretação sinalizada para revisão** (mesmo padrão de transparência usado na QUEST-006): entendi "via API/D1, seguindo o padrão" como "persistir de verdade no D1 através de uma rota de API", não como "literalmente a mesma URL `/api/notes`". Mover uma nota entre pastas ou marcá-la como privada, por outro lado, usa o `/api/notes` existente (o `PUT`/`POST` de salvar já aceita `folderId`/`isPrivate` no corpo) — isso evitou criar um caminho de escrita paralelo para um campo que já faz parte do "salvar a nota";
- **Exclusão de pasta não foi implementada**: o Required Behavior e os Acceptance Criteria pedem criar, renomear, mover nota e ver "sem pasta" — nenhum deles pede apagar uma pasta. Para manter a mudança no tamanho do que foi pedido (`AGENTS.md`: "não expandir escopo sem justificativa"), não adicionei exclusão. **Correção aplicada nesta mesma branch, antes do push**: a revisão externa do pacote QUEST-007 encontrou uma divergência entre a intenção declarada em `db/schema.ts` (`onDelete: 'set null'`) e o SQL de fato gerado em `drizzle/0003_little_amazoness.sql` — o `ALTER TABLE ... ADD folder_id ... REFERENCES atlas_note_folders(id)` não carregava a cláusula `ON DELETE SET NULL`, então, em vez de zerar `folder_id`, apagar uma pasta referenciada lançava `FOREIGN KEY constraint failed`. Reproduzi o bug com `better-sqlite3` (`PRAGMA foreign_keys = ON` + a DDL exata do arquivo), corrigi a migração para `... REFERENCES atlas_note_folders(id) ON DELETE SET NULL`, resetei o D1 local (`.wrangler/state/v3/d1`) e reapliquei as 4 migrações do zero, e confirmei com `drizzle-kit generate` que `schema.ts`/snapshot/SQL aplicado convergem ("No schema changes, nothing to migrate"). Validado empiricamente contra o D1 local recriado: criei uma pasta e uma nota vinculada pela API real, apaguei a pasta direto via SQL (`DELETE FROM atlas_note_folders`) e confirmei que `folder_id` da nota virou `NULL` em vez de lançar erro de FK. Suíte de testes (107/107), typecheck e lint re-executados sem regressão depois da correção;
- **Anexos são efêmeros por decisão, não por limitação técnica** — **ambiguidade sinalizada para revisão**: o Task Contract deixa claro que upload real está fora de escopo, mas não diz explicitamente se a referência (nome do arquivo) deve sobreviver a um reload. Optei por mantê-la só em memória, por nota aberta no editor (reseta ao trocar de nota ou recarregar a página), por dois motivos: (1) nenhum Acceptance Criterion pede persistência entre reloads para anexos — só para pastas e privacidade, que têm coluna de schema explícita nesta quest; (2) o efêmero reforça visualmente que não é uma persistência real, em vez de um metadado "meio persistido" que poderia confundir o usuário sobre o que exatamente foi salvo. Se o comportamento esperado for "nome do anexo persiste entre reloads, mas o arquivo em si não", isso exigiria uma nova coluna (`attachments_json` ou tabela própria) — uma decisão de escopo que não estava clara no contrato, então não a tomei sozinho;
- **Mapa de cobertura**: função pura `computeContentCoverage`/`computeOverallCoverage` em `components/notes-coverage.ts`, mesmo padrão de `notes-panel-filters.ts` — calcula, por assunto do catálogo (`lib/content-catalog.ts`), quantos conteúdos têm pelo menos uma nota com `links` apontando para o `id` deles. É a proporção simples pedida no Task Contract, não o cálculo pedagógico real (MVP-07/TEC-02, fora de escopo, como o contrato já explicita);
- **Filtro de pasta reaproveita `notes-panel-filters.ts`**: adicionei `folderId` opcional a `NotesPanelNote` e um sentinel exportado `NO_FOLDER_FILTER` para representar "sem pasta" sem colidir com `''` ("todas as pastas") ou com qualquer id real — mesma técnica que já existia para o filtro de conteúdo vinculado, só estendida;
- **UI**: o botão único "Favoritos" da coluna esquerda virou uma linha de 3 botões (Favoritos | Pastas | Cobertura) que abrem o mesmo tipo de painel (`.favorites-panel`/`.favorites-back`/`.favorites-heading`, reaproveitados sem mudança de estrutura) — nenhum sistema de estilo novo, conforme a UX Constraint. O painel "Pastas" também serve para navegar (clicar numa pasta filtra o painel "Todas as notas" por ela, incluindo "Sem pasta"), evitando duplicar a renderização de lista de notas que já existe lá embaixo. Pasta e privacidade da nota aberta são editadas na linha de ferramentas do editor (seletor de pasta + pill de privacidade, ao lado do `sync-pill` já existente) e só persistem quando o usuário clica "Salvar nota" — mesmo modelo que título/corpo já seguem, sem um caminho de salvamento paralelo.

Realizado nesta sessão:

- suíte automatizada: 107/107 testes passando (91 herdados — suíte já estava nesse número antes desta quest, não 65 como o card do kanban dizia — mais 16 novos: 6 de filtro por pasta em `notes-panel-filters.test.ts`, 10 de cobertura em `notes-coverage.test.ts`);
- `pnpm run typecheck` limpo;
- `pnpm run lint`: nenhum erro novo (comparei a lista de erros antes/depois por arquivo:linha; a única diferença foi o achado pré-existente de `Date.now()` em `notes-workspace.tsx` mudando de número de linha por causa do código inserido acima — mesmo código, já registrado nas quests anteriores, não uma regressão nova);
- validação manual em navegador real (`pnpm run dev` + D1 local migrado) com Playwright, cobrindo os 4 itens: criei 2 pastas, renomeei uma, movi uma nota entre pastas e confirmei via API que persiste; abri o painel de cobertura com 1 nota vinculada e confirmi a proporção 1/157 (1/40 em Contabilidade Geral); anexei um arquivo real pelo seletor de arquivo do navegador, vi nome+tamanho listados com o aviso demonstrativo, e removi; marquei uma nota como privada e vi o cadeado em "Notas recentes" e em "Todas as notas". Repeti as mesmas interações em viewport 380×820 e confirmei `scrollWidth === clientWidth` (sem overflow horizontal) em todos os estados;
- validação da API por `curl`, incluindo os casos de erro: `folderId` inexistente ao salvar uma nota retorna 400 "Pasta não encontrada.", nome de pasta vazio ao criar retorna 400 "Dê um nome à pasta.".

PENDENTE (não descartado):

- exclusão de pasta não foi implementada (ver Implementation Notes acima — não estava nos Acceptance Criteria);
- anexos não persistem entre reloads por decisão deliberada, sinalizada acima para confirmação — se o comportamento esperado for outro, é uma mudança pequena e isolada (nova coluna + wiring no mesmo padrão de `folderId`/`isPrivate`);
- a rota de pastas ficou em `app/api/notes/folders` (não em `/api/notes`) — interpretação sinalizada acima para confirmação;
- nenhum push ou PR foi feito para esta quest ainda, aguardando instrução.

---

# USAGE RULES

When a new development quest begins, Atlas should replace the ACTIVE QUEST section with the current Task Contract.

Claude Code should use this file as the primary product specification for implementation.

Claude Code must not reinterpret explicit observable requirements without approval.

If the task is classified as SMALL, Hermes should normally not be involved.

If Claude Code discovers a real Architecture Gate, the original requirement in this file must remain the common reference for both Claude Code and Hermes.

When the quest is complete:

1. validate the acceptance criteria;

2. archive the quest if historical retention is useful;

3. reset this file before the next active quest.

This file should contain only one active quest at a time.
