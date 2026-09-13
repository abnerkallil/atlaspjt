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



QUEST-005 — Atlas Notes: marcação colorida e sistema de favoritos



\## Priority



Not specified in the originating Task Contract.



\## Complexity



MEDIUM



\## Hermes Gate



NO (no concrete architectural conflict was found; DEC-001/DEC-002 were not reopened)



\---



\## Objective



Separar "Favoritar texto" de "Realçar" como duas ações distintas no menu Formatar, cada uma com paleta de cores padrão (amarelo/verde/azul-claro/vermelho-rosa/roxo), permitindo recolorir trechos já marcados. Adicionar um painel de favoritos na coluna esquerda (acima do futuro bloco "Notas recentes", ainda não implementado — quest separada). Cada item do painel exibe o texto marcado, o título da nota de origem e a data de marcação; clicar em um item abre a nota de origem e posiciona/rola até o ponto exato marcado. Texto e alvo de navegação devem sempre refletir o estado ATUAL da nota, nunca uma cópia congelada.



\---



\## Required Behavior



\- "Favoritar texto" e "Realçar" aparecem como ações distintas no menu Formatar, cada uma abrindo um submenu de seleção de cor;

\- selecionar uma cor aplica a marca correspondente (highlight ou favorite) ao trecho selecionado;

\- reaplicar uma cor diferente sobre um trecho já marcado recolore a marca existente em vez de empilhar marcas duplicadas;

\- o painel de favoritos é acionado por um botão/aba na coluna esquerda (reaproveitando o padrão visual de `.sync-pill`) e substitui o conteúdo da coluna (content-swap), com um caminho claro de volta ao estado padrão;

\- cada entrada do painel mostra o texto marcado, o título da nota de origem e a data de marcação (reaproveitando o padrão visual de `.note-list-item`);

\- clicar em uma entrada abre a nota de origem (se não estiver aberta) e rola/posiciona o cursor exatamente no trecho marcado, inclusive em notas longas que exigem rolagem;

\- se o texto favoritado for editado depois de marcado, tanto o texto exibido no painel quanto o alvo de navegação refletem o estado atual da nota;

\- marcas de destaque (highlight) pré-existentes, sem cor explícita, continuam renderizando em amarelo sem regressão.



\---



\## Acceptance Criteria



\- \[x] "Favoritar" e "Realçar" existem como ações distintas no menu Formatar, cada uma com seletor de cor (amarelo/verde/azul-claro/rosa/roxo);

\- \[x] recolorir um trecho já marcado (highlight ou favorite) atualiza a marca existente;

\- \[x] painel de favoritos implementado na coluna esquerda como content-swap, com botão de retorno;

\- \[x] cada entrada do painel mostra texto, nota de origem e data;

\- \[x] clicar em uma entrada navega até o trecho exato, inclusive entre notas e com rolagem em notas longas;

\- \[x] favoritos e destaques refletem o estado vivo do documento (verificado via `extractAtlasNotesFavorites` recalculado a partir do documento atual, nunca de uma cópia congelada);

\- \[x] destaques amarelos pré-existentes continuam renderizando corretamente após a migração de schema (coberto por teste automatizado dedicado);

\- \[x] extensão de schema é aditiva; DEC-001/DEC-002 não foram reabertas;

\- \[x] suíte de testes automatizados cobrindo o atributo de cor e o id estável de favorito no formato canônico (45/45 testes passando, incluindo os novos casos);

\- \[ ] validação manual/funcional em navegador real — NÃO REALIZADA nesta sessão. Ambos os caminhos de execução disponíveis (bridge com a máquina do usuário e sandbox de nuvem) estavam bloqueados: o bridge local (`device_bash`) permanece quebrado por um bug de atualização do Windows (09/09), e o registro npm está bloqueado por política de egress no sandbox de nuvem, impedindo `pnpm install`/`pnpm dev` em ambos os ambientes. Este item permanece pendente até que um dos dois caminhos seja restaurado ou até que o usuário execute a validação manual localmente.



\---



\## UX Constraints



\- painel de favoritos é troca de conteúdo dentro da coluna esquerda existente, não uma nova rota/página;

\- seletor de cor segue a identidade visual branco/azul/dourado do Atlas;

\- reaproveita padrões visuais existentes (`.sync-pill`, `.note-list-item`) em vez de introduzir novos padrões visuais do zero;

\- menu Formatar não é redesenhado além do necessário para acomodar "Favoritar".



\---



\## Non-Goals



\- não alterar as marcas existentes comment/code/link;

\- sem busca/filtro no painel de favoritos;

\- sem alterações de modelo de permissão/usuário;

\- não implementar "Notas recentes" nem "Todas as notas" (QUEST-004/QUEST-006, separadas).



\---



\## Dependencies



\- DEC-001 (formato canônico v2, `highlight` sem atributos, `assertKeys` estrito) — estendida de forma aditiva, não reaberta;

\- DEC-002 (listas aninhadas) — não afetada;

\- padrão de referência estável por id já usado por `footnoteRef`/`footnote` — reutilizado para a marca `favorite`.



\---



\## Complexity Budget



Architecture: LIMITED (extensão aditiva de schema; sem novo runtime/persistência)



Hermes: 0



Documentation: UPDATE EXISTING WHEN NECESSARY (este registro em ACTIVE.md)



Refactor: RELATED CODE ONLY (`components/notes-editor.tsx`, `components/notes-workspace.tsx`)



Dependencies: NONE



\---



\## Validation



Realizado nesta sessão:



\- suíte automatizada (`tsc -p tsconfig.notes-spike.json && node --test .notes-spike-dist/tests/*.test.js`): 45/45 testes passando, incluindo novos casos para cor de highlight, validação/merge de marca favorite, extração ao vivo de favoritos (`extractAtlasNotesFavorites`) e não-regressão de highlights legados sem cor;

\- revisão manual linha a linha do diff de todos os arquivos alterados (`lib/atlas-notes-document.ts`, `components/notes-editor.tsx`, `components/notes-editor.module.css`, `components/notes-workspace.tsx`, `app/globals.css`, `tests/atlas-notes-document.test.ts`, `tests/atlas-notes-input.test.ts`) para consistência estrutural (JSX balanceado, tipos, dispatch de schema);

\- correção preventiva identificada durante a revisão: regra `parseHTML` de fallback do highlight (`{ tag: 'mark' }`) poderia capturar indevidamente um `<mark data-atlas-favorite>` colado externamente; ajustada para `mark:not([data-atlas-favorite])`.



PENDENTE (bloqueado nesta sessão, não descartado):



\- validação manual/funcional em navegador real cobrindo: favoritar com cores diferentes; recolorir um trecho já marcado; editar um trecho favoritado e confirmar atualização do painel; navegar até favoritos em nota curta e em nota longa com rolagem; persistência via save/reload/reabertura; e confirmação visual de que highlights amarelos pré-existentes seguem renderizando corretamente.



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
