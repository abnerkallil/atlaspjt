# Apolo — motor de avaliação determinístico (DEC-014)

Sem IA externa: todo o Apolo é regra fixa, em código, auditável. Cobre a
curadoria de questões (APO-01..08, ver `docs/FONTES.md` e `docs/QUESTOES.md`)
e, a partir daqui, o motor que usa o banco para avaliar o aluno.

## Modelo do aluno (APO-09, DEC-017)

O Apolo acompanha a habilidade do aluno por **tema × conteúdo × subtópico**
(Elo) e a memória de cada questão já respondida (dificuldade, estabilidade e
recuperabilidade, inspirado no FSRS). As duas coisas só **priorizam ou
selecionam** questão — nunca mudam a nota do quiz, que continua sendo
calculada por `lib/quizzes.ts` (DEC-016: só o Apolo emite nota, e aqui ele
nem participa disso).

Tudo em `lib/apolo/skill.ts` (funções puras) e `lib/apolo/profile.ts` (leitura
do D1). **Nenhum estado incremental é gravado**: cada chamada a
`getStudentProfile` reprocessa o histórico inteiro de tentativas enviadas
(`atlas_quiz_attempts` com `status = 'enviado'`) do zero. Reprocessar duas
vezes o mesmo histórico dá sempre o mesmo resultado — é a garantia que o
DEC-017 pede (a regra pode mudar amanhã; o estado de hoje não precisa ser
migrado, só recalculado).

- **Habilidade Elo**: começa em 1200 por grupo (tema, conteúdo, subtópico).
  A dificuldade nominal da questão (`facil`/`media`/`dificil`, curada à mão)
  vira o "oponente" Elo (1000/1200/1400). O passo de atualização (K) encolhe
  conforme mais respostas se acumulam naquele grupo — K alto no início,
  estabiliza perto de 8.
- **Memória por questão**: dificuldade (1 a 10, prior pela dificuldade
  nominal), estabilidade (dias até ~90% de chance de lembrar) e data de
  vencimento (`dueAt`). Acerto reduz a dificuldade e aumenta a estabilidade
  (mais, se o aluno acertou depois de muito tempo); erro faz o oposto. A
  curva de esquecimento usada é uma simplificação do FSRS
  (`R(t) = (1 + t/(9·S))⁻¹`), não o algoritmo FSRS oficial (que ajusta 19
  parâmetros por otimização) — essa parte real da fila de recuperação
  (política de revisão, agenda) é entregue no APO-15.
- Questão sem `theme` (anterior ao Apolo) não entra no cálculo — o Apolo só
  enxerga o que ele próprio classificou.

`GET /api/apolo/perfil` retorna `{ temas, filaRecuperacao }`: a habilidade por
grupo e a lista de questões por ordem de vencimento (`dueAt`).

## Estatística de itens (APO-10, DEC-017)

Mede cada questão para tirar as ruins das provas. Por questão: taxa de
acerto, dificuldade Elo (mesmo sistema do modelo do aluno, mas por questão em
vez de por tema/conteúdo/subtópico — as duas Elo são independentes, não se
influenciam), correlação item-total (point-biserial entre acertar o item e a
nota da tentativa inteira) e taxa de escolha de cada alternativa (para
múltipla escolha, já desembaralhada de volta ao índice original do banco).
Por conteúdo ("instrumento aplicado"): KR-20.

Tudo em `lib/apolo/item-stats.ts` (funções puras) e `lib/apolo/item-audit.ts`
(leitura do D1 e o corte automático). Mesmo princípio do APO-09: recalculado
do zero a cada chamada, nenhum estado incremental.

**Simplificação assumida (disclosed):** o KR-20 de livro-texto pressupõe
várias pessoas respondendo à mesma aplicação ao mesmo tempo (a variância vem
da nota de cada pessoa). Aqui há só o Abner, então a variância usada é entre
as tentativas já enviadas do **mesmo conteúdo** — o quiz é reaplicado a cada
reprovação/retomada (DEC-04), então essas repetições fazem o papel que
"várias pessoas" fariam no KR-20 de livro-texto. Com menos de 2 tentativas
daquele conteúdo, ou variância zero (sempre a mesma nota), o KR-20 fica nulo.

**Regras de alerta** (amostra mínima de 30 respostas, por item): correlação
item-total abaixo de 0,10; acerto acima de 95%; ou alguma alternativa
incorreta escolhida em menos de 5% das respostas (a alternativa certa nunca
conta como "distrator fraco" — baixa escolha nela seria baixo acerto, já
coberto pela outra regra). Questão alertada tem `lifecycle_state` virando
`'curadoria'` e `active` virando `0` — some do próximo sorteio (que só lê
`active = 1`) e cai na mesma fila de revisão humana do APO-07, sem apagar
nada nem mexer em nota já emitida.

O corte roda sozinho a cada quiz enviado (`app/api/quizzes/[id]/route.ts`,
depois que a nota já foi gravada; uma falha na auditoria nunca derruba a
resposta do quiz). `GET /api/apolo/estatisticas` expõe tudo isso para leitura
(`{ items, instruments, alerts }`), sem aplicar nenhum corte por si só.

## Planos de prova (APO-11)

Cada instrumento (quiz, revisão 24h/7d/30d, corretivo, atividade, exame de
meio de curso, atividade final, recuperação, proficiência) tem uma regra fixa
e visível de composição: tamanho, mistura de tipo de questão, mistura de
Bloom, mistura de dificuldade, intercalação, tempo por tipo (reaproveita
`QUESTION_SECONDS` de `lib/quizzes.ts`) e corte de aprovação. Tudo em
`lib/apolo/plans.ts` (funções puras, sem I/O): `resolvePlan(instrumento,
áreaDeConhecimento?, overrides?)` monta o plano, `allocateCounts` converte uma
mistura de pesos em contagens inteiras que somam o tamanho do plano (maior
resto/Hamilton, determinístico), e `applyDifficultyFallback` resolve o risco
do card — quando o banco não tem questões suficientes numa faixa de
dificuldade, o excedente vai para a faixa vizinha (fácil-média-difícil) com
sobra, e um aviso é reportado; nenhuma questão é inventada.

