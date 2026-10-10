# Acervo de fontes do Apolo (APO-05)

PDF de prova de concurso, apostila ou lista que alimenta o banco de questões
do Apolo (origem `oficial` ou base de `molde`, ver `docs/QUESTOES.md`). Fica
no mesmo bucket `ATTACHMENTS` dos anexos de nota e materiais, sob o prefixo
`apolo/fontes/<tema>/<id>` (DEC-015). **Sem acesso público**: legal ainda não
revisou direitos autorais de prova de concurso, então todo download passa
pela rota autenticada do Worker, nunca por uma URL direta do R2.

## Tela

`/fontes` lista o acervo (filtrável por tema), permite cadastrar uma fonte
nova (PDF até 30MB) e remover uma existente. Campos: título, tema (texto
livre, igual ao tema de questão — DEC-014), tipo (`prova_concurso`,
`apostila` ou `lista`) e, só para prova de concurso, banca/órgão/ano.

## CLI (`apolo:fonte`)

Para subir fontes em lote, sem passar pela tela:

```
pnpm run apolo:fonte -- --target local --file prova.pdf --titulo "Prova TJ-SP 2023" \
  --tipo prova_concurso --tema direito-constitucional --banca FGV --orgao TJ-SP --ano 2023
pnpm run apolo:fonte -- --target production --file apostila.pdf --titulo "Apostila módulo 1" --tipo apostila
```

Grava o PDF no R2 e registra os metadados no D1 numa só execução. O mesmo
arquivo (hash SHA-256 igual) não entra duas vezes no acervo — o comando para
e mostra o título e o id da fonte já cadastrada.

## Extrator de questões (APO-06)

A partir de uma fonte já cadastrada (ou de um PDF local), `apolo:extrair`
tira o texto do PDF (`unpdf`) e corta em rascunhos de questão por regra —
nunca IA (DEC-014). Três formatos:

- **Cebraspe**: item numerado, afirmação única julgada Certo/Errado contra
  um gabarito externo.
- **Alternativas A-E** (FGV/FCC/Vunesp): item numerado com 2 a 5 alternativas
  rotuladas, gabarito por letra.
- **Genérico** (rede de segurança para apostila/lista sem formato de
  concurso): tenta alternativas e, se não achar, pergunta + linha
  "Resposta:"/"Gabarito:".

O que nenhum parser conseguir cortar com segurança vira **manual** no
relatório, para a curadoria (APO-07) resolver; um item marcado "anulada" no
gabarito sai do rascunho sem virar manual.

```
pnpm run apolo:extrair -- --file prova.pdf --formato cebraspe --gabarito gabarito.txt
pnpm run apolo:extrair -- --target local --fonte <id-da-fonte> --saida rascunhos.json
```

O gabarito é um arquivo de texto, um item por linha (`1 C`, `2 ERRADO`,
`3 anulada`). Sempre grava um JSON de rascunhos em disco; com `--target`,
também insere cada rascunho em `atlas_question_drafts` como `"pendente"`
(linter de Haladyna, APO-04, roda aqui só para gerar os avisos mostrados na
curadoria — nenhum erro bloqueia a extração). Sem `--target`, é só ensaio:
nada entra na fila.

## Curadoria de rascunhos (APO-07)

