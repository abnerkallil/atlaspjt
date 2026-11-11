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

## PR #137 — Lote 12 de questões do roadmap de Contabilidade (CT-088–CT-097, retenções e SPED)

- Ponto de restauração: branch `restore/pre-lote-ct-088-097` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-088-097.csv`, 150 questões autorais — 15 por
  conteúdo, sem nenhum deles ter questão aprovada antes). Retenções:
  PIS/Cofins/CSLL (CT-088), ISS (CT-089). Folha e retenções: EFD-Reinf,
  DCTFWeb e MIT (CT-090). Obrigações e SPED: ECD (CT-091), ECF (CT-092),
  EFD-Contribuições (CT-093), EFD ICMS/IPI (CT-094), eSocial/EFD-Reinf/
  DCTFWeb (CT-095), PER/DCOMP Web (CT-096), obrigações estaduais e
  municipais (CT-097). Fundamentado na Lei 10.833/2003 (retenção
  unificada), LC 116/2003 e LC 157/2016 (ISS), e na estrutura do SPED
  (ECD, ECF, EFD-Contribuições, EFD ICMS/IPI).

## PR #135 — Lote 13 de questões do roadmap de Contabilidade (CT-078–CT-087, ISS e Folha/retenções)

- Ponto de restauração: branch `restore/pre-lote-ct-078-087` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-078-087.csv`, 150 questões autorais — 15 por
  conteúdo, sem nenhum deles ter questão aprovada antes). ISS: LC 116 e
  lista de serviços (CT-078), local da incidência e exportação de serviços
  (CT-079), base/alíquotas/deduções (CT-080), retenção e responsabilidade
  (CT-081), NFS-e e fechamento municipal (CT-082). Folha e retenções:
  contribuições previdenciárias da folha (CT-083), eSocial e fechamento da
  folha (CT-084), CPRB e regimes previdenciários sobre receita (CT-085),
  retenção previdenciária em serviços (CT-086), IRRF sobre pagamentos
  (CT-087). Fundamentado na Constituição (art. 156, III), LC 116/2003, Lei
  8.212/1991, Lei 12.546/2011, Lei 7.713/1988, Lei 7.450/1985 e
  jurisprudência consolidada do STF/STJ (SV 31, Súmula 163/STJ, Temas
  296 e 816), sem citar banca/órgão/ano (origem "autoral"). As questões só
  aparecem para o aluno depois que o Abner rodar o comando de carga em
  produção (ainda não enviado; vai ser acumulado com os demais lotes,
  conforme `docs/APOLO-questoes-roadmap-plano.md`).

## PR #133 — Lote 11 de questões do roadmap de Contabilidade (CG-016–CG-020, CG-026, Mecânica contábil e Clientes/contas a receber)

- Ponto de restauração: branch `restore/pre-lote-cg-016-026` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-cg-016-026.csv`, 87 questões autorais — Lançamentos
  contábeis (CG-016), Livros Diário e Razão (CG-017), Escrituração contábil
  (CG-018), Balancete de verificação (CG-019), Erros e correções de
  escrituração (CG-020) e Clientes e contas a receber (CG-026)). 15
  questões novas para CG-016, CG-017, CG-018 e CG-020 (nenhum tinha questão
  aprovada ou rascunho próprio antes). CG-019 recebe 14 novas (ordem 2–15):
  há 1 questão da prova ATRFB 2012 Área Geral curada na PR #123
  (`data/apolo/provas-rf-2026-11/atrfb-2012-area-geral-contabilidade.json`)
  ainda como rascunho pendente de aprovação em `/rascunhos`, contada como já
  cobrindo a ordem 1. CG-026 recebe 13 novas (ordem 3–15): há 2 questões da
  mesma prova já curadas para esse conteúdo, contadas como ordem 1–2.
  Fundamentado na aula já existente no acervo
  (`data/apache/aulas/contabilidade-geral-2.json`), sem citar banca/órgão/ano
  (origem "autoral"). As questões só aparecem para o aluno depois que o
  Abner rodar o comando de carga em produção (ainda não enviado; vai ser
  acumulado com os demais lotes, conforme
  `docs/APOLO-questoes-roadmap-plano.md`).

## PR #132 — Lote 10 de questões do roadmap de Contabilidade (CG-007, CG-009–CG-012, CG-014, Contas e teorias do débito/crédito)

- Ponto de restauração: branch `restore/pre-cg-007-014-20261111201759` (main
  antes do merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-cg-007-014.csv`, 90 questões autorais — conceito,
  função e estrutura das contas (CG-007), contas de resultado (CG-009),
  Teoria Personalista (CG-010), Teoria Materialista (CG-011), Teoria
  Patrimonialista (CG-012) e natureza devedora e credora (CG-014). 15
  questões novas por conteúdo (nenhum dos seis tinha questão aprovada ou
  rascunho próprio em produção antes deste lote; confirmado também que as
  provas da Receita Federal curadas nas PRs #123 e #125 não tocam esses
  `content_id`). Fundamentado nas aulas já existentes no acervo
  (`data/apache/aulas/contabilidade-geral-1.json` e
  `contabilidade-geral-2.json`), sem citar banca/órgão/ano (origem
  "autoral"). As questões só aparecem para o aluno depois que o Abner rodar
  o comando de carga em produção (ainda não enviado; vai ser acumulado com
  os demais lotes, conforme `docs/APOLO-questoes-roadmap-plano.md`).

