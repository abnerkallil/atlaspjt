# Modelo de dados (TEC-02 / DEC-010)

D1 é a fonte da verdade do catálogo curado e de todo estado pedagógico. A planilha
oficial só cura o catálogo; ela nunca recebe nem decide progresso. Schema em
`db/schema.ts`, migration `drizzle/0004_canonical_spine.sql`.

## Espinha (migrada agora)

```
atlas_roadmaps ─< atlas_phases ─< atlas_disciplines ─< atlas_contents ─< atlas_subtopics
                                                          │   ▲               │
                                                          │   └─ atlas_content_prerequisites (conteúdo → conteúdo)
                                                          └──< atlas_evidences >──┘ (subtópico opcional)

atlas_content_states     estado atual do conteúdo (DEC-03)
atlas_discipline_states  estado atual da disciplina (DEC-03)
atlas_state_audit        uma linha por transição (TEC-06)
```

- Ids são chaves estáveis em texto. Conteúdos da planilha mantêm o id dela
  (`CG-001`, `CT-...`), o mesmo usado em `atlas_note_links.content_id`.
- `unit` em `atlas_contents` é o agrupamento da planilha ("Fundamentos"), não um
  nível da hierarquia.
- Pré-requisito vai de conteúdo para conteúdo, inclusive entre disciplinas
  (fundamentos compartilhados, DEC-05).
- Remover um nível remove os de baixo em cascata; a auditoria não tem FK para a
  entidade e por isso sobrevive.

## Estados (DEC-03)

Os valores válidos e as transições estão em `lib/pedagogy/states.ts`. Sem linha em
`atlas_*_states`, vale o estado inicial (`nao-iniciado` / `em-andamento`).

| Nível | Estados |
| --- | --- |
| Conteúdo | nao-iniciado, em-estudo, aguardando-quiz, concluido, bloqueado, aguardando-revisao, revalidado, em-revisao-ativa |
| Disciplina | em-andamento, exame-meio-liberado, exame-meio-em-curso, exame-meio-concluido, atividade-final-liberada, atividade-final-em-curso, recuperacao-liberada, recuperacao-em-curso, concluida |

Pedem confirmação explícita: iniciar exame de meio de curso, iniciar atividade
final e iniciar recuperação. Pré-requisito pendente não é estado: é calculado a
partir de `atlas_content_prerequisites` (MVP-01). Dispensa por proficiência
(DEC-05) é a transição `nao-iniciado → concluido` com evento próprio.

Leituras feitas na implementação, onde o DEC-03 não detalha:

- `bloqueado → em-estudo` ao reabrir o material ("revisar e passar de novo").
- `revalidado → aguardando-revisao` a cada novo prazo (7d, 30d).
- `em-revisao-ativa → revalidado` quando o domínio volta a ser comprovado.
- A disciplina só libera a atividade final depois do exame de meio de curso
  entregue (o DEC-10 trata os dois como etapas obrigatórias, com peso 50/50).

## Fora da espinha (cada uma chega com o seu card)

Questão e tentativa (MVP-04), revisão (MVP-06), avaliação
(MVP-07/08), preferências (TEC-04), histórico de notas (MVP-03). Não há tabela de
usuário além do DEC-007. `atlas_sync_operations` continua existindo e, se usada,
serve só para importar o catálogo da planilha para o D1.

## Trilha de auditoria (TEC-06)

Toda mudança de estado passa por `applyTransition` (`lib/pedagogy/transitions.ts`):

1. lê o estado atual (ou o inicial, se não houver linha);
2. `planTransition` valida o evento contra a máquina do DEC-03, exige
   `actor: 'usuario'` + `confirmed: true` nas transições com confirmação e uma
   evidência em `quiz-aprovado` e `dispensa-proficiencia`;
3. grava auditoria e estado num único batch do D1. A auditoria só entra se o
   estado ainda for o lido; o estado só muda se a auditoria entrou. Uma escrita
   concorrente devolve erro `conflict` e não deixa rastro parcial.

Cada linha de `atlas_state_audit` tem autor (`usuario`/`sistema`), momento,
estado anterior, estado novo, evento, motivo (o informado ou a descrição da
regra) e evidência. A tabela só recebe inserções.

