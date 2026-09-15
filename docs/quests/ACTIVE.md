\# ATLAS PROJECT — ACTIVE QUEST



\## Purpose



This file contains the current active Task Contract for Atlas development.



It is the operational source of truth for the task currently being implemented.



Atlas defines the product requirement.



Claude Code implements the requirement.



Hermes reads this same requirement only when an Architecture Gate is triggered.



The active quest must remain concise and focused on observable requirements.



Do not use this file as a development diary.



Do not accumulate completed quests here.



\---



\# ACTIVE QUEST



\## Quest



QUEST-006 — Atlas Notes: painel "Todas as notas" com filtros e busca



\## Priority



P1



\## Complexity



MEDIUM



\## Hermes Gate



NO



\---



\## Objective



Criar um painel full-width abaixo da grade de notas (recentes/editor/vínculos) com a navegação completa por todas as notas, incluindo busca por título, conteúdo e texto incluído, e filtros por conteúdo vinculado e por ordenação. A coluna esquerda deixa de mostrar a lista completa/busca que existia — passa a mostrar só o bloco "Notas recentes" (sem mudança nele), já que a navegação completa migra inteiramente para o painel novo.



\---



\## Required Behavior



\- painel novo, abaixo da grade de 3 colunas, listando todas as notas do usuário;

\- campo de busca que encontra notas por título, corpo do texto, ou texto incluído na nota;

\- filtro por conteúdo vinculado (nota tem vínculo com X do catálogo);

\- ordenação por data (mais recente/mais antiga) e por título (A-Z / Z-A);

\- clicar numa nota do painel abre ela no editor central, como já acontece na lista atual;

\- a coluna esquerda mantém só o bloco "Notas recentes" — a busca e a lista completa que existiam ali (abaixo dele) são removidas dessa coluna.



\---



\## Acceptance Criteria



\- \[x\] busca encontra notas por título, corpo e texto incluído — validado automaticamente (12 testes novos em `notes-panel-filters.test.ts`) e manualmente em navegador real com 6 notas reais (5 semeadas nesta sessão + 1 pré-existente): busca por "Equacao" achou só pelo título; busca por "IRPJ" (presente só no corpo, não no título) achou a nota certa; busca por "Patrimônio Líquido" e por "CG-001" (nem no título nem no corpo da nota, só no conteúdo vinculado) achou a nota certa nos dois casos. \*\*Decisão de interpretação, sinalizada aqui para revisão\*\*: o Task Contract lista três alvos de busca (título, corpo, "texto incluído na nota") mas o corpo (`body`) já é a projeção textual de todo o conteúdo visível da nota (parágrafos, listas, tabelas, citações, notas de rodapé — ver `projectCanonicalContent` em `lib/atlas-notes-document.ts`), então um terceiro alvo redundante com o corpo não faria sentido. Interpretei "texto incluído na nota" como o texto do conteúdo do catálogo vinculado à nota (`contentTitle`/`contentId` de `note.links`) — ou seja, buscar por um termo que aparece no conteúdo oficial vinculado, mesmo que esse termo não apareça literalmente no título ou corpo da nota. Se essa não for a leitura pretendida, é uma mudança pequena e isolada em `matchesNotesPanelSearch` (`components/notes-panel-filters.ts`);

\- \[x\] cada filtro (conteúdo vinculado, data, título) funciona isoladamente e em combinação — validado automaticamente (testes de `applyNotesPanelFilters` cobrindo filtro isolado, busca+filtro combinados como E lógico — não OU —, e busca+filtro+ordenação juntos) e manualmente: filtro por um conteúdo vinculado isolado retornou só as notas certas; filtro + busca combinados retornaram a interseção correta (não a união); os 4 modos de ordenação (`date-desc`, `date-asc`, `title-asc`, `title-desc`) foram testados e confirmados como exato espelho um do outro onde esperado (`date-asc` é o reverso exato de `date-desc`, `title-desc` o reverso exato de `title-asc`) e como ordem alfabética real via comparação programática das listas;

\- \[x\] abrir uma nota pelo painel funciona igual ao comportamento já existente — validado manualmente: cliquei num item do painel novo e confirmei que o campo de título do editor passou a mostrar exatamente esse título e que o próprio item ficou destacado como ativo no painel — mesmo `openNote()` já usado pela lista antiga e pelo bloco de recentes, sem duplicação de lógica;