## PR #131 — Lote 9 de questões do roadmap de Contabilidade (CT-118–CT-124, Reforma tributária — Documentos fiscais)

- Ponto de restauração: branch `restore/pre-ct-118-124` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-118-124.csv`, 105 questões autorais — CST,
  cClassTrib e tributação no documento fiscal (CT-118), NF-e e NFC-e na
  Reforma Tributária (CT-119), NFS-e e DPS na Reforma Tributária (CT-120),
  correções, ajustes e eventos fiscais na Reforma (CT-121), créditos e
  apuração assistida (CT-122), cadastros, ERP, EFD e controles na Reforma
  Tributária (CT-123) e o caso integrado de implantação da Reforma nos
  documentos fiscais (CT-124). 15 questões novas por conteúdo (nenhum dos
  sete tinha questão aprovada em produção antes deste lote). Fundamentado
  na aula já existente no acervo (`data/apache/aulas/contabilidade-tributaria-15.json`,
  por sua vez baseada na LC 214/2025), sem citar banca/órgão/ano (origem
  "autoral"). As questões só aparecem para o aluno depois que o Abner rodar
  o comando de carga em produção (ainda não enviado; vai ser acumulado com
  os demais lotes, conforme `docs/APOLO-questoes-roadmap-plano.md`).

## PR #130 — Lote 8 de questões do roadmap de Contabilidade (CT-098, CT-108–CT-117, Malha fiscal e Governança/domínio)

- Ponto de restauração: branch `restore/pre-ct-108-117` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-108-117.csv`, 165 questões autorais — CT-098
  (cruzamentos e malhas fiscais) e o bloco Governança e domínio completo:
  calendário e fechamento fiscal integrado (CT-108), cadastro e motor
  tributário (CT-109), revisão e auditoria tributária (CT-110), passivo,
  certidões e processo tributário (CT-111), planejamento tributário lícito
  (CT-112), módulos setoriais e regimes especiais (CT-113), tributação
  internacional (CT-114), tax technology e dados fiscais (CT-115), capstone
  multirregime (CT-116) e avaliação de domínio em Contabilidade Tributária
  (CT-117). 15 questões novas por conteúdo (nenhum dos onze tinha questão
  aprovada em produção antes deste lote). Fundamentado direto na legislação
  vigente (CTN, Lei 9.249/1995, Lei 9.718/1998, Lei 12.973/2014, Lei
  13.988/2020, Lei 14.596/2023, LC 123/2006, LC 116/2003, EC 132/2023, LC
  214/2025, entre outras), sem aula própria no acervo (`data/apache/aulas`)
  e sem citar banca/órgão/ano (origem "autoral"). As questões só aparecem
  para o aluno depois que o Abner rodar o comando de carga em produção
  (ainda não enviado; vai ser acumulado com os demais lotes, conforme
  `docs/APOLO-questoes-roadmap-plano.md`).

