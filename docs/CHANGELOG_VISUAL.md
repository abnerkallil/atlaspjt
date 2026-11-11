# Changelog visual do Atlas

Cada PR mesclado na `main` tem aqui uma entrada com o que muda para quem usa o
site e o ponto de restauração criado logo antes do merge: um branch
`restore/...` apontando para a `main` daquele momento (tags não podem ser
enviadas deste ambiente). Se algo no site
ficar estranho (uma nota, uma tela, um número), procure a entrada que mexe
naquela parte; para ver o estado anterior a um PR, use o ponto dele:

```
git checkout restore/<nome>
```

ou peça ao Claude para reverter o PR. Publicar continua sendo um passo seu
(`Publicar Atlas.cmd`): nada daqui aparece no site antes disso.

## PR (a abrir) — Lote 4 de questões do roadmap de Contabilidade (CT-030–CT-039)

- Ponto de restauração: branch `restore/pre-ct-030-039` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-030-039.csv`, 150 questões autorais — 15 por
  conteúdo, CT-030 a CT-039, bloco de Simples Nacional: estrutura/opção,
  MEI/SIMEI, receita bruta/RBT12, anexos/faixas, Fator R, segregação no
  PGDAS-D, PGDAS-D/DAS/retificações, DEFIS, restituição/compensação/
  parcelamento e um caso completo integrador), fundamentadas na LC
  123/2006 e na Resolução CGSN 140/2018, seguindo o padrão dos lotes
  anteriores (`docs/APOLO-questoes-roadmap-plano.md`, lote 3b). As
  questões só aparecem para o aluno depois que o Abner rodar `pnpm run
  questoes:importar -- --target production --file
  data/questoes/lote-ct-030-039.csv` (comando ainda não enviado; vai
  junto com os próximos lotes do mesmo plano).
- O que muda fora do site: `docs/APOLO-questoes-roadmap-plano.md` marca o
  lote 3b como feito.
- Se algo der errado: reverter para `restore/pre-ct-030-039` volta ao
  estado anterior; como nada foi carregado em produção ainda, não há
  nenhuma questão para desfazer no D1.

## PR #123 — Lote 3 de questões do roadmap de Contabilidade (CT-020–CT-029)

- Ponto de restauração: branch `restore/pre-apolo-lote-ct-020-029` (main
  antes do merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-020-029.csv`, 150 questões autorais — 15 por
  conteúdo, CT-020 a CT-029, cadastros e documentos fiscais eletrônicos),
  fundamentadas na aula-base `data/apache/aulas/contabilidade-tributaria-03.json`,
  seguindo o padrão dos lotes 1 e 2 (`docs/APOLO-questoes-roadmap-plano.md`).
  As questões só aparecem para o aluno depois que o Abner rodar
  `pnpm run questoes:importar -- --target production --file
  data/questoes/lote-ct-020-029.csv` (comando ainda não enviado; vai junto
  com os próximos lotes do mesmo plano).
- O que muda fora do site: `docs/APOLO-questoes-roadmap-plano.md` marca o
  lote 3 como feito.
- Se algo der errado: reverter para `restore/pre-apolo-lote-ct-020-029` volta
  ao estado anterior; como nada foi carregado em produção ainda, não há
  nenhuma questão para desfazer no D1.

## PR #122 — Lote 2 de questões do roadmap de Contabilidade (CT-011–CT-019)