\- \[x\] painel funciona com zero, poucas e muitas notas — validado manualmente com poucas notas (6) cobrindo busca sem resultado nenhum (estado vazio apareceu corretamente, sem erros no console). \*\*Ressalva honesta\*\*: o caso de zero notas no banco \*não\* foi validado ao vivo nesta sessão — a rotina de limpar o D1 local (`DELETE FROM atlas_notes`) foi bloqueada pelo classificador de destruição irreversível do ambiente sandbox, e optei por não insistir em contornar esse bloqueio. Validei esse caso por leitura de código em vez disso: `filteredAllNotes` é derivado de `applyNotesPanelFilters(notes, ...)`, que sobre um array vazio retorna `[]` incondicionalmente (mesmo caminho de código já exercitado ao vivo pelo teste de busca-sem-resultado acima, que também produz uma lista filtrada vazia), então o painel cai no mesmo ramo `.notes-empty` já visualmente confirmado; e `linkedContentOptions`, derivado de `notes.flatMap`, retorna `[]` da mesma forma, deixando o filtro só com a opção "Todos". Não é o mesmo nível de confiança de um teste ao vivo contra o banco — registrando isso explicitamente em vez de marcar como validado sem ressalva;

\- \[x\] responsivo em tela estreita (filtros não quebram o layout) — validado manualmente em viewport de 380px: sem overflow horizontal da página (`scrollWidth` = `clientWidth`), os três controles (busca, filtro de conteúdo vinculado, ordenação) empilham verticalmente em vez de comprimir lado a lado, e a lista de notas do painel cai para uma coluna;

\- \[x\] coluna esquerda, após a mudança, mostra só Favoritos + Notas recentes — sem busca/lista antigas — e sem regressão em nenhum dos dois blocos — validado manualmente: inspeção do DOM confirmou que `.notes-index` (a coluna esquerda) agora só tem três filhos no ramo sem o painel de Favoritos aberto (botão Favoritos, bloco Notas recentes, rodapé do catálogo oficial — este último não fazia parte do que o Task Contract pediu para remover, então foi mantido); o bloco de Notas recentes continua funcionando exatamente como na QUEST-004 (mesmo componente, não tocado); o painel de Favoritos (QUEST-005) não foi alterado.



\---



\## UX Constraints



\- reaproveitar o padrão visual de item de lista já existente (`.note-list-item` e equivalentes) — feito: o painel novo usa exatamente a mesma classe/estrutura da lista antiga e do bloco de recentes, só reorganizada num grid multi-coluna via CSS quando há espaço horizontal;

\- filtros com comportamento acessível em telas menores (podem virar menu suspenso) — implementado como empilhamento vertical simples via `flex-wrap`/media query, não como um menu suspenso à parte: os dois filtros já são `<select>` nativos (que o próprio navegador já abre como um menu suspenso em telas pequenas), então não havia necessidade de construir um componente de menu adicional para atender ao requisito.



\---



\## Non-Goals



\- não introduzir paginação server-side nesta quest — não foi necessária: o painel busca a lista completa de notas uma única vez (mesma chamada `GET /api/notes` que já existia) e filtra/ordena inteiramente no cliente, o que é suficiente no volume de notas testado e evita adicionar parâmetros novos ao endpoint.



\---



\## Dependencies



\- QUEST-004 (Notas recentes) — concluída; esta quest assume o bloco "Notas recentes" já existente na coluna esquerda e apenas remove o que estava abaixo dele — confirmado: `components/notes-recent-list.ts` e a lógica de `bumpRecentNote`/`loadRecentNotes` em `notes-workspace.tsx` não foram tocados;

\- endpoint `/api/notes` já existente (`q=` de busca) — a filtragem acabou sendo feita no cliente sobre a lista já carregada (ver Non-Goals), então o parâmetro `q=` do servidor ficou sem uso pelo cliente novo (continua existindo no endpoint, sem motivo para removê-lo — não é código morto, é uma capacidade do endpoint que simplesmente não é mais exercitada por este componente);

\- IMPORTANTE: nem a PR #1 (QUEST-005) nem a PR #2 (QUEST-004) foram mergeadas em `main` até o momento em que esta quest começou. A branch desta quest (`claude/quest-006-todas-notas`) foi criada a partir da ponta de `claude/quest-004-notas-recentes` (commit `319c686`), por ser a branch mais recente com todo o layout de que esta quest depende (botão Favoritos da QUEST-005 + bloco Notas recentes da QUEST-004). Nenhum push ou PR foi aberto para esta quest ainda — aguardando instrução, seguindo o mesmo padrão das quests anteriores.



\---



\## Complexity Budget



Architecture: LIMITED (nenhuma mudança de schema/persistência; filtragem e ordenação inteiramente client-side sobre dados já existentes)



Hermes: 0



Documentation: NONE



Refactor: RELATED CODE ONLY (`components/notes-workspace.tsx`; a remoção do parâmetro de busca (`search`) do efeito de carregamento de `notes` também simplificou o workaround `showFavorites ? '' : search` da QUEST-005 — como a busca antiga deixou de existir neste arquivo, `notes` passa a ser sempre a lista completa não filtrada para todo mundo que a consome (Favoritos, nota selecionada, painel novo), o que elimina de raiz a classe de bug da QUEST-005 nº2, não só o sintoma que já tinha sido corrigido lá)



