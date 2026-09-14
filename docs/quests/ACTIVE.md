\# ATLAS PROJECT — ACTIVE QUEST



\## Purpose



This file contains the current active Task Contract for Atlas development.



It is the operational source of truth for the task currently being implemented.



Atlas defines the product requirement.



Codex implements the requirement.



Hermes reads this same requirement only when an Architecture Gate is triggered.



The active quest must remain concise and focused on observable requirements.



Do not use this file as a development diary.



Do not accumulate completed quests here.



\---



\# ACTIVE QUEST



\## Quest



QUEST-004 — Atlas Notes: bloco de Notas recentes



\## Priority



P0 (frente ativa: finalizar Atlas Notes antes de outras páginas/backend)



\## Complexity



MEDIUM



\## Hermes Gate



CONDITIONAL — sem conflito arquitetural conhecido hoje, mas esta quest provavelmente exige um novo campo de persistência (ver Dependencies). Só acione Hermes se isso levantar uma questão arquitetural real (ex.: volume de escrita no D1 a cada abertura de nota) — não para aprovar rotineiramente uma coluna nova.



\---



\## Objective



Adicionar um bloco "Notas recentes" fixo na coluna esquerda do Atlas Notes, sempre visível, mostrando as 5 notas mais recentemente interagidas pelo usuário — onde "interagida" significa aberta OU editada/salva, prevalecendo sempre a ação mais recente entre as duas. Isso é diferente da lista principal de notas, que já ordena só por última edição salva: o bloco de recentes deve refletir também simples aberturas de leitura, sem exigir que o usuário tenha alterado nada.



\---



\## Required Behavior



\- Quando o painel de Favoritos NÃO está aberto, a coluna esquerda mostra, nesta ordem: botão Favoritos → bloco Notas recentes → busca → lista completa de notas;

\- o bloco mostra sempre as 5 notas com a interação mais recente;

\- abrir uma nota (só visualizar/entrar nela) conta como interação, mesmo sem editar nada;

\- editar e salvar uma nota também conta como interação;

\- entre abertura e edição da mesma nota, vale sempre o momento mais recente dos dois, não uma prioridade fixa de um sobre o outro;

\- clicar em um item do bloco abre a nota correspondente no editor, igual ao comportamento já existente da lista principal;

\- o bloco reflete o estado atual imediatamente após abrir ou salvar uma nota, sem precisar recarregar a página;

\- a ordem/composição do bloco sobrevive a um reload completo da página (não pode ser só estado em memória do cliente).



\---



\## Acceptance Criteria



\- \[x] bloco "Notas recentes" sempre visível na coluna esquerda, na posição descrita acima, quando o painel de Favoritos não está aberto — validado manualmente em navegador real: botão Favoritos → bloco Notas recentes → busca → lista completa, nessa ordem, confirmado via captura de tela e inspeção do DOM; o bloco some quando o painel de Favoritos é aberto (é renderizado no mesmo ramo condicional que busca/lista, que o painel de Favoritos substitui) e reaparece ao fechar o painel — ambos confirmados manualmente;

\- \[x] mostra as 5 notas mais recentemente interagidas (aberta OU editada/salva, o mais recente prevalece) — validado manualmente: abri as 5 notas existentes em uma ordem específica e confirmei que o bloco refletiu exatamente a ordem inversa (mais recentemente aberta primeiro); a semântica "o mais recente prevalece" é garantida no servidor por um `UPDATE`/`ON CONFLICT` incondicional de `last_interacted_at` tanto ao abrir quanto ao salvar (nunca uma comparação condicional), então a última ação em ordem real de chegada sempre vence — não há uma janela de decisão "abertura vs. edição" para acertar, cada ação simplesmente registra o momento em que aconteceu;

\- \[x] abrir uma nota sem editá-la conta como interação e reordena/inclui essa nota no bloco — validado automaticamente (teste do helper puro `mergeRecentInteraction`) e manualmente: abrir uma nota que não estava no bloco a trouxe para o topo imediatamente, sem editar nada;

