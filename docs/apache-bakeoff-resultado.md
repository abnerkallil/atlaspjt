# APA-17 — Resultado do bake-off de modelo (enriquecimento)

Gerado automaticamente por `scripts/apache-bakeoff.ts` em 2026-10-21T11:59:51.158Z.

Compara 3 modelos do catálogo Workers AI na tarefa de EXTRAÇÃO de ficha de enriquecimento (`ApacheEnrichment`, não a aula base) em 2 casos de teste: material relevante e material irrelevante ao conteúdo. Taxas de neurons de `lib/apache/neuron-meter.ts` (APA-15).

## Resultados

| Modelo | Caso | Válido | JSON schema | Latência (ms) | Neurons | irrelevante | nº conceitos | Erro |
|---|---|---|---|---|---|---|---|---|
| Llama 3.3 70B (baseline da aula, APA-06) | material relevante | sim | sim | 5765 | 51.4 | false | 3 | - |
| Llama 3.3 70B (baseline da aula, APA-06) | material irrelevante | sim | sim | 1076 | 15.1 | true | 0 | - |
| Gemma 4 26B | material relevante | NÃO | sim | 9715 | 17.5 | - | - | JSON não encontrado na resposta: nenhum bloco { ... } encontrado na resposta |
| Gemma 4 26B | material irrelevante | sim | sim | 8116 | 13.4 | true | 0 | - |
| Qwen3 30B | material relevante | NÃO | sim | 3007 | 13.4 | - | - | validação falhou: ficha inválida: não é um objeto |
| Qwen3 30B | material irrelevante | NÃO | sim | 557 | 2.6 | - | - | validação falhou: ficha inválida: não é um objeto |

## Saída bruta de cada chamada (para avaliação qualitativa manual)

### Llama 3.3 70B (baseline da aula, APA-06) — material relevante

```json
{"v":1,"conceitos":[{"id":"cd","nome":"Controle Difuso","def":"feito por qualquer juiz ou tribunal, no julgamento de um caso concreto, com efeito inter partes"},{"id":"cc","nome":"Controle Concentrado","def":"feito só pelo STF, julgando a lei em tese, fora de um caso concreto, com efeito erga omnes"},{"id":"crp","nome":"Cláusula de Reserva de Plenário","def":"um órgão fracionário de tribunal não pode declarar uma lei inconstitucional por conta própria, só o plenário ou o órgão especial do próprio tribunal pode fazer isso"}],"irrelevante":false}
```

### Llama 3.3 70B (baseline da aula, APA-06) — material irrelevante

```json
{"v":1,"conceitos":[],"irrelevante":true}
```

### Gemma 4 26B — material relevante

```json
(sem resposta)
```

### Gemma 4 26B — material irrelevante

```json
{
  "v": 1,
  "conceitos": [],
  "irrelevante": true
}
```

### Qwen3 30B — material relevante

```json
null
```

### Qwen3 30B — material irrelevante

```json
null
```

## Custo total deste bake-off

113.4 neurons (orçamento diário: 10.000, ver `DAILY_NEURON_BUDGET`).

## Recomendação

_Pendente — revisar a qualidade das fichas extraídas acima (conceitos corretos, definições fiéis ao material, acerto do campo "irrelevante" no caso B) e o custo em neurons, e preencher esta seção com o modelo escolhido para `APACHE_ENRICHMENT_MODEL` antes do APA-12 fechar._