Leitura: `GET /api/auditoria?entityType=conteudo|disciplina&entityId=...&limit=...`
(mais recente primeiro, até 500; exige sessão como toda a API). Ainda não há
rota de escrita: quem dispara transições são os cards MVP (sessão, quiz,
revisão, avaliação).

## Catálogo no D1 (TEC-04)

`drizzle/0005_catalog_seed.sql` carrega o catálogo de `lib/content-catalog.ts` no
roadmap `atlas-contabil`, com a estrutura escolhida pelo Abner em 2026-10-06:

- uma fase por matéria (Contabilidade Geral, depois Contabilidade Tributária),
  cada uma com uma disciplina de mesmo nome;
- os 157 conteúdos na ordem da planilha, com a unidade como agrupamento;
- pré-requisito em sequência dentro de cada unidade (cada conteúdo depende do
  anterior da mesma unidade; o primeiro de cada unidade fica livre).

A carga é idempotente: atualiza títulos e ordem, nunca apaga estado, evidência
ou auditoria. Quando a planilha mudar, atualize `lib/content-catalog.ts`, rode
`pnpm run db:catalog` e crie uma migration nova com o SQL gerado (a 0005 já
aplicada não roda de novo). O teste `tests/catalog-roadmap.test.ts` falha se o
arquivo e o gerador divergirem. Para mudar fases ou pré-requisitos, edite
`lib/catalog/roadmap-seed.ts`.

Leitura: `GET /api/roadmap` devolve fases → disciplinas → conteúdos com estado
atual e pré-requisitos (exige sessão). Preferências e tarefas não ganharam
tabela: nenhuma tela as usa ainda; a primeira preferência real (horário padrão
da agenda, DEC-09) chega com o MVP-05.

## Pré-requisitos e bloqueios (MVP-01)

- Um pré-requisito conta como cumprido quando está em `concluido`,
  `aguardando-revisao` ou `revalidado` (`lib/pedagogy/prerequisites.ts`).
  `em-revisao-ativa` e `bloqueado` não contam: o DEC-03 reabre o conteúdo.
- `applyTransition` recusa `abrir-material` de um conteúdo não iniciado com
  pré-requisito pendente (erro `prerequisite`, nada é gravado). Quem já começou
  não é travado de novo.
- Dispensa por proficiência (DEC-05) pula os pré-requisitos, mas exige uma
  evidência `kind = 'proficiencia'` do próprio conteúdo. O exame que gera essa
  evidência (nota acima de 85) é do card de avaliações; aqui só a regra.
- Toda evidência citada numa transição precisa existir e ser do mesmo conteúdo.
- `GET /api/roadmap` devolve, por conteúdo, `pendingPrerequisites` e `locked`, e
  por fase/disciplina o progresso bruto (cumpridos / total).
- Começar um conteúdo é abrir uma sessão de estudo (`POST /api/sessoes`, MVP-02;
  409 se travado).

A página Roadmap e o cartão de roadmap da página Hoje leem esses dados; o
registro de mudanças da página Roadmap vem de `GET /api/auditoria`.

## Sessões de estudo (MVP-02)

`atlas_study_sessions` (migration 0008): uma linha por sessão, com `status`
(`em-andamento`, `pausada`, `concluida`), tempo acumulado em `active_seconds` +
início do trecho em andamento em `last_resumed_at`, ponto atual em
`checkpoint_json` (até 16KB: etapa, etapas feitas, nota da sessão) e, quando
concluída, `finished_at` e `evidence_id`. Regras em `lib/study-sessions.ts`:

- Iniciar: no máximo uma sessão aberta por conteúdo (índice único parcial); se
  já houver, ela é retomada. Se o conteúdo está `nao-iniciado` ou `bloqueado`,
  dispara `abrir-material` (com a checagem de pré-requisitos do MVP-01).
- Uma sessão em andamento por vez: começar ou retomar outra pausa a anterior,
  guardando o tempo.
- Pausar congela o tempo; retomar volta a contar; salvar ponto atual não mexe
  em status nem tempo.