\- \[x] editar e salvar uma nota conta como interação — validado manualmente: editei a nota que estava mais embaixo no bloco (a interagida há mais tempo) e, ao salvar, ela subiu para o topo;

\- \[x] clicar em um item do bloco abre a nota certa no editor — validado manualmente: cliquei no 3º item do bloco e confirmei que o campo de título do editor passou a mostrar exatamente esse título;

\- \[x] o bloco atualiza imediatamente após abrir/salvar, sem reload — validado manualmente em todos os cenários acima (nenhum deles envolveu recarregar a página) e também no caso extremo de criar a toda-primeira nota depois de zero notas: o bloco apareceu com 1 item imediatamente após salvar, sem reload;

\- \[x] a "última interação" persiste através de um reload completo da página — validado manualmente: após a sequência de aberturas/edições acima, recarreguei a página inteira e o bloco reapareceu na mesma ordem exata de antes do reload (comparação exata das duas listas de títulos);

\- \[x] com menos de 5 notas no total, o bloco mostra só as que existem; com zero notas, o bloco não aparece — validado manualmente nos dois extremos: com 2 notas no banco local, o bloco mostrou exatamente 2 itens (sem preenchimento artificial) e o layout não quebrou; com 0 notas, o elemento do bloco não é renderizado (confirmado via seletor DOM retornando zero elementos) e o layout permanece limpo (vai direto de Favoritos para a busca, sem espaço vazio). Decisão tomada: não renderizar o bloco quando vazio (mais simples que reaproveitar o padrão de estado vazio `.notes-empty`, e evita duplicar a mensagem "comece aqui" que a lista principal já mostra logo abaixo);

\- \[x] nenhuma regressão na lista principal de notas, na busca, ou no painel de Favoritos entregue na QUEST-005 — validado manualmente: digitar um termo de busca que não bate com nenhuma nota não afeta o conteúdo do bloco de recentes (ele não é filtrado pela busca, propositalmente — ver Dependencies/Validation); o painel de Favoritos continua abrindo, mostrando contagem e itens, e fechando normalmente; suíte automatizada completa (53/53, incluindo os 49 testes de highlight/favorite da QUEST-005) continua passando sem nenhuma alteração nos arquivos daquela quest.



\---



\## UX Constraints



\- bloco FIXO, sempre visível — não é content-swap como o painel de Favoritos (sem botão de "voltar", sem substituir a coluna inteira);

\- reaproveita o padrão visual `.note-list-item`, já usado tanto na lista principal quanto no painel de Favoritos;

\- posição: imediatamente abaixo do botão "Favoritos", acima da busca;

\- não introduz nova rota/página.



\---



\## Non-Goals



\- não implementar QUEST-006 (Todas as notas) — quest separada;

\- não alterar o critério de ordenação da lista principal de notas (continua por última edição salva);

\- sem paginação/scroll infinito no bloco — é uma lista curta fixa de 5;

\- não implementar pastas, anexos ou associação assistida por IA a conteúdo — fora do escopo desta quest;

\- não mexer no painel de Favoritos além do necessário para acomodar o novo bloco no layout.



\---



\## Dependencies



\- reaproveita os padrões visuais `.note-list-item`/`.sync-pill` já usados no painel de Favoritos (QUEST-005);

\- provavelmente exige um pequeno campo novo de persistência para registrar o momento da última interação por nota (ex.: uma coluna `last_opened_at` ou equivalente, atualizada tanto ao abrir quanto ao salvar uma nota) — o mecanismo exato é decisão sua;

