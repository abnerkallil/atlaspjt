# ATLAS — Relatório Mestre de Produto e Negócios

## Atlas Pessoal + Atlas Business

**Data:** 15 de setembro de 2026
**Versão:** 1.0
**Classificação:** Material de produto para apresentação e compartilhamento externo (parceiros, colaboradores em potencial, investidores)

---

### Ficha do documento

| Campo | Valor |
|---|---|
| Título | Atlas — Relatório Mestre de Produto e Negócios |
| Subtítulo | Atlas Pessoal + Atlas Business |
| Autor/organização | Projeto Atlas (idealizador: Abner Coimbra) |
| Data de emissão | 15/09/2026 |
| Versão | 1.0 (consolida o plano reconstruído de set/2026 com o inventário funcional do código em 15/09/2026) |
| Fontes | GitHub `abnerkallil/atlaspjt` (branch `claude/atlas-master-report-codex-rename-7xm3vn`), Google Drive (pasta de governança do projeto), PDF "Atlas_Plano_de_Negocios_Reconstruido.pdf" |
| Escopo | Produto, pedagogia, arquitetura de agentes, inventário técnico, modelo de negócio (hipóteses), governança, riscos, roadmap |
| Uso pretendido | Leitura de ponta a ponta por pessoas sem contexto prévio do projeto; material de compartilhamento externo |

---

## Sumário

0. Tarefa preparatória — Renomeação Codex → Claude Code
1. Sumário Executivo
2. Problema e Oportunidade
3. Atlas Pessoal — Experiência Completa
4. (reservado — ver nota abaixo)
5. Inventário Funcional Página por Página e Botão por Botão
6. Motor Pedagógico e Didática Acadêmica
7. Os Dois Grupos de Agentes do Projeto — Não Confundir
8. Atlas Notes e Ecossistema
9. Atlas Business
10. Modelo de Negócio (Hipóteses, Não Decisões)
11. Roadmap e Kanban Consolidado
12. Governança e Salvaguardas
13. Métricas e Validação
14. Riscos e Respostas
15. Síntese Estratégica e Próximos Passos Recomendados
16. Apêndices

> Nota de numeração: a estrutura solicitada numera 16 seções lógicas; a seção "3. Atlas Pessoal" já cobre a jornada completa do produto, por isso o inventário funcional aparece como seção 5, imediatamente após "Problema e Oportunidade" e "Atlas Pessoal", preservando a ordem pedida pelo escopo original sem duplicar conteúdo.

---

# 0. Tarefa Preparatória — Renomeação Codex → Claude Code

Antes da redação deste relatório, foi executada a renomeação do papel de "Implementation Authority" do projeto: de **Codex** (CLI da OpenAI, ferramenta original de implementação) para **Claude Code**. O modelo de autoridade de desenvolvimento passou a ser:

**Atlas (Product & Specification Authority) → Hermes (Architecture Authority) → Claude Code (Implementation Authority)**

O detalhamento completo (o que mudou, por quê, e as duas exceções tratadas de forma diferente) está registrado no changelog da seção 16.4. Em resumo:

- 9 arquivos do repositório GitHub tiveram "Codex"/"CODEX" substituído por "Claude Code"/"CLAUDE CODE" preservando integralmente o sentido técnico de cada regra: `AGENTS.md`, `docs/README.md`, `docs/ATLAS_CAMPAIGN.md`, `docs/ATLAS_DECISIONS.md`, `docs/ATLAS_FAILURE_MODES.md`, `docs/quests/ACTIVE.md`, `docs/quests/ARCHITECTURE_GATE.md`, `docs/quests/TEMPLATE.md`, `.hermes.md`.
- 3 documentos históricos em `docs/archive/` (`ATLAS_NOTES_GATE1.md`, `ATLAS_NOTES_GATE2.md`, `quest-3-atlas-notes-advanced-blocks.md`) **não foram reescritos** — receberam apenas uma nota de rodapé/cabeçalho explicando que "Codex", nesses registros, corresponde à ferramenta usada à época (confirmado literalmente pelo próprio `quest-3-atlas-notes-advanced-blocks.md`: "o trabalho foi conduzido através de prompts diretos ao Codex — à época, a CLI do Codex da OpenAI").
- `vite.config.ts` **não foi alterado**: a linha `process.env.CODEX_SANDBOX === 'seatbelt'` é uma variável de ambiente real de sandbox técnico (controla polling de hot-reload sob macOS Seatbelt), não o papel de autoridade — está sinalizada como decisão pendente de infraestrutura na seção 16.5.
- Dois documentos de governança no Google Drive — "ATLAS — Product & Specification Authority" e "ATLAS — Quest Handoff Protocol" — foram recriados com o mesmo título e conteúdo corrigido (a API de Drive disponível não permite edição de texto in-place em Google Docs; a versão antiga foi movida para a lixeira do Drive, reversível pelo dono). Um terceiro documento (um rascunho de README.md para a raiz do repositório, não commitado) também mencionava "Codex"; a correção desse rascunho ficou incompleta — ver nota de transparência na seção 16.5.
- Busca final case-insensitive por "codex" no repositório confirma exatamente 2 categorias de resíduo esperado (as exceções acima) e nenhuma outra.

---

# 1. Sumário Executivo

**O que é o Atlas.** O Atlas é uma plataforma única de estudo orientada por competência. Sua tese central, registrada no plano de produto reconstruído: **estudar conteúdo não é o mesmo que demonstrar domínio**. O Atlas conecta teoria, prática, revisão, retenção e consistência para transformar atividade em decisão pedagógica compreensível — em vez de tratar "ver o conteúdo" como sinônimo de "saber o conteúdo".

**Origem.** O projeto nasce para 1 pessoa — o idealizador é o primeiro usuário. O primeiro caso de uso é o estudo de Contabilidade Geral e Tributária, mas a arquitetura não deve ficar presa a essa disciplina.

**Critérios centrais.** Aprovação normal exige nota **≥ 70**; o Selo Atlas de Domínio exige nota **≥ 85**, com evidência prática e sem inconsistências relevantes. Após recuperação, a progressão exige cobertura completa e nota **> 85**; um novo erro em recuperação volta a bloquear o avanço.

**As duas camadas.** A estratégia tem duas camadas complementares e sequenciais:

| Camada | Papel | Resultado esperado |
|---|---|---|
| **Atlas Pessoal** | Produto inicial e laboratório longitudinal | Provar utilidade, estabilidade, explicabilidade e ganho real de aprendizagem |
| **Atlas Business** | Evolução institucional | Apoiar universidades, escolas e plataformas com análise de aprendizagem e intervenção antecipada |

A migração para o Atlas Business só deve ocorrer depois que o Atlas Pessoal demonstrar, em uso longitudinal: utilidade real, métricas válidas e explicáveis, estabilidade do motor de estados, qualidade consistente das avaliações, proteção adequada de dados e evidência de que as recomendações melhoram a aprendizagem.

**Onde o projeto está hoje (fato verificado no código, não opinião).** Das seis abas do produto (Hoje, Estudar, Roadmap, Notas, Quizzes, Progresso), **apenas uma — Atlas Notes — tem backend real**: notas são criadas, editadas, buscadas e persistidas em banco de dados (Cloudflare D1), com formatação rica, listas aninhadas, links, notas de rodapé, tabelas, blocos de matemática, callouts, favoritos e um painel de busca completo. As abas Hoje e Estudar são prototípos visuais completos e navegáveis, mas com dados 100% fixos (mock), sem API por trás. As abas Roadmap, Quizzes e Progresso ainda não foram desenhadas — mostram apenas um aviso "será desenhada na próxima etapa". Os agentes de IA do produto (Atlas orientador, Hades, Themis) existem apenas como conceito documentado — nenhuma linha de código de IA foi implementada para eles. Este relatório trata essa distinção como princípio inegociável em toda a seção 5.

**Leitura de 3-5 minutos, três frases:** o Atlas quer substituir o estudo fragmentado (materiais, notas, revisões e progresso espalhados sem evidência confiável) por uma jornada única, explicável e baseada em competência demonstrada; hoje isso já funciona de verdade só no caderno de notas (Atlas Notes) — o resto do produto é protótipo visual ou visão registrada em documentação; e o caminho recomendado é terminar o núcleo funcional determinístico (progresso, quizzes, revisões) antes de qualquer automação por IA ou expansão institucional, exatamente como a própria documentação de arquitetura do projeto já determina ("Advanced AI capabilities must not replace the deterministic core before that core has been validated" — `docs/ATLAS_CAMPAIGN.md`).

---

# 2. Problema e Oportunidade

**Problemas observados** (fonte: plano de produto reconstruído, seção 02, e `atlas-pessoal-fundacao.md`):

- Materiais, notas, tarefas, quizzes e agenda vivem em ferramentas diferentes — nenhuma visão única de progresso.
- Conclusão costuma ser confundida com visualização ou marcação de conteúdo ("ver a matéria" ≠ "saber a matéria").
- Pré-requisitos podem ser ignorados, gerando avanço sobre bases frágeis.
- A revisão depende da memória e da iniciativa do próprio estudante, sem rotina programada.
- No ambiente institucional, o mesmo problema cresce: professores e gestores recebem sinais tardios — em geral concentrados em provas — quando a lacuna de aprendizagem já está consolidada.

**Oportunidade.** Reunir evidências de aprendizagem em uma única experiência e convertê-las em próximos passos claros: o que estudar, o que revisar, onde praticar e por que a prioridade mudou. O plano de produto é explícito sobre a natureza dessa oportunidade: "a oportunidade comercial futura não nasce apenas de oferecer IA. Ela nasce de reduzir incerteza pedagógica: para o aluno, sobre o que realmente domina; para o professor, sobre onde intervir; para a instituição, sobre quais conteúdos estão produzindo aprendizagem."