## PR #129 — Lote 7 de questões do roadmap de Contabilidade (CT-099–CT-107, Reforma Tributária)

- Ponto de restauração: branch `restore/pre-ct-099-107` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-099-107.csv`, 135 questões autorais — CT-099 a
  CT-107, bloco Reforma tributária: fundamentos da reforma do consumo
  (CT-099), CBS (CT-100), IBS (CT-101), Imposto Seletivo (CT-102), não
  cumulatividade/créditos/destino (CT-103), regimes diferenciados,
  específicos e favorecidos (CT-104), Simples Nacional na transição
  (CT-105), documentos/split payment/cashback (CT-106) e transição
  2026–2033 (CT-107). 15 questões novas por conteúdo (nenhum dos nove
  tinha questão aprovada em produção antes deste lote). Fundamentado na
  EC 132/2023 e na LC 214/2025, sem citar banca/órgão/ano (origem
  "autoral"). As questões só aparecem para o aluno depois que o Abner
  rodar o comando de carga em produção (ainda não enviado; vai ser
  acumulado com os demais lotes, conforme
  `docs/APOLO-questoes-roadmap-plano.md`).

## PR TBD — Lote 6 de questões do roadmap de Contabilidade (CT-073–CT-077, IPI)

- Ponto de restauração: branch `restore/pre-ct-073-077` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-073-077.csv`, 75 questões autorais — CT-073 a
  CT-077, bloco de IPI: incidência e conceito de industrialização
  (CT-073), TIPI/NCM e enquadramento (CT-074), base de cálculo e
  apuração (CT-075), suspensão/isenção/imunidade e regimes especiais
  (CT-076), escrituração e EFD ICMS/IPI (CT-077). 15 questões novas por
  conteúdo (nenhum dos cinco tinha questão aprovada em produção antes
  deste lote). Fundamentado no CTN (arts. 46 e 51), na Lei nº 4.502/1964
  e no RIPI (Decreto nº 7.212/2010, arts. 4º, 5º e 9º), além do art.
  153, §3º, da Constituição Federal (não cumulatividade, seletividade e
  imunidade na exportação). Desviei do pedido inicial (CT-050–CT-059):
  essa faixa está listada no plano como dependente de reconferência em
  produção após a PR #116 (candidatos de Lucro Real/PIS-Cofins já
  relabelados), então escrevi o próximo lote realmente pendente e sem
  esse risco de duplicar cobertura — CT-073–CT-077 (IPI), lote 4 do
  plano. As questões só aparecem para o aluno depois que o Abner rodar o
  comando de carga em produção (ainda não enviado; vai ser acumulado com
  os demais lotes, conforme `docs/APOLO-questoes-roadmap-plano.md`).

## PR #127 — Lote 5 de questões do roadmap de Contabilidade (CT-040–CT-049)

- Ponto de restauração: branch `restore/pre-ct-040-049` (main antes do
  merge).
