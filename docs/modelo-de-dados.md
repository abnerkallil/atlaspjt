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
