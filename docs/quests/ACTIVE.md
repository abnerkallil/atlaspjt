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



\- \[x] "Favoritar" e "Realçar" existem como ações distintas no menu Formatar, cada uma com seletor de cor (amarelo/verde/azul-claro/rosa/roxo) — validado manualmente em navegador real nesta sessão;

\- \[ ] recolorir um trecho já marcado (highlight ou favorite) atualiza a marca existente — QUEBRADO, confirmado por teste manual em navegador real nesta sessão: reaplicar uma cor diferente sobre um trecho já destacado OU já favoritado lança `Marca de texto duplicada` (`INVALID_MARK`) e bloqueia a mudança (a marca visível não muda). Causa raiz identificada: tanto `AtlasHighlight` quanto `AtlasFavorite` definem `excludes: ''`, o que desliga a auto-exclusão padrão do ProseMirror para marcas do mesmo tipo — a nova instância de cor passa a coexistir com a antiga em vez de substituí-la, e o canonicalizador rejeita corretamente o documento resultante por marca duplicada. Correção mínima (remover `excludes: ''` de ambas as marcas) foi testada manualmente e resolve o problema nos dois casos, mas NÃO foi incluída nesta entrega — está fora do escopo dos dois problemas resolvidos neste ciclo, pendente de decisão explícita antes de ser aplicada;

\- \[x] painel de favoritos implementado na coluna esquerda como content-swap, com botão de retorno — validado manualmente em navegador real nesta sessão;

\- \[x] cada entrada do painel mostra texto, nota de origem e data — validado manualmente em navegador real nesta sessão;

\- \[ ] clicar em uma entrada navega até o trecho exato, inclusive entre notas e com rolagem em notas longas — NÃO validado nesta sessão (nem automatizado nem manual);

\- \[x] favoritos e destaques refletem o estado vivo do documento (verificado via `extractAtlasNotesFavorites` recalculado a partir do documento atual, nunca de uma cópia congelada, incluindo o caso do trecho totalmente apagado — teste automatizado). A lista do painel de favoritos não é mais silenciosamente filtrada por um termo de busca residual ao abrir o painel — validado manualmente em navegador real: favoritei um trecho em uma nota, digitei uma busca que só batia com outra nota, e o favorito continuou aparecendo no painel. A atualização do texto exibido no painel após editar um trecho já favoritado permanece validada apenas por teste automatizado, não reexercitada manualmente nesta sessão;

\- \[x] destaques amarelos pré-existentes continuam renderizando corretamente após a migração de schema — agora genuinamente validado, não apenas por teste de schema isolado: teste automatizado dedicado alimentando a forma real que o editor chega a emitir (`attrs: { color: null }`, antes da correção) confirma que o schema a rejeita, e teste manual em navegador real confirma o fluxo completo editor→schema→salvar — apliquei um destaque amarelo em texto novo, continuei editando (o gatilho exato do bug relatado), salvei, recarreguei a página inteira e reabri a nota: nenhum erro de validação em nenhum momento, cor preservada;

\- \[x] extensão de schema é aditiva; DEC-001/DEC-002 não foram reabertas;

\- \[x] suíte de testes automatizados cobrindo o atributo de cor e o id estável de favorito no formato canônico (46/46 testes passando — 45 anteriores mais um novo caso de regressão para o bug do highlight amarelo);

\- \[x] validação manual/funcional em navegador real — REALIZADA PARCIALMENTE nesta sessão (diferente da entrega anterior, o ambiente permitiu `pnpm install` e `pnpm dev` sem bloqueio de rede). Cobriu: aplicar destaque amarelo e continuar editando sem erro de validação; salvar e recarregar a página inteira, confirmando persistência do destaque amarelo na forma legada sem atributos; favoritar um trecho e abrir o painel de favoritos com uma busca residual ativa que não batia com a nota favoritada, confirmando que o favorito continuou aparecendo; e recolorir um trecho já marcado, o que revelou que este item está quebrado (ver acima). NÃO cobriu: navegação/rolagem ao clicar em uma entrada do painel, atualização visual do painel após editar um trecho já favoritado, e persistência de favoritos através de reload.



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



Realizado na sessão original:



\- suíte automatizada (`tsc -p tsconfig.notes-spike.json && node --test .notes-spike-dist/tests/*.test.js`): 45/45 testes passando;

\- revisão manual linha a linha do diff de todos os arquivos alterados para consistência estrutural (JSX balanceado, tipos, dispatch de schema);

\- correção preventiva identificada durante a revisão: regra `parseHTML` de fallback do highlight (`{ tag: 'mark' }`) poderia capturar indevidamente um `<mark data-atlas-favorite>` colado externamente; ajustada para `mark:not([data-atlas-favorite])`.



Realizado nesta sessão de correção (ciclo de revisão seguinte):



\- corrigido o bug bloqueante do highlight amarelo (`color` deixou de default para `null`, passou a default para `'yellow'`; `applyHighlightColor`, `parseHTML` e `renderHTML` ajustados no mesmo sentido) e adicionado teste automatizado alimentando a forma real e problemática (`attrs: { color: null }`);

\- corrigido o bug do painel de favoritos escondendo favoritos por causa de um filtro de busca residual (a lista passa a carregar sem o filtro de busca enquanto o painel está aberto);

\- suíte automatizada: 46/46 testes passando (45 anteriores + o novo caso de regressão);

\- validação manual/funcional em navegador real REALIZADA (ao contrário da sessão anterior, `pnpm install`/`pnpm dev` funcionaram sem bloqueio de rede neste ambiente): aplicar destaque amarelo em texto novo e continuar editando sem erro de validação; salvar e recarregar a página inteira, confirmando a persistência do destaque amarelo na forma legada sem atributos; favoritar um trecho, digitar uma busca que só batia com outra nota, e confirmar que o favorito da primeira nota continuou aparecendo no painel de favoritos;

\- durante essa validação manual foi descoberto um terceiro problema, não relacionado aos dois acima e não corrigido nesta entrega (ver "Acceptance Criteria"): recolorir um trecho já marcado (highlight ou favorite) está quebrado — lança `Marca de texto duplicada` e bloqueia a mudança, porque `AtlasHighlight`/`AtlasFavorite` definem `excludes: ''`, desligando a auto-exclusão padrão do ProseMirror entre instâncias do mesmo tipo de marca. Uma correção mínima (remover `excludes: ''` de ambas) foi testada e funciona, mas não foi aplicada — aguardando decisão explícita antes de entrar em qualquer entrega.



PENDENTE (não descartado):



\- decisão sobre corrigir ou não o bug de recolorir nesta mesma entrega;

\- validação manual em navegador real ainda não realizada para: navegação/rolagem ao clicar em uma entrada do painel de favoritos; atualização visual do painel após editar um trecho já favoritado; persistência de favoritos através de reload.



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
