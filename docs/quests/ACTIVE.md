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



\- \[ ] bloco "Notas recentes" sempre visível na coluna esquerda, na posição descrita acima, quando o painel de Favoritos não está aberto;

\- \[ ] mostra as 5 notas mais recentemente interagidas (aberta OU editada/salva, o mais recente prevalece);

\- \[ ] abrir uma nota sem editá-la conta como interação e reordena/inclui essa nota no bloco;

\- \[ ] editar e salvar uma nota conta como interação;

\- \[ ] clicar em um item do bloco abre a nota certa no editor;

\- \[ ] o bloco atualiza imediatamente após abrir/salvar, sem reload;

\- \[ ] a "última interação" persiste através de um reload completo da página — validado manualmente, não só em memória;

\- \[ ] com menos de 5 notas no total, o bloco mostra só as que existem; com zero notas, o bloco não aparece (ou usa o mesmo padrão de estado vazio já usado em outros lugares do workspace — decisão sua, desde que não quebre o layout);

\- \[ ] nenhuma regressão na lista principal de notas, na busca, ou no painel de Favoritos entregue na QUEST-005.



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