- Concluir registra a evidência `kind = 'sessao'` (`source_ref` = id da sessão)
  e, se o conteúdo está `em-estudo`, aplica `encerrar-sessao` (→
  `aguardando-quiz`) citando essa evidência. Estudar de novo um conteúdo já
  adiante não muda o estado.

API: `GET /api/sessoes?abertas=1`, `GET /api/sessoes?conteudo=ID`,
`POST /api/sessoes { contentId }`, `GET /api/sessoes/:id` e
`PATCH /api/sessoes/:id { action: pausar | retomar | salvar-ponto | concluir, checkpoint? }`.

## Quizzes (MVP-04)

`atlas_questions` (migration 0009): banco de questões por conteúdo. `kind`
`multipla` (alternativas em `options_json`, certa em `correct_option`),
`dissertativa` (`model_answer`) ou `calculo` (`expected_value` ± `tolerance` e 5
perguntas de verificação em `verification_json`). `source` diz se veio do banco
inicial (`curado`, migration 0010) ou de importação (`importado`); `active = 0`
tira a questão dos próximos sorteios sem quebrar tentativas antigas.

`atlas_quiz_attempts` (migration 0009): uma linha por tentativa, com as questões
sorteadas e a ordem embaralhada das alternativas (`questions_json`), prazo
(`deadline_at`), respostas, correção (`result_json`), nota, aprovação e a
evidência. `status`: `em-andamento` → (com dissertativas) `autoavaliacao` →
`enviado`; no máximo uma tentativa aberta por conteúdo e finalidade. Regras em
`lib/quizzes.ts` (DEC-04 e DEC-10):

- Libera só com o conteúdo em `aguardando-quiz`; até 10 questões; tempo total =
  1 min por múltipla + 5 min por dissertativa; cálculo sem limite.
- Correção determinística: múltipla pela alternativa; dissertativa pela
  autoavaliação depois de travar as respostas e ver o gabarito; cálculo pelo
  valor, anulado com menos de 3 das 5 verificações. Cada questão vale 100/N
  sem contar as anuladas; aprova com 70%.
- Envio grava a evidência `kind = 'quiz'` e aplica `quiz-aprovado` (→
  `concluido`) ou `quiz-reprovado` (→ `bloqueado`).

API: `GET /api/quizzes` (liberados e tentativas), `POST /api/quizzes { contentId }`,
`GET /api/quizzes/:id` e `POST /api/quizzes/:id { action: travar | enviar, answers?, selfAssessments? }`.
Importação de questões: `docs/QUESTOES.md`.

## Agenda interna (MVP-05)

`atlas_agenda_items` (migration 0011): um compromisso por linha, com `kind`
(`estudo`, `quiz`, `revisao`, `recuperacao`), conteúdo, dia local
(`due_date`), horário fixado (`start_time`, opcional), duração, prioridade
(`urgente`, `alta`, `normal`), `status` (`pendente`, `concluido`,
`cancelado`), o motivo de existir (`reason`) e o motivo da última mudança
(`change_reason`, `original_date`, `reschedule_count`). Regras em
`lib/agenda.ts` (DEC-09):

- Sem tarefa agendada: `GET /api/agenda?hoje=AAAA-MM-DD` sincroniza antes de
  listar. A sincronização conclui por evidência (sessão para estudo e
  recuperação, quiz para quiz), cancela o que perdeu sentido, passa para hoje o
  que ficou para trás e cria o que falta: recuperação urgente para conteúdo
  bloqueado, quiz para conteúdo aguardando quiz e o próximo estudo do roadmap.
- Horário: sem hora fixada, os itens do dia seguem em sequência a partir das
  7h, por prioridade (recuperação, quiz, revisão, estudo).
- Concluir à mão vale pelo dia (o passo não é recriado até amanhã) e não muda o
  estado pedagógico do conteúdo.
- As revisões 24h/7d/30d (`kind = 'revisao'`, `source_ref` com o prazo) chegam
  com o MVP-06.

API: `GET /api/agenda?hoje=AAAA-MM-DD&dias=7` e
`PATCH /api/agenda/:id { action: concluir | reagendar (hoje, date, time?, reason?) | ajustar (durationMinutes?, priority?) }`.

