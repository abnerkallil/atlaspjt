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
atividade final tem** (continua rascunho de 20, sem decisão). Os perfis por
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