\- IMPORTANTE: a PR #1 (QUEST-005) ainda não foi mergeada em main. O botão "Favoritos" e o layout da coluna esquerda que este Task Contract referencia só existem na branch claude/fervent-keller-kz0mvz. Abra a branch desta quest a partir de claude/fervent-keller-kz0mvz (não de main/origin), para não trabalhar contra um layout que ainda não existe no destino final. Se isso gerar alguma complicação de merge mais adiante (PR #1 ainda aberta, ordem de merge, rebase), avise o usuário antes de decidir sozinho como resolver — não é uma decisão de implementação rotineira.

  Seguido sem complicação: a branch `claude/quest-004-notas-recentes` foi criada a partir da ponta de `claude/fervent-keller-kz0mvz` (commit `0163f27`, o mesmo já enviado em PR #1), então o histórico desta quest é um descendente linear direto da PR #1 — não houve divergência, nenhum rebase foi necessário, e não há nada de decisão de merge a fazer agora. Quando/se a PR #1 for mergeada em `main` antes desta quest, a diferença entre esta branch e `main` deixará de incluir os commits da QUEST-005 automaticamente (já estarão em `main`); nenhuma ação preventiva foi tomada aqui além de registrar isso.



\---



\## Complexity Budget



Architecture: LIMITED (extensão aditiva de persistência — novo campo de "última interação"; sem migração de dados existentes)



Hermes: 0–1 (só se o padrão de escrita a cada abertura de nota levantar uma questão real de performance/arquitetura)



Documentation: UPDATE EXISTING WHEN NECESSARY



Refactor: RELATED CODE ONLY (`components/notes-workspace.tsx`, `lib/notes-store.ts`, `db/schema.ts`, `app/api/notes/route.ts`)



Dependencies: NONE unless technically required



\---



\## Validation



\- testes automatizados cobrindo a lógica de "última interação" (abrir vs. editar, o mais recente prevalece) e o corte para 5 itens;

\- validação manual em navegador real: abrir várias notas em ordens diferentes e confirmar que o bloco reflete a ordem certa; editar uma nota mais antiga e confirmar que ela sobe para o topo; salvar, recarregar a página inteira, e confirmar que a ordem persiste;

\- confirmar que a lista principal, a busca e o painel de Favoritos continuam funcionando sem regressão.



\---



\## Implementation Notes



Decisões tomadas (persistência):



\- nova coluna `last_interacted_at` (nullable) em `atlas_notes`, gerada via `pnpm run db:generate` (migração `drizzle/0002_freezing_marrow.sql`: só `ALTER TABLE ... ADD` + `CREATE INDEX`, sem backfill — consistente com "sem migração de dados existentes" no Complexity Budget). Notas já existentes antes desta quest ficam com a coluna `NULL` até serem abertas ou salvas de novo;

\- toda leitura (`listNotes`, `getNote`, novo `listRecentNotes`) usa `COALESCE(last_interacted_at, updated_at)` — uma nota nunca chega ao cliente sem uma `lastInteractedAt` definida; para uma nota pré-existente ainda não reaberta, isso naturalmente usa a última edição como proxy razoável, sem precisar de um script de backfill separado;

\- `saveNote` grava `last_interacted_at = now` no mesmo `INSERT ... ON CONFLICT`, então salvar já conta como interação sem uma escrita separada; abrir uma nota (sem editar) usa uma função nova, `recordNoteOpen(id)`, com um `UPDATE` mínimo de uma coluna só;

\- a regra "o mais recente prevalece" não é implementada como uma comparação condicional (tipo `MAX(x, y)`) — cada ação (abrir ou salvar) simplesmente sobrescreve `last_interacted_at` com o instante em que ela de fato aconteceu, incondicionalmente. Como as ações chegam ao servidor na ordem real em que aconteceram, isso já produz o resultado correto sem lógica extra. Não foi implementado nenhum controle de concorrência otimista (tipo "só atualiza se o novo timestamp for maior que o atual") para o caso extremo de duas requisições chegarem fora de ordem (ex.: uma abertura e um salvamento quase simultâneos, com a rede entregando fora de ordem) — julguei isso fora do orçamento desta quest (Architecture: LIMITED) e um cenário raro o suficiente para não justificar a complexidade extra; registrando aqui para o caso de precisar revisitar;

\- endpoint: em vez de uma rota nova, o `GET /api/notes` existente ganhou um parâmetro `?recent=1` que troca para `listRecentNotes(5)` (ignora `q`), e o mesmo arquivo ganhou um handler `PATCH` novo (`{ id }` no corpo) para registrar uma abertura. Escolhido para ficar dentro do Complexity Budget, que já listava só `app/api/notes/route.ts` (não uma rota aninhada nova) como arquivo permitido;

\- no cliente, abrir ou salvar atualiza o bloco de recentes de forma otimista (sem esperar um novo `GET`): `openNote` já tem o objeto `AtlasNote` completo em mãos e só precisa trocar o timestamp; `save()` usa o `lastInteractedAt` que já vem autoritativo na resposta do servidor. O `PATCH` de abertura é "fire-and-forget" (não bloqueia a UI); a busca por texto nunca filtra o bloco de recentes — ele usa sua própria chamada (`?recent=1`), independente do estado de `search`, para não repetir o bug da QUEST-005 (painel de Favoritos escondido por um filtro residual);

\- a lógica de "mover para o topo, desduplicar por id, cortar em 5" foi extraída para uma função pura (`components/notes-recent-list.ts`, `mergeRecentInteraction`), seguindo o mesmo padrão já usado por `notes-editor-list-guard.ts` (lógica pura fora do componente React, testável por `node --test` sem DOM/jsdom).



Realizado nesta sessão:



\- suíte automatizada: 53/53 testes passando (49 herdados da QUEST-005, sem nenhuma alteração nos arquivos daquela quest, mais 4 novos casos para `mergeRecentInteraction`: move para o topo, uma interação mais recente substitui a posição antiga em vez de duplicar, corta no limite descartando os mais antigos, e os casos de lista vazia/abaixo do limite);

\- `pnpm run typecheck` limpo;

\- `pnpm run lint`: nenhum erro novo introduzido (o comando já falhava antes desta quest, com dezenas de erros pré-existentes em `components/ui/*`, `app/page.tsx` e `hooks/use-mobile.ts` não relacionados; o único achado novo nesta sessão — `react-compiler(EffectSetState)` no efeito que carrega o bloco de recentes ao montar — foi corrigido envolvendo a chamada num `window.setTimeout`, replicando exatamente o padrão já usado pelo efeito de busca existente no mesmo arquivo);

\- validação manual em navegador real (`pnpm run dev` + D1 local migrado, Chromium via Playwright), cobrindo cada Acceptance Criteria acima (ver detalhes lá): ordem do bloco após abrir 5 notas em sequência específica; abrir um item a partir do próprio bloco de recentes; editar e salvar uma nota mais antiga; busca sem afetar o bloco; painel de Favoritos escondendo/reexibindo o bloco corretamente; persistência através de reload completo; bloco ausente com zero notas; bloco com exatamente as notas existentes quando há menos de 5; bloco aparecendo imediatamente com 1 item ao criar a toda-primeira nota depois de zero.



PENDENTE (não descartado):



\- nenhum item de Acceptance Criteria desta quest ficou sem validação. Fora do escopo desta quest, seguem os mesmos itens já pendentes da QUEST-005 (navegação/rolagem ao clicar em um favorito, atualização visual do painel de favoritos após editar um trecho já favoritado, persistência da lista de favoritos como um todo através de reload) — inalterados por este trabalho.



\---



\# USAGE RULES



When a new development quest begins, Atlas should replace the ACTIVE QUEST section with the current Task Contract.



Codex should use this file as the primary product specification for implementation.



Codex must not reinterpret explicit observable requirements without approval.



If the task is classified as SMALL, Hermes should normally not be involved.



If Codex discovers a real Architecture Gate, the original requirement in this file must remain the common reference for both Codex and Hermes.



When the quest is complete:



1\. validate the acceptance criteria;



2\. archive the quest if historical retention is useful;



3\. reset this file before the next active quest.



This file should contain only one active quest at a time.