O plano de `quiz` sem área de conhecimento é, de propósito, idêntico ao que
`lib/quizzes.ts` já faz hoje (`QUIZ_SIZE`, `QUESTION_SECONDS`,
`PASSING_SCORE`) — nada muda na prova atual. O perfil por área de
conhecimento do tema (`atlas_themes.knowledge_area`, APO-02) só ajusta a
mistura de tipo de questão: exatas prioriza cálculo/lacuna numérica; humanas
prioriza dissertativa; jurídico prioriza certo/errado; sociais aplicadas e
linguagens ficam mistas. "Biológicas" (uma das 6 áreas já presentes no schema,
mas que o card não listava) foi tratada como mista, igual sociais aplicadas,
até o Abner revisar.

**DEC-10 confirmado pelo Abner em 2026-10-08:** o card cita "Gate: não
(implementa o DEC-10)", e o DEC-10 do kanban pessoal ("Definir a composição
das avaliações", P0, Pedagogia/Produto) não tinha decisão formal registrada
em `docs/ATLAS_DECISIONS.md` até este card ser implementado. Pergunta feita
ao Abner no chat do projeto às 15:58 (`cmsg_015thNCrpovZtKsRcfQ4RaQBX9VTDhqU89TeJfXPPP7AgC`,
item 2: "Confirma o DEC-10 das Avaliações (exame de meio com 60 questões,
final 50/50, cascata)?") e resposta às 16:08
(`cmsg_015thNCrpovZtKsRcfQ4RaQBHJC7stLu1MZeGbV69v51i8`, "2 -> Sim."):
exame de meio de curso tem 60 questões; atividade final e exame de meio
pesam 50/50 na nota da disciplina (já documentado em
`docs/modelo-de-dados.md` linha 56); e a "cascata" (ordem de liberação
atividade → exame de meio → atividade final → recuperação, DEC-018) foi
confirmada em princípio — a fórmula exata de como a nota cascateia entre
essas etapas ainda não foi detalhada por ele, então continua sendo decisão
do card APO-19 quando chegar a vez.

Isso fixa o tamanho de `exame_meio` neste plano em 60 questões (antes um
rascunho com 20, só palpite). O peso 50/50 é uma regra de nota da
disciplina (entre exame de meio e atividade final), não de composição de
prova — fica fora do escopo de `ExamPlan` aqui, para o card que calcular a
nota final da disciplina decidir; **não confirma quantas questões a
atividade final tem** (continua rascunho de 20, sem decisão — o APO-19
fixou em 60, confirmado pelo Abner em 2026-10-09). Os perfis por
área de conhecimento do tema e os planos dos instrumentos sem motor próprio
(atividade, atividade_final, recuperação, proficiência — "fora da espinha",
só existem como estado da FSM em `lib/pedagogy/states.ts`) seguem como
primeiro rascunho deste card, não uma decisão fechada. Nenhum desses planos
está ligado à seleção real de questão ainda — isso é o APO-12 (seletor
adaptativo), que depende deste card.

## Seletor adaptativo (APO-12, DEC-017)

Monta a lista de questões de uma prova a partir do plano (APO-11), do perfil
do aluno (APO-09) e do histórico recente — `lib/apolo/selector.ts`,
`selectQuestions(plano, perfil, banco, histórico, semente)`, função pura, sem
I/O: mesma entrada, sempre a mesma prova. Nunca seleciona questão fora de
`lifecycleState: 'ativa'` (DEC-014) — rascunho, curadoria (inclusive a que o
APO-10 acabou de aposentar) e aposentada nunca saem daqui.

Prioridade, nessa ordem, cada questão ganha um motivo (`recuperacao-vencida`,
`subtopico-fraco`, `cobertura-do-plano`):

1. **Recuperação vencida** (`dueAt` já passou, fila do APO-09) — mais
   atrasada primeiro.
2. **Subtópico fraco** — grupo tema×conteúdo×subtópico com Elo de habilidade
   abaixo de 1150 (mesmo valor usado como oponente "média" em
   `lib/apolo/skill.ts`).
3. **Cobertura do plano** — o resto, respeitando a mistura de tipo e
   dificuldade do plano (`allocateCounts`, mesma conta do APO-11); escolhe
   sempre o tipo/faixa que o plano ainda mais precisa.

Em (1), (2) e na cobertura normal de (3), quando há mais de uma opção válida,
sorteia-se (com semente) entre as 5 melhores — evita expor sempre a mesma
questão. Nunca mais de uma questão por família de molde (`itemModelId`) na
mesma prova. Tenta não repetir o que está em `recentlySeen`; só volta a
considerar essas questões se não der para completar o plano sem elas (nunca
falta questão só pela regra de não repetição).

**Modo adaptativo** (`adaptive: true`, para prática e proficiência):
substitui a cobertura por tipo/dificuldade por um critério de Rasch de 1
parâmetro — escolhe sempre o item cuja dificuldade (Elo do item, APO-10) está
mais perto da habilidade do aluno no tema (mais informativo, ~50% de chance
de acerto), e aí **não** sorteia entre os 5 melhores: escolhe o mais próximo
diretamente, como um CAT (computerized adaptive testing) clássico — só
prioriza, nunca afeta nota (DEC-017). Item sem Elo/habilidade conhecida fica
por último.

Ainda não tem rota própria nem está ligado a `startQuiz`
(`lib/quizzes.ts`) — isso fica para quando um card ligar o seletor à tela de
verdade.

## Corretor e boletim (APO-13, DEC-016)