`/rascunhos` é a fila de revisão: todo rascunho — vindo do extrator ou
cadastrado à mão — fica `"pendente"` até um humano aprovar ou descartar.
Nunca é seleção automática ("precisamos de curadoria se quisermos um
desenvolvimento sério", Abner, 2026-10-08).

A tela mostra a fila (rascunho sem conteúdo definido primeiro, depois mais
antigo primeiro), um formulário de edição e, quando o rascunho veio de uma
fonte, o PDF de origem ao lado. Aprovar exige conteúdo, nível de Bloom e
explicação preenchidos; grava a questão em `atlas_questions`, já ativa
(aparece no próximo quiz do conteúdo), e marca o rascunho como `"aprovado"`.
Descartar é definitivo — o rascunho não volta para a fila.

Tema é criado só aqui (`POST /api/apolo/temas`), nunca pelo extrator.

**Duas simplificações de escopo assumidas nesta entrega** (Abner pode pedir
a versão completa depois):

- O card pedia o rascunho "ao lado da página do PDF" de origem. Rastrear a
  página exata exigiria reabrir o extrator (APO-06, já mergeado) para marcar
  fronteiras de página texto a texto. A tela mostra o PDF inteiro da fonte,
  sem pular automaticamente para a página do item.
- A fila não prioriza "conteúdo com menos questões primeiro" — o conteúdo só
  é escolhido durante a própria curadoria, então a ordem é por ausência de
  conteúdo e data de criação.

### Bagagem de temas

Até 2026-10-10 `atlas_themes` estava vazia: os 1.800 rascunhos das 30 provas
autorais (PR #67) já chegam com um tema em texto livre (ex.:
`direito-tributario`), mas como nenhum tema estava cadastrado, o combo
"Tema" não tinha nada para oferecer — o Abner tinha que digitar um tema
novo a cada rascunho. A migração `drizzle/0021_temas_bagagem_apolo.sql`
resolve isso cadastrando de uma vez os 18 temas que esse lote já usa (mesmo
id/slug do texto livre, então o combo já aparece com o tema certo
pré-selecionado nesses 1.800): contabilidade, contabilidade geral, direito
tributário, tributação, direito empresarial, direito eleitoral, direito
administrativo, direito constitucional, matemática, matemática financeira,
estatística, raciocínio lógico, dados, português, inglês, espanhol,
departamento pessoal e departamento fiscal. É só um ponto de partida —
continua liberado cadastrar tema novo a qualquer momento pela tela
(DEC-014: tema é etiqueta aberta, nunca uma lista fechada).

### Sugestão de nível de Bloom

**O que é Bloom, em uma frase:** uma escala de 6 níveis (lembrar, entender,
aplicar, analisar, avaliar, criar) que classifica *o tipo de esforço mental*
que a pergunta exige do aluno — não o assunto, nem a dificuldade. "Lembrar"
é só reconhecer um fato; "aplicar" é usar uma fórmula/regra num caso
concreto; "analisar"/"avaliar"/"criar" exigem decompor, julgar ou propor
algo novo. É a taxonomia de Bloom revisada por Anderson & Krathwohl (2001),
usada mundialmente em educação — o critério oficial é **o verbo de comando
do enunciado** (o que a pergunta manda o aluno fazer), não o conteúdo.

**O que a pesquisa mostrou sobre classificar isso automaticamente:** há
estudos publicados tentando automatizar esse julgamento (ex.: Jayakodi et
al. 2016; Omar et al. 2012). Todos usam a mesma ideia — casar o verbo do
enunciado com o nível — mas também mostram o limite dela: só pelo verbo, a
taxa de acerto fica em ~47-55%; levando em conta o tipo de questão e se ela
apresenta um caso concreto (não só o verbo isolado), passa de 70%. Ou seja:
dá para ter um palpite razoável sem IA, mas nunca 100% certo — por isso
isto é só uma sugestão, nunca uma decisão automática.

Por exigência do DEC-014 (nada de IA externa dentro do Apolo), a sugestão é
regra fixa em código: `lib/apolo/bloom-classifier.ts` (com uma cópia para
rodar fora do bundle da Worker, `scripts/lib/bloom-classifier.mjs`). Ela
olha o tipo da questão e pistas no enunciado (há um verbo de cálculo? um
cenário com números? um pedido de julgamento entre alternativas?) e devolve
um palpite. Rodando contra os 1.800 rascunhos reais: 638 viraram "lembrar"
(reconhecimento puro, tipo "sobre X, qual alternativa está correta?"), 921
"entender" (afirmações certo/errado e múltipla escolha que exigem entender
uma regra, sem cenário numérico) e 241 "aplicar" (problemas com números
concretos, tipo "um terreno mede 28m por 19m, qual o perímetro?"). Nenhum
"analisar"/"avaliar"/"criar" apareceu nesse lote — faz sentido, já que são
todas questões objetivas (múltipla escolha ou certo/errado), e esses três
níveis pedem tipicamente uma resposta aberta (dissertativa).

`pnpm run apolo:sugestao-bloom -- --target production` preenche o campo
Bloom só nos rascunhos ainda pendentes **sem** Bloom definido — nunca
sobrescreve um rascunho que o Abner já revisou, e a aprovação continua
exigindo ele confirmar (ou trocar) o Bloom, o conteúdo e a explicação antes
de a questão virar ativa. `-- --check` só mostra a contagem por nível, sem
gravar nada.

## Exclusão e backup

Remover uma fonte (pela tela ou DELETE `/api/apolo/fontes/:id`) apaga o PDF
do R2 e a linha do D1 de imediato — sem soft-delete, seguindo o compromisso
de exclusão em até 3 dias do DEC-08. O backup manual (`pnpm run backup:atlas`,
DEC-011) já copia o acervo de fontes junto com os demais anexos do R2.

## Base mista inicial: 30 provas autorais Atlas

Pedido do Abner (thread "Cards em escada do Apolo", 2026-10-10): como a
classificação por IA das fontes ficou em segundo plano (DEC-014 continua sem
IA), o banco de fontes nasce com uma base mista escrita pela própria Atlas —
30 "provas" de 60 questões (1800 no total), cadastradas como fonte tipo
`lista` (sem banca/órgão/ano — não são provas de concurso reais digitalizadas,
são material autoral, então nada inventado nesses campos).

Temas cobertos (abertos, DEC-014): contabilidade, contabilidade geral, direito
tributário, tributação, direito empresarial, direito eleitoral, direito
administrativo, direito constitucional, matemática, matemática financeira,
estatística, raciocínio lógico, dados, português, inglês, espanhol e
departamento pessoal/fiscal. Metade das questões de matemática, matemática
financeira, estatística, raciocínio lógico e metade de contabilidade/
contabilidade geral vem de cálculo gerado e verificado em código (resultado
nunca "chutado"); o restante vem de um banco de fatos escritos à mão, cada um
gerando uma questão de múltipla escolha e uma de certo/errado.

Arquivos em `data/apolo/fontes-autorais/` (`manifest.json` + um JSON por
prova); os 30 PDFs (prova + gabarito comentado) ficam fora do git — estão nos
arquivos do projeto, para baixar e colocar em `data/apolo/fontes-autorais/pdf/`
antes de rodar o carregador.

Carregar o lote (sobe o PDF no R2 e grava a fonte + os 60 rascunhos
"pendentes" de cada prova — nunca em `atlas_questions` direto; a aprovação
continua manual em `/rascunhos`, como qualquer outro rascunho):

```
pnpm run apolo:fontes-autorais -- --check
pnpm run apolo:fontes-autorais -- --target production --dir data/apolo/fontes-autorais
```

Idempotente pelo sha256 do PDF: rodar de novo não duplica uma prova já
carregada. Como os assuntos de direito e departamento fiscal/pessoal têm
risco de erro técnico, vale uma amostragem antes de ativar muitas questões
desses temas em massa pela tela de curadoria.