Essa distinção — reduzir incerteza pedagógica, não apenas "adicionar IA" — é o fio condutor que separa o Atlas de um catálogo de conteúdo ou de um chatbot de estudo genérico.

---

# 3. Atlas Pessoal — Experiência Completa

O Atlas Pessoal deve nascer útil para uma pessoa, com arquitetura capaz de evoluir. Seu primeiro caso de uso é o estudo de Contabilidade Geral e Tributária.

**Experiência central (visão de produto, `atlas-pessoal-fundacao.md` + plano reconstruído):**

1. **Hoje** — usuário abre a plataforma; Atlas mostra a jornada prioritária e o tempo planejado.
2. **Estudar** — usuário retoma o conteúdo exatamente do ponto onde parou.
3. **Notas** — usuário registra conceitos e anexos; Atlas associa evidências ao conteúdo do roadmap.
4. **Quizzes** — usuário responde questões; Atlas localiza retenção e pontos frágeis.
5. **Prática** — usuário aplica o conhecimento; Atlas busca evidência compatível com a competência.
6. **Progresso** — usuário consulta o estado; Atlas explica a decisão e o próximo passo.

"A interface permanece simples enquanto o raciocínio fica em segundo plano. O usuário deve receber uma orientação curta, não um painel técnico de regras" (plano de produto, seção 03).

### Tabela ação-do-usuário / resposta-do-Atlas — visão versus estado atual

| Ação do usuário (visão de produto) | Resposta esperada do Atlas | Estado atual verificado no código |
|---|---|---|
| Abrir o app | Mostrar jornada prioritária do dia e tempo planejado | **PROTÓTIPO VISUAL** — aba Hoje com ribbon, saudação e métricas fixas (`app/page.tsx`) |
| Continuar estudo | Retomar exatamente do ponto anterior | **PROTÓTIPO VISUAL** — botão "Continuar estudo" abre um modal de início de sessão que apenas fecha a si mesmo; não há retomada real de posição |
| Registrar nota vinculada a um conteúdo | Associar evidência ao roadmap oficial | **IMPLEMENTADO E FUNCIONAL** — Atlas Notes persiste em D1, sugere e vincula conteúdos do catálogo oficial |
| Responder quiz | Localizar retenção e pontos frágeis | **PLANEJADO / VISÃO** — nenhuma aba de Quizzes existe ainda (mostra aviso "será desenhada na próxima etapa") |
| Aplicar conhecimento em prática | Buscar evidência compatível com a competência | **PLANEJADO / VISÃO** — sem implementação, sem tela |
| Consultar progresso | Explicar decisão e próximo passo | **PROTÓTIPO VISUAL** parcial — números de domínio/retenção/consistência aparecem na aba Hoje, mas são strings fixas, sem cálculo real; aba Progresso dedicada ainda não existe |

Esta tabela é a ponte direta para o inventário funcional completo (seção 5), que detalha página por página e botão por botão.

---

# 5. Inventário Funcional — Página por Página e Botão por Botão

Esta seção descreve o estado **real do código-fonte** em 15/09/2026 (branch `claude/atlas-master-report-codex-rename-7xm3vn`, arquivo principal `app/page.tsx` e componentes de `components/notes-*`). Cada item é classificado como:

- **IMPLEMENTADO E FUNCIONAL** — existe lógica/backend real por trás.
- **PROTÓTIPO VISUAL** — renderiza na tela, mas usa dados estáticos/mock, sem lógica real.
- **PLANEJADO / VISÃO** — existe apenas como conceito em documento ou cartão de kanban; sem interface ainda.

O app declara seis abas de navegação: `['Hoje', 'Estudar', 'Roadmap', 'Notas', 'Quizzes', 'Progresso']` (`app/page.tsx`, linha 31). Todo o estado de topo (`active`, `done`, `assistantOpen`, `journeyStarted`, `studyOverview`) é `useState` local em React, sem persistência — **tudo reseta ao recarregar a página**, exceto o que está dentro do componente `NotesWorkspace`.

## 5.1 Aba "Hoje" — PROTÓTIPO VISUAL

**O que mostra:** ribbon superior com contagem dinâmica de atividades restantes (`4 - done.length`) e minutos restantes (`100 - completedMinutes`, calculados a partir de estado local, não de dados reais); data fixa "QUINTA-FEIRA, 3 DE SETEMBRO"; saudação fixa "Bom dia, Marcos."; card "Continue de onde parou" com 42% fixo; card "O Atlas observou" com texto fixo; três métricas fixas (Domínio 74%, Retenção 82%, Consistência "7 dias" — strings sem cálculo); lista de 4 tarefas fixas ("Regime de competência", "Contas patrimoniais", "Débito e crédito", "Construção de balancete"); card-resumo de roadmap com 68% fixo.

**Nenhuma chamada de API ou `fetch` ocorre nesta aba** — todos os dados vêm de arrays/strings hardcoded no componente.

**Controles interativos:**

| Controle | Comportamento atual |
|---|---|
| "Ver orientação do Atlas" | Abre o painel/drawer do assistente (`setAssistantOpen(true)`) |
| Botão de marca "ATLAS" | Volta para a aba Hoje |
| Itens de navegação (Hoje/Estudar/Roadmap/Notas/Quizzes/Progresso) | Trocam a aba ativa |
| "Buscar" | **Sem handler — decorativo, não faz nada** |
| "Notificações" | **Sem handler — decorativo** |
| Avatar "MS" | **Sem handler — decorativo** |
| Menu mobile | **Sem handler — decorativo** |
| "Continuar estudo" | Abre o modal de início de sessão (`setJourneyStarted(true)`) |
| "Entender recomendação" | Abre o painel do assistente |
| Checkbox de cada tarefa (4 itens) | Alterna estado local `done`, puramente visual, sem persistência |
| Seta de cada tarefa (abrir detalhe) | **Sem handler — decorativo** |
| "Ver roadmap completo" | **Sem handler — decorativo** |

## 5.2 Aba "Estudar" — PROTÓTIPO VISUAL

Duas subvisões controladas por estado local (`studyOverview`), sem `fetch`/`useEffect`, 100% dados fixos.

**Visão de retomada** (padrão): "CONTABILIDADE GERAL · MÓDULO 2", título "Regime de competência", badge 42% fixo, card de aula "AULA 4 DE 9", quatro passos de sessão (Leitura inicial, Reconhecimento contábil, Nota de síntese, Fixação) — **esses quatro passos são `<div>`s estáticas, sem nenhum handler**.

**Visão de conteúdo completo:** lista de módulos fixa — Módulo 1 "concluído" 100%, Módulo 2 "em andamento" 42% com 3 aulas, Módulo 3 "bloqueado" (ícone de cadeado, tag "Pré-requisito").

**Controles interativos:**

| Controle | Comportamento atual |
|---|---|
| "Ver conteúdo completo" | Alterna para a visão de módulos (`setStudyOverview(true)`) |
| "Retomar estudo" | Abre o **mesmo** modal de sessão da aba Hoje |
| "Voltar ao estudo" | Volta para a visão de retomada |
| Linha "Regime de caixa" (concluída) | **Sem handler — decorativo** |
| Linha "Regime de competência" (ativa) | Apenas volta à visão de retomada |
| Linha "Ajustes de competência" (próxima) | **Sem handler — decorativo** |

## 5.3 Aba "Roadmap" — PLANEJADO / VISÃO

Não tem tela própria. Cai no bloco genérico de aviso descrito em 5.5.

## 5.4 Aba "Notas" — IMPLEMENTADO E FUNCIONAL (ver detalhamento completo na seção 8)

A única aba que renderiza um componente com estado de servidor real: `<NotesWorkspace />`. Todo o restante do app é mock local; esta é a exceção documentada em `status-site.md`: "protótipo funcional com persistência do Atlas Notes; motor pedagógico ainda não implementado."

## 5.5 Abas "Roadmap", "Quizzes" e "Progresso" — PLANEJADO / VISÃO

Confirmado literalmente no código-fonte (`app/page.tsx`): qualquer aba que não seja Hoje, Estudar ou Notas renderiza exatamente o mesmo aviso genérico —

```
A página {active} será desenhada na próxima etapa.
[Voltar para Hoje]
```

Não há conteúdo distinto por aba, nem dado algum. O único botão ("Voltar para Hoje") apenas troca a aba ativa de volta para Hoje. Isso corresponde exatamente ao que `status-site.md` já registrava em 6/set/2026: "Hoje e Estudar possuem telas próprias no ambiente local. As demais exibem somente aviso de futura construção." — nada mudou nesse ponto desde então.

## 5.6 Sobreposições globais (independentes da aba ativa)

| Elemento | Estado | Comportamento |
|---|---|---|
| Botão flutuante "Perguntar ao Atlas" | PROTÓTIPO VISUAL | Abre o drawer do assistente |
| Drawer do assistente | PROTÓTIPO VISUAL | Fecha ao clicar fora ou no X; 3 perguntas sugeridas ("Por que esta ordem de estudos?", "Como está minha retenção?", "O que vem depois nesta fase?") **sem handler — decorativas**; campo de texto e botão de enviar **sem `onSubmit`/`onClick` — decorativos, não enviam nada** |
| Modal de início de sessão | PROTÓTIPO VISUAL | Botões "Agora não" e "Iniciar sessão" fazem **exatamente a mesma coisa** — fecham o modal; nenhum dos dois inicia uma sessão real ou navega para qualquer lugar |

**Resumo do inventário do app (`app/page.tsx`):** das 6 abas declaradas, só **Notas** tem back-end real; **Hoje** e **Estudar** são mockups interativos completos com vários botões decorativos (busca, notificações, avatar, menu mobile, seta de tarefa, "Ver roadmap completo", as 3 perguntas sugeridas do assistente, o campo de envio do assistente, e 2 das 3 linhas de aula); **Roadmap, Quizzes e Progresso** são 100% placeholder, sem conteúdo próprio.

