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

Sessão (MVP-02), questão e tentativa (MVP-04), revisão (MVP-06), avaliação
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
da agenda, DEC-09) chega com o MVP-05. Sessões chegam com o MVP-02 (DEC-010).
