# APA-17 — Resultado do bake-off de modelo (enriquecimento)

Gerado automaticamente por `scripts/apache-bakeoff.ts` em 2026-10-21T12:06:10.041Z.

Compara 3 modelos do catálogo Workers AI na tarefa de EXTRAÇÃO de ficha de enriquecimento (`ApacheEnrichment`, não a aula base) em 2 casos de teste: material relevante e material irrelevante ao conteúdo. Taxas de neurons de `lib/apache/neuron-meter.ts` (APA-15).

## Resultados

| Modelo | Caso | Válido | JSON schema | Truncado? | Latência (ms) | Neurons | irrelevante | nº conceitos | Erro |
|---|---|---|---|---|---|---|---|---|---|
| Llama 3.3 70B (baseline da aula, APA-06) | material relevante | sim | sim | não | 7209 | 51.2 | false | 3 | - |
| Llama 3.3 70B (baseline da aula, APA-06) | material irrelevante | sim | sim | não | 1198 | 15.1 | true | 0 | - |
| Gemma 4 26B | material relevante | sim | sim | não | 6984 | 11.3 | false | 3 | - |
| Gemma 4 26B | material irrelevante | sim | sim | não | 1111 | 3.9 | true | 0 | - |
| Qwen3 30B | material relevante | NÃO | sim | não | 3397 | 13.7 | - | - | formato de resposta desconhecido: nem "response" nem "choices[0].message" presentes (ou ambos nulos/vazios) |
| Qwen3 30B | material irrelevante | NÃO | sim | não | 774 | 2.6 | - | - | formato de resposta desconhecido: nem "response" nem "choices[0].message" presentes (ou ambos nulos/vazios) |

## Saída bruta de cada chamada (para avaliação qualitativa manual)

### Llama 3.3 70B (baseline da aula, APA-06) — material relevante

```json
{"v":1,"conceitos":[{"id":"cd","nome":"Controle Difuso","def":"feito por qualquer juiz ou tribunal, no julgamento de um caso concreto, com efeito inter partes"},{"id":"cc","nome":"Controle Concentrado","def":"feito pelo STF, julgando a lei em tese, fora de um caso concreto, com efeito erga omnes"},{"id":"crp","nome":"Cláusula de Reserva de Plenário","def":"um órgão fracionário de tribunal não pode declarar uma lei inconstitucional por conta própria, só o plenário ou o órgão especial do próprio tribunal pode fazer isso"}],"irrelevante":false}
```

### Llama 3.3 70B (baseline da aula, APA-06) — material irrelevante

```json
{"v":1,"conceitos":[],"irrelevante":true}
```

### Gemma 4 26B — material relevante