- O que muda no site: nada visível ainda. É só um arquivo de dados
  (`data/questoes/lote-ct-040-049.csv`, 148 questões autorais — CT-040 a
  CT-049, bloco de Lucro Presumido (elegibilidade/opção/apuração
  trimestral, receita bruta e percentuais de presunção, demais receitas e
  ganhos de capital, IRPJ e adicional, CSLL, PIS/Cofins cumulativos) e
  início do Lucro Real (obrigatoriedade/opção/modalidades, ponte fiscal,
  despesas dedutíveis/indedutíveis, e-Lalur/e-Lacs). CT-040 e CT-046 já
  tinham 1 questão aprovada em produção (`CT-040-Q01`, `CT-046-Q01`); o
  lote não reaproveita esses ids, e sim completa 14 questões novas em
  cada um desses dois conteúdos (ordem 2 a 15), e 15 novas nos outros 8
  conteúdos — total de 148 questões para completar as 15 por conteúdo
  nos 10 conteúdos do lote. Fundamentado na aula-base de cada conteúdo
  (`data/apache/aulas/contabilidade-tributaria-05.json` e `-06.json`) e
  na legislação nela citada (Lei nº 9.718/1998, arts. 12 a 14; Lei nº
  9.249/1995, arts. 15 e 20; Lei nº 4.506/1964, art. 47; IN RFB nº
  1.422/2013), seguindo o padrão dos lotes anteriores
  (`docs/APOLO-questoes-roadmap-plano.md`, lote 3c). As questões só
  aparecem para o aluno depois que o Abner rodar `pnpm run
  questoes:importar -- --target production --file
  data/questoes/lote-ct-040-049.csv` (comando ainda não enviado; vai
  junto com os próximos lotes do mesmo plano).
- O que muda fora do site: `docs/APOLO-questoes-roadmap-plano.md` marca o
  lote 3c como feito.
- Se algo der errado: reverter para `restore/pre-ct-040-049` volta ao
  estado anterior; como nada foi carregado em produção ainda, não há
  nenhuma questão para desfazer no D1.

## PR #126 — Lote 4 de questões do roadmap de Contabilidade (CT-030–CT-039)

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

## PR (a abrir) — Apolo: ATRFB 2012 Informática e AFRFB 2014, mais 15 questões reais da Receita Federal

- Ponto de restauração: branch `restore/pre-apolo-provas-rf-atrfb2012-info-afrfb2014`
  (main antes do merge).
- O que muda no site: depois de o Abner rodar o comando de produção, mais
  10 conteúdos do roadmap de Contabilidade (CG-029, CG-030, CG-031, CG-034,
  CG-038, AD-001, AD-004, CA-001, CA-003, CA-005, CA-007) ganham 1 a 2
  questões novas, extraídas das provas ATRFB 2012 (Prova 2, Área
  Informática) e AFRFB 2014 (Prova 2) da Receita Federal, enviadas pelo
  Abner na thread "Provas da Receita: ATRFB 2012 Informática e AFRFB 2014".
- O que muda fora do site:
  - `data/apolo/provas-rf-2026-11/atrfb-2012-informatica-contabilidade.json`
    (1 questão): a seção de Contabilidade Geral da Área Informática
    (questões 21-30) é idêntica à da Área Geral já carregada no PR
    anterior (mesmo enunciado e mesmo gabarito oficial em ambas as áreas),
    então a dedupe por `text_hash` descarta 9 das 10 questões
    automaticamente; só a questão 27 (conceitual, sobre coligadas,
    investimento relevante, leasing e nomenclatura de "impostos a
    recolher") não estava no arquivo anterior.
  - `data/apolo/provas-rf-2026-11/afrfb-2014-contabilidade.json` (14
    questões): Prova 2 do AFRFB/2014, sem gabarito oficial anexado — todas
    resolvidas e verificadas pela Claude (cálculos refeitos e conferidos
    contra as 5 alternativas antes de marcar a correta), cobrindo DFC, DVA,
    índices de liquidez e rentabilidade, folha de pagamento, impairment
    (CPC 01), baixa de imobilizado, desconto de duplicatas (registro,
    inadimplência e regime de competência dos juros), reserva legal e
    classificação de reservas, e equivalência patrimonial (apuração e
    dividendos). Das 20 questões de Contabilidade Geral e Avançada da
    prova (21-45 no caderno), 6 ficaram de fora por não terem resposta
    segura ou mapeamento claro para um conteúdo do roadmap atual: duas
    envolvem índices sem conteúdo correspondente no roadmap (grau de
    endividamento; classificação de imóvel para valorização/"propriedade
    para investimento"), e três fazem parte de uma cascata de
    participações nos lucros (Cia. Madeira) cuja ordem exata de cálculo
    (debenturistas, empregados, administração) não é dedutível com
    segurança sem o gabarito oficial — ficou só a Reserva Legal (5% do
    lucro líquido, valor que não depende dessa ordem).
  - Testado localmente (`--target local` via `--check`): os dois arquivos
    passam na validação do `apolo:carregar-provas-curadas` (15 rascunhos
    novos, nenhum `content_id` inválido); suíte `pnpm run test:notes` (543
    testes) verde.
  - Com isso fecham as duas pendências que o PR anterior deixou em aberto
    (ATRFB 2012 Área Informática e AFRFB 2014).

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
