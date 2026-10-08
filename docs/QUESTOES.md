# Banco de questões (MVP-04)

Os quizzes usam as questões da tabela `atlas_questions`. O Atlas já vem com um
banco inicial (`data/questoes/banco-inicial.csv`, 10 questões para cada
conteúdo de Fundamentos, CG-001 a CG-006). Conteúdo sem questões aparece na
tela de Quizzes como "Ainda sem questões cadastradas".

## Formato do CSV

Abra no Excel e salve como CSV (ponto e vírgula ou vírgula). Cabeçalho:

| coluna                         | o que vai                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `conteudo`                     | id do conteúdo, ex.: `CG-007`                                                    |
| `ordem`                        | 1, 2, 3… (ordem dentro do conteúdo)                                              |
| `tipo`                         | `multipla`, `dissertativa` ou `calculo`                                          |
| `enunciado`                    | a pergunta                                                                       |
| `contexto`                     | opcional: caso ou dados usados pela questão                                      |
| `a` … `e`                      | alternativas (múltipla escolha, ao menos 2)                                      |
| `correta`                      | letra da alternativa certa (o Atlas embaralha na hora do quiz)                   |
| `gabarito`                     | resposta modelo (obrigatória na dissertativa)                                    |
| `valor_esperado`, `tolerancia` | cálculo: resultado e margem aceita                                               |
| `verificacao`                  | cálculo: JSON com 5 perguntas `[{"prompt":"…","options":["…","…"],"correct":0}]` |
| `explicacao`                   | mostrada na correção                                                             |
| `id`                           | opcional; padrão `CG-007-Q01`                                                    |
| `ativa`                        | opcional; `nao` tira a questão dos próximos quizzes                              |

## Importar

```
pnpm run questoes:importar -- --file minhas-questoes.csv --check
pnpm run questoes:importar -- --target local --file minhas-questoes.csv
pnpm run questoes:importar -- --target production --file minhas-questoes.csv
```

`--check` só valida e mostra quantas questões há por conteúdo; erros dizem a
linha do arquivo. Em produção o nome do D1 vem do `deploy.local.json`. Questão
com o mesmo id é atualizada; as demais continuam como estão.