## 5.7 Atlas Notes — detalhamento total (única funcionalidade com backend real)

Esta é a única parte do produto com persistência real de ponta a ponta. A seguir, cada capacidade é amarrada à quest que a entregou e à decisão arquitetural (DEC-*) que a sustenta.

### Fundação técnica e persistência

- Backend real via `app/api/notes/route.ts`, rodando em `runtime = 'edge'` (Cloudflare Workers), com `GET` (lista/recentes), `PATCH` (registra abertura da nota), `POST` (cria) e `PUT` (atualiza) — todos delegando a `lib/notes-store.ts`, que acessa o Cloudflare D1.
- **IMPLEMENTADO E FUNCIONAL.** É a única rota de toda a aplicação que lê/escreve estado real de servidor — todo o resto do app (`Hoje`, `Estudar`, placeholders de `Roadmap`/`Quizzes`/`Progresso`) é estado local no navegador, sem API.
- Documento canônico versionado (envelope `atlas-notes`, campo `content_json`), com `body` como projeção textual determinística (LF) usada para busca, prévia e contagem — nunca editado separadamente do conteúdo estruturado (`docs/atlas-notes.md`).
- Fila de sincronização de metadados (`atlas_sync_operations`) com chave idempotente; o corpo da nota **nunca** entra no payload dessa fila — apenas id/título/contagem de caracteres/estado de vínculo/data. Estados possíveis: `queued`, `processing`, `synced`, `failed`. A escrita real na planilha oficial de conteúdo ainda depende de uma credencial Google restrita não provisionada — por isso a fila permanece em `queued` até que essa integração exista (nenhuma escrita alternativa é feita).

### Fundação arquitetural — DEC-001, DEC-002, DEC-003

| Decisão | O que define | Status |
|---|---|---|
| **DEC-001 — Atlas Notes Canonical Document v2** (08/09/2026) | Introduz o envelope versão 2 como representação canônica durável; leitores aceitam v1 e v2, escritores sempre gravam v2; adota formas ao estilo Tiptap/ProseMirror normalizadas pelo Atlas (paragraph, heading 1–6, listas, blockquote, tabela, footnote, callout, math, marks bold/italic/strike/code/highlight/comment/link); projeção textual LF-only determinística; limites de segurança mantidos (profundidade 8, 20.000 nós, 100.000 caracteres visíveis) | ACCEPTED |
| **DEC-002 — Atlas Notes Nested Lists** (11/09/2026) | Permite hierarquia real de listas (`listItem`/`taskItem` = 1 parágrafo obrigatório + 0..N listas-filhas), com mixing heterogêneo entre bullet/ordered/task, projeção recursiva LF-only sem marcadores inventados, dentro do envelope v2 (sem criar v3) | ACCEPTED |
| **DEC-003 — Atlas Notes Nested Lists Depth Correction** (11/09/2026) | Corrige o limite de profundidade de 8 para 16, pois o limite original permitia só ~2 níveis funcionais de lista com texto; o novo limite viabiliza ~6 níveis funcionais, sem alterar forma canônica, mixing ou projeção | ACCEPTED |

### Capacidades do editor — amarradas a quest e decisão

