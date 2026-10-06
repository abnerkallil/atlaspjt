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
