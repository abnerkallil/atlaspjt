# Banco de questões (MVP-04, v2 no APO-03/04)

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
| `tipo`                         | `multipla`, `dissertativa`, `calculo`, `certo_errado` ou `lacuna_numerica`       |
| `enunciado`                    | a pergunta                                                                       |
| `contexto`                     | opcional: caso ou dados usados pela questão                                      |
| `a` … `e`                      | alternativas (múltipla escolha, ao menos 2)                                      |
| `correta`                      | letra da alternativa certa (múltipla); `certo`/`errado` (certo_errado)           |
| `gabarito`                     | resposta modelo (obrigatória na dissertativa)                                    |
| `valor_esperado`, `tolerancia` | cálculo e lacuna numérica: resultado e margem aceita                             |
| `verificacao`                  | só cálculo: JSON com 5 perguntas `[{"prompt":"…","options":["…","…"],"correct":0}]` (lacuna numérica não tem verificação) |
| `explicacao`                   | mostrada na correção                                                             |
| `id`                           | opcional; padrão `CG-007-Q01`                                                    |
| `ativa`                        | opcional; `nao` tira a questão dos próximos quizzes                              |

### Colunas do Apolo (APO-01/02/03), todas opcionais

| coluna                             | o que vai                                                      |
| ----------------------------------- | --------------------------------------------------------------- |
| `tema`                              | etiqueta de texto livre (DEC-014); vazio = sem tema ainda       |
| `subtopico_id`, `bloom`             | subtópico do conteúdo; nível de Bloom (`lembrar`…`criar`)       |
| `dificuldade`                       | `facil`, `media` ou `dificil`                                    |
| `tipo_conhecimento`                 | `factual`, `conceitual`, `procedimental` ou `metacognitivo`      |
| `origem`                            | `curada`, `oficial` ou `molde`                                   |
| `banca`, `orgao`, `ano`             | proveniência de questão oficial (concurso)                      |
| `fonte_r2`                          | chave do PDF de origem no R2 (`apolo/fontes/<tema>/<id>`)        |
| `explicacoes_alternativas`          | múltipla: JSON `{"0":"...","1":"..."}` com explicação por opção (além da `explicacao` geral) |

## JSON v2

Alternativa ao CSV sem precisar escapar vírgula/JSON em célula: um array de
objetos com as mesmas chaves de cima, mas `verificacao` e
`explicacoes_alternativas` já como array/objeto (não string):

```json
[
  {
    "conteudo": "CG-007",
    "ordem": 1,
    "tipo": "certo_errado",
    "enunciado": "O ativo circulante inclui o caixa?",
    "correta": "certo",
    "explicacao": "Caixa é ativo circulante por definição."
  }
]
```

## Linter (APO-04)

Toda importação roda um linter de escrita de itens (Haladyna, Downing &
Rodriguez) antes de gravar. **Erros bloqueiam** a importação (alternativas
repetidas na mesma questão, enunciado duplicado de outra questão do arquivo,
por hash normalizado); **avisos** só aparecem no terminal e ficam para a
curadoria resolver (ex.: "todas/nenhuma das anteriores", negação sem
destaque, alternativa certa bem mais longa que as demais, enunciado que não
parece terminar em pergunta).

## Importar

```
pnpm run questoes:importar -- --file minhas-questoes.csv --check
pnpm run questoes:importar -- --file minhas-questoes.json --check
pnpm run questoes:importar -- --target local --file minhas-questoes.csv
pnpm run questoes:importar -- --target production --file minhas-questoes.csv
```

`--check` só valida e mostra quantas questões há por conteúdo, mais os
erros/avisos do linter; erros (estruturais ou do linter) dizem a linha do
arquivo e impedem a importação, mesmo fora do `--check`. Em produção o nome
do D1 vem do `deploy.local.json`. Questão com o mesmo id é atualizada; as
demais continuam como estão.