| Capacidade | Quest de origem | Decisão base | Estado |
|---|---|---|---|
| Editor rico (Tiptap/ProseMirror), menu contextual de formatação (padrão Obsidian, submenus Formatar/Parágrafo/Inserir) | Quest 2 (commit `5a51c92` — "add contextual formatting menu") | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Documento canônico v2, colagem restrita a texto simples, limites de segurança aplicados a cada transação do editor (guarda P0) | Quest 1 (commit `5f9f966` — "implement canonical document v2") | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Listas aninhadas (bullet/numbered/task) com guarda de profundidade e aviso visual ao atingir o limite | "Quest 3" informal (commit `68fa080`) | DEC-002 + DEC-003 | IMPLEMENTADO E FUNCIONAL |
| Correção do aviso visual de limite de profundidade (o bloqueio já funcionava; o aviso não renderizava por causa de um contexto de stacking/overflow do editor; corrigido renderizando via `createPortal` em `document.body`) | **QUEST-003** (Task Contract formal, mesmo commit `68fa080`), registrado em `docs/archive/quest-003-list-depth-notice.md` | DEC-003 | IMPLEMENTADO E FUNCIONAL |
| Links com popup de hover (mostrar URL), confirmação de segurança antes de abrir link externo, opção de editar | "Quest 3" informal (`68fa080`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Notas de rodapé (footnote): título padrão = título da nota, editável ao passar o mouse, independente de mudanças futuras no título da nota | "Quest 3" informal (`68fa080`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Tabelas configuráveis (usuário define colunas, linhas e título de cada coluna na criação; navegação por Tab/Shift-Tab) | "Quest 3" informal (`68fa080`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Blocos de matemática (inline e bloco, LaTeX bruto em `attrs.latex`) | "Quest 3" informal (`68fa080`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Callouts | "Quest 3" informal (`68fa080`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Favoritos/destaques (marcação `AtlasFavorite`, 5 cores), com correção de bug de recoloração multi-parágrafo | **QUEST-005** (commits `8fd5aa5`, `e6c9cde`, `0163f27`, PR #1 `d2b11b0`) | DEC-001 | IMPLEMENTADO E FUNCIONAL |
| Bloco "Notas recentes" (até 5 itens, ordenado por ordem de interação) | **QUEST-004** (commits `96f0611`, `319c686`, PR #2 `5b4395a`) | — | IMPLEMENTADO E FUNCIONAL |
| Painel "Todas as notas" com busca (título, corpo, conteúdo vinculado), filtro por conteúdo vinculado e ordenação (data/título) | **QUEST-006** (commits `70ac2fc`, `587a2c5`, PR #3 `7c99592`) | — | IMPLEMENTADO E FUNCIONAL |

**Observação de rastreabilidade importante:** QUEST-004 e QUEST-005 são entregas reais e confirmadas no histórico de commits e no código funcional (`notes-recent-list.ts`, correções de recoloração em `notes-editor.tsx`), mas **não existe um documento de Task Contract dedicado para nenhuma das duas** em `docs/archive/` — ambas são conhecidas apenas por menção retrospectiva dentro do contrato de QUEST-006 (`docs/quests/ACTIVE.md`) e pelas mensagens de commit. QUEST-006 é a única das quatro com Task Contract formal próprio, além de QUEST-003. Isso é sinalizado aqui para não sugerir uma trilha documental mais completa do que a real.

**Discrepância viva observada:** `docs/quests/ACTIVE.md` ainda apresenta QUEST-006 como quest em andamento ("nenhum push ou PR foi feito ainda"), mas o histórico do Git confirma que o PR #3 (QUEST-006) **já foi mesclado** em `main` (commit `7c99592`). O arquivo não foi atualizado/arquivado após a mesclagem, apesar da própria regra do arquivo determinar esse passo ao concluir uma quest. Isso é uma lacuna de processo, não uma lacuna de produto — sinalizada na seção 16.6 (perguntas em aberto).

### Painel "Todas as notas" — comportamento exato (QUEST-006)

- Campo de busca (`allNotesQuery`) compara título, corpo e conteúdo vinculado (título/id) — os 3 alvos de busca definidos no contrato.
- Filtro "Conteúdo vinculado" — lista derivada dinamicamente dos vínculos já existentes nas notas, ordenada por `localeCompare('pt-BR')`.
- Ordenação "Ordenar por" — 4 modos: data mais recente/mais antiga, título A–Z/Z–A.
- Busca e filtro combinam-se como **E lógico** (AND), não OU.
- Toda a filtragem é feita no cliente sobre as notas já carregadas (sem paginação de servidor) — decisão explícita de escopo da quest.
- Clicar em qualquer item abre a nota no editor central, reaproveitando a mesma função usada em todo o resto do app.

### Outras capacidades confirmadas no código

- Vínculo com o catálogo oficial de conteúdos (Contabilidade Geral/Tributária), com sugestão automática por análise textual de título+corpo, sinalização de ambiguidade quando duas sugestões têm pontuação próxima, e confirmação manual obrigatória antes de gravar o vínculo — todo novo vínculo entra como `"Anotado — ainda não trabalhado"`.
- Indicador de status de sincronização por nota (pendente/na fila/sincronizando/sincronizado).
- Botão salvar desabilitado quando: já salvando, título vazio, corpo vazio, ou erro de validação do editor.

---

# 6. Motor Pedagógico e Didática Acadêmica

## 6.1 Estados de competência

Máquina de estados conceitual, definida em `atlas-pessoal-fundacao.md` (visão de produto — **PLANEJADO/VISÃO**, sem motor determinístico implementado ainda):

**Não iniciado → Em estudo → Exame de meia conclusão (≈50% de cobertura) → Cobertura confirmada (100% do conteúdo + exame intermediário ≥70) → Avaliação → Proficiente (nota final ≥70, evidências coerentes, integridade aprovada) → Domínio (desempenho ≥85 + demonstração prática compatível)**, com ramos de:

- **Revisão** — reforço programado ou disparado por falha/inconsistência/perda de retenção.
- **Recuperação** — tratamento dirigido das partes reprovadas; bloqueia avanço até cobertura completa e nota >85; um novo erro em recuperação volta a bloquear o avanço.
- **Em risco** — queda de desempenho, notas incorretas ou sinais de fragilidade.
- **Revalidação** — nova comprovação por suspeita de fraude ou perda de domínio ao longo do tempo.
- **Consolidação** — leitura conjunta de todas as evidências para decidir o estado final e a elegibilidade ao domínio.

Regra de ouro repetida em todo o material de fundação: **"todos os conteúdos são relevantes; 'criticidade' será usada para pré-requisitos e evidências-chave, não para tolerar erros."**

## 6.2 Rotina de revisão 24h/7d/30d

- **24 horas e 7 dias** — quiz básico de 30 questões, focado em recordação.
- Após erros no quiz de 30 — quiz dirigido de 10 questões sobre as falhas específicas.
- Novo erro no quiz dirigido — o conteúdo entra em urgência para o dia seguinte, com penalidade pedagógica.
- **30 dias** — 60 questões médias/difíceis, medindo retenção e consolidando evidências.
- Domínio nunca depende apenas de uma prova objetiva isolada.

## 6.3 Tipos de evidência aceitos

Questões objetivas e discursivas; explicação de conceitos e criação de exemplos próprios; resolução de casos, cálculos e raciocínio demonstrado; projetos ou entregas profissionais quando a natureza da competência exigir prática aplicada.

## 6.4 Fundamentação acadêmica dos mecanismos do produto

Esta subseção conecta cada mecanismo pedagógico do Atlas a corpos teóricos estabelecidos na literatura educacional — trata-se de uma leitura interpretativa deste relatório sobre o material de fundação do projeto, não uma citação literal dos documentos de origem (que descrevem os mecanismos sem nomear formalmente a teoria por trás). O próprio card de pesquisa **IA-01 "AtlasStudy"** do kanban já lista nominalmente os métodos a revisar: "repetição espaçada, recuperação ativa, intercalação, feedback, prática deliberada, métodos de anotação" — confirmando que essa é uma direção de pesquisa já prevista, e não apenas uma inferência externa deste relatório.

| Mecanismo do Atlas | Corpo teórico correspondente |
|---|---|
| Estados de competência (não iniciado → proficiente → domínio), bloqueio por pré-requisito, exigência de nota ≥70/≥85 | **Aprendizagem baseada em competência** (competency-based learning) e **mastery learning** (Bloom) — progressão condicionada à demonstração real de domínio, não ao tempo de exposição ao conteúdo |
| Quizzes de 24h/7d/30d como mecanismo central de retenção, não apenas avaliação | **Prática de recuperação / retrieval practice** — o ato de recuperar informação da memória (não apenas relê-la) fortalece a retenção de longo prazo |
| Espaçamento das revisões (24h, 7 dias, 30 dias) | **Repetição espaçada (spaced repetition)**, baseada no efeito de espaçamento sobre o esquecimento |
| Alternância entre quiz de recordação, quiz dirigido às falhas, prática aplicada | **Interleaving** (prática intercalada) — misturar tipos/tópicos de prática melhora a discriminação e a transferência, em vez de treinar um único padrão em blocos |
| Quiz intermediário em ~50% de cobertura vs. avaliação final de domínio | **Avaliação formativa vs. somativa** — a formativa (meia-cobertura) orienta o ajuste do percurso; a somativa (avaliação final/Selo de Domínio) certifica o resultado |
| Explicação obrigatória de cada mudança de estado ("por que este conteúdo avançou/entrou em risco/voltou para recuperação") | **Feedback explicativo/formativo** — feedback que explica o "porquê", não apenas o "certo/errado", é consistentemente associado a maior transferência de aprendizagem |

Essa tabela é uma ferramenta de leitura para quem avalia o produto pedagogicamente — não substitui pesquisa formal (a própria IA-01 do kanban já reconhece que essa revisão de evidências ainda precisa ser feita antes de qualquer implementação de recomendação adaptativa).

---

# 7. Os Dois Grupos de Agentes do Projeto — Não Confundir

O nome "Atlas" é usado em **dois contextos completamente diferentes** dentro deste projeto. Confundi-los é o erro de leitura mais provável para quem chega sem contexto — por isso esta seção os separa explicitamente.

## 7.1 Agentes do PRODUTO (o que o usuário final vê): Atlas, Hades e Themis

Esse trio é **100% conceitual hoje** — nenhum dos três está implementado como IA real no código atual. Corresponde aos cartões **IA-07** (Hades), **IA-08** (Themis) e **IA-09** (orquestração do debate) do kanban, todos na coluna "Ideias e futuro".

```
                    ┌────────────────────┐
                    │   ESTUDANTE (Atlas  │
                    │       Pessoal)      │
                    └─────────┬───────────┘
                              │ observa desempenho/evidências
                              ▼
          ┌───────────────────────────────────────┐
          │   ATLAS — orquestrador e "juiz geral"  │
          │  (conversa com o usuário; decide o que │
          │   comunicar e recomendar)              │
          └───────────────┬─────────────┬──────────┘
                           │  handoff    │  handoff
                           ▼             ▼
              ┌─────────────────┐  ┌─────────────────┐
              │      HADES       │  │     THEMIS      │
              │  risco, lacunas, │◄─┤ contesta causa,  │
              │  regressão,      │─►│ proporcionalidade,│
              │  descumprimento  │  │ explicações      │
              │  de pré-requisito│  │ alternativas      │
              └────────┬─────────┘  └────────┬─────────┘
                       │   debate/contestação  │
                       └───────────┬───────────┘
                                   ▼
                    síntese conjunta → Atlas
                                   │
                          caso não resolvido →
                                   ▼
                       ┌─────────────────────┐
                       │  ESCALONAMENTO       │
                       │  HUMANO              │
                       └─────────────────────┘
```

**Atlas** — orquestra evidências e conversa com o usuário; funciona como o "juiz geral" das decisões de conteúdo, lendo o que Hades e Themis levantaram e decidindo o que, de fato, comunicar e recomendar (ex.: "Notamos que sua nota em X caiu 5 pontos. Depois de analisar, entendemos que o ideal é focar nesse conteúdo antes de seguir para o próximo" — exemplo literal do README de apresentação do Drive).

**Hades** — analisa risco, lacunas, regressão de desempenho e descumprimento de pré-requisitos.

**Themis** — contesta a causalidade apontada, testa a proporcionalidade da resposta e explora explicações alternativas antes de aceitar uma conclusão como válida.

**Fluxo de debate previsto (card IA-09):** Hades e Themis operam sob **constituições versionadas**, com métricas diferentes de análise; produzem contestação mútua; chegam a uma síntese; e — quando não há acordo ou o impacto é alto — o caso é **escalado a revisão humana**. Isso não é um detalhe de implementação: é uma salvaguarda de governança (ver seção 12) já embutida na própria arquitetura conceitual do trio.

### Fundamentação acadêmica de Hades e Themis (leitura interpretativa deste relatório)

- **Hades (análise de risco pedagógico):** corpo teórico próximo de **sistemas de alerta antecipado em educação (early-warning systems)** — modelos que sinalizam risco de evasão/reprovação a partir de sinais comportamentais e de desempenho antes que o resultado final se consolide — e de **mastery learning**, no sentido de identificar quando uma lacuna de pré-requisito compromete o avanço.
- **Themis (contestação e justificação):** corpo teórico próximo de **devido processo algorítmico** e **IA explicável/contestável (explainable and contestable AI)** — a ideia de que uma decisão automatizada de alto impacto deve poder ser questionada, com explicação e caminho de recurso — e de **justiça procedimental**, que trata como legítima uma decisão não apenas pelo resultado, mas pelo processo que a produziu (transparência, consistência, possibilidade de contestação).

Essas referências não estão nomeadas nos documentos originais do projeto — são o enquadramento acadêmico proposto por este relatório para dar peso teórico a uma arquitetura hoje inteiramente conceitual.

## 7.2 Papéis de autoridade do DESENVOLVIMENTO: Atlas, Hermes e Claude Code

Este é um uso **completamente diferente** do nome "Atlas": aqui, Atlas não é o assistente pedagógico do produto — é a **autoridade de especificação do processo de desenvolvimento** do próprio projeto de software.

```
   ATLAS                    HERMES                  CLAUDE CODE
(Product &               (Architecture           (Implementation
 Specification             Authority)                Authority)
 Authority)
     │                         │                          │
     │ define WHAT             │ decide arquitetura        │ decide HOW,
     │ (requisitos,            │ SOMENTE quando existe      │ dentro da
     │ critérios de            │ um Architecture Gate       │ arquitetura
     │ aceite, UX)             │ genuíno                    │ já estabelecida
     ▼                         │                          ▼
┌───────────┐                 │                    ┌───────────────┐
│Task        │──── SMALL ─────┼───────────────────►│  INSPECT →     │
│Contract    │   (sem Hermes) │                     │  IMPLEMENT →   │
│(QUEST-XXX) │                │                     │  TESTE →       │
└─────┬─────┘                 │                     │  VALIDAÇÃO →   │
      │                       │                     │  COMMIT        │
      │── MEDIUM/LARGE ───────┤                     └───────────────┘
      │   (gate condicional   │
      │    ou obrigatório)    ▼
      │              ┌─────────────────┐
      └─────────────►│ ARCHITECTURE     │
                      │ GATE             │
                      │ (docs/quests/    │
                      │ ARCHITECTURE_    │
                      │ GATE.md)         │
                      └────────┬─────────┘
                               │ decisão registrada
                               ▼
                      DEC-* em ATLAS_DECISIONS.md
                      (se durável e arquitetural)
```

**Como o modelo governa o fluxo de quests** (fonte: `AGENTS.md`, `.hermes.md`, `docs/README.md`, `docs/ATLAS_DECISIONS.md`, doc "ATLAS — Quest Handoff Protocol" do Drive):

1. Atlas converte um pedido do usuário em um **Task Contract** conciso (Quest, Prioridade P0/P1/P2, Objetivo, Comportamento Requerido, Critérios de Aceite, Restrições de UX, Não-Objetivos, Dependências).
2. A tarefa é classificada como **SMALL, MEDIUM ou LARGE** — a classificação determina quanta arquitetura, documentação e coordenação entre agentes é justificada.
3. Para tarefas SMALL, Hermes normalmente **não** é envolvido; o fluxo é direto: Task Contract → Claude Code → Implementação → Validação → Commit.
4. Para tarefas MEDIUM/LARGE, se surgir um **Architecture Gate genuíno** (mudança de modelo de dados persistente, fronteira arquitetural, dependência estrutural significativa, conflito com uma decisão DEC-* existente, entre outros gatilhos listados em `AGENTS.md`), Claude Code prepara uma solicitação neutra de decisão e consulta Hermes via `docs/quests/ARCHITECTURE_GATE.md`.
5. Se a decisão de Hermes for durável e arquitetural, ela é registrada como um novo **DEC-*** em `docs/ATLAS_DECISIONS.md` (exemplos reais: DEC-001, DEC-002, DEC-003, detalhados na seção 5.7).
6. Claude Code retoma a implementação respeitando as restrições definidas pelo Gate.

**Por que não é o mesmo grupo da seção 7.1:** o trio de produto (Atlas/Hades/Themis) é uma visão de IA pedagógica que ainda não existe em código — seu "Atlas" conversa com o estudante. O trio de desenvolvimento (Atlas/Hermes/Claude Code) é o processo humano-assistido que **já rege como este próprio repositório é construído** — seu "Atlas" conversa com quem pede uma mudança no software. São dois papéis do mesmo nome, para dois públicos e dois momentos completamente diferentes do projeto.

---

# 8. Atlas Notes e Ecossistema

O Atlas Notes é descrito no plano de produto como substituto do Obsidian no núcleo do produto: "mais do que armazenar texto, ele conecta o que foi escrito ao conteúdo oficial e alimenta a compreensão do progresso." A primeira versão prevista (visão) incluía: editor com organização por pastas e salvamento automático; anexos de texto, imagens e PDFs; associação das notas aos conteúdos do roadmap; questionário de fixação com ao menos duas questões por subtópico estudado.

**Confronto visão vs. implementado:**

| Capacidade prevista na visão | Estado atual |
|---|---|
| Editor com salvamento automático e conteúdo vinculado ao roadmap | IMPLEMENTADO E FUNCIONAL (ver seção 5.7) |
| Organização por pastas | **PLANEJADO / VISÃO** — não documentado como implementado; não verificado no código lido |
| Anexos de imagens e PDFs | **PLANEJADO / VISÃO** — não encontrado no código analisado |
| Questionário de fixação por subtópico estudado | **PLANEJADO / VISÃO** — sem evidência de implementação |

**Evoluções registradas na visão (todas PLANEJADO/VISÃO hoje):**

- **Links bidirecionais** e migração/importação do Obsidian (card **FUT-01** e **FUT-02** do kanban).
- **Agenda externa** e integração futura com Google Calendar (card **FUT-04**).
- **PrivateLink** — área tecnicamente excluída da análise por IA, ainda não implementada (card **FUT-03**, que exige explicitamente "isolamento técnico verificável, não apenas indicação visual"). O plano de produto reforça: "a área privada não integra o primeiro MVP público, mas a arquitetura futura não deve inviabilizá-la. Privacidade é requisito de produto, não acabamento posterior."

---

# 9. Atlas Business

O Atlas Business é a evolução institucional do Atlas para universidades, escolas e plataformas de cursos — hoje **inteiramente PLANEJADO/VISÃO**, registrado apenas em `atlas-business.md` e no plano reconstruído; não integra o desenvolvimento atual do Atlas Pessoal (afirmação textual do próprio documento de fundação: "esta frente está registrada para preservar a visão, mas não integra o desenvolvimento atual do Atlas Pessoal").

## Proposta de valor por beneficiário

| Beneficiário | Proposta de valor |
|---|---|
| **Aluno** | Jornada orientada, progresso explicável, preparação mais confiável para avaliações e certificações |
| **Professor / tutor** | Menos trabalho repetitivo de tutoria; intervenções antecipadas antes de a lacuna se consolidar |
| **Coordenação de curso** | Visão de lacunas por aluno, turma, disciplina e material |
| **Produção de conteúdo** | Evidência sobre a efetividade de aulas, materiais e questões produzidas |
| **Gestão acadêmica** | Políticas configuráveis por instituição, relatórios, auditoria e visão de coortes |

## Capacidades futuras (visão)

Painéis de coorte e comparação entre turmas; alertas de risco pedagógico e recomendações de intervenção; roadmaps institucionais, trilhas "AtlasStudy" e trilhas reconhecidas de professores; certificação de proficiência e Selo Atlas de Domínio; auditoria assistida de avaliações; personalização de políticas por instituição; integrações com ambientes virtuais de aprendizagem; exportação de relatórios e APIs.

## Condições de expansão vindas do Atlas Pessoal

A migração do Atlas Pessoal para o Atlas Business é condicionada — não automática — à comprovação, no uso pessoal e longitudinal, de: utilidade real; métricas válidas e explicáveis; estabilidade do motor de estados; qualidade consistente das avaliações; proteção adequada de dados; e evidência de que as recomendações melhoram a aprendizagem. Essas mesmas condições reaparecem, com a mesma redação, tanto em `atlas-business.md` quanto no plano de produto reconstruído — são tratadas como um gate de decisão, não uma meta de calendário.

---

# 10. Modelo de Negócio (Hipóteses, Não Decisões)

**Aviso obrigatório:** nenhum número deste bloco é uma decisão tomada. O material preservado do projeto define proposta de valor, mas explicitamente **não fixa** preços, planos comerciais, tamanho de mercado, estrutura societária ou projeções financeiras. Cada linha abaixo é rotulada como **hipótese a validar**.

| Caminho | Descrição (hipótese a validar) | O que precisa ser validado |
|---|---|---|
| **Pessoal** | Acesso individual gratuito ou por assinatura | Uso recorrente, disposição real a pagar, custo de operação |
| **Institucional** | Licença por aluno ativo, por turma, ou contrato anual | Ciclo de compra, suporte, implantação, valor econômico percebido |
| **Integração** | Módulos, relatórios avançados ou API | Demanda real; responsabilidade sobre dados compartilhados |
| **Credencial** | Certificação e Selo Atlas de Domínio como credencial reconhecida | Validade pedagógica, jurídica e reputacional |

**Diretriz econômica explícita do plano de produto:** "a monetização não deve preceder a comprovação de aprendizagem. A prioridade é reduzir risco de produto: primeiro demonstrar que o sistema ajuda uma pessoa de maneira consistente; depois provar que essa capacidade se sustenta em grupos e contextos institucionais."

Nenhum valor de preço, tamanho de mercado, projeção de receita ou estrutura societária foi encontrado em qualquer fonte consultada (PDF, Drive ou repositório) — por isso nenhum aparece neste relatório, inclusive como estimativa.

---

# 11. Roadmap e Kanban Consolidado

O kanban oficial (`docs/archive/kanban-atlas-pessoal.md`, atualizado em 4/set/2026, quadro Trello `https://trello.com/b/g5FqnOUs/atlas-project`) registra **69 cartões**, confirmados linha a linha: 12 (DEC) + 8 (UX) + 8 (TEC) + 10 (MVP) + 9 (IA) + 7 (FUT) + 15 (DONE) = 69. O próprio documento confirma: "Sincronização inicial: 69 cartões criados; 15 cartões históricos marcados como concluídos."

Objetivo declarado no momento da última atualização do kanban: **"concluir a experiência visual do Atlas Pessoal antes de implementar o núcleo funcional."**

## 11.1 Visão de progresso (proporção)

| Bloco | Cartões | % do total |
|---|---|---|
| ✅ Concluído (DONE-01..15) | 15 | 21,7% |
| 🧭 Precisa de decisão (DEC-01..12) | 12 | 17,4% |
| 📋 Pronto para fazer — UX (UX-01..08) | 8 | 11,6% |
| 📋 Pronto para fazer — técnico (TEC-01..08) | 8 | 11,6% |
| 📋 Pronto para fazer — núcleo funcional (MVP-01..10) | 10 | 14,5% |
| 📥 Ideias e futuro — IA (IA-01..09) | 9 | 13,0% |
| 📥 Ideias e futuro — integrações/expansão (FUT-01..07) | 7 | 10,1% |

Ou seja: **21,7% concluído**, **55,1% "pronto para fazer" mas ainda pendente** (decisões + UX + técnico + MVP), **23,1% ainda em fase de ideia/futuro** (IA-* + FUT-*).

## 11.2 ✅ Concluído (DONE-01 a DONE-15)

| Cartão | Título | Cruzamento com o código atual |
|---|---|---|
| DONE-01 | Definir a visão do Atlas Pessoal | Confirmado — `atlas-pessoal-fundacao.md` existe e é fonte deste relatório |
| DONE-02 | Separar Atlas Pessoal e Atlas Business | Confirmado — dois documentos de fundação distintos |
| DONE-03 | Definir princípios de competência e progressão | Confirmado — seção 6.1 deste relatório |
| DONE-04 | Definir proficiência, domínio, recuperação e revalidação | Confirmado — estados pedagógicos documentados, mas **motor ainda não implementado em código** |
| DONE-05 | Definir conceitualmente a rotina 24h/7d/30d | Confirmado como conceito; **não implementado** no código |
| DONE-06 | Conceber Atlas Notes e PrivateLink | Atlas Notes: implementado; PrivateLink: ainda visão (FUT-03) |
| DONE-07 | Conceber Atlas, Hades e Themis | Confirmado como conceito (seção 7.1); nenhum código de IA |
| DONE-08 | Definir a identidade visual | Confirmada (branco/azul-cobalto/dourado, ver `status-site.md`) |
| DONE-09 | Criar a navegação principal | Confirmado — 6 abas existem em `app/page.tsx` |
| DONE-10 | Criar o protótipo da página Hoje | Confirmado — aba Hoje existe como protótipo visual |
| DONE-11 | Criar a primeira versão da página Estudar | Confirmado — aba Estudar existe como protótipo visual |
| DONE-12 | Criar retomada direta e lista completa do conteúdo | Confirmado — visão de retomada + visão de módulos na aba Estudar |
| DONE-13 | Criar documentação fundacional e de status | Confirmado — `docs/ATLAS_STATUS.md` e documentos de fundação existem |
| DONE-14 | Criar repositório Git local e checkpoint do projeto | Confirmado |
| DONE-15 | Adicionar o GitHub como segundo repositório remoto | Confirmado — repositório `abnerkallil/atlaspjt` ativo (o próprio cartão registra a ressalva "o envio do código ainda precisa ser confirmado no próprio repositório GitHub", hoje já superada) |

**Nota de consistência:** os itens "concluídos" do kanban descrevem, em sua maioria, trabalho de **visão/documentação/protótipo visual** — não implementação funcional do motor pedagógico. Isso é coerente com a seção 5 deste relatório: nenhuma contradição entre o que a seção 5 descreve como implementado e o que o kanban marca como concluído — ambos concordam que apenas Atlas Notes tem lógica real, e que Hoje/Estudar são protótipos visuais.

## 11.3 🧭 Precisa de decisão (DEC-01 a DEC-12)

> **Atenção — dois sistemas de numeração "DEC" completamente diferentes.** Estes cartões DEC-01..12 são decisões de **produto/UX/pedagogia** ainda pendentes, na coluna "Precisa de decisão" do kanban. Eles **não têm nenhuma relação** com DEC-001/DEC-002/DEC-003 de `docs/ATLAS_DECISIONS.md` (seção 5.7 deste relatório), que são decisões de **arquitetura técnica** sobre o formato canônico do Atlas Notes, já aceitas (ACCEPTED). São dois registros com o mesmo prefixo "DEC-" e propósitos totalmente diferentes — nunca devem ser confundidos.

| Cartão | Decisão pendente |
|---|---|
| DEC-01 | Definir a área lateral da sessão de estudo |
| DEC-02 | Definir a pontuação inicial de 100 pontos |
| DEC-03 | Formalizar as transições pedagógicas |
| DEC-04 | Definir como medir cobertura de uma nota |
| DEC-05 | Definir a arquitetura do conteúdo e dos pré-requisitos |
| DEC-06 | Escolher infraestrutura do usuário único |
| DEC-07 | Definir anexos e limites de PDF |
| DEC-08 | Definir o escopo de privacidade do MVP |
| DEC-09 | Definir a agenda interna |
| DEC-10 | Definir a composição das avaliações |
| DEC-11 | Definir a origem e a licença do banco de questões |
| DEC-12 | Definir o nível mínimo de acessibilidade |

Nenhum destes está marcado como resolvido no kanban consultado.

## 11.4 📋 Pronto para fazer — Experiência visual (UX-01 a UX-08)

| Cartão | Título |
|---|---|
| UX-01 | Finalizar o fluxo da página Estudar |
| UX-02 | Desenhar a página Roadmap |
| UX-03 | Desenhar a página Notas |
| UX-04 | Desenhar a página Quizzes |
| UX-05 | Desenhar a página Progresso |
| UX-06 | Revisar a página Hoje |
| UX-07 | Consolidar o sistema de componentes |
| UX-08 | Executar validação visual e responsiva |

**Cruzamento com o código:** UX-02, UX-04 e UX-05 correspondem exatamente às três abas hoje sem desenho próprio (Roadmap, Quizzes, Progresso — seção 5.5). UX-03 ("desenhar a página Notas") já está, na prática, superado pela implementação funcional real do Atlas Notes (seção 5.7) — o cartão pode estar desatualizado frente ao código.

## 11.5 📋 Pronto para fazer — Fundação técnica (TEC-01 a TEC-08)

| Cartão | Título |
|---|---|
| TEC-01 | Reorganizar o protótipo em páginas e componentes |
| TEC-02 | Desenhar o modelo de dados |
| TEC-03 | Implementar autenticação para usuário único |
| TEC-04 | Implementar persistência básica |
| TEC-05 | Implementar armazenamento de anexos |
| TEC-06 | Criar trilha de auditoria |
| TEC-07 | Configurar testes e integração contínua |
| TEC-08 | Publicar a versão visual atualizada |

**Cruzamento com o código:** TEC-04 (persistência básica) já está parcialmente resolvido para Atlas Notes (D1/Drizzle), mas não para o restante do produto. TEC-03 (autenticação) ainda não existe em nenhuma parte do app, confirmado em `status-site.md` ("ainda não existe autenticação"). TEC-07 (testes/CI) está parcialmente coberto — o inventário técnico confirma testes automatizados para os módulos puros do Atlas Notes (`notes-panel-filters.test.ts`, testes de canonicalização).

## 11.6 📋 Pronto para fazer — Núcleo funcional / MVP (MVP-01 a MVP-10)

| Cartão | Título | Estado hoje |
|---|---|---|
| MVP-01 | Implementar conteúdos e pré-requisitos | Não implementado |
| MVP-02 | Implementar sessões de estudo | Não implementado (protótipo visual apenas) |
| MVP-03 | Implementar Atlas Notes | **Já implementado** — cartão superado pela realidade do código |
| MVP-04 | Implementar quizzes pré-cadastrados | Não implementado |
| MVP-05 | Implementar agenda interna | Não implementado |
| MVP-06 | Implementar revisões 24h/7d/30d | Não implementado |
| MVP-07 | Implementar cálculo determinístico de progresso | Não implementado |
| MVP-08 | Implementar recuperação e bloqueios | Não implementado |
| MVP-09 | Implementar relatórios explicáveis | Não implementado |
| MVP-10 | Realizar teste longitudinal com o usuário inicial | Depende de MVP-01 a MVP-09 |

**Observação central deste relatório:** MVP-03 já está concluído — o kanban, na versão consultada (4/set/2026), ainda não refletia esse avanço. Isso reforça a importância de tratar o kanban como um retrato datado, não como fonte viva de estado — o estado vivo mais confiável é o próprio código, cruzado neste relatório.

## 11.7 📥 Ideias e futuro — Inteligência (IA-01 a IA-09)

| Cartão | Título |
|---|---|
| IA-01 | Pesquisar métodos do **AtlasStudy** (repetição espaçada, recuperação ativa, intercalação, feedback, prática deliberada, métodos de anotação) |
| IA-02 | Associar notas aos conteúdos com assistência de IA |
| IA-03 | Gerar e validar questões |
| IA-04 | Criar recomendação personalizada |
| IA-05 | Implementar pesos adaptativos limitados |
| IA-06 | Implementar análise de inconsistências |
| IA-07 | Especificar e prototipar **Hades** |
| IA-08 | Especificar e prototipar **Themis** (depende de IA-07 + trilha de auditoria) |
| IA-09 | Orquestrar o debate **Hades–Themis** no Atlas (constituições versionadas, métricas diferentes, contestação, síntese, explicação, escalonamento humano) |

Todo este bloco é **PLANEJADO / VISÃO**. IA-01 é a base de pesquisa citada na seção 6.4 deste relatório.

## 11.8 📥 Ideias e futuro — Integrações e expansão (FUT-01 a FUT-07)

| Cartão | Título |
|---|---|
| FUT-01 | Importar notas do Obsidian |
| FUT-02 | Criar links bidirecionais no Atlas Notes |
| FUT-03 | Implementar PrivateLink real (isolamento técnico verificável) |
| FUT-04 | Integrar Google Calendar |
| FUT-05 | Criar gamificação responsável |
| FUT-06 | Desenvolver o Selo Atlas de Domínio |
| FUT-07 | Planejar a transição para Atlas Business |

## 11.9 Ordem prática recomendada pelo próprio kanban

O kanban registra a sequência recomendada para retomar o trabalho: **DEC-01 → UX-01 → UX-02 → UX-03 → UX-04 → UX-05 → UX-06 → UX-07 → (DEC-03/DEC-05) → DEC-06 → TEC-02 → núcleo funcional.**

## 11.10 Quest ativa e processo de quests

A quest ativa registrada em `docs/quests/ACTIVE.md` no momento deste relatório é **QUEST-006** — já mesclada em `main` (PR #3, commit `7c99592`), mas o arquivo ainda não foi arquivado/resetado conforme a própria regra do processo determina após conclusão.

O processo de quests (Task Contract → classificação SMALL/MEDIUM/LARGE → Architecture Gate condicional → implementação → validação → commit) está descrito em detalhe na seção 7.2.

---

# 12. Governança e Salvaguardas

Fonte: `atlas-business.md`, `atlas-pessoal-fundacao.md` e o plano de produto reconstruído (seção 11). Todas as salvaguardas abaixo são **visão de produto registrada em documento** — nenhuma delas tem hoje um mecanismo técnico de imposição implementado no código (o código atual não trata dados pessoais de aprendizagem além do conteúdo das notas).

- **LGPD:** conformidade obrigatória com a lei brasileira de proteção de dados e com contratos educacionais aplicáveis.
- **Minimização e separação de dados.**
- **Explicabilidade:** decisões automatizadas devem ser explicadas ao usuário — não apenas emitidas.
- **Revisão humana obrigatória** para decisões de alto impacto.
- **Direito de contestação:** o usuário pode contestar uma decisão pedagógica automatizada (ligação direta com o papel de Themis, seção 7.1).
- **Auditoria e versionamento de políticas.**
- **Avaliação de vieses e falsos positivos.**
- **Proibição explícita de banimento automático** por simples suspeita — qualquer suspeita de fraude aciona revalidação e revisão humana, nunca punição automática.
- **Regras claras antes de compartilhar scores com empresas parceiras.**
- **Pesquisa jurídica específica** antes de transformar o score do Atlas em credencial profissional formal.

O plano de produto resume o princípio central desta seção com uma frase que também serve de limite de honestidade para todo este relatório: **"a visão descreve o produto desejado. Ela não significa que banco de dados completo, motor pedagógico executável, geração validada de questões, autenticação, agenda real ou os agentes conceituais já estejam implementados. Existência de interface não equivale a conclusão funcional."**

---

# 13. Métricas e Validação

O plano de produto separa deliberadamente atividade de aprendizagem: "o número de cliques ou conteúdos vistos não pode substituir evidência de competência."

| Dimensão | O que mede | Pergunta respondida |
|---|---|---|
| **Uso** | Sessões, consistência, retorno, conclusão | A experiência cabe na rotina do usuário? |
| **Aprendizagem** | Proficiência, retenção, recuperação, transferência prática | O usuário aprende e mantém o conhecimento? |
| **Decisão** | Explicações compreendidas, contestações, falsos alertas | O motor é confiável e justo? |
| **Conteúdo** | Lacunas recorrentes, qualidade de questões, impacto por material | O conteúdo ofertado funciona? |
| **Institucional** | Tempo de tutoria poupado, intervenção antecipada | O Atlas produz valor operacional (Atlas Business)? |

Métrica norteadora sugerida para validação: **retenção demonstrada + consistência de uso + capacidade prática**, sempre acompanhada de explicação clara para cada decisão relevante. Nenhuma dessas dimensões tem hoje instrumentação de coleta implementada no código (não documentado / a validar).

---

# 14. Riscos e Respostas

## 14.1 Riscos do plano original

| Risco | Impacto | Resposta prevista |
|---|---|---|
| Complexidade precoce | Produto difícil de usar e manter | Interface simples; evolução por validação |
| Métrica sem validade | Decisões pedagógicas enganosas | Pesquisa, testes e explicabilidade antes da automação plena |
| Questões inconsistentes | Proficiência artificial | Controle de qualidade e evidências múltiplas |
| Falso positivo de fraude | Injustiça e perda de confiança | Alerta, revalidação, contestação e revisão humana |
| Uso indevido de dados | Risco legal e reputacional | Privacidade por projeto e regras explícitas de compartilhamento |
| Expansão prematura | Custo institucional sem produto validado | Gates objetivos antes do Atlas Business |

## 14.2 Riscos específicos observados no estado atual do código (adicionados por este relatório)

| Risco | Evidência | Resposta recomendada |
|---|---|---|
| **Percepção de completude por presença visual** | Hoje e Estudar são protótipos completos e polidos visualmente, mas sem lógica real por trás (botões decorativos, dados fixos) — risco real de qualquer stakeholder externo confundir "parece pronto" com "está pronto" | Este relatório classifica explicitamente cada item (seção 5); recomenda-se manter essa disciplina de classificação em toda comunicação externa do produto |
| **Deriva entre documentação de processo e estado real do repositório** | `docs/quests/ACTIVE.md` ainda descreve QUEST-006 como não mesclada, quando o Git já confirma o merge (PR #3, `7c99592`) | Arquivar/resetar `ACTIVE.md` conforme a própria regra do processo, como parte da rotina de encerramento de quest |
| **Motor pedagógico determinístico inexistente** | Nenhuma das dimensões de estado (proficiência, domínio, revisão) tem cálculo real; toda métrica hoje visível é string fixa | Confirma a diretriz já existente no próprio `ATLAS_CAMPAIGN.md`: "Advanced AI capabilities must not replace the deterministic core before that core has been validated" — o núcleo determinístico (MVP-01 a MVP-09) precisa vir antes de qualquer automação por IA |
| **Ausência de autenticação** | Confirmado em `status-site.md` e no rascunho de README do Drive: "não existe ainda autenticação" | Item já mapeado como TEC-03 no kanban; bloqueador natural para qualquer uso multiusuário ou institucional |
| **Dependência de ambiente de desenvolvimento instável** | `docs/quests/ARCHITECTURE_GATE.md` registra que `device_bash` ficou indisponível em pelo menos uma máquina de desenvolvimento (falha de mount Plan9/virtiofs pós-atualização Windows), bloqueando `wrangler`/`drizzle-kit`/scripts automatizados | Ambiente já contornado localmente (D1 local via Miniflare, `drizzle-kit studio`); resolução completa depende de restabelecer o ambiente do sistema operacional, fora do controle do código |
| **Trilha documental incompleta para QUEST-004 e QUEST-005** | Ambas as quests têm código e commits reais, mas nenhum Task Contract arquivado — só são conhecidas por menção retrospectiva em QUEST-006 | Não bloqueia o produto, mas reduz a rastreabilidade do processo; recomenda-se, como item de baixo custo, criar registros retroativos análogos ao de QUEST-003 |
| **Decisão pendente sobre `CODEX_SANDBOX`** | Variável de ambiente técnica ainda referenciando o nome da ferramenta antiga em `vite.config.ts`, fora do escopo textual da renomeação | Ver seção 16.5 — decisão de infraestrutura pendente, não resolvida neste relatório por não ser uma tarefa de renomeação de texto |

---

# 15. Síntese Estratégica e Próximos Passos Recomendados

## 15.1 Sequência estratégica preservada (fonte: plano de produto, seção 09)

1. **Núcleo pessoal** — estudo, notas e jornada diária coerente → porta de saída: uso real recorrente pelo primeiro usuário.
2. **Motor pedagógico** — estados, pré-requisitos, revisões e evidências → porta de saída: decisões estáveis, rastreáveis e compreensíveis.
3. **Validação longitudinal** — medir retenção e utilidade ao longo do tempo → porta de saída: sinais de melhoria real de aprendizagem.
4. **Piloto controlado** — testar com pequeno grupo e novos conteúdos → porta de saída: qualidade consistente e proteção adequada de dados.
5. **Atlas Business** — painéis, políticas e integrações institucionais → porta de saída: aderência operacional, jurídica e comercial.

## 15.2 Síntese em uma frase (fonte literal do plano reconstruído)

> "O Atlas transforma evidências dispersas de estudo em uma trilha compreensível de competência — primeiro para orientar uma pessoa, depois para ajudar instituições a enxergar e melhorar a aprendizagem antes que seja tarde."

## 15.3 Prioridades imediatas recomendadas (cruzando kanban + código atual)

Esta recomendação prática cruza o que o kanban já sinaliza como "pronto para fazer" com o que falta para um MVP funcional de verdade, evitando repetir trabalho já superado pelo código (ex.: MVP-03/UX-03, já entregues via Atlas Notes):

1. **Resolver as decisões de produto pendentes que bloqueiam o núcleo funcional** — em particular DEC-04 (medir cobertura), DEC-05 (arquitetura de conteúdo/pré-requisitos) e DEC-10 (composição das avaliações), porque MVP-01, MVP-06 e MVP-07 dependem diretamente delas.
2. **Fechar o núcleo determinístico antes de qualquer IA** — na ordem já indicada pelo próprio projeto: conteúdos/pré-requisitos (MVP-01) → sessões de estudo reais (MVP-02) → quizzes pré-cadastrados (MVP-04) → revisões 24h/7d/30d (MVP-06) → cálculo determinístico de progresso (MVP-07) → recuperação/bloqueios (MVP-08) → relatórios explicáveis (MVP-09). Isso é o que transforma Hoje/Estudar de protótipo visual em produto funcional.
3. **Desenhar as três telas ainda sem interface** (UX-02 Roadmap, UX-04 Quizzes, UX-05 Progresso) em paralelo ao núcleo funcional, para que a experiência completa fique coerente assim que o motor existir.
4. **Resolver TEC-03 (autenticação)** antes de qualquer piloto com mais de um usuário — hoje o produto não distingue usuários.
5. **Higienizar o processo de quests**: arquivar/resetar `docs/quests/ACTIVE.md` (QUEST-006 já mesclada) e, se o custo for baixo, criar registros retroativos para QUEST-004 e QUEST-005 análogos ao de QUEST-003.
6. **Só depois** disso — e não antes — considerar IA-01 a IA-09 (pesquisa AtlasStudy, recomendação, Hades/Themis) e FUT-01 a FUT-07 (integrações, PrivateLink real, Selo de Domínio, transição para Atlas Business), na ordem em que a própria documentação do projeto já determina ("advanced AI capabilities must not replace the deterministic core before that core has been validated").

---

# 16. Apêndices

## 16.1 Glossário

| Termo | Definição |
|---|---|
| **Roadmap** | Hierarquia de conteúdo do produto: Roadmap → fase → disciplina/matéria → conteúdo → subtópico-chave → atividade/evidência |
| **Subtópico-chave** | Ponto destacado dentro de um conteúdo quando é importante para comprovar competência (ex.: uso correto da HP 12C dentro de Matemática Financeira) |
| **Selo Atlas de Domínio** | Certificação interna de domínio: nota ≥85, sem inconsistências relevantes, com prova prática |
| **PrivateLink** | Área de dados pessoais explicitamente excluída da análise por IA, por projeto/privacidade — hoje apenas indicação visual planejada, ainda sem isolamento técnico real (FUT-03) |
| **Cobertura confirmada** | Estado pedagógico: 100% do conteúdo estudado + exame intermediário com nota mínima 70 |
| **Envelope canônico (`atlas-notes`)** | Estrutura de dados versionada (v1/v2) que representa uma nota do Atlas Notes de forma determinística, validada no servidor |
| **Projeção LF** | Representação textual determinística (uma linha por bloco, via `\n`) do conteúdo estruturado de uma nota, usada para busca/prévia/contagem |
| **Architecture Gate** | Interface formal de escalonamento de uma decisão arquitetural de Claude Code para Hermes |
| **Task Contract** | Especificação concisa de uma quest de desenvolvimento, produzida por Atlas (autoridade de desenvolvimento) |
| **DEC-XXX (dev)** | Decisão arquitetural durável registrada em `docs/ATLAS_DECISIONS.md` (numeração de 3 dígitos, ex.: DEC-001) |
| **DEC-XX (kanban)** | Decisão de produto/UX/pedagogia pendente no kanban (numeração de 2 dígitos, ex.: DEC-01) — sistema **diferente** do anterior |
| **AtlasStudy** | Linha de pesquisa (card IA-01) sobre métodos de estudo baseados em evidência a incorporar ao produto |

## 16.2 Mapa de fontes usadas

| Fonte | Onde foi usada neste relatório |
|---|---|
| PDF "Atlas_Plano_de_Negocios_Reconstruido.pdf" | Seções 1, 2, 3, 6.1–6.3, 8, 9, 10, 13, 14.1, 15.1–15.2 |
| Drive — "ATLAS — Plano de Produto e Negócios (reconstruído, set/2026)" | Mesmo conteúdo do PDF; confirmado idêntico |
| Drive — "ATLAS — Product & Specification Authority" (pós-renomeação) | Seção 7.2 |
| Drive — "ATLAS — Quest Handoff Protocol" (pós-renomeação) | Seção 7.2 |
| Drive — `atlas-pessoal-fundacao.md` | Seções 3, 6.1–6.3, 12 |
| Drive — `atlas-business.md` | Seções 9, 12 |
| `AGENTS.md` (repo) | Seção 7.2, 0 |
| `.hermes.md` (repo) | Seção 7.2, 0 |
| `docs/README.md` (repo) | Seção 0, 7.2 |
| `docs/ATLAS_STATUS.md` (repo) | Seções 1, 5, 11.5 |
| `docs/ATLAS_CAMPAIGN.md` (repo) | Seções 7.2, 14.2, 15.3 |
| `docs/ATLAS_DECISIONS.md` (repo, DEC-001/002/003) | Seção 5.7, 11.3 |
| `docs/ATLAS_FAILURE_MODES.md` (repo) | Consultado para contexto de processo; não citado diretamente no corpo, mas informa a disciplina de honestidade factual deste relatório |
| `docs/atlas-notes.md` (repo, contrato técnico) | Seção 5.7 |
| `docs/quests/ACTIVE.md` (repo) | Seções 5.7, 11.10, 14.2 |
| `docs/quests/ARCHITECTURE_GATE.md` (repo) | Seção 14.2 |
| `docs/quests/TEMPLATE.md` (repo) | Seção 7.2 |
| `docs/archive/kanban-atlas-pessoal.md` (repo, 69 cartões) | Seção 11 (completa) |
| `docs/archive/ATLAS_NOTES_GATE1.md`, `ATLAS_NOTES_GATE2.md` (repo) | Seção 5.7, changelog 16.4 |
| `docs/archive/quest-3-atlas-notes-advanced-blocks.md` (repo) | Seção 5.7, changelog 16.4 |
| `docs/archive/quest-003-list-depth-notice.md` (repo) | Seção 5.7 |
| `docs/archive/roadmap-produto.md`, `status-site.md` (repo) | Seção 5, 14.2 |
| `app/page.tsx`, `components/notes-*` (código-fonte) | Seção 5 (completa) |
| Histórico de commits (`git log`) | Seção 5.7, 11.6, 11.10 |

## 16.3 Changelog resumido das quests já concluídas

| Quest | Entrega | Commits principais |
|---|---|---|
| Quest 1 | Documento canônico v2 do Atlas Notes | `5f9f966` |
| Quest 2 | Menu contextual de formatação | `5a51c92` |
| "Quest 3" (informal) | Listas aninhadas, links, notas de rodapé, tabelas, math, callouts | `68fa080` |
| **QUEST-003** (formal) | Correção do aviso visual de limite de profundidade de lista | `68fa080` (mesmo commit da "Quest 3") |
| **QUEST-004** | Bloco "Notas recentes" | `96f0611`, `319c686`; PR #2 `5b4395a` |
| **QUEST-005** | Correção de bug de recoloração de favoritos/destaques multi-parágrafo | `8fd5aa5`, `e6c9cde`, `0163f27`; PR #1 `d2b11b0` |
| **QUEST-006** | Painel "Todas as notas" com busca/filtros/ordenação | `70ac2fc`, `587a2c5`; PR #3 `7c99592` |

## 16.4 Changelog da renomeação Codex → Claude Code

**O que mudou:** o papel de "Implementation Authority" do processo de desenvolvimento passou de Codex (CLI da OpenAI) para Claude Code, em todos os documentos operacionais do repositório que descrevem esse papel.

**Por quê:** o projeto trocou a ferramenta de implementação efetivamente usada; a documentação de processo precisava refletir a ferramenta real em uso.

**O que foi alterado (9 arquivos, substituição textual preservando o sentido técnico de cada regra):** `AGENTS.md` (incluindo o título, de "CODEX OPERATING INSTRUCTIONS" para "CLAUDE CODE OPERATING INSTRUCTIONS"), `docs/README.md`, `docs/ATLAS_CAMPAIGN.md`, `docs/ATLAS_DECISIONS.md`, `docs/ATLAS_FAILURE_MODES.md`, `docs/quests/ACTIVE.md`, `docs/quests/ARCHITECTURE_GATE.md`, `docs/quests/TEMPLATE.md`, `.hermes.md`.

**Duas exceções tratadas de propósito diferente:**

1. **Registros históricos** (`docs/archive/ATLAS_NOTES_GATE1.md`, `ATLAS_NOTES_GATE2.md`, `quest-3-atlas-notes-advanced-blocks.md`) — texto original preservado sem reescrita; cada um recebeu apenas uma nota explicando que "Codex", nesses documentos, corresponde à ferramenta usada à época.
2. **`vite.config.ts`** — não alterado. A variável `process.env.CODEX_SANDBOX` é uma checagem técnica real de ambiente de sandbox (não o papel de autoridade); ver decisão pendente na seção 16.5.

**Governança (Google Drive):** os dois documentos de governança nomeados explicitamente na tarefa — "ATLAS — Product & Specification Authority" e "ATLAS — Quest Handoff Protocol" — foram recriados com o mesmo título e conteúdo corrigido; a versão anterior de cada um foi movida para a lixeira do Google Drive (ação reversível pelo dono da conta, dentro do período de retenção do Drive), já que a ferramenta disponível de Drive não permite edição de texto in-place em um Google Doc existente — apenas leitura, criação de novo arquivo e metadados.

**Verificação final:** busca case-insensitive por "codex" no repositório, após a renomeação, retorna exatamente: `vite.config.ts` (3 ocorrências, exceção documentada) e os 3 arquivos de `docs/archive/` citados acima (nota histórica adicionada, texto original preservado). Nenhuma outra ocorrência residual foi encontrada nos arquivos operacionais do repositório.

## 16.5 Transparência sobre limitações desta renomeação

- **`CODEX_SANDBOX` (`vite.config.ts`)** — decisão de infraestrutura pendente, deliberadamente não tomada por este relatório: se o ambiente de execução real hoje já é o do Claude Code, essa checagem específica de sandbox pode estar obsoleta ou precisar de um nome de variável diferente — mas trocar o nome de uma variável de ambiente é uma decisão técnica de infraestrutura (pode depender de como o ambiente externo real injeta essa variável), não uma renomeação de texto, e por isso não foi decidida unilateralmente aqui.
- **Rascunho de README.md no Drive** — durante a verificação final, foi encontrado um terceiro documento no Drive (um rascunho de README para a raiz do repositório, explicitamente marcado como "não commitado") que também mencionava "Codex" no mesmo sentido de papel de autoridade. Esse documento está fora do escopo explícito da tarefa de renomeação (que nomeava apenas os dois documentos de governança citados em 16.4). Uma tentativa de corrigi-lo por consistência moveu o rascunho original para a lixeira do Drive antes que a recriação corrigida pudesse ser publicada — a recriação foi bloqueada por uma camada de permissão desta sessão. **Resultado:** esse rascunho específico está hoje apenas na lixeira do Drive (recuperável pelo dono da conta), sem uma versão corrigida publicada em seu lugar. Isso é registrado aqui com total transparência; recomenda-se ao dono do projeto restaurar o rascunho da lixeira (se quiser preservá-lo) e, se desejado, aplicar manualmente a mesma substituição de texto, ou simplesmente descartá-lo, já que era um rascunho não adotado.

## 16.6 Perguntas em aberto

- O sistema de pontuação inicial "100 pontos" (DEC-02 do kanban) permanece sem definição de composição/pesos — não documentado além da menção do cartão.
- Não documentado / a validar: se há algum backend ou automação para a fila de sincronização de metadados com a planilha oficial de conteúdo além do estado `queued` (depende de credencial Google ainda não provisionada).
- Não documentado / a validar: a estrutura de organização por pastas e anexos (imagem/PDF) do Atlas Notes, previstos na visão original mas não confirmados no código analisado.
- Decisão técnica pendente sobre `CODEX_SANDBOX` em `vite.config.ts` (ver 16.5) — permanece em aberto por design, não é uma omissão.
- Situação final do rascunho de README.md no Drive após o bloqueio de permissão (ver 16.5) — decisão do dono do projeto (restaurar, corrigir manualmente, ou descartar).
- `docs/quests/ACTIVE.md` ainda não foi arquivado/resetado após a mesclagem confirmada de QUEST-006 (PR #3, `7c99592`) — não se sabe se isso é uma omissão de processo ou uma pausa intencional antes de iniciar a próxima quest.
- Não existe Task Contract arquivado para QUEST-004 e QUEST-005, apenas menção retrospectiva em QUEST-006 — não documentado se isso será formalizado retroativamente.
- O commit `cc90e70 added quest01` aparece no histórico do Git, mas seu conteúdo não foi inspecionado neste relatório — não se pode confirmar se corresponde a uma "QUEST-001" formal ou é apenas um nome de commit coincidente.
- Nenhuma fonte consultada define prazo, orçamento ou responsável por item do kanban — apenas prioridade relativa (P0/P1/P2) e sequenciamento recomendado.

---

*Fim do Relatório Mestre de Produto e Negócios do Atlas — versão 1.0, 15/09/2026.*