```json
{
  "v": 1,
  "conceitos": [
    {
      "id": "controle_difuso",
      "nome": "Controle difuso",
      "def": "Feito por qualquer juiz ou tribunal, no julgamento de um caso concreto, com efeito inter partes (só vale para aquele processo) — a chamada 'via de defesa'."
    },
    {
      "id": "controle_concentrado",
      "nome": "Controle concentrado",
      "def": "Feito só pelo STF, julgando a lei 'em tese', fora de um caso concreto, com efeito erga omnes (vale para todos) — a 'via de ação'."
    },
    {
      "id": "clausula_reserva_plenario",
      "nome": "Cláusula de reserva de plenário",
      "def": "Regra (art. 97 da CF) segundo a qual um órgão fracionário de tribunal (uma turma, uma câmara) não pode declarar uma lei inconstitucional por conta própria, apenas o plenário ou o órgão especial do próprio tribunal pode fazer isso."
    }
  ],
  "irrelevante": false
}
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
{"id":"chatcmpl-e7ef5efe-b4a4-4f1a-a5f9-c4772b6c5f3d","object":"chat.completion","created":1792584367,"model":"@cf/qwen/qwen3-30b-a3b-fp8","choices":[{"index":0,"message":{"role":"assistant","content":null,"refusal":null,"annotations":null,"audio":null,"function_call":null,"reasoning":"{\n  \"v\": 1,\n  \"conceitos\": [\n    {\n      \"id\": \"controle_difuso\",\n      \"nome\": \"Controle Difuso\",\n      \"def\": \"Feito por qualquer juiz ou tribunal, no julgamento de um caso concreto, com efeito inter partes (só vale para aquele processo).\"\n    },\n    {\n      \"id\": \"controle_concentrado\",\n      \"nome\": \"Controle Concentrado\",\n      \"def\": \"Feito só pelo STF, julgando a lei 'em tese', fora de um caso concreto, com efeito erga omnes (vale para todos).\"\n    },\n    {\n      \"id\": \"via_defesa\",\n      \"nome\": \"Via de Defesa\",\n      \"def\": \"Termo usado para se referir ao controle difuso, onde o juiz ou tribunal analisa a constitucionalidade da lei em um caso concreto.\"\n    },\n    {\n      \"id\": \"via_acao\",\n      \"nome\": \"Via de Ação\",\n      \"def\": \"Termo usado para se referir ao controle concentrado, onde o STF julga a lei 'em tese', fora de um caso concreto.\"\n    },\n    {\n      \"id\": \"clausula_reserva_plenario\",\n      \"nome\": \"Cláusula de Reserva de Plenário\",\n      \"def\": \"Disposição que impede que um órgão fracionário de tribunal (como uma turma ou câmara) declare uma lei inconstitucional por conta própria, sendo apenas o plenário ou o órgão especial do tribunal autorizado a fazê-lo.\"\n    }\n  ],\n  \"irrelevante\": false\n}","reasoning_content":"{\n  \"v\": 1,\n  \"conceitos\": [\n    {\n      \"id\": \"controle_difuso\",\n      \"nome\": \"Controle Difuso\",\n      \"def\": \"Feito por qualquer juiz ou tribunal, no julgamento de um caso concreto, com efeito inter partes (só vale para aquele processo).\"\n    },\n    {\n      \"id\": \"controle_concentrado\",\n      \"nome\": \"Controle Concentrado\",\n      \"def\": \"Feito só pelo STF, julgando a lei 'em tese', fora de um caso concreto, com efeito erga omnes (vale para todos).\"\n    },\n    {\n      \"id\": \"via_defesa\",\n      \"nome\": \"Via de Defesa\",\n      \"def\": \"Termo usado para se referir ao controle difuso, onde o juiz ou tribunal analisa a constitucionalidade da lei em um caso concreto.\"\n    },\n    {\n      \"id\": \"via_acao\",\n      \"nome\": \"Via de Ação\",\n      \"def\": \"Termo usado para se referir ao controle concentrado, onde o STF julga a lei 'em tese', fora de um caso concreto.\"\n    },\n    {\n      \"id\": \"clausula_reserva_plenario\",\n      \"nome\": \"Cláusula de Reserva de Plenário\",\n      \"def\": \"Disposição que impede que um órgão fracionário de tribunal (como uma turma ou câmara) declare uma lei inconstitucional por conta própria, sendo apenas o plenário ou o órgão especial do tribunal autorizado a fazê-lo.\"\n    }\n  ],\n  \"irrelevante\": false\n}"},"logprobs":null,"finish_reason":"stop","stop_reason":null,"token_ids":null,"routed_experts":null}],"service_tier":null,"usage":{"prompt_tokens":465,"completion_tokens":379,"total_tokens":844,"prompt_tokens_details":{"cached_tokens":0},"neurons":13.700368881225586},"prompt_logprobs":null,"prompt_token_ids":null,"prompt_text":null,"kv_transfer_params":null,"ec_transfer_params":null,"metrics":null,"response":null,"tool_calls":[]}
```

### Qwen3 30B — material irrelevante

```json
{"id":"chatcmpl-048a1e75-7f4e-4ffd-941b-990569c8c990","object":"chat.completion","created":1792584370,"model":"@cf/qwen/qwen3-30b-a3b-fp8","choices":[{"index":0,"message":{"role":"assistant","content":null,"refusal":null,"annotations":null,"audio":null,"function_call":null,"reasoning":"{\n  \"v\": 1,\n  \"conceitos\": [],\n  \"irrelevante\": true\n}","reasoning_content":"{\n  \"v\": 1,\n  \"conceitos\": [],\n  \"irrelevante\": true\n}"},"logprobs":null,"finish_reason":"stop","stop_reason":null,"token_ids":null,"routed_experts":null}],"service_tier":null,"usage":{"prompt_tokens":385,"completion_tokens":26,"total_tokens":411,"prompt_tokens_details":{"cached_tokens":0},"neurons":2.572807788848877},"prompt_logprobs":null,"prompt_token_ids":null,"prompt_text":null,"kv_transfer_params":null,"ec_transfer_params":null,"metrics":null,"response":null,"tool_calls":[]}
```

## Custo total deste bake-off

97.8 neurons (orçamento diário: 10.000, ver `DAILY_NEURON_BUDGET`).

## Recomendação

_Esta seção é escrita à mão (análise humana/Claude sobre os resultados acima) — uma próxima execução do script SOBRESCREVE este arquivo inteiro, inclusive esta seção. Se o bake-off rodar de novo, reaplicar esta análise depois._