A correção que já existia em `lib/quizzes.ts` (`gradeQuestion`,
`scoreResults`) mudou de casa para `lib/apolo/corrector.ts`, **sem mudar
nenhuma regra**: mesma lógica, função por função, só realocada — o critério
de aceite do card é que toda tentativa antiga, recorrigida com o código
novo, dê exatamente a mesma nota de antes (conferido pelos testes que já
existiam em `tests/quizzes.test.ts`, incluindo os do PR #38/#39 de refazer
quiz sem mudar nota). `lib/quizzes.ts` agora importa essas funções do Apolo
e as reexporta com os mesmos nomes (`gradeQuestion`, `scoreResults`,
`PASSING_SCORE`, `VERIFICATION_MINIMUM`), então nenhum chamador precisou
mudar.

**Boletim** (`buildBoletim`): empacota um resultado já calculado — não é um
novo estado gravado nem recalcula nada; o resultado de uma tentativa já é
imutável desde o envio (`atlas_quiz_attempts.result_json` nunca é
reescrito, DEC-04/DEC-10). O boletim soma a versão do corretor
(`APOLO_CORRECTOR_VERSION`), a versão do plano (APO-11, quando aplicável) e,
por questão, o motivo (`correta`/`incorreta`/`anulada`) — pronto para
exibir ou auditar depois.

**Gabarito comentado por alternativa:** o schema já tem o campo
`optionExplanations`/`option_explanations_json` (APO-03), mas ele continua
sem ser lido em nenhum lugar — ligar essa leitura ao resultado do quiz
fica fora do escopo mínimo deste card (nenhuma rota ou tela pede isso
ainda) e é uma decisão disponível para um card futuro, não deste.