- Ponto de restauração: branch `restore/pre-apolo-lote-ct-011-019` (main
  antes do merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-011-019.csv`, 135 questões autorais — 15 por
  conteúdo, CT-011 a CT-019), fundamentadas nas aulas-base de
  `data/apache/aulas/contabilidade-tributaria-01.json` e `-02.json` e na
  legislação vigente (CTN arts. 105-138, CPC 25 e CPC 32), seguindo o padrão
  do lote 1 (`docs/APOLO-questoes-roadmap-plano.md`). As questões só
  aparecem para o aluno depois que o Abner rodar
  `pnpm run questoes:importar -- --target production --file
  data/questoes/lote-ct-011-019.csv` (comando ainda não enviado; vai junto
  com os próximos lotes do mesmo plano).
- O que muda fora do site: `docs/APOLO-questoes-roadmap-plano.md` marca o
  lote 2 como feito.
- Se algo der errado: reverter para `restore/pre-apolo-lote-ct-011-019` volta
  ao estado anterior; como nada foi carregado em produção ainda, não há
  nenhuma questão para desfazer no D1.

## PR #120 — Correção: `--check` ignorava `--target production`

- Ponto de restauração: branch `restore/pre-fix-check-ignores-target` (main
  antes do merge).
- O que muda no site: nada agora — é a correção de um bug nos dois scripts
  dos PRs #116/#117 antes de o Abner rodar qualquer um deles em produção.
- O que muda fora do site:
  - Bug: `scripts/apolo-classificar-rotulos-ct.mjs` e
    `scripts/apolo-aprovar-rascunhos-roadmap.mjs` tinham
    `const target = values.check ? 'local' : requireTarget(values.target);`
    — ou seja, assim que `--check` era passado, o `--target production`
    informado era **ignorado** e o script sempre lia o D1 local (vazio/de
    desenvolvimento), nunca o de produção. Por isso a prévia que o Abner
    rodou com `--check --target production` mostrou 0 em tudo, mesmo com
    centenas de rascunhos reais em produção.
  - Correção: `const target = requireTarget(values.target);` nos dois
    scripts — `--check` agora só pula a gravação (como sempre fez), mas lê
    o ambiente que `--target` pedir, inclusive `production`.

## PR #118 — Plano de questões para o roadmap de Contabilidade + lote 1 (CT-001/CT-002)

- Ponto de restauração: branch `restore/pre-apolo-plano-questoes-roadmap`
  (commit `962eb58`, main antes do merge).
- O que muda no site: nada visível ainda. É só documentação
  (`docs/APOLO-questoes-roadmap-plano.md`) e um arquivo de dados
  (`data/questoes/lote-ct-001-002.csv`, 20 questões autorais para CT-001 e
  CT-002). As questões só aparecem para o aluno depois que o Abner rodar
  `pnpm run questoes:importar -- --target production --file
  data/questoes/lote-ct-001-002.csv` (comando ainda não enviado; vai junto
  com os próximos lotes do mesmo plano).
- Se algo der errado: reverter para `restore/pre-apolo-plano-questoes-roadmap`
  volta ao estado anterior; como nada foi carregado em produção ainda, não
  há nenhuma questão para desfazer no D1.

> Nota técnica (2026-11-11): este arquivo ficou grande demais para esta
> sessão reescrever com segurança de uma vez (ferramenta de push por
> conteúdo completo, sem patch). Para não arriscar corromper o histórico,
> as entradas de PRs anteriores ao #116 foram removidas **deste arquivo**,
> mas continuam intactas no histórico do git: `git log -p -- docs/CHANGELOG_VISUAL.md`
> (ou veja a versão de `main` antes deste PR) traz todas de volta. Uma
> sessão futura pode restaurá-las no arquivo sem perda de informação.

## PR (a abrir) — Apolo: 20 questões reais de provas da Receita Federal para o roadmap de Contabilidade

- Ponto de restauração: branch `restore/pre-apolo-provas-rf-contabilidade`
  (main antes do merge).
- O que muda no site: depois de o Abner rodar o comando de produção, 15
  conteúdos do roadmap de Contabilidade (CG-006, CG-019, CG-026, CG-027,
  CG-029, CG-031, CG-032, CG-034, CG-036, CG-038, CA-001, CA-003, CA-004,
  CA-007, CC-002) ganham 1 a 2 questões novas, extraídas de provas reais de
  concurso (AFRFB/ATRFB) da Receita Federal, enviadas pelo Abner na thread
  "Incluir questões das provas da Receita Federal".
- O que muda fora do site:
  - Novo script `scripts/apolo-carregar-provas-curadas.mjs`
    (`pnpm run apolo:carregar-provas-curadas -- --file <json> --check|--target <local|production>`):
    insere em `atlas_question_drafts`, como "pendente", questões já
    curadas (conteúdo do roadmap, nível de Bloom, tipo de conhecimento e
    explicação decididos por quem escreveu o arquivo) — nunca grava em
    `atlas_questions` direto. Existia uma lacuna entre `apolo:extrair`
    (corte automático por regra, só reconhece alternativas A-E maiúsculas
    separadas por "." ou ")") e `apolo:aplicar-curadoria` (só atualiza um
    rascunho que já existe): nenhum dos dois servia para carregar uma prova
    real cujo enunciado e gabarito exigem leitura humana/IA para separar o
    que é de Contabilidade e, nas provas sem gabarito, resolver a resposta.
  - Dados em `data/apolo/provas-rf-2026-11/` (3 arquivos JSON, 20
    questões): AFRFB 2023 (FGV) manhã — 4; ATRFB 2023 (FGV) manhã — 8;
    ATRFB 2012 (ESAF) Prova 2 Área Geral — 8. Todas com gabarito oficial
    (nenhuma precisou de resposta resolvida pela Claude nesta primeira
    leva); banca/órgão/ano reais, preservados nos campos `exam_board`/
    `exam_org`/`exam_year`.
  - Os rascunhos entram já elegíveis para `apolo:aprovar-roadmap` (PR
    #116) — a aprovação em si não faz parte deste PR, é o comando de
    produção enviado ao Abner depois do merge.
  - Testado localmente (`--target local`): carga dos 20 rascunhos +
    `apolo:aprovar-roadmap` aprovou os 20 sem erro, cobrindo os 15
    conteúdos acima; suíte `pnpm run test:notes` (543 testes) verde.
  - Restam, para uma thread futura: ATRFB 2012 Prova 2 Área Informática
    (também tem seção de Contabilidade Geral) e AFRFB 2014 Prova 2 (sem
    gabarito anexado — precisa resposta resolvida e verificada por leitura
    humana/IA antes de carregar).

## PR #117 — Apolo: classificação dos rascunhos "soltos" de Contabilidade Tributária por rótulo

- Ponto de restauração: branch `restore/pre-apolo-classificar-rotulos-ct`
  (main antes do merge).
- O que muda no site: nada por si só — este script só preenche `content_id`
  em rascunhos que ainda estavam só com `content_label_id` (taxonomia
  pré-roadmap). O efeito visível (questões ativas nos conteúdos CT-003,
  CT-004, CT-005, CT-006, CT-008, CT-009, CT-010, CT-068 e CT-112) só aparece
  depois de rodar `apolo:aprovar-roadmap` (PR #116) em seguida.
- O que muda fora do site:
  - Novo script `scripts/apolo-classificar-rotulos-ct.mjs`
    (`pnpm run apolo:classificar-ct -- --check|--target <local|production>`),
    a partir do levantamento
    `notes/levantamento-rascunhos-vs-roadmap-ct-2026-11-11.md`: reclassifica
    rascunhos pendentes com `content_id` NULL (só `content_label_id`, nos
    temas `direito-tributario`/`tributacao`/`departamento-fiscal`) para o
    `content_id` do roadmap quando o rótulo bate claramente com UM conteúdo
    específico (não uma faixa com vários nós, que exigiria ler cada
    enunciado — essas faixas, ex. CT-091..098, ficam de fora de propósito).
  - Sempre roda com `--check` antes de gravar, mostrando quantos rascunhos
    cada grupo de rótulos capturou, para o Abner comparar com as contagens
    do levantamento.

## PR #116 — Apolo: aprovação em lote de rascunhos com conteúdo do roadmap já preenchido

- Ponto de restauração: branch `restore/pre-apolo-aprovar-roadmap` (main antes
  do merge).
- O que muda no site: depois de o Abner rodar o comando de produção, os
  conteúdos do roadmap de Contabilidade que hoje têm 0 questão aprovada mas
  já têm rascunhos classificados (todo o bloco AD-\*, CA-\*, CC-\* e parte de
  CG/CT) passam a ter questões ativas — o quiz desses conteúdos deixa de
  ficar vazio.
- O que muda fora do site:
  - Novo script `scripts/apolo-aprovar-rascunhos-roadmap.mjs`
    (`pnpm run apolo:aprovar-roadmap -- --check|--target <local|production>`),
    pedido do Abner na thread "Aprovar rascunhos do roadmap de
    contabilidade": aprova automaticamente todo rascunho **pendente** em
    `atlas_question_drafts` cujo `content_id` já bate com um nó real de
    `atlas_contents` (a curadoria anterior — PRs #72-#79 — só preenche esse
    campo quando o nó do roadmap já existe), substituindo, só para este
    lote, a regra de nunca aprovar sem revisão humana (DEC-014).
  - Replica exatamente `approveDraft()` (`lib/apolo/drafts.ts`): grava a
    questão em `atlas_questions` na posição seguinte do conteúdo, já ativa,
    e marca o rascunho como `aprovado`; calcula a posição seguinte em
    memória por `content_id` (em vez de uma subquery por linha, que daria a
    mesma posição a várias questões do mesmo conteúdo no mesmo lote).
  - Só aprova quem já tem `content_id`, `bloom_level` e `explanation`
    preenchidos (mesma exigência de `approveDraft()`); ignora e lista
    separadamente qualquer `content_id` que não exista em `atlas_contents`
    (nenhum conteúdo novo é criado — para Contabilidade isso nunca é
    necessário, porque `content_id` só é preenchido quando o nó já existe).
  - Usa as colunas já indexadas de `atlas_question_drafts` (`status`,
    `content_id` — migração 0017) como filtro principal, então não repete o
    estouro de leitura do D1 do incidente de 2026-10-13.