Dependencies: NONE unless technically required — nenhuma dependência nova foi adicionada.



\---



\## Validation



\- validação manual no navegador de busca e cada filtro — feita, ver Acceptance Criteria acima para o detalhe de cada cenário;

\- revisão do diff final antes de considerar concluído — pendente de revisão externa, como nas quests anteriores.



\---



\## Implementation Notes



Decisões tomadas:



\- toda a lógica de busca/filtro/ordenação foi extraída para um módulo puro novo, `components/notes-panel-filters.ts` (`matchesNotesPanelSearch`, `sortNotesPanel`, `applyNotesPanelFilters`), seguindo o mesmo padrão já usado por `notes-editor-list-guard.ts` e `notes-recent-list.ts` — lógica testável por `node --test` sem DOM/jsdom, sem tocar o componente React para testar as regras de negócio;

\- a busca é E lógico (AND) com o filtro de conteúdo vinculado, não OU — uma nota só aparece se satisfizer os dois ao mesmo tempo quando ambos estão ativos; validado explicitamente por teste automatizado e manualmente (ver Acceptance Criteria);

\- as opções do filtro "Conteúdo vinculado" são derivadas dinamicamente das notas que já existem (`note.links`), não do catálogo oficial inteiro (`content-catalog.ts`) — evita listar dezenas de itens do catálogo que nenhuma nota usa, e mantém o filtro sempre relevante ao conjunto de notas real;

\- o carregamento de `notes` deixou de depender de um parâmetro de busca (`loadNotes()` agora sempre busca a lista completa, sem debounce): antes, um workaround da QUEST-005 (`effectiveQuery = showFavorites ? '' : search`) existia só para evitar que a busca da coluna esquerda escondesse favoritos; como essa busca não existe mais nesta coluna, o workaround inteiro foi removido — mudança tratada como "Refactor: RELATED CODE ONLY" (mesmo arquivo, consequência direta de remover a busca antiga, não um retoque à parte);

\- a lista do painel novo reaproveita a mesma marcação/classe `.note-list-item` da lista antiga (mesmo ícone, título, trecho do corpo, data e contagem de vínculos por item) — só o container em volta mudou, de uma coluna estreita rolável para um grid `repeat(auto-fill, minmax(300px,1fr))` que aproveita a largura total do painel e cai para 1 coluna em telas estreitas.



Realizado nesta sessão:



\- suíte automatizada: 65/65 testes passando (53 herdados das QUEST-004/005, sem nenhuma alteração nos arquivos daquelas quests, mais 12 novos casos em `notes-panel-filters.test.ts`: busca por título/corpo/conteúdo vinculado, busca vazia, os 4 modos de ordenação, ordenação não destrutiva, filtro isolado, busca+filtro como E lógico, busca+filtro+ordenação combinados, e os valores default);

\- `pnpm run typecheck` limpo;

\- `pnpm run lint`: nenhum erro novo introduzido (o comando já falhava antes desta quest, com dezenas de erros pré-existentes em `components/ui/*`, `app/page.tsx`, `hooks/use-mobile.ts` e o mesmo achado pré-existente de `Date.now()` em `notes-workspace.tsx` já registrado na QUEST-004 — nada disso foi tocado ou piorado por esta quest);

\- validação manual em navegador real (`pnpm run dev` + D1 local migrado + 5 notas novas semeadas via API, cobrindo títulos/corpos/vínculos variados, além da nota já existente de sessões anteriores), cobrindo cada Acceptance Criteria acima (ver detalhes lá).



PENDENTE (não descartado):



\- caso de zero notas no banco: validado só por leitura de código, não ao vivo no navegador (ver Acceptance Criteria acima para o motivo exato — bloqueio do sandbox à limpeza do banco local, não uma omissão);

\- a interpretação de "texto incluído na nota" como busca sobre o conteúdo vinculado (não sobre outra coisa) é uma decisão que fiz sozinho diante de uma ambiguidade real no Task Contract — sinalizada explicitamente acima para confirmação, não escondida atrás de "concluído";

\- nenhum push ou PR foi feito para esta quest ainda, aguardando instrução.



\---



\# USAGE RULES



When a new development quest begins, Atlas should replace the ACTIVE QUEST section with the current Task Contract.



Claude Code should use this file as the primary product specification for implementation.



Claude Code must not reinterpret explicit observable requirements without approval.



If the task is classified as SMALL, Hermes should normally not be involved.



If Claude Code discovers a real Architecture Gate, the original requirement in this file must remain the common reference for both Claude Code and Hermes.



When the quest is complete:



1\. validate the acceptance criteria;



2\. archive the quest if historical retention is useful;



3\. reset this file before the next active quest.



This file should contain only one active quest at a time.