Gate: DEC-016, já ACEITO (PR #42) — nenhum Raf Gate novo para este card.

## Quiz do conteúdo pelo Apolo (APO-14)

Primeiro uso real do seletor (APO-12) e do corretor (APO-13) no quiz que o
Abner já faz todo dia (`startQuiz`, `lib/quizzes.ts`) — mas **ligado por
conteúdo**, não para todo mundo de uma vez: um conteúdo só passa a usar o
Apolo quando o banco já tem tema classificado (`atlas_questions.theme`) em
quantidade suficiente para o plano de hoje (DEC-10, 10 questões ativas e
classificadas). Essa é a mitigação que o próprio card pede para o risco já
conhecido ("banco pequeno repete questão" — depende do APO-08, carga
inicial, e do APO-16, moldes, nenhum dos dois terminado ainda). Sem isso,
o conteúdo continua exatamente no sorteio local de sempre
(`selectQuestions`/`directedSelection`, MVP-08) — nada muda até o Abner
classificar o banco daquele conteúdo.

Quando ligado: `resolvePlan('quiz')` (APO-11, mesmo tamanho/tempo/corte de
hoje) + `getStudentProfile` (APO-09) alimentam `selectQuestions` do Apolo
(APO-12), que prioriza recuperação vencida, depois subtópico fraco, depois
cobertura do plano — e nunca seleciona questão fora de `lifecycle_state =
'ativa'` (DEC-014), ao contrário do sorteio local (que só olha `active =
1`; as duas colunas deveriam estar sempre em sincronia, mas só o Apolo
checa a canônica).

**Quiz dirigido (MVP-08) preservado, não substituído:** o FSRS do Apolo
(`lib/apolo/skill.ts`) só marca uma questão errada como "vencida" depois de
meia estabilidade mínima (12h) — então, sozinho, não traria de volta as
erradas no mesmo dia como o quiz dirigido sempre trouxe. Por isso as
erradas da última reprovação (`recoveryStatus`) entram forçadas na fila de
recuperação do seletor como "vencidas agora", além da fila real do FSRS
(que pode trazer de volta questões de outras reprovações mais antigas,
inclusive de outros conteúdos). `QuizAttempt.directed` continua contando
só as forçadas (o mesmo significado de sempre: "quantas erradas da última
reprovação voltaram").

Nenhuma migration nova. O formato gravado na tentativa (`questions_json`)
não muda — a seleção decide quais `Question` da `listQuestions` de sempre
entram na prova, não troca o formato delas.

**Nota de implementação:** mover `resolvePlan`/`selectQuestions`(Apolo)
para dentro de `startQuiz` criou um ciclo de import em runtime
(`lib/quizzes.ts` → `lib/apolo/plans.ts`/`lib/apolo/selector.ts` → de volta
para `lib/quizzes.ts`, que já emprestava `QUESTION_KINDS`/`QUIZ_SIZE`/
`QUESTION_SECONDS` a eles). Essas três constantes mudaram de casa para
`lib/apolo/types.ts` (sem depender de nada que crie ciclo), e
`lib/quizzes.ts` as reexporta com os mesmos nomes — nenhum chamador mudou.

Gate: não (o card não pede um Raf Gate novo).

## Revisões, corretivo e fila de recuperação (APO-15)

Revisão (24h/7d/30d) e corretivo passam a ter plano próprio em
`lib/apolo/plans.ts` em vez de reaproveitar o do quiz sem distinção. Tamanho
**confirmado pelo Abner em 2026-10-08**: começa em 10 questões (igual ao
quiz) e sobe para 30 (24h e 7d) ou 60 (30d), "conforme o banco permitir" —
quando o conteúdo tem menos questões classificadas que isso, o seletor (ou
o sorteio local, para conteúdo ainda sem tema) devolve só o que existe, sem
inventar questão nem travar a revisão. A revisão de 30 dias intercala
questões de dificuldade média e difícil (`difficultyMix: { media: 0.5,
dificil: 0.5 }`), por cobrar mais depois de mais tempo.

**Simplificação assumida (disclosed):** o card também pede essa revisão de
30 dias intercalada com **conteúdos vizinhos**, não só o próprio. Toda
seleção do Apolo hoje — seletor (APO-12), planos (APO-11), este card — é
escopada a um único `contentId`; buscar banco de outro conteúdo na mesma
prova exigiria decidir o que "vizinho" significa (mesma disciplina? posição
adjacente no roadmap?) e como gravar isso numa tentativa que hoje tem um
`content_id` só (`atlas_quiz_attempts`). Isso fica para um card futuro,
quando (ou se) o volume de questões por conteúdo justificar — hoje, com
banco pequeno em todo conteúdo real, intercalar dentro do próprio conteúdo
já cobre o objetivo ("cobrar mais depois de mais tempo").

**Fila de recuperação com formatura** (`lib/apolo/skill.ts`,
`recoveryQueueState`): uma questão que já errou alguma vez só "se forma"
(sai de consideração como pendente) depois de **3 acertos em sessões
diferentes** desde o último erro — dois acertos na mesma tentativa contam
como um só; errar de novo zera a contagem. Isso é mais rígido que o FSRS
puro do APO-09 (que já empurra o `dueAt` para longe com um único acerto) —
as duas coisas convivem: o FSRS decide **quando** reexpor a questão
(`dueAt`, já usado pelo seletor), isto decide **se** ela ainda conta como
"em recuperação" para quem olha a fila (hoje, a nova rota de leitura
abaixo). `getRecoveryQueue` (`lib/apolo/profile.ts`) combina as duas coisas
e `GET /api/apolo/recuperacao` expõe `{ queue }` por questão (tema,
conteúdo, vencimento, sessões corridas de acerto) — recalculada do zero a
cada chamada, mesmo princípio do resto do Apolo (DEC-017); só leitura,
nenhum corte aplicado aqui.

Nenhuma migration nova; nenhuma tela usa a rota nova ainda — fica para
quando um card ligar a agenda (MVP-05) a ela.

Gate: não.

## Modelos de item (APO-16)

Primeiro card que define geradores de verdade (o registro em si já existia
desde o APO-01) — 5 funções puras em `lib/apolo/generators.ts`, uma por
**categoria estrutural**: `calculo_percentual`, `equacao_linear`,
`lacuna_numerica_formula`, `certo_errado_regra`, `interpretacao_texto`. A
categoria estrutural é o próprio `generatorKey` do molde — já vinha separado
do `theme` desde o desenho original (DEC-014): o mesmo gerador serve moldes
de temas diferentes, só os `params` curados mudam. Isso é o que o card pede
com "um molde de índice financeiro de Contabilidade Geral empresta a
estrutura a um molde de alíquota de Direito Tributário" — `CG-MOD-01`/`02` e
`DT-MOD-01` reaproveitam `calculo_percentual` com parâmetros próprios de
cada tema (migração `0018_moldes_apo16.sql`, 10 moldes de Contabilidade
Geral + 1 de Direito Tributário, todos nascendo `rascunho`, como todo molde
desde o APO-01 — precisam de ativação explícita).

Cada gerador é construído para nunca produzir versão inválida, qualquer que
seja a semente — a garantia vem da aritmética do próprio gerador (sem laço
que possa não terminar, sem divisão por zero, sem valor negativo onde não
faz sentido), não de sorte com os parâmetros curados: `calculo_percentual`
sempre sorteia uma base múltipla de 100 (a parte sai de divisão exata, sem
arredondamento); `lacuna_numerica_formula` nunca deixa o caixa líquido
negativo (pagamento é sempre limitado ao disponível) nem divide por vida
útil zero; `equacao_linear` nunca sorteia coeficiente zero. `tests/apolo-
generators.test.ts` expande cada um dos 11 moldes com 10 mil sementes
diferentes e confere, em toda versão: resposta certa presente, distratores
distintos dela e entre si (para `multipla`/`certo_errado`), valor numérico
finito dentro do que o gerador garante (para `lacuna_numerica`), e resposta-
modelo não vazia (para `dissertativa`) — mais um teste de determinismo
(mesma semente, mesma versão) e um confirmando o reaproveitamento entre
temas.

**Simplificação assumida (disclosed):** "interpretação de texto curado" não
gera texto novo — sorteia entre algumas variantes de texto+pergunta já
escritas à mão nos `params` do molde. Um gerador que "interpreta" e produz
pergunta nova sobre um texto arbitrário exigiria compreensão de linguagem,
que o Apolo não tem por desenho (determinístico, sem IA, DEC-014). Isso é
reaproveitar o mesmo princípio do APO-07 (fila de rascunhos: toda questão
nasce curada por um humano antes de valer) aplicado a moldes.

Nenhuma migration grava questão em `atlas_questions` a partir destes
moldes — essa ligação (gerar sob demanda ou materializar no banco) é
decisão de um card futuro; este card só entrega o gerador+verificador e os
moldes em rascunho. Gate: não (coberto pelo DEC-014). Próximo passo antes de
qualquer um destes moldes valer em produção: Abner revisa 20 versões de
cada um e ativa (`setItemModelLifecycle`) — nenhum dos 11 está ativo ainda.

## Atividades (APO-17, DEC-018)

Atividade é uma nota própria do conteúdo, independente do `state` do DEC-03
(`lib/pedagogy/transitions.ts` nunca é tocado por ela) — pode ser feita a
qualquer momento, não só quando o quiz libera. `startAtividade` (`lib/
quizzes.ts`) é uma função separada de `startQuiz`, sem o lookup por
`PURPOSE_BY_STATE`: foi preciso extrair a lógica comum de montagem da
tentativa (banco de questões, plano, seleção de itens, `optionOrders`,
`INSERT`) para `createAttemptRecord`, já que `startQuiz` deriva o `purpose`
do estado do conteúdo e a Atividade não tem estado nenhum para derivar de.

Aprovação em Atividade exige nota **maior que 70%** (estrito), diferente do
quiz/revisão que aprovam com `>= 70%` — distinção pedida pelo DEC-018.
Reprovação pode ser refeita direto, sem limite nem penalidade (mesma
mecânica de refação do quiz, MVP-08).

Evidência (`kind='atividade'` em `atlas_evidences`) só é gravada quando a
tentativa é **aprovada** — diferente de quiz/revisão, que sempre gravam
evidência (aprovado ou reprovado), porque a FSM do DEC-03 precisa da
evidência nos dois casos para decidir entre `quiz-aprovado`/`quiz-
reprovado`. Atividade não tem transição nenhuma no DEC-03, então uma
reprovação não grava nada — fica só a tentativa em `atlas_quiz_attempts`.

Risco e congelamento (`lib/progress.ts`, `lib/reports.ts`) reaproveitam a
mesma trilha existente, como o DEC-018 pede (nenhuma estrutura paralela):
um conteúdo com atividade reprovada e nunca aprovada depois entra no mesmo
`frozenBy`/`atRisk` que os estados `em-revisao-ativa`/`bloqueado`/`aguardando-
quiz` já usavam, e o motivo some assim que alguma tentativa passa. Em
`assessRisk`, a atividade reprovada só sobe o nível para `atencao` — nunca
rebaixa um nível já `alto` pelo state — e o motivo da atividade aparece
junto, não no lugar do motivo do state.

A nota de Atividades em `lib/progress.ts` (`COMPONENTS.atividades`, peso 20
do DEC-02) usa a melhor nota aprovada por conteúdo (reprovações não entram
na média), igual ao componente de quiz.

**Correção de bug descoberto durante a implementação:** o índice único do
banco (`uq_atlas_quiz_attempts_open` em `drizzle/0009_quizzes.sql`) é por
`(content_id, purpose)` — uma tentativa de quiz em andamento não bloqueia
nem é devolvida por engano a quem chama `startAtividade` no mesmo conteúdo
(e vice-versa). O check de "tentativa em andamento" em `startQuiz` e
`startAtividade` foi escrito para respeitar essa mesma chave composta;
antes da Atividade existir isso era invisível (cada conteúdo só podia ter
um propósito "atual" por vez, via `PURPOSE_BY_STATE`), mas deixou de ser
seguro quando a Atividade passou a poder coexistir com qualquer state.
Teste de regressão em `tests/atividades.test.ts` prova a coexistência.

**Simplificação assumida (disclosed):** `/api/atividades` só expõe `GET`
(lista) e `POST` (iniciar) — envio e correção reaproveitam `POST /api/
quizzes/:id`, que já corrige por id da tentativa sem olhar o `purpose`
(mesmo padrão de toda rota Apolo adicionada até aqui: sem wiring de UI
ainda). `isPrerequisiteMet` por atividade (gatilho de pré-requisito entre
conteúdos) fica explicitamente em aberto, como o DEC-018 definiu. Gate:
não (coberto pelo DEC-018, ACCEPTED).

## Exame de meio de curso (APO-18)

Primeira prova **por disciplina** do Atlas — quiz, revisão, corretivo e
atividade são todos por conteúdo (`atlas_quiz_attempts`). Tudo em
`lib/apolo/exam.ts`, com tabela própria `atlas_exam_attempts` (migration
`0020_exames_apo18.sql`): uma linha por disciplina e instrumento, com o
escopo fotografado no início (`scope_json`), as questões, as respostas, o
resultado e o boletim (`result_json`), nota, aprovação, versão do plano e
versão do corretor.

**Liberação e início pela FSM que já existia** (DEC-03, `lib/pedagogy/
states.ts`), sem nenhuma transição nova (DEC-018 proíbe mexer em
`DISCIPLINE_TRANSITIONS`) — estes eventos só existiam na definição e nos
testes; é a primeira vez que código de produção os dispara:

1. `conteudo-50` (sistema, sem confirmação): disparado por
   `syncDisciplineState` quando pelo menos 50% dos conteúdos da disciplina
   estão cobertos — mesma lista `COVERED_STATES` do componente Cobertura de
   `lib/progress.ts`, não uma régua nova. Roda depois de todo quiz enviado
   (`app/api/quizzes/[id]/route.ts`, no mesmo esquema do corte do APO-10:
   uma falha aqui nunca derruba a resposta do quiz), a cada `GET
   /api/exames` e antes de iniciar o exame. Idempotente; corrida com outra
   chamada é ignorada do mesmo jeito que `submitQuiz` ignora `conflict`.
2. `iniciar-exame-meio` (usuário, **exige confirmação explícita**):
   `startExameMeio(db, disciplina, { confirmed })`. Sem `confirmed: true`,
   sai o mesmo `TransitionError` `'confirmation'` de qualquer transição
   (409 com `code: 'confirmation'` via `quizErrorResponse`) — conferido pela
   regra pura `planTransition` antes de montar a prova, então nada é gravado.
3. `exame-meio-entregue` (sistema): disparado pelo envio (`submitExam`),
   depois que o resultado já foi gravado.

**Tentativa única**, garantida no banco: índice único **não parcial** em
`(discipline_id, instrument)` — nem uma tentativa enviada, nem uma em
andamento, permitem uma segunda. Chamar `startExameMeio` de novo devolve a
tentativa existente (em andamento ou já entregue), sem nova transição; se
duas chamadas correrem, a que perder o `INSERT` devolve a da outra.

**Escopo ("primeira metade")**: todo conteúdo da disciplina com nível
curado `iniciante` ou `intermediario` — coluna nova
`atlas_contents.level` (migration `0019_niveis_apo18.sql`), texto livre no
banco e validado em código (`isContentLevel`), mesmo padrão de `theme`
(DEC-014). O nível é **curadoria humana** (`setContentLevel`), nunca
classificação automática — classificar por IA violaria o DEC-014. Conteúdo
`avancado` fica de fora; conteúdo sem nível também, quando a disciplina já
tem algum conteúdo nivelado. O escopo é gravado no início da tentativa
(`scope_json`, com a regra usada) e nunca recalculado — o boletim continua
reconstituível a partir do que ele mesmo guardou (DEC-016).

**Montagem da prova**: plano `exame_meio` (APO-11; 60 questões e corte de
70% já confirmados no DEC-10, intercalação ligada) + perfil do aluno
(APO-09) no seletor do Apolo (APO-12), com um parâmetro novo e opcional no
seletor, `perContentQuota`: um teto de questões por conteúdo, valendo em
todos os passos (recuperação vencida, subtópico fraco, cobertura) — sem ele,
recuperação vencida concentrada num conteúdo tomaria o exame inteiro.
`allocateContentQuotas` divide as 60 questões o mais igual possível entre os
conteúdos do escopo, sem passar do banco ativo de cada um (quem tem pouco
entrega tudo, a sobra vai para quem tem mais). A ordem final é embaralhada
com semente (intercalação de conteúdos). Para isso, `listQuestions` e
`listCandidateQuestions` (`lib/quizzes.ts`) passaram a aceitar também uma
lista de conteúdos (com um id só, a consulta é exatamente a de antes; lista
longa vai em lotes por causa do limite de 100 parâmetros do D1).

**Tempo**: 90 s por questão, somados no tempo total (`secondsByKind` do
plano `exame_meio`, que por isso passou à versão 2 — a versão 1 era o
rascunho com o tempo do quiz), **sem rolagem** de sobra para a questão
seguinte (essa regra é só da atividade final, APO-19). Cálculo e lacuna
numérica continuam sem limite, como em todo o Atlas — com uma delas na
prova, o exame não tem prazo. Entregar depois do prazo marca `late`, igual
ao quiz.

**Nota própria**: corrigida pelo corretor único (`gradeQuestion`/
`scoreResults`, APO-13), aprovada com nota >= 70% (`passingScore` do plano,
gravado na tentativa). Dissertativa segue o mesmo fluxo do quiz: `travar`
libera o gabarito para a autoavaliação (DEC-04), `enviar` corrige. O
resultado e o boletim são gravados uma única vez, sob guarda de status
(DEC-016). O boletim (`buildBoletim`) ganhou um campo opcional
`reliability: { kr20, basis, administrations }` — quiz e atividade seguem
sem ele.

**KR-20**: a conta pura saiu de dentro de `computeInstrumentStats` para
`kr20()` (`lib/apolo/item-stats.ts`), linha por linha a mesma matemática —
os números de referência de `tests/apolo-item-stats.test.ts` não mudaram.
O exame usa a mesma aproximação do APO-10 (aplicações repetidas no tempo no
lugar de várias pessoas), sobre todas as tentativas enviadas do exame de
meio de curso da disciplina, com a mesma guarda: nulo com menos de 2
aplicações ou variância zero.

**Progresso**: o componente Avaliações (peso 30, DEC-02) deixou de ser
fixo em "indisponível": com o exame entregue, vale nota do exame / 100
(aprovado ou não — é a nota emitida no boletim); sem exame, continua
indisponível. `loadProgressInput` lê `atlas_exam_attempts` enviados.

**Simplificação assumida (disclosed):**

- **Escopo por posição enquanto nada está nivelado.** Até a disciplina ter
  pelo menos um conteúdo com nível curado, o escopo é a primeira metade dos
  conteúdos pela posição no roadmap (⌈n/2⌉) — para o exame não ficar
  travado esperando a curadoria. É o mesmo padrão de "degradação graciosa
  enquanto a curadoria não chega" do APO-15 ("conforme o banco permitir").
  Basta nivelar um conteúdo para a disciplina inteira passar à regra por
  nível — conteúdo ainda sem nível fica fora do escopo a partir daí.
- **Banco curto.** Quando os conteúdos do escopo têm menos de 60 questões
  ativas, o exame sai com o que existe (aviso gravado em `questions_json`),
  sem inventar questão — mesmo princípio do APO-11/APO-15. Escopo sem
  nenhuma questão recusa o início (409) sem disparar `iniciar-exame-meio`.
- **KR-20 nulo na prática.** Com tentativa única por disciplina, só existe
  uma aplicação do exame por disciplina — pela guarda herdada do APO-10, o
  KR-20 do boletim fica sempre nulo hoje. O campo, a base e a contagem de
  aplicações já ficam gravados para quando houver mais de uma aplicação
  comparável (ex.: uma regra de refação ou uma base entre disciplinas, que
  este card não decide).
- **Sem evidência.** `atlas_evidences` é por conteúdo (`content_id NOT
  NULL`) e `exame-meio-entregue` não exige evidência; o registro durável do
  exame é a própria tentativa com o boletim. Nenhuma evidência é gravada.
- **Sem curadoria de nível na tela.** `setContentLevel` existe (valida e
  grava), mas nenhuma rota nem tela chama ainda — o nível é preenchido
  direto no banco até um card de curadoria ligar isso.
- **Sem UI.** `GET/POST /api/exames` e `GET/POST /api/exames/:id` existem,
  mas nenhuma tela usa ainda — mesmo padrão de toda rota do Apolo até aqui.
- **Fora deste card:** `conteudo-100` (que pelo DEC-018 também precisa de
  todas as atividades aprovadas), a fórmula 50/50 entre exame de meio e
  atividade final na nota da disciplina e a rolagem de tempo da atividade
  final — todos do APO-19.

API: `GET /api/exames` (situação por disciplina, já sincronizada, e
tentativas; `?disciplina=` só as tentativas daquela), `POST /api/exames {
disciplineId, confirmar: true }`, `GET /api/exames/:id` e `POST
/api/exames/:id { action: travar | enviar, answers?, selfAssessments? }`.

Gate: não (DEC-016 e DEC-018 já ACEITOS cobrem; nenhuma transição nova).

## Atividade final e recuperação (APO-19)

As duas provas que fecham a disciplina, na **mesma tabela** do exame de meio
de curso (`atlas_exam_attempts`), sem migration nova: o índice único é em
`(discipline_id, instrument)`, e `atividade_final` e `recuperacao` são
instrumentos diferentes de `exame_meio` — cada disciplina tem no máximo uma
linha de cada, a tentativa única das duas sai do banco do mesmo jeito. Nada
precisou de coluna nova: a recuperação se liga à atividade final pela
própria disciplina (não há `related_attempt_id`), e o que é novo (relógio
por questão, tempo com rolagem, cascata) vai nos JSON que a tabela já tinha.
O que é comum às três provas (montagem, gravação, correção, KR-20, liberação
pela cobertura, regra de tempo) ficou em `lib/apolo/exam.ts`, extraído do
APO-18 sem mudar o comportamento do exame de meio; o que é só destas duas
está em `lib/apolo/final.ts`.

**FSM que já existia** (DEC-03), nenhuma transição nova (DEC-018):

1. `conteudo-100` (sistema): `syncDisciplineState` agora também dispara
   este evento, a partir de `exame-meio-concluido`, quando **100% dos
   conteúdos estão cobertos** (mesma `COVERED_STATES`) **e todos têm
   atividade aprovada** (evidência `atividade` em `atlas_evidences`, só
   gravada na aprovação, APO-17) — as duas condições que o DEC-018 manda
   gatar o mesmo evento. Um passo por chamada: a sincronização nunca pula o
   exame de meio. Roda nos mesmos pontos do `conteudo-50` (depois de todo
   quiz/atividade enviado, a cada `GET /api/exames` e antes de iniciar).
2. `iniciar-atividade-final` (usuário, **com confirmação explícita**) —
   `startAtividadeFinal`; sem `confirmed: true`, 409 `code: 'confirmation'`
   e nada gravado, como no exame de meio.
3. `atividade-final-aprovada` → `concluida`, ou
   `atividade-final-insatisfatoria` → `recuperacao-liberada` (sistema, no
   envio), decididos pela nota **já ajustada** pela cascata contra o corte
   de 70% do plano.
4. `iniciar-recuperacao` (usuário, com confirmação) — `startRecuperacao`.
5. `recuperacao-entregue` → `concluida` (sistema, sempre, no envio): a
   recuperação é o fim da cadeia, aprovada ou não; não há segunda
   recuperação, e o exame de meio não tem recuperação (APO-18).

**Escopo**: a disciplina inteira (regra `disciplina` em `scope_json`, todos
os conteúdos pela ordem do roadmap), sem recorte por nível. Montagem igual à
do exame de meio — `allocateContentQuotas` + seletor do Apolo com cota por
conteúdo, ordem intercalada com semente. A recuperação passa as questões da
atividade final como `recentlySeen` para o seletor: só prioridade, com
banco curto elas voltam (no banco semeado de hoje, 60 questões ativas em
Contabilidade Geral, a atividade final usa todas e a recuperação repete).

**Planos**: `atividade_final` com **60 questões** (confirmado pelo Abner em
2026-10-09: sempre foi o mesmo tamanho do exame de meio; o 20 era rascunho),
corte de 70% e 90 s por questão — versão 2 do plano (a 1 era o rascunho com
o tempo do quiz). `recuperacao` também passou à versão 2, com a mesma base
de 90 s e intercalação ligada.

**Cascata do exame de meio** (`applyMidtermCascade`):
`nota ajustada = nota bruta × (1 − erro do exame de meio)`, com `erro = 1 −
nota do exame de meio / 100`. Exemplo do Abner: 33% de erro no exame de
meio (nota 67) corta 33% da nota — bruta 90 vira 60,3. **Sem piso nem teto**
além do natural (por decisão explícita do Abner: limitar o ajuste quebraria
o propósito, que é ninguém passar "com louvor" na final depois de ir mal no
exame de meio). Mesmo arredondamento do corretor (uma casa). A nota emitida
(coluna `score`, `passed`, progresso) é a ajustada; o boletim guarda a
correção bruta do corretor (`score`, `correct`, `counted`) e, no campo novo
opcional `cascade`, a bruta, a tentativa e a nota do exame de meio usadas, o
erro e a ajustada — o boletim continua reconstituível sem reler o exame de
meio nem recorrigir nada (DEC-016). Sem exame de meio entregue na
disciplina o envio é recusado (409) — pela FSM isso não acontece.

**Recuperação — resgate aditivo, modelo "faculdade" (confirmado pelo Abner
em 2026-10-09, `applyRecoveryBuyback`)**: a recuperação **não aplica a
cascata de novo** sobre a própria nota bruta. Ela resgata só os pontos que
a cascata cortou da atividade final: `removido = bruta da atividade final
− ajustada da atividade final`; `ajustada da recuperação = ajustada da
atividade final + (bruta da recuperação / 100) × removido`. Exemplo do
Abner: exame de meio corta 50 pontos da atividade final (removido = 50);
recuperação com nota máxima devolve os 50 inteiros, e a atividade final
chega a 100 — a nota bruta ORIGINAL da atividade final, nunca a do exame de
meio, que não é teto da recuperação (só da atividade final, por construção:
`ajustada da recuperação <= bruta da atividade final`, igualdade só com
recuperação 100%). Sem piso nem teto além desse. A nota da atividade final
que vale para a disciplina é a **maior entre a atividade final e a
recuperação** (`effectiveFinalActivity` em `lib/progress.ts`, usada por
`getFinalActivityGrade` e pelo progresso; empate fica com a atividade
final) — como a recuperação nunca fica abaixo da atividade final por
construção (contribuição sempre >= 0), na prática vale sempre ela quando
existe. Só lê notas já emitidas — escolher a maior é agregação, como a
melhor nota de quiz, não uma nota nova.

**Tempo com rolagem** (`rolloverTiming`, função pura): mesma base de 90 s
por questão do exame de meio, mas a sobra de uma questão passa para a
seguinte (respondeu em 60 s uma questão de 90, a próxima tem 120). Questão
a questão, pela ordem da prova: gasto = momento da resposta − momento da
resposta anterior (a primeira conta do início); prazo = base + sobra
herdada; atrasada se gasto > prazo + tolerância (os mesmos 30 s do quiz);
sobra = prazo − gasto, nunca negativa (estourar zera a sobra, não desconta
da próxima). Cálculo e lacuna numérica seguem sem limite: nunca atrasam e
deixam a sobra herdada passar intacta. Atraso só marca `late` (na questão,
em `timing`, e na tentativa), igual ao quiz — não recusa resposta nem muda
nota. `deadline_at` da tentativa continua sendo o total (60 × 90 s), agora
só como teto: a rolagem move a sobra, nunca aumenta o total. O exame de
meio **não mudou**: segue sem rolagem, com o prazo total somado (APO-18).

O tempo é medido no **servidor**, questão a questão: ação nova `responder`
(`answerFinalQuestion`, só para estas duas provas) recebe UMA resposta, a
da vez (a primeira ainda sem resposta, na ordem da prova), e grava o
momento pelo relógio do servidor (`result_json.answeredAt`). Fora de ordem
é recusado (409); questão já respondida não volta. A tentativa expõe
`currentQuestion` com o prazo da questão da vez (já com a sobra) e `timing`.
Na trava (`travar`) ou no envio direto (`enviar`), o que já foi respondido
questão a questão vale como gravado, e as questões restantes entram com o
relógio daquele momento — o tempo e o `late` são fechados ali e gravados no
resultado (a autoavaliação das dissertativas depois da trava não conta como
tempo, igual ao quiz).

**KR-20**: mesmo cálculo e mesma guarda do APO-10/APO-18, por instrumento
(a atividade final e a recuperação são provas diferentes, não se somam),
sobre a nota **bruta** de cada aplicação — a ajustada mistura o exame de
meio e não mede a consistência da prova. Com tentativa única, fica nulo na
prática, como no exame de meio.

**Progresso**: o componente Avaliações (peso 30, DEC-02) passa a ser a
média **50/50** entre o exame de meio e a nota da atividade final que vale
(DEC-10, confirmado em 2026-10-08), assim que a atividade final é entregue.
Antes disso, continua valendo só o exame de meio, como no APO-18 (agora com
o texto "Atividade final ainda não entregue."). `FORMULA_VERSION` não mudou
(o APO-18 também não mudou ao ligar o componente). A disciplina chegar em
`concluida` não alimenta mais nada: nenhum relatório ou contagem lê o
estado da disciplina hoje, e este card não cria uma.

**Simplificações assumidas (disclosed):**

- **Resolvido com o Abner, não é mais simplificação.** A primeira
  implementação aplicou a mesma cascata multiplicativa na recuperação (nota
  ajustada = bruta da recuperação × nota do exame de meio / 100). Isso
  tornava a nota do exame de meio um **teto permanente e impossível de
  superar** na nota da disciplina — exame de meio 50 significava que nem
  100+100 em final e recuperação destravava a aprovação (mínimo 70%), já
  que o exame de meio não tem refação (APO-18). Escalado ao Abner antes de
  mesclar; ele confirmou o modelo **"faculdade"** (resgate aditivo, acima)
  — a recuperação nunca mais aplica a cascata sobre a própria nota bruta.
- **Rolagem medida pelo servidor, mas só no ritmo das respostas.** O que é
  garantido no servidor é o momento em que cada resposta chegou (relógio do
  servidor, na ordem). Não há como o servidor saber quando o aluno
  "abriu" cada questão — o tempo de uma questão é medido entre uma
  resposta e a seguinte. Quem não usar o `responder` (manda tudo junto no
  `travar`/`enviar`) tem todas as questões restantes carimbadas naquele
  momento: o tempo inteiro conta na primeira delas, que provavelmente
  estoura. Nenhuma tela usa o `responder` ainda (mesmo padrão de toda rota
  do Apolo até aqui); a tela que vier precisa responder questão a questão,
  sem voltar.
- **Sobra herdada atravessa cálculo/lacuna numérica.** Como essas questões
  não têm limite, a sobra que chegou nelas passa intacta para a seguinte —
  não ganha nem perde por causa do tempo gasto nelas.
- **Tamanho da recuperação continua rascunho (10 questões), não
  confirmado pelo Abner** — como vários outros tamanhos de plano neste
  código. O tempo dela (90 s com rolagem) e a intercalação ligada são
  inferência nossa (a recuperação é a mesma prova refeita, sobre a
  disciplina inteira), não decisão dele.
- **Sem evidência.** Como no exame de meio: `atlas_evidences` é por
  conteúdo, nenhum destes eventos exige evidência; o registro durável é a
  tentativa com o boletim.
- **Sem UI.** Rotas existem, nenhuma tela usa ainda.

API (as mesmas rotas do exame de meio, generalizadas): `POST /api/exames {
disciplineId, instrument?: exame_meio | atividade_final | recuperacao,
confirmar: true }` (sem `instrument`, exame de meio, como antes); `GET
/api/exames?disciplina=` devolve também `grade` (exame de meio, atividade
final e recuperação ajustadas e a nota que vale); `POST /api/exames/:id {
action: responder, questionId, answer }` (só atividade final e
recuperação) além de `travar`/`enviar`, que escolhem o fluxo pelo
instrumento da tentativa — o fluxo do exame de meio recusa tentativa da
atividade final e vice-versa (409).

Gate: não (DEC-016 e DEC-018 já ACEITOS cobrem; nenhuma transição nova,
nenhuma migration).