**Modelo escolhido para `APACHE_ENRICHMENT_MODEL`: `@cf/google/gemma-4-26b-a4b-it` (Gemma 4 26B).**

### Gemma 4 26B × Llama 3.3 70B (baseline da aula)

Qualidade equivalente nos dois casos de teste: nos dois modelos, o caso
relevante extraiu exatamente os 3 conceitos certos (Controle Difuso,
Controle Concentrado, Cláusula de Reserva de Plenário), sem inventar nada
que não estivesse no material; o caso irrelevante foi corretamente marcado
`irrelevante: true` com `conceitos: []` nos dois. A ficha do Gemma é até
mais completa — inclui o `art. 97 da CF` (citado no material) e os apelidos
"via de defesa"/"via de ação" como parte da própria definição, em vez de
criar conceitos novos para eles (o Qwen3 cometeu esse erro, ver abaixo).

Custo: Gemma usou 11,3 + 3,9 = 15,2 neurons nos 2 casos contra 51,2 + 15,1 =
66,3 do Llama — **~4,4× mais barato**, pela mesma qualidade nesta tarefa de
extração (bem mais simples que escrever uma aula inteira do zero, onde o
Llama continua sendo a escolha certa, APA-06).

### Qwen3 30B — não escolhido

Causa raiz confirmada na saída bruta desta rodada (ver acima): mesmo
enviando `chat_template_kwargs.enable_thinking: false` (parâmetro
confirmado só por teste direto, NÃO documentado oficialmente pela Cloudflare
para este modelo — ver nota abaixo), o endpoint do Qwen3 no Workers AI
sempre devolve `message.content: null` e põe a resposta inteira em
`message.reasoning`/`message.reasoning_content` — um comportamento do
parser de raciocínio do modelo que o parâmetro não desliga por completo
nesta versão hospedada.
Isso por si só é contornável (bastaria ler `reasoning_content` como
fallback), mas a ficha extraída nesse fallback (visível na saída bruta
acima) tem um problema de qualidade: o Qwen3 separou "Via de Defesa" e "Via
de Ação" como 2 conceitos à parte, quando no material eles são só apelidos
do Controle Difuso/Concentrado — um falso positivo de "conceito novo" que
poluiria a ficha de enriquecimento real (`diffEnrichmentAgainstLesson`
trataria isso como 2 reforços/novos conceitos espúrios). Sem vantagem de
custo clara sobre o Gemma (13,7+2,6 = 16,3 neurons, praticamente empatado)
para compensar essa fragilidade de formato + qualidade pior. **Registrado
como não avaliado para uso em produção**: formato de resposta instável
nesta tarefa e sem indício de que valha o esforço extra de parsing.

### Decisão para o APA-12

`APACHE_ENRICHMENT_MODEL=@cf/google/gemma-4-26b-a4b-it` deve ser lido como
`env.APACHE_ENRICHMENT_MODEL` (variável de ambiente, nunca hardcoded — NÃO
é o mesmo padrão de `LESSON_MODEL` em `lib/apache/lesson-writer.ts:13`, que
é uma constante fixa no código), com Gemma como valor padrão. A chamada em
si segue o mesmo formato (`response_format: json_schema`, `max_tokens`
explícito) de `lesson-writer.ts`, mas a RESPOSTA do Gemma vem no formato
OpenAI-compatible (`choices[0].message.content`/`.parsed`), confirmado
pela própria falha da 1ª rodada deste bake-off (o Gemma não tem campo
`response`) e pela documentação atual da Cloudflare — não no formato
nativo `{ response, usage }` que só o Llama usa. O APA-12 deve ler a
resposta do jeito que `resolveModelOutput()` (`scripts/apache-bakeoff.ts`)
faz: tentar `choices[0].message.content`/`.parsed` primeiro, com `response`
como fallback só por segurança caso o catálogo mude de novo — não precisa
do fallback de `reasoning_content` que este script criou só para também
tentar comparar o Qwen3 (modelo não escolhido).

### Nota sobre `enable_thinking`

O parâmetro `chat_template_kwargs: { enable_thinking: false }` foi usado
neste bake-off com base só em teste direto (rodando contra a conta real),
não em documentação oficial da Cloudflare confirmando esse nome de campo
para Gemma 4 26B ou Qwen3 30B — funcionou razoavelmente para o Gemma
(permitiu respostas válidas nas 2 rodadas finais) mas não resolveu o
problema do Qwen3 (ver acima). Se o APA-12 reaproveitar esse parâmetro,
vale reconfirmar na documentação do modelo antes, porque pode mudar sem
aviso.