## Revisões 24h/7d/30d (MVP-06)

Sem tabela nova: reaproveita `atlas_quiz_attempts.purpose` (`revisao`,
`corretivo`), `atlas_agenda_items` (`kind = 'revisao'`, `source_ref` = etapa)
e o histórico de estados. Regras em `lib/reviews.ts` (DEC-09 e DEC-03):

- O ciclo começa no último `quiz-aprovado` (ou `dispensa-proficiencia`) do
  conteúdo; as etapas vencem 1, 7 e 30 dias depois desse momento. Cada
  `revisao-aprovada` desde então conta uma etapa.
- A sincronização da agenda aplica `revisao-vencida` (→ `aguardando-revisao`)
  quando o dia local chega à data da etapa e agenda a próxima revisão com
  antecedência.
- Revisão aprovada → `revalidado`; reprovada → `em-revisao-ativa`, com
  recuperação urgente na agenda. O quiz corretivo só abre depois de uma nova
  sessão concluída; aprovado, aplica `revisao-aprovada` e o ciclo segue.
- Evidência `kind = 'revisao'` para revisão e corretivo. O resultado guarda o
  resumo (`review`: etapa, próxima revisão, ciclo concluído após os 30d).

## Progresso determinístico (MVP-07)

Sem tabela nova: `lib/progress.ts` recalcula a cada leitura (`GET /api/progresso`)
a partir de estados, `atlas_quiz_attempts` enviados, `atlas_state_audit` e
`atlas_study_sessions`. Fórmula `v1` com os pesos padrão do DEC-02 (Avaliações
30, Atividades 20, Cobertura 20, Revisão 15, Quiz 15), por disciplina:

- Cobertura: conteúdos em `concluido`, `aguardando-revisao` ou `revalidado`
  sobre o total da disciplina.
- Quiz: média da melhor nota de quiz de conteúdo (`purpose = 'quiz'`) de cada
  conteúdo já tentado.
- Revisão: etapas aprovadas sobre etapas vencidas no ciclo atual de cada
  conteúdo (mesma âncora do MVP-06).
- Avaliações e Atividades: 0 e marcadas como indisponíveis até o Atlas
  registrar essas entregas.

Domínio é a nota da disciplina; proficiência é a média das últimas 5
tentativas (quiz, revisão, corretivo); retenção é revisões aprovadas sobre
revisões feitas. Consistência soma `active_seconds` por dia local nos últimos
28 dias. O gatilho do ajuste adaptativo dos pesos (±10 pp) aguarda o Gate
`ATLAS-RAF-GATE-20261008-001`.

## Recuperação e bloqueios (MVP-08)

Sem tabela nova: `lib/recovery.ts` lê `atlas_quiz_attempts` (resultado por
questão em `result_json`) e `atlas_questions`. O desbloqueio continua sendo a
transição do DEC-03 ao passar; o MVP-08 não cria estado novo.

- Reprovações seguidas: tentativas enviadas reprovadas desde a última aprovada
  (quiz, revisão ou corretivo). Duas ou mais aparecem como reincidência na
  agenda e em Progresso.
- Estudo dirigido (`GET /api/recuperacao?conteudo=`): as questões erradas na
  última reprovação, com a resposta certa e a explicação, no topo da sessão de
  estudo.
- Quiz dirigido: enquanto há reprovação sem aprovação depois, o próximo quiz (o
  quiz do conteúdo bloqueado ou o corretivo) traz primeiro as questões erradas
  e completa com o sorteio normal; `questions_json.directed` guarda quantas
  voltaram.
- Conclusão congelada (DEC-03): disciplina com conteúdo bloqueado ou em revisão
  ativa mostra o aviso em Progresso; a cobertura já não conta esses conteúdos.
- Penalidade numérica: nenhuma decisão aprovada define um desconto em pontos
  por reprovação (a única redução aprovada é a da atividade final pelo exame de
  meio de curso, DEC-10, que depende das avaliações). Hoje a reprovação pesa só
  pelo que a fórmula do MVP-07 já mede (revisão aprovada sobre vencida e
  cobertura).
