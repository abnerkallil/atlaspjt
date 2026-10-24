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

## PR #108 (pendente) — APA-18: aulas base de Contabilidade Tributária (sub-lote 5h)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-08`
  (commit `eab072e`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  10 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: oitavo sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-08.json` (10 dos 124
  conteúdos: CT-063 a CT-072, unidade "ICMS", na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#107 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: fundamentos e
  fontes normativas (art. 155, II e §2º, CF; LC 87/1996 — Lei Kandir;
  convênios CONFAZ; não cumulatividade e seletividade facultativa); fato
  gerador, local da operação, contribuinte (inclusive importador pessoa
  física, RE 439.796/STF) e base de cálculo "por dentro"; alíquotas
  internas (estaduais) e interestaduais (7%/12% pela Resolução do Senado
  nº 22/1989; 4% para importados pela Resolução nº 13/2012); não
  cumulatividade, vedação ao crédito de uso e consumo (prorrogada até
  2033 pela LC 171/2019) e estorno de crédito; DIFAL e FCP (EC 87/2015,
  Convênio ICMS 236/2021 e LC 190/2022, após a invalidação do Convênio
  93/2015 por falta de lei complementar); substituição tributária, CEST,
  MVA e o direito a ressarcimento/complemento fixado pelo STF no RE
  593.849; benefícios fiscais (isenção, redução de base, crédito
  presumido, diferimento, suspensão) e suas obrigações acessórias; CIAP e
  crédito do ativo imobilizado em 48 parcelas (LC 87/1996, art. 20, §5º);
  importação, imunidade de exportação (EC 42/2003), não incidência em
  transferências entre estabelecimentos do mesmo titular (ADC 49/STF,
  Convênio ICMS 178/2023) e operações triangulares/industrialização por
  encomenda; e a EFD ICMS/IPI (blocos 0/C/D/E/G/H/K/9, apuração no
  registro E110). Legislação e cronograma da reforma tributária
  confirmados vigentes em 2026 (pesquisa web: fase de teste do IBS/CBS em
  2026 não reduz o ICMS; extinção do ICMS só em 2033, após transição
  gradual entre 2029 e 2032). `docs/APACHE-18-plano.md` atualizado
  (sub-lote 5h mesclado; Tributária em 72/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-08` volta ao estado
  anterior; nenhuma aula ainda foi carregada em produção, então reverter
  sem ter rodado o script de carga não perde nada.

## PR #107 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5g)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-07`
  (commit `82fb570`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  7 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: sétimo sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-07.json` (7 dos 124
  conteúdos: CT-056 a CT-062, unidade "PIS e Cofins", na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#106 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: incidência,
  contribuintes e base de cálculo (art. 195, I, "b", da Constituição;
  exclusão do ICMS pelo RE 574.706/2017 do STF; ICMS-ST, IPI destacado,
  vendas canceladas e descontos incondicionais como exclusões da Lei nº
  9.718/1998); regime cumulativo (Lei nº 9.718/1998 — 0,65%/3%, Lucro
  Presumido/Arbitrado, sem crédito); regime não cumulativo (Leis nº
  10.637/2002 e 10.833/2003 — 1,65%/7,6%, créditos listados em lei, e o
  conceito de insumo pós-REsp nº 1.221.170/PR do STJ consolidado na IN RFB
  nº 2.121/2022 — essencialidade/relevância — com rateio e estorno de
  créditos); monofasia, substituição tributária, alíquota zero, isenção e
  suspensão (combustíveis, farmacêuticos, perfumaria, autopeças,
  cigarros); PIS/Cofins-Importação (Lei nº 10.865/2004) e imunidade de
  exportação (art. 149, §2º, I, da Constituição) com manutenção de
  créditos; EFD-Contribuições (blocos 0/A/C/D/F/M/9, CST, retificação); e
  um caso completo integrando classificação, apuração e contabilização.
  Alíquotas confirmadas vigentes em 2026 (pesquisa web: fase de teste da
  CBS em 2026 roda em paralelo, com alíquota simbólica própria, sem
  reduzir PIS/Cofins — a Reforma Tributária em sentido estrito continua
  fora do escopo deste sub-lote, tratada nos sub-lotes 5m/5o).
  `docs/APACHE-18-plano.md` atualizado (sub-lote 5g mesclado; Tributária
  em 62/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-07` volta ao estado
  anterior; nenhuma aula ainda foi carregada em produção, então reverter
  sem ter rodado o script de carga não perde nada.

## PR #106 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5f)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-06`
  (commit `482aee5`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  10 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: sexto sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-06.json` (10 dos 124
  conteúdos: CT-046 a CT-055, unidade "Lucro Real", na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#105 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: obrigatoriedade
  e modalidades do Lucro Real (Lei nº 9.718/1998, art. 14 — limite de R$
  78.000.000,00 de receita total anual ou proporcional, instituições
  financeiras, lucros do exterior, benefícios fiscais, estimativa já paga
  no ano, factoring/securitização; apuração trimestral x anual com
  estimativas); a "ponte fiscal" do lucro líquido contábil ao lucro real
  (adições, exclusões, compensações); critérios de dedutibilidade de
  despesas (Lei nº 4.506/1964, art. 47) e indedutibilidade de multas
  punitivas e provisões em geral; e-Lalur/e-Lacs (IN RFB nº 1.422/2013,
  Parte A/Parte B); compensação de prejuízo fiscal e base negativa de
  CSLL com a trava dos 30% e sem prazo de prescrição (Lei nº 9.065/1995,
  arts. 15 e 16); estimativas mensais e balanços de suspensão/redução
  (Lei nº 8.981/1995, art. 35); crédito fiscal de subvenção para
  investimento (Lei nº 14.789/2023, vigente desde 2024, substituindo a
  exclusão direta do art. 30 da Lei nº 12.973/2014) e incentivos
  regionais SUDAM/SUDENE; juros sobre capital próprio (Lei nº 9.249/1995,
  art. 9º — limite pela TJLP e pelo dobro do lucro/reservas), preços de
  transferência (Lei nº 9.430/1996, atualizada pela Lei nº 14.596/2023,
  padrão OCDE desde 2024) e subcapitalização (Lei nº 12.249/2010, arts.
  24-25 — limites 2:1 geral e 0,3:1 para jurisdições de tributação
  favorecida); tributo corrente x diferido e diferenças temporárias (CPC
  32); ECF e fechamento anual (prazo até o último dia útil de julho do
  ano seguinte, integração com e-Lalur/e-Lacs e recuperação de dados da
  ECD). Valores e dispositivos legais (limite de obrigatoriedade, trava
  dos 30%, limites de JCP, regime atual de subvenção, atualização dos
  preços de transferência e da subcapitalização, prazo da ECF)
  verificados contra fontes oficiais/recentes antes de escrever o
  conteúdo, incluindo a mudança de regime da subvenção para investimento
  (vigente desde 2024) e o novo marco de preços de transferência (vigente
  desde 2024); a Reforma Tributária em sentido estrito (IBS/CBS/Seletivo)
  fica fora do escopo deste sub-lote (tratada nos sub-lotes 5m/5o).
  `docs/APACHE-18-plano.md` atualizado (sub-lote 5f mesclado; Tributária
  em 55/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-06` volta ao estado
  anterior; nenhuma aula ainda foi carregada em produção, então reverter
  sem ter rodado o script de carga não perde nada.

## PR #105 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5e)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-05`
  (commit `5660c40`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  6 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: quinto sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-05.json` (6 dos 124 conteúdos:
  CT-040 a CT-045, unidade "Lucro Presumido", na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#104 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: elegibilidade,
  opção e vedações do Lucro Presumido (Lei nº 9.718/1998, art. 13 — limite
  de R$ 78.000.000,00 de receita bruta anual, ou proporcional por R$
  6.500.000,00/mês; art. 14 — vedações a instituições financeiras,
  factoring, benefícios fiscais e lucros no exterior) e apuração
  trimestral; receita bruta e percentuais de presunção do IRPJ e da CSLL
  por atividade (Lei nº 9.249/1995, arts. 15 e 20 — 8%/12% comércio, 16%
  (receita baixa)/32% serviços no IRPJ, sempre 32% na CSLL para serviços,
  1,6% combustíveis, exceção das profissões regulamentadas); ganhos de
  capital e receitas financeiras tributados integralmente, sem presunção;
  IRPJ (alíquota de 15% mais adicional de 10% sobre o que exceder R$
  60.000,00 por trimestre) e CSLL (alíquota única de 9%, sem adicional),
  com retenções e formas de pagamento; PIS e Cofins no regime cumulativo
  (0,65% e 3% mensais sobre a receita bruta, sem crédito) e a conciliação
  trimestral entre as apurações mensais de PIS/Cofins e a apuração
  trimestral de IRPJ/CSLL. Valores e mecanismos (limite de receita,
  percentuais de presunção, adicional de IRPJ, alíquotas de PIS/Cofins
  cumulativos) verificados contra fontes oficiais/recentes antes de
  escrever o conteúdo; a Reforma Tributária fica fora do escopo deste
  sub-lote (tratada nos sub-lotes 5m/5o). `docs/APACHE-18-plano.md`
  atualizado (sub-lote 5e mesclado; Tributária em 45/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-05` volta ao estado anterior;
  nenhuma aula ainda foi carregada em produção, então reverter sem ter
  rodado o script de carga não perde nada.

## PR #104 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5d)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-04`
  (commit `3a47b85`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  10 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: quarto sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-04.json` (10 dos 124
  conteúdos: CT-030 a CT-039, unidade "Simples Nacional", na ordem do
  catálogo, `model='claude-manual'`), usando o mesmo mecanismo de carga dos
  PRs #95-#103 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: estrutura,
  opção e vedações do Simples Nacional (LC 123/2006, limite de R$
  4.800.000,00 e sublimite de R$ 3.600.000,00 para ICMS/ISS); MEI e SIMEI
  (DAS-MEI, limite do MEI, DASN-SIMEI); receita bruta, regime de
  competência/caixa e RBT12; Anexos I a V, faixas e alíquota efetiva;
  Fator R (28%) e migração entre Anexos III e V; segregação de receitas no
  PGDAS-D (substituição tributária, monofásico, exportação); PGDAS-D, DAS
  e retificação; DEFIS e obrigações complementares; restituição,
  compensação, parcelamento e regularização; caso completo integrando
  todo o fluxo. Valores e mecanismos (limites, sublimite, Fator R 28%,
  prazos de DEFIS/DASN-SIMEI) verificados contra fontes oficiais/recentes
  antes de escrever o conteúdo; a interação da Reforma Tributária com o
  Simples Nacional fica fora do escopo deste sub-lote (tratada nos
  sub-lotes 5m/5o). `docs/APACHE-18-plano.md` atualizado (sub-lote 5d
  mesclado; Tributária em 39/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-04` volta ao estado anterior;
  nenhuma aula ainda foi carregada em produção, então reverter sem ter
  rodado o script de carga não perde nada.

## PR #103 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5c)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-03`
  (commit `0f7cf01`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  10 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: terceiro sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-03.json` (10 dos 124
  conteúdos: CT-020 a CT-029, unidade "Cadastros e documentos", na ordem do
  catálogo, `model='claude-manual'`), usando o mesmo mecanismo de carga dos
  PRs #95-#102 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: CNPJ/CNAE e
  autonomia fiscal do estabelecimento, inscrições e domicílios fiscais
  eletrônicos (DTE, e-CAC), certificado digital e procuração eletrônica,
  ecossistema de documentos fiscais eletrônicos (NF-e, NFC-e, CT-e, MDF-e,
  NFS-e) e seus eventos (cancelamento, carta de correção, manifestação do
  destinatário), e classificação fiscal (CFOP, NCM, CST/CSOSN, CEST);
  conteúdo cadastral/operacional, sem citação de dispositivo legal
  específico e sem reforma tributária (fora do escopo desta unidade).
  `docs/APACHE-18-plano.md` atualizado (sub-lote 5c mesclado; Tributária em
  29/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-03` volta ao estado anterior;
  nenhuma aula ainda foi carregada em produção, então reverter sem ter
  rodado o script de carga não perde nada.

## PR #102 — APA-18: aulas base de Contabilidade Tributária (sub-lote 5b)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-02`
  (commit `5cd425e`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  7 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: segundo sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-02.json` (7 dos 124
  conteúdos: CT-013 a CT-019, unidade "Contabilização", na ordem do
  catálogo, `model='claude-manual'`), usando o mesmo mecanismo de carga dos
  PRs #95-#101 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: tributos a
  recuperar e a recolher, reconhecimento por competência, tributos sobre
  compras/vendas/resultado, conciliação contábil-fiscal, provisões e
  contingências fiscais (CPC 25), tributos sobre o lucro corrente e
  diferido (CPC 32) e fechamento tributário integrado; cita apenas de forma
  genérica Lei nº 6.404/1976 arts. 177 e 187, CPC 00, CPC 16, CPC 25 e CPC
  32 — pronunciamentos/artigos consolidados e amplamente conhecidos, sem
  texto literal de dispositivo e sem reforma tributária (fora do escopo
  desta unidade). `docs/APACHE-18-plano.md` atualizado (sub-lote 5b
  mesclado; Tributária em 19/124).
- Se algo der errado: reverter para
  `restore/pre-apa-18-contabilidade-tributaria-02` volta ao estado anterior;
  nenhuma aula ainda foi carregada em produção, então reverter sem ter
  rodado o script de carga não perde nada.

## PR #101 (pendente) — APA-18: aulas base de Contabilidade Tributária (sub-lote 5a)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-tributaria-01`
  (commit `5cfed63`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  12 aulas só aparecem depois de o Abner rodar o comando de carga para esse
  arquivo (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
  O carregamento em produção de toda a Contabilidade Tributária será feito
  num único comando ao final de todos os 15 sub-lotes, a pedido do Abner.
- O que muda fora do site: primeiro sub-lote de Contabilidade Tributária em
  `data/apache/aulas/contabilidade-tributaria-01.json` (12 dos 124
  conteúdos: CT-001 a CT-012, unidade "Fundamentos", na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#100 (`scripts/apache-carregar-aulas.mjs`). Conteúdo: atividade
  financeira do Estado, Sistema Tributário Nacional, competência e
  repartição de receitas, espécies tributárias (teoria pentapartite),
  princípios e limitações ao poder de tributar, obrigação tributária
  (principal e acessória), hipótese de incidência e fato gerador, sujeitos
  da relação tributária, crédito tributário e lançamento, suspensão/
  extinção/exclusão do crédito, responsabilidade/solidariedade/sucessão e
  interpretação/vigência/aplicação da legislação; cita apenas de forma
  genérica dispositivos consolidados e amplamente conhecidos da
  Constituição Federal de 1988 (arts. 145 a 162, 150) e do CTN (Lei nº
  5.172/1966, arts. 3º, 96 a 138, 142 a 156, 173 a 175), sem texto literal
  de dispositivo e sem citar reforma tributária (fora do escopo desta
  unidade). `docs/APACHE-18-plano.md` atualizado: sub-lote 5a mesclado,
  Contabilidade Tributária em 12/124.
- Se algo der errado: reverter para `restore/pre-apa-18-contabilidade-tributaria-01`
  volta ao estado anterior; as aulas só existem em D1/R2 depois de o Abner
  rodar o comando de carga, então reverter sem ter rodado o comando não
  perde nada em produção.

## PR #100 (pendente) — APA-18: aulas base de Contabilidade Geral (sub-lote 4c, disciplina completa)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-geral-3`
  (commit `5e0a514`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  13 aulas só aparecem depois de o Abner rodar `pnpm run
  apache:carregar-aulas -- --file data/apache/aulas/contabilidade-geral-3.json
  --target production` (não precisa de "Publicar Atlas": o script grava
  direto em D1/R2).
- O que muda fora do site: terceiro e último sub-lote de Contabilidade
  Geral em `data/apache/aulas/contabilidade-geral-3.json` (13 dos 41
  conteúdos: CG-028 a CG-040, na ordem do catálogo, `model='claude-manual'`),
  usando o mesmo mecanismo de carga dos PRs #95-#99
  (`scripts/apache-carregar-aulas.mjs`). Conteúdo: operações usuais finais
  (CMV, tributos em compras/vendas, folha de pagamento,
  imobilizado/intangível/depreciação, empréstimos e financiamentos,
  provisões e contingências, operações com PL), fechamento contábil,
  demonstrações (Balanço, DRE, DLPA/DMPL/DFC, notas explicativas) e
  integração do ciclo contábil completo; cita apenas de forma genérica CPC
  27, CPC 04, CPC 25, CPC 03 e Lei nº 6.404/1976 arts. 178, 182 e 187, sem
  texto literal de dispositivo. `docs/APACHE-18-plano.md` atualizado:
  **Contabilidade Geral completa (41/41)**; inclui também proposta de 15
  sub-lotes para a próxima disciplina, Contabilidade Tributária (124
  conteúdos).

## PR #99 — APA-18: aulas base de Contabilidade Geral (sub-lote 4b)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-geral-2`
  (commit `a27bcaa`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  14 aulas só aparecem depois de o Abner rodar `pnpm run
  apache:carregar-aulas -- --file data/apache/aulas/contabilidade-geral-2.json
  --target production` (não precisa de "Publicar Atlas": o script grava
  direto em D1/R2).
- O que muda fora do site: segundo sub-lote de Contabilidade Geral em
  `data/apache/aulas/contabilidade-geral-2.json` (14 dos 41 conteúdos:
  CG-014 a CG-027, na ordem do catálogo, `model='claude-manual'`), usando o
  mesmo mecanismo de carga dos PRs #95-#98
  (`scripts/apache-carregar-aulas.mjs`). Conteúdo técnico: mecânica contábil
  (natureza devedora/credora, partidas dobradas, lançamentos, Diário/Razão,
  balancete, correção de erros), regime de competência e operações usuais
  (caixa/bancos, clientes, compras/vendas/estoques); cita apenas o regime
  de competência (Lei nº 6.404/1976, art. 177, e CPC 00) de forma genérica,
  sem outro dispositivo legal específico. `docs/APACHE-18-plano.md`
  atualizado (lote 4/5 em andamento: 28/41, restam CG-028 a CG-040).

## PR #98 — APA-18: aulas base de Contabilidade Geral (sub-lote 4a)

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-geral-1`
  (commit `62e4caf`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  14 aulas só aparecem depois de o Abner rodar `pnpm run
  apache:carregar-aulas -- --file data/apache/aulas/contabilidade-geral-1.json
  --target production` (não precisa de "Publicar Atlas": o script grava
  direto em D1/R2).
- O que muda fora do site: primeiro sub-lote de Contabilidade Geral em
  `data/apache/aulas/contabilidade-geral-1.json` (14 dos 41 conteúdos:
  CG-001 a CG-006, CG-041, CG-007 a CG-013, na ordem do catálogo,
  `model='claude-manual'`), usando o mesmo mecanismo de carga dos PRs
  #95-#97 (`scripts/apache-carregar-aulas.mjs`). Conteúdo majoritariamente
  técnico/conceitual (patrimônio, equação patrimonial, contas, teorias
  clássicas das contas — Personalista, Materialista, Patrimonialista —,
  plano de contas); CG-041 cita apenas a Estrutura Conceitual (CPC 00) de
  forma genérica, sem artigo específico. `docs/APACHE-18-plano.md`
  atualizado (lote 4/5 em andamento: 14/41, restam CG-014 a CG-040).

## PR #97 — APA-18: aulas base de Contabilidade Avançada

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-avancada`
  (commit `8abed42`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  7 aulas só aparecem depois de o Abner rodar `pnpm run apache:carregar-aulas
  -- --file data/apache/aulas/contabilidade-avancada.json --target
  production` (não precisa de "Publicar Atlas": o script grava direto em
  D1/R2).
- O que muda fora do site: terceiro lote do APA-18 em
  `data/apache/aulas/contabilidade-avancada.json` (7 conteúdos: CA-001 a
  CA-007, `model='claude-manual'`), usando o mesmo mecanismo de carga dos
  PRs #95/#96 (`scripts/apache-carregar-aulas.mjs`). Primeiro lote com
  citação de CPC (intangíveis/goodwill/MEP — CPC 04/15/18; consolidação —
  CPC 36; provisões/contingências/impairment — CPC 25/01; valor justo e
  AVP — CPC 46/12; subvenções — CPC 07; ajustes de exercícios anteriores —
  CPC 23; reserva legal — art. 193 da Lei 6.404/76; DOAR extinta pela Lei
  11.638/2007 e substituída pela DFC; DVA — CPC 09), citado apenas onde
  havia certeza. `docs/APACHE-18-plano.md` atualizado (lote 3/5 concluído).
- Se algo der errado: reverter para `restore/pre-apa-18-contabilidade-avancada`
  volta ao estado anterior; nenhuma aula chega a ser gravada em produção
  antes de o Abner rodar o comando acima, então reverter sem ter rodado o
  script não perde nada.

## PR #96 — APA-18: aulas base de Análise das Demonstrações Financeiras

- Ponto de restauração: branch `restore/pre-apa-18-analise-demonstracoes`
  (commit `6a5d538`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona os dados; as
  6 aulas só aparecem depois de o Abner rodar `pnpm run apache:carregar-aulas
  -- --file data/apache/aulas/analise-demonstracoes-financeiras.json --target
  production` (não precisa de "Publicar Atlas": o script grava direto em
  D1/R2).
- O que muda fora do site: segundo lote do APA-18 em
  `data/apache/aulas/analise-demonstracoes-financeiras.json` (6 conteúdos:
  AD-001 a AD-006, `model='claude-manual'`), usando o mesmo mecanismo de
  carga do PR #95 (`scripts/apache-carregar-aulas.mjs`). Conteúdo técnico
  (índices de liquidez e CCL, giro de estoque e ciclo operacional/financeiro,
  margem bruta, margem líquida/ROE/ROA, EBITDA, VPL/TIR), sem citação de
  legislação. `docs/APACHE-18-plano.md` atualizado (lote 2/5 concluído).
- Se algo der errado: reverter para `restore/pre-apa-18-analise-demonstracoes`
  volta ao estado anterior; nenhuma aula chega a ser gravada em produção
  antes de o Abner rodar o comando acima, então reverter sem ter rodado o
  script não perde nada.

## PR #95 — APA-18: carga administrativa de aulas base + piloto Contabilidade de Custos

- Ponto de restauração: branch `restore/pre-apa-18-contabilidade-de-custos`
  (commit `aa30d87`, main antes do merge).
- O que muda no site: nada visível ainda — este PR só adiciona o script e os
  dados; a aula de Contabilidade de Custos só aparece depois de o Abner
  rodar `pnpm run apache:carregar-aulas -- --file
  data/apache/aulas/contabilidade-de-custos.json --target production`
  (não precisa de "Publicar Atlas": o script grava direto em D1/R2).
- O que muda fora do site: novo script `scripts/apache-carregar-aulas.mjs`
  — primeiro mecanismo de carga do APA-18 (aulas base escritas à mão,
  `model='claude-manual'`), replicando a mesma gravação de `saveLesson`
  (APA-05: R2 gzip + upsert em D1) via CLI do `wrangler`, já que não existe
  rota HTTP administrativa para chamar `saveLesson` de fora do Worker.
  Primeiro lote em `data/apache/aulas/contabilidade-de-custos.json` (4
  conteúdos: CC-001 a CC-004), escolhido como piloto por não exigir
  pesquisa de legislação. Plano completo das 4 disciplinas restantes em
  `docs/APACHE-18-plano.md`.
- Se algo der errado: reverter para `restore/pre-apa-18-contabilidade-de-custos`
  volta ao estado anterior; nenhuma aula chega a ser gravada em produção
  antes de o Abner rodar o comando acima, então reverter sem ter rodado o
  script não perde nada.

## PR #94 — Testes finais e docs do Apache (APA-16)

- Ponto de restauração: branch `restore/pre-apa-16` (main antes do merge).
- O que muda no site: nada visível diretamente — este PR não é uma
  funcionalidade nova, é a correção de um bug real achado escrevendo os
  testes finais do Apache. Reportar uma aula com erro bem na hora de um
  poll automático, ou enviar/reenviar material em 2 abas quase ao mesmo
  tempo, podia fazer o Apache gerar a aula ou processar o enriquecimento
  **duas vezes** por engano (gastando neurons em dobro à toa) — corrigido.
  Comportamento visível ao aluno não muda; o impacto é só em custo de
  neurons evitado nesses casos raros.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-16` volta ao
  comportamento anterior (sem a correção da corrida); nenhuma aula ou nota
  existente é afetada.

## PR #93 — Upload do material do aluno (APA-12)

- Ponto de restauração: branch `restore/pre-apa-12` (main antes do merge).
- O que muda no site: a sessão de estudo de qualquer conteúdo ganha um
  formulário "Enriquecer com meu material" — o aluno manda um PDF/DOCX/
  XLSX (até 10MB) ou uma foto/print (OCR no navegador, com fallback pra
  letra de mão) e o Apache extrai os conceitos relevantes do material.
  Quando o envio é pequeno, o resultado aparece na hora; um envio maior
  (2+ "pedaços" de texto) processa em segundo plano e aparece na próxima
  vez que a aula carregar. A aula passa a mostrar uma seção "Do seu
  material" com conceitos novos e reforços que o material trouxe além do
  que a aula já tinha. Limite: 90 páginas por dia por usuário (reseta à
  meia-noite UTC); reenviar o mesmo arquivo de novo não gasta cota nem
  neurons outra vez.
- Sem migration nova (usa as tabelas/colunas já criadas pelo APA-02,
  migration 0027, em produção desde aquele PR).
- Se algo der errado: reverter para `restore/pre-apa-12` tira o formulário
  de upload e a seção "Do seu material" da aula; nenhuma aula ou nota
  existente é apagada (as fichas de enriquecimento ficam guardadas, só
  deixam de ser lidas).

## PR #92 — Reportar erro na aula (APA-08)

- Ponto de restauração: branch `restore/pre-apa-08` (main antes do merge).
- O que muda no site: a aula do Apache (sessão de estudo) ganha um botão
  "Reportar erro" no final. Ao clicar, confirma com "Avisar que esta aula
  tem um erro? Ela entra na fila de revisão." — a aula **continua visível**
  (nunca some), só ganha o aviso "Erro reportado — esta aula está na fila
  de revisão e pode ser atualizada em breve." e dispara uma nova geração
  em segundo plano (mesma fila do PR #91, mesmo custo de ~490 neurons por
  regeneração). Se a aula atual foi escrita a mão (não é o caso ainda, só
  acontece quando o Claude escrever aulas manualmente pro roadmap inteiro),
  o report fica só como item de backlog, sem gastar neurons.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-08` tira o botão e a
  rota de reportar; nenhuma aula ou report existente é apagado.

## PR #91 — Fila, geração lazy da aula e diff na leitura (APA-07)

- Ponto de restauração: branch `restore/pre-apa-07` (main antes do merge).
- O que muda no site: a sessão de estudo de qualquer conteúdo passa a
  mostrar uma **aula base** (do Apache) em vez de "Nenhum material anexado
  ainda" — a aula aparece automaticamente, com um spinner enquanto é gerada
  pela primeira vez. **Importante: depois do próximo "Publicar Atlas", a
  primeira vez que alguém abrir cada conteúdo vai disparar uma geração de
  verdade pelo Llama 3.3 70B (Workers AI), gastando ~490 neurons por aula**
  — dentro do teto diário de 10.000 do plano Free, mas é consumo real, não
  simulado. A geração roda numa fila (Cloudflare Queues, `atlas-apache-aulas`)
  em segundo plano: a tela sempre responde rápido, só mostra "gerando" até
  a aula ficar pronta (poll de 5s). Se a cota diária de neurons acabar, a
  aula fica pendente até o reset (meia-noite UTC) — sem travar nem cobrar
  nada além do Free.
- Sem migration nova (a tabela `atlas_apache_queue` já existia desde o
  APA-02).
- Se algo der errado: reverter para `restore/pre-apa-07` volta a tela de
  "Nenhum material anexado ainda" (comportamento anterior), sem perder nada
  — nenhuma aula gerada é apagada, só para de aparecer até reaplicar o PR.

## PR #90 — Bake-off de modelo para enriquecimento (APA-17)

- Ponto de restauração: branch `restore/pre-apa-17` (main antes do merge).
- O que muda no site: nada visível. Este PR adiciona só um script de
  desenvolvimento (`scripts/apache-bakeoff.ts`, `pnpm run apache:bakeoff`)
  que compara 3 modelos do Workers AI (Llama 3.3 70B, Gemma 4 26B, Qwen3
  30B) na extração da ficha de enriquecimento, e registra a decisão em
  `docs/apache-bakeoff-resultado.md`: `APACHE_ENRICHMENT_MODEL=
  @cf/google/gemma-4-26b-a4b-it` — mesma qualidade do Llama nessa tarefa,
  ~4,4× mais barato em neurons. Essa variável ainda não é lida por nenhum
  código do site (fica pronta para o futuro APA-12, que vai implementar o
  pipeline de enriquecimento de verdade).
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-17` remove o script e
  a decisão documentada; como nenhuma rota ainda lê
  `APACHE_ENRICHMENT_MODEL`, nada no site muda.

## PR #89 — Fallback de letra de mão, Workers AI vision (APA-11)

- Ponto de restauração: branch `restore/pre-apa-11` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/ingest-handwriting.ts` (`extractHandwriting`): transcreve
  letra de mão chamando o Workers AI (Llama 3.2 11B vision) quando a
  confiança do OCR em navegador (APA-10) de uma página fica abaixo de 70,
  checa o orçamento diário de neurons pelo pior caso antes de cada chamada
  e registra o gasto real depois, e reconhece quando a cota diária do
  Workers AI esgota (vira "tenta de novo depois da meia-noite UTC",
  distinto de uma simples sobrecarga temporária de capacidade). Teto de
  1.5MB por imagem (CPU do Workers Free). Nenhuma tela ou rota ainda chama
  isso — é o futuro APA-12 (pipeline de enriquecimento) que vai acionar.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-11` remove o módulo;
  como nenhuma rota ainda chama `extractHandwriting`, nada no site muda.

## PR #88 — Gerador da aula base do Apache, Workers AI (APA-06)

- Ponto de restauração: branch `restore/pre-apa-06` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/lesson-writer.ts` (`writeLesson`): gera a aula de um conteúdo
  chamando o Workers AI (Llama 3.3 70B), usando os materiais já cadastrados
  do conteúdo como contexto (com o delimitador de prompt-injection do Gate
  APA-14 em volta deles, neutralizado se um material tentar fechar o
  delimitador sozinho), checa o orçamento diário de neurons antes de cada
  chamada, tenta de novo uma vez se a resposta vier fora do formato, e
  grava a aula pronta (APA-05) quando dá certo. Nenhuma tela ou rota ainda
  chama isso — é o APA-07 (fila) que vai acionar. Binding novo `AI` no
  Worker, ligado só no build/deploy (não em `pnpm dev`, pra não exigir
  login no Wrangler nem gastar neurons reais testando local).
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-06` remove o gerador;
  como nenhuma rota ainda chama `writeLesson`, nada no site muda.

## PR #87 — OCR de foto/print/PDF escaneado, no navegador (APA-10)

- Ponto de restauração: branch `restore/pre-apa-10` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/ocr.ts` (`ocrFile`): roda OCR em português inteiramente no
  navegador (Tesseract.js) para foto/print (`image/*`) ou PDF escaneado
  (renderiza cada página como imagem com `unpdf`, reaproveitado — sem
  dependência nova de PDF), devolve texto + confiança por página, e rejeita
  arquivo maior que 10 MB ou com mais páginas que a cota diária (90) antes
  de processar. `components/apache/ocr-progress.tsx` traz a barra de
  progresso pronta, mas nenhuma tela ainda a usa — isso é o APA-12. Os
  arquivos do Tesseract (worker, núcleo WASM, dados do idioma português)
  passam a ser servidos pelo próprio Atlas em `/tesseract/`, em vez de um
  CDN de terceiro.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-10` remove o módulo de
  OCR e os arquivos em `public/tesseract/`; como nenhuma rota ou tela os usa
  ainda, nada no site muda.

## PR #86 — Storage R2 das aulas do Apache, gzip (APA-05)

- Ponto de restauração: branch `restore/pre-apa-05` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/lesson-store.ts` (`saveLesson`/`readLesson`/`markReported`/
  `markFailed`): grava a aula gerada no bucket R2 comprimida em gzip e
  guarda status/versão/modelo em D1 (`atlas_apache_lessons`); aula
  regerada sobrescreve a anterior sem histórico de versão. `markReported`
  (botão "reportar erro", ainda sem UI — é o APA-08) marca a aula como
  reportada e enfileira uma nova geração em `atlas_apache_queue`.
  Nenhuma rota ou tela chama essas funções ainda — isso é o APA-06/07.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-05` remove o módulo
  de storage; como nenhuma rota o usa ainda, nada no site muda.

## PR #84 — UI da aula base na sessão de estudo (APA-04)

- Ponto de restauração: branch `restore/pre-apa-04` (main antes do merge).
- O que muda no site: na tela de estudo de qualquer conteúdo, antes do
  bloco "Material do conteúdo", aparece um novo card de "aula gerada por
  IA" (objetivo, conceitos, fórmulas, exemplos, pegadinhas de prova e
  resumo) assim que ela estiver pronta — enquanto a aula está sendo
  escrita mostra um spinner avisando que leva poucos minutos, e se for
  reportado algum erro nela (card futuro) ela continua visível com um
  aviso acima. **Hoje esse card não aparece de fato**: a rota que ele
  consulta (`GET /api/apache/aulas/:contentId`, card APA-07) ainda não
  existe, então ele recebe 404 e se esconde sozinho — nada muda na tela
  até o APA-07 ser mesclado.
- O componente (`components/pages/content-lesson.tsx`) consulta essa rota
  de novo a cada 5s enquanto a aula não estiver pronta, parando depois de
  ~10 minutos de tentativas ou quando a aba fica em segundo plano (volta a
  consultar assim que a aba fica visível de novo), para não gastar
  requisições à toa.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-04` remove o
  componente e as classes `.al-*`; como a rota que ele chama não existe
  ainda, nada no site muda hoje de qualquer forma.

## PR #85 — Ingestão de arquivo digital, PDF/DOCX/XLSX (APA-09)

- Ponto de restauração: branch `restore/pre-apa-09` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/ingest-digital.ts` (`extractDigital`): extrai o texto de um
  PDF/DOCX/XLSX digital via `env.AI.toMarkdown` (gratuito para documento,
  sem OCR), rejeita acima de 540.000 caracteres extraídos (Gate APA-14
  item 5) e sinaliza quando o arquivo parece ser um PDF escaneado (sem
  texto real), para o próximo card (APA-10) tentar OCR. Nenhuma rota ou
  tela chama essa função ainda.
- Sem migration nova.
- Se algo der errado: reverter para `restore/pre-apa-09` remove a função
  de extração; como nenhuma rota a usa ainda, nada no site muda.

## PR #81 — Limite de 90 páginas/24h por usuário (APA-13)

- Ponto de restauração: branch `restore/pre-apa-13` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/quota.ts` (`assertQuota`/`refundQuota`): checagem e débito de
  páginas numa janela rolante de 24h por usuário, num único `UPDATE`
  condicional (sem leitura separada antes), para duas chamadas concorrentes
  nunca somarem mais que 90 páginas no dia. Também adiciona
  `getApacheUserId()` em `lib/auth.ts` (hoje retorna a constante fixa do
  dono), usado pelas próximas peças do Apache. Nenhuma rota ou tela chama
  essas funções ainda.
- Sem migration nova (usa a tabela `atlas_apache_quota` já criada pelo
  PR #80).
- Se algo der errado: reverter para `restore/pre-apa-13` remove a checagem
  de cota; como nenhuma rota a usa ainda, nada no site muda.

## PR #83 — Esquema JSON da aula do Apache + testes (APA-03)

- Ponto de restauração: branch `restore/pre-apa-03` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/schema.ts` (tipos da aula/ficha do Apache e as funções puras
  `validateLesson`, `validateEnrichment`, `renderLesson`,
  `diffEnrichmentAgainstLesson`) e `lib/apache/errors.ts` (`ApacheError`
  com mensagem curta + status HTTP, Gate APA-14 item 8), sem nenhuma rota,
  tela ou migration. Cria também o primeiro runner de teste do Apache,
  estendendo `pnpm run test:notes` para cobrir `tests/apache-schema.test.ts`.
- Se algo der errado: reverter para `restore/pre-apa-03` remove esses dois
  arquivos e os testes; nenhuma tabela ou tela existente é afetada.

## PR #82 — Medidor diário de neurons do Workers AI (APA-15)

- Ponto de restauração: branch `restore/pre-apa-15` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só adiciona
  `lib/apache/neuron-meter.ts` (`recordNeuronUsage`, `neuronBudgetRemaining`,
  `estimateNeurons`), que vai ser usado pelas próximas peças do Apache
  (gerador de aula, fila/cron, upload de enriquecimento) para nunca deixar
  o Workers AI passar de 90% do orçamento grátis de 10.000 neurons/dia.
  Nenhuma tela ou rota chama essas funções ainda; nenhum dado de nota, quiz,
  sessão ou progresso existente é afetado.
- Sem migration nova (usa a tabela `atlas_apache_neuron_meter` já criada
  pelo PR #80).
- Se algo der errado: reverter para `restore/pre-apa-15` remove o medidor;
  como nenhuma rota o usa ainda, nada no site muda.

## PR #80 — Migration D1 base do Apache (APA-02)

- Ponto de restauração: branch `restore/pre-apa-02` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só cria as 5 tabelas
  (`atlas_apache_lessons`, `atlas_apache_enrichments`, `atlas_apache_quota`,
  `atlas_apache_queue`, `atlas_apache_neuron_meter`) que vão sustentar o
  Apache (aula base gerada por IA + enriquecimento por upload do aluno,
  decidido nos Gates APA-01/APA-14, formalizados como DEC-019/DEC-020).
  Nenhuma tela usa essas tabelas ainda; nenhum dado de nota, quiz, sessão ou
  progresso existente é afetado.
- Migration nova: `0027_apache_base.sql`. O `Publicar Atlas.cmd` aplica
  sozinho.
- Se algo der errado: reverter para `restore/pre-apa-02` remove as 5 tabelas
  (ainda vazias); nenhuma outra tabela é tocada.

## PR #79 — 3 disciplinas novas no roadmap (Custos, Análise das Demonstrações, Avançada) + CG-041

- Ponto de restauração: branch `restore/pre-contabilidade-custos-analise-avancada` (main antes do merge).
- O que muda no site: o roadmap de Contabilidade ganha 18 nós novos — 1 em
  Contabilidade Geral (CG-041, "Princípios contábeis fundamentais", inserido
  dentro da unidade "Fundamentos") e 3 disciplinas novas depois de
  Contabilidade Tributária: **Contabilidade de Custos** (4 nós: classificação
  de custos/CPV, avaliação de estoque, markup, ponto de equilíbrio),
  **Análise das Demonstrações Financeiras** (6 nós: liquidez/CCL, giro,
  margem de lucro bruto, margem líquida/rentabilidade, EBITDA, TIR/VPL) e
  **Contabilidade Avançada** (7 nós: intangíveis/goodwill/MEP, consolidação,
  provisões/impairment, valor justo/AVP, receita diferida/subvenção/
  duplicatas, ajustes de exercícios anteriores/reserva legal, DOAR/DVA).
  Quem já estuda Contabilidade Geral/Tributária vê esses nós aparecerem no
  roadmap; não muda nada do que já estava lá (CG-007 a CG-040 só reordenam
  posição interna pra abrir espaço pro CG-041).
  Depois que Abner rodar `data/apolo/curadoria/remap-contabilidade-novos-nos.sql`
  em produção, 194 rascunhos que a curadoria de 2026-10-12 tinha deixado
  "fora do roadmap" passam a aparecer em `/rascunhos` com o conteúdo certo
  já selecionado (mais 1, "Depreciação pelo método das unidades produzidas",
  remapeado pro nó já existente CG-031, mesmo padrão dos PRs #76/#77). Não
  aprova nenhum rascunho.
  Estrutura aprovada pelo Abner em 2026-10-20 (opção B da proposta em
  `/mnt/project-files/apolo/curadoria/proposta-estrutura-contabilidade-2026-10-20.md`),
  coordenado com o PR #78 (que adiciona nós de Contabilidade Tributária sobre
  documentos fiscais) — disciplinas e faixas de ID diferentes, sem overlap.

## PR #78 — Apostila Documentos Fiscais na Reforma: novos nós + materiais no roadmap de Contabilidade Tributária

- Ponto de restauração: branch `restore/pre-apostila-documentos-fiscais` (main antes do merge).
- O que muda no site: no **Roadmap**, a disciplina Contabilidade Tributária ganha
  7 nós novos na unidade "Reforma tributária — Documentos fiscais" (CT-118 a
  CT-124: CST/cClassTrib, NF-e/NFC-e, NFS-e/DPS, correções e ajustes, créditos
  e apuração assistida, cadastros/ERP/EFD, caso integrado), posicionados entre
  CT-107 e a Governança. O nó já existente CT-106 (Documentos, split payment e
  cashback) e os 7 nós novos ganham **Material do conteúdo** (texto) extraído
  da apostila "Documentos Fiscais na Reforma Tributária" (Débora Maiara
  Rediess, Nota Fácil Assessoria).
- Migrations novas: `0024_contabilidade_tributaria_reforma_documentos_fiscais.sql`
  (os 7 nós + pré-requisitos + reposicionamento de CT-108 a CT-117, que
  entraram 7 posições depois na mesma disciplina) e
  `0025_materiais_documentos_fiscais_reforma.sql` (20 materiais de texto).
  `Publicar Atlas.cmd` aplica sozinho.
- Se algo der errado: reverter para `restore/pre-apostila-documentos-fiscais`
  remove os 7 nós novos e os materiais; nenhuma nota, quiz ou progresso de
  aluno existente é afetado (nenhuma tabela de estado é tocada).

## PR #77 — Remapeia 2 rascunhos de regime tributário pro nó certo do roadmap

- Ponto de restauração: branch `restore/pre-remap-tributario` (main antes do merge).
- O que muda no site: nada visível ainda. Mesma correção do PR #76, mas para
  "Regimes tributários: lucro presumido/Lucro Real" → CT-040/CT-046
  (Contabilidade Tributária já tem esses nós).

## PR #76 — Remapeia 36 rascunhos de Contabilidade pro nó certo do roadmap

- Ponto de restauração: branch `restore/pre-remap-contabilidade` (main antes do merge).
- O que muda no site: nada visível ainda — é um dado, não publica sozinho.
  Depois que Abner rodar `data/apolo/curadoria/remap-contabilidade-existente.sql`
  em produção, 36 rascunhos que a curadoria de 2026-10-12 tinha deixado "fora
  do roadmap" (por não baterem o título exato de um nó) passam a aparecer em
  `/rascunhos` com o conteúdo certo já selecionado (ex.: "Ativo (conceito)" →
  CG-008). Não cria nó novo, não aprova nada.

## PR #75 — Índice em atlas_question_drafts.text_hash (corrige queda do Hoje)

- Ponto de restauração: branch `restore/pre-idx-drafts-text-hash` (main antes do merge).
- O que muda no site: nada de novo visualmente. Corrige a queda de hoje à
  noite: Hoje/Agenda, "Continue de onde parou" e "O Atlas observou" ficaram
  indisponíveis porque o D1 de produção bateu o limite gratuito de leituras
  (5M linhas/dia). Causa: `atlas_question_drafts` não tinha índice em
  `text_hash` (diferente de `atlas_questions`, que já tinha); os 2.802
  UPDATEs de `pnpm apolo:aplicar-curadoria` desta noite, cada um filtrando
  por `text_hash`, varreram a tabela inteira (~3.600 linhas) a cada um —
  cerca de 10,1M linhas lidas, bem acima do limite. Migration 0023 adiciona
  o índice que faltava. O site some sozinho a indisponibilidade quando o
  limite reseta (00:00 UTC / 21h em Brasília); este PR evita que aconteça de
  novo na próxima carga.

## PR #74 — Arquivos de classificação da curadoria (APO-07/APO-08)

- Ponto de restauração: branch `restore/pre-curadoria-arquivos` (main antes do merge).
- O que muda no site: nada visível ainda. Este PR só traz para o repositório
  os 10 arquivos de classificação (conteúdo + tipo de conhecimento) das
  3.600 questões pendentes em `/rascunhos`, para rodar
  `pnpm apolo:aplicar-curadoria` com `git pull` em vez de copiar arquivo por
  arquivo. A migração 0022 (`atlas_content_taxonomy`) já estava mesclada
  (PR #72/#73) e ainda precisa ser publicada em produção; aplicar os
  arquivos grava conteúdo/tipo de conhecimento nos rascunhos, nunca aprova
  nenhum (DEC-014 continua exigindo revisão humana em `/rascunhos`).

## PR #30 — Backup do D1 e R2 com restauração de teste (DEC-011)

- Ponto de restauração: branch `restore/pre-backup-dec011` (commit `d4d3145`, main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda.
- O que muda fora do site: novos comandos `Backup Atlas.cmd` (copia o D1 e os
  anexos de produção para a pasta `backupDir` do `deploy.local.json`) e
  `Testar Restauracao Atlas.cmd` (restaura a cópia num banco local separado e
  confere). Uso em `docs/BACKUP.md`.
- Se algo der errado: só o backup em si pode falhar; ele apenas lê da
  Cloudflare, então não altera dados do site.

## PR #31 — Sessões de estudo reais (MVP-02, ATLAS-ESC-13)

- Ponto de restauração: branch `restore/pre-mvp-02` (commit `858c181`, main antes do merge).
- Migration nova: `0008_study_sessions` (tabela `atlas_study_sessions`). O
  `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Estudar**: a tela deixa de ser demonstração. Mostra a sessão aberta (ou
    o próximo conteúdo liberado do roadmap) e a lista de conteúdos da
    disciplina. Endereço `/estudar?sessao=...` abre uma sessão específica.
  - **Sessão de estudo**: relógio com **Pausar** / **Retomar** (aparece um
    aviso "Sessão pausada"), o ponto atual e o rascunho da nota são salvos
    sozinhos (a cada 2 s e ao fechar a aba), e **Concluir** registra a
    evidência e leva o conteúdo para "aguardando quiz". As datas de revisão
    de exemplo sumiram da sessão.
  - **Hoje**: o cartão "Continue de onde parou" usa a sessão real (some se
    não houver nada aberto).
  - **Roadmap**: o botão "Começar a estudar / Estudar" cria a sessão e abre
    a tela de estudo.
- Se algo der errado: tempo de estudo errado, sessão que não retoma, conteúdo
  que não passa para "aguardando quiz" ou cartão "Continue de onde parou"
  estranho vêm deste PR.

## PR #32 — Quizzes reais com banco de questões (MVP-04, ATLAS-ESC-14)

- Ponto de restauração: branch `restore/pre-mvp-04` (commit `40f6b8a`, main antes do merge).
- Migrations novas: `0009_quizzes` (tabelas `atlas_questions` e
  `atlas_quiz_attempts`) e `0010_question_bank` (60 questões de Fundamentos,
  CG-001 a CG-006). O `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Quizzes**: o quiz de demonstração "Débito e crédito" sumiu. A tela lista
    os quizzes liberados (conteúdos com sessão concluída) e as tentativas
    anteriores com nota.
  - **Fazer um quiz**: tela de regras, até 10 questões com alternativas
    embaralhadas, relógio (1 min por múltipla, 5 min por dissertativa) que trava
    as respostas ao zerar, revisão antes do envio e, se houver dissertativas, uma
    etapa para comparar sua resposta com o gabarito.
  - **Resultado**: nota, certa/errada de cada questão com gabarito e explicação.
    Aprovado (70% ou mais) marca o conteúdo como **concluído** no Roadmap;
    reprovado o deixa **bloqueado** até uma nova sessão de estudo, com o botão
    "Estudar de novo".
  - **Sessão concluída**: ganhou o botão "Fazer o quiz".
  - Conteúdos fora de Fundamentos (CG-007 em diante) aparecem com "Ainda sem
    questões cadastradas" até você importar questões (`docs/QUESTOES.md`).
- Se algo der errado: quiz que não abre, nota estranha, conteúdo que não vira
  concluído/bloqueado depois do quiz, ou texto de questão errado vêm deste PR.

## PR #33 — Agenda interna real em Hoje (MVP-05, ATLAS-ESC-15)

- Ponto de restauração: branch `restore/pre-mvp-05` (commit `c178fd0`, main antes do merge).
- Migration nova: `0011_agenda` (tabela `atlas_agenda_items`). O
  `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Cabeçalho** (faixa do topo): "N atividades · N min restantes · N revisões
    programadas" passa a contar a agenda real do dia, em todas as páginas.
  - **Hoje → Sua jornada de hoje**: as quatro tarefas de demonstração sumiram.
    Os passos vêm do roadmap: recuperação urgente (vermelho) para conteúdo
    bloqueado, quiz para conteúdo com sessão concluída e o próximo estudo
    liberado. Cada passo mostra horário (a partir das 7h), duração, prioridade e
    o motivo de estar ali.
  - O círculo numerado conclui o passo à mão; ele também se conclui sozinho
    quando a sessão ou o quiz é feito. "Reagendar ou ajustar" abre um diálogo
    para mudar dia, horário, duração, prioridade e escrever o motivo.
  - Passos não feitos passam para o dia seguinte com "Não foi feita em DD/MM";
    passos reagendados aparecem em **Próximos dias**.
- Se algo der errado: passos repetidos, horários estranhos, contagem errada no
  cabeçalho ou um passo que não some depois de feito vêm deste PR.

## PR #34 — Revisões 24h/7d/30d (MVP-06, ATLAS-ESC-16)

- Ponto de restauração: branch `restore/pre-mvp-06` (commit `22fbb60`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Quizzes**: além do quiz de conteúdo, aparecem "Revisão de 24h", "Revisão
    de 7d", "Revisão de 30d" e "Quiz corretivo". O corretivo só libera depois de
    uma nova sessão de estudo.
  - **Hoje**: a revisão aparece na agenda (já em Próximos dias antes do prazo).
    Falhar numa revisão cria uma **recuperação urgente** (vermelho) e depois o
    quiz corretivo.
  - **Resultado do quiz**: mostra a data da próxima revisão, "Ciclo de revisões
    concluído" ou "Conteúdo reaberto" quando a revisão falha.
  - **Roadmap**: os estados "aguardando revisão", "revalidado" e "em revisão
    ativa" passam a acontecer de verdade.
- Se algo der errado: revisão que aparece no dia errado, conteúdo que fica
  preso em "aguardando revisão", corretivo que não libera ou data de próxima
  revisão estranha vêm deste PR.

## PR #35 — Progresso calculado (MVP-07, ATLAS-ESC-17)

- Ponto de restauração: branch `restore/pre-mvp-07` (commit `7963874`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Hoje → Seus indicadores** e **Progresso** (os três cartões do topo):
    Domínio geral, Retenção média e Consistência deixam de ser números fixos e
    passam a ser calculados (podem ter uma casa decimal, ex.: "3,8%").
  - **Progresso → Visão por disciplina**: as quatro "competências" de exemplo
    viraram as disciplinas reais do roadmap, com proficiência (média das
    últimas 5 tentativas) e domínio (nota da disciplina).
  - **Progresso → Histórico e tendência**: gráfico de 8 semanas real.
  - **Progresso → Consistência**: os 28 quadrados pintam pelos minutos de
    sessão de cada dia.
  - **Progresso → Conteúdos em risco**: lista conteúdos bloqueados, com revisão
    vencida ou reabertos, com o próximo passo.
  - **Progresso → Como a nota é calculada** e **Pesos do curso** (novos):
    pontos de cada componente (Avaliações, Atividades, Cobertura, Revisão,
    Quiz) e de onde vieram. Avaliações e Atividades aparecem em 0 porque ainda
    não existem no Atlas.
  - Saíram o "Plano da semana" de exemplo e o aviso "Dados de demonstração".
- Se algo der errado: nota de disciplina ou indicador estranho, gráfico ou
  consistência que não bate com o que você estudou vêm deste PR.

## PR #36 — Recuperação e bloqueios (MVP-08, ATLAS-ESC-18)

- Ponto de restauração: branch `restore/pre-mvp-08` (commit `fb7af78`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Sessão de estudo** de um conteúdo reprovado (bloqueado ou reaberto pela
    revisão): faixa vermelha **Estudo dirigido** no topo, com as questões
    erradas na última reprovação, a resposta certa e a explicação (fechada
    quando são mais de 3; clique para abrir).
  - **Quizzes**: o quiz seguinte a uma reprovação é dirigido. Aparece a faixa
    "Quiz dirigido: as N questões que você errou voltaram" e elas estão entre
    as 10 questões.
  - **Hoje**: a recuperação urgente diz quantas questões erradas voltam e,
    a partir da 2ª reprovação seguida, "Reincidência". O quiz depois do estudo
    aparece como "Quiz dirigido".
  - **Progresso**: conteúdos em risco mostram a reincidência, e a disciplina
    com conteúdo bloqueado mostra "Conclusão da disciplina congelada".
- Se algo der errado: quiz que repete questões demais, faixa de estudo
  dirigido que aparece sem ter reprovado, ou aviso de congelamento errado vêm
  deste PR.

## PR #37 — Relatórios explicáveis (MVP-09, ATLAS-ESC-19)

- Ponto de restauração: branch `restore/pre-mvp-09` (commit `2c175d4`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Página nova `/relatorio`**: lista os conteúdos já estudados; cada um abre
    um relatório com Próxima ação (com botão), Risco, Origem da nota, Mudanças
    de estado e Histórico (sessões e quizzes).
  - **Progresso**: link "Relatórios por conteúdo" no subtítulo e "Ver
    relatório" em cada conteúdo em risco.
  - **Roadmap**: "Ver relatório do conteúdo" no painel do conteúdo escolhido
    (só para conteúdos já iniciados); o texto do cartão "Conteúdos concluídos"
    passou a dizer "A nota com pesos fica em Progresso."
- Se algo der errado: relatório que não abre, risco ou próxima ação que não
  batem com o estado do conteúdo, ou histórico incompleto vêm deste PR.

## PR #38 — Reprovação em quiz não altera a nota (ATLAS-ESC-20)

- Ponto de restauração: branch `restore/pre-quiz-nota` (commit `cd2cb38`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Progresso** e **Relatório**: o componente Quiz da nota só conta a melhor
    nota *aprovada* de cada conteúdo. Uma reprovação não baixa mais a nota; só
    deixa o conteúdo urgente.
  - Conteúdo em revisão ativa (falhou numa revisão) continua contando na
    Cobertura.
- Se algo der errado: nota de disciplina que caiu depois de um quiz reprovado,
  ou cobertura que não conta um conteúdo já estudado vêm deste PR.

## PR #39 — Quiz reprovado trava o conteúdo até passar (ATLAS-ESC-21)

- Ponto de restauração: branch `restore/pre-quiz-refazer` (commit `c63fdf5`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Resultado do quiz reprovado**: botões "Refazer o quiz" (principal) e
    "Revisar as notas antes"; o texto diz que o conteúdo, e o próximo, ficam
    travados até passar com 70%.
  - **Quizzes**: conteúdo bloqueado aparece na lista para refazer na hora; o
    quiz corretivo também abre direto (sem exigir nova sessão de estudo).
  - **Hoje/agenda**: reprovação vira um quiz urgente ("refaça até passar com
    70%"), não mais uma "recuperação" de estudo; enquanto há reprovação, o
    Atlas não sugere conteúdo novo.
  - **Roadmap**: conteúdo bloqueado ou em revisão ativa mostra "Refazer o
    quiz" / "Fazer o quiz corretivo" e "Revisar as notas antes".
  - **Relatório**: próxima ação de conteúdo bloqueado é "Refazer o quiz".
- Se algo der errado: quiz que não reabre depois de reprovar, conteúdo que não
  desbloqueia ao passar, ou agenda sem sugestão de estudo vêm deste PR.

## PR #40 — Revisão da página Hoje (UX-06, ATLAS-ESC-22)

- Ponto de restauração: branch `restore/pre-ux-06` (commit `f4216f1`, main antes do merge).
- Sem migration nova.
- O que muda no site:
  - **Hoje · Continue de onde parou**: quando há quiz pendente (refazer,
    corretivo, liberado ou revisão vencida), o botão principal é o quiz
    ("Refazer o quiz", "Fazer o quiz corretivo"…) e, se o conteúdo foi
    reprovado, aparece "Revisar as notas antes".
  - **Estudar**: mesmo próximo passo, com o selo "QUIZ PENDENTE".
  - **Hoje · O Atlas observou**: texto calculado do seu progresso (conteúdo em
    risco com link para o relatório, sequência de dias, retenção ou
    constância), não mais fixo.
  - **Assistente (Perguntar ao Atlas)**: sem exemplo fictício nem campo de
    pergunta; atalhos para Roadmap, Progresso e Relatórios.
  - **Agenda**: o quiz corretivo feito conclui o item de quiz; o motivo de um
    item pendente se atualiza (ex.: contagem de reincidência).
- Se algo der errado: botão de Hoje levando ao lugar errado, observação
  estranha, ou item de agenda que não conclui/atualiza vêm deste PR.

## PR #41 — Material de estudo por conteúdo (UX-01, ATLAS-ESC-23)

- Ponto de restauração: branch `restore/pre-ux-01` (commit `a30cb74`, main antes do merge).
- Migration nova: `0012_content_materials` (tabela `atlas_content_materials`).
  Voltar ao ponto de restauração não apaga a tabela; ela só deixa de ser usada.
- O que muda no site:
  - **Sessão de estudo** (qualquer conteúdo fora da demonstração): o aviso
    "material ainda não cadastrado" dá lugar à área **Material do conteúdo**,
    com "Adicionar material" para texto, link (ex.: videoaula) ou arquivo
    (PNG, JPG, PDF ou DOCX até 10MB). O material fica no conteúdo e aparece em
    toda sessão dele; PDF e imagem abrem no navegador, imagem aparece em
    miniatura, cada item tem lixeira.
  - **Backup**: os arquivos de material entram na cópia do R2 junto com os
    anexos de notas.
- Continua igual: atividade prática e fixação só existem no conteúdo de
  demonstração (dependem das regras de Atividades).
- Se algo der errado: material que não salva, não abre ou não some ao remover
  vem deste PR.

## PR #43 — Fundação do Apolo: moldes e campos de tema/dificuldade/ciclo de vida (APO-01, DEC-014)

- Ponto de restauração: branch `restore/pre-apo-01` (commit `83ea67b`, main antes do merge).
- Migration nova: `0013_apolo_base` (4 colunas aditivas em `atlas_questions` —
  `theme`, `bloom_level`, `difficulty_nominal`, `lifecycle_state` — mais nova
  tabela `atlas_item_models`). O `Publicar Atlas.cmd` aplica sozinho; as 60
  questões já cadastradas continuam exatamente como estavam.
- O que muda no site: nada visível. Nenhuma tela, quiz, nota ou número muda —
  é só a fundação de dados e o módulo `lib/apolo/` por trás do Apolo. Nenhum
  questionário é montado nem nota é emitida ainda pelo Apolo.
- Se algo der errado: só poderia afetar o banco de questões (tema, dificuldade
  ou ciclo de vida de uma questão); nenhuma tela do Atlas lê esses campos
  ainda.

## PR #44 — Temas e mapa do conhecimento (APO-02, DEC-014)

- Ponto de restauração: branch `restore/pre-apo-02` (commit `ca8e984`, main antes do merge).
- Migration nova: `0014_temas_apo02` (nova tabela `atlas_themes` — tema aberto,
  tema pai opcional, área de conhecimento; coluna aditiva `atlas_contents.theme_id`,
  nullable). O `Publicar Atlas.cmd` aplica sozinho; conteúdos sem tema continuam
  funcionando normalmente.
- O que muda no site: nada visível ainda. `GET /api/roadmap` passa a devolver
  o tema de cada conteúdo (quando houver um cadastrado), mas nenhuma tela lê
  esse campo ainda — é a base de dados por trás do mapa do conhecimento do
  Apolo. Nenhum tema foi cadastrado em produção por este PR.
- Se algo der errado: só poderia afetar a resposta de `/api/roadmap` (campo
  de tema a mais); nenhuma tela do Atlas muda de comportamento.

## PR #45 — Banco de questões v2 (APO-03, DEC-014)

- Ponto de restauração: branch `restore/pre-apo-03` (commit `b36d3b5`, main antes do merge).
- Migration nova: `0015_banco_questoes_v2` (colunas aditivas em `atlas_questions`:
  subtópico, dimensão de conhecimento, proveniência, banca/órgão/ano, fonte no
  R2 e hash do enunciado — todas opcionais). O `Publicar Atlas.cmd` aplica
  sozinho; as 60 questões já cadastradas continuam exatamente como estavam.
- O que muda no site: a tela de quiz passa a reconhecer dois tipos novos de
  questão — "Certo ou errado" e "Lacuna numérica" — caso uma questão desses
  tipos seja cadastrada no futuro (nenhuma foi cadastrada por este PR). Os
  quizzes de múltipla escolha, dissertativa e cálculo continuam idênticos.
- Se algo der errado: só poderia afetar uma questão cadastrada com um dos
  tipos novos; os quizzes já existentes não usam nenhum campo novo.

## PR #46 — Importador v2 e linter de itens (APO-04)

- Ponto de restauração: branch `restore/pre-apo-04` (commit `851443b`, main antes do merge).
- Sem migration nova (só muda `scripts/lib/question-bank.mjs`, usado fora do
  site, e `docs/QUESTOES.md`).
- O que muda no site: nada. A importação de questões passa a aceitar também
  JSON v2 (além do CSV) e a recusar automaticamente um arquivo com
  alternativas repetidas ou enunciado duplicado; avisos de estilo de questão
  aparecem no terminal de quem importa, nunca no site.
- Se algo der errado: só poderia afetar uma importação futura de questões
  (`pnpm run questoes:importar`), nunca o site em produção.

## PR #47 — Acervo de fontes no R2 (APO-05, DEC-015)

- Ponto de restauração: branch `restore/pre-apo-05` (commit `2d61bd9`, main antes do merge).
- Migration nova: `0016_fontes_apo05` (tabela nova `atlas_question_sources`:
  título, tema, tipo de fonte, banca/órgão/ano, arquivo, hash e chave no R2).
  O `Publicar Atlas.cmd` aplica sozinho; nenhuma tabela existente muda.
- O que muda no site: nova tela **Fontes** no menu principal, para cadastrar,
  listar (por tema) e remover o PDF de prova de concurso/apostila/lista que
  alimenta o banco de questões do Apolo. O download só funciona autenticado,
  pelo próprio site — sem link público. Nenhuma fonte foi cadastrada em
  produção por este PR.
- Também: script `pnpm run apolo:fonte` (upload em lote fora da tela) e o
  backup manual (`pnpm run backup:atlas`) passa a copiar o acervo de fontes
  junto com os demais anexos do R2.
- Se algo der errado: só poderia afetar a tela Fontes e o banco de questões
  do Apolo (ainda em construção); nenhuma tela de estudo do aluno é tocada.

## PR #48 — Extrator determinístico de questões (APO-06)

- Ponto de restauração: branch `restore/pre-apo-06` (commit `404ccd3`, main antes do merge).
- Sem migration nova (só código novo em `scripts/` e a dependência `unpdf`,
  usada fora do bundle do site).
- O que muda no site: nada visível — este PR só adiciona o script
  `pnpm run apolo:extrair`, que tira o texto de um PDF do acervo de fontes
  (ou um PDF local) e corta em rascunhos de questão (Cebraspe, alternativas
  A-E ou genérico), gravando um JSON em disco para a curadoria revisar. Não
  grava nada no D1 nem muda nenhuma tela.
- Se algo der errado: só poderia afetar uma extração futura de rascunhos
  (`pnpm run apolo:extrair`), nunca o site em produção.

## PR #49 — Curadoria de rascunhos de questão (APO-07)

- Ponto de restauração: branch `restore/pre-apo-07` (commit `cba7da4`, main antes do merge).
- Migration nova: `0017_rascunhos_apo07` (tabela nova `atlas_question_drafts`:
  rascunho pendente, com FKs para fonte, conteúdo, subtópico e a questão
  aprovada). O `Publicar Atlas.cmd` aplica sozinho; nenhuma tabela existente
  muda.
- O que muda no site: nova tela **Rascunhos** no menu principal — a fila de
  curadoria. Todo rascunho (vindo do extrator do APO-06 ou cadastrado à mão)
  fica pendente até um humano escolher conteúdo, tema, nível de Bloom e
  escrever a explicação; só então aprovar (vira questão de verdade, já ativa
  no próximo quiz do conteúdo) ou descartar (definitivo). A tela mostra o PDF
  da fonte ao lado, quando o rascunho veio de uma.
- Também: `pnpm run apolo:extrair` passa a gravar os rascunhos extraídos
  direto nessa fila (como "pendente") quando `--target` é informado; antes só
  gerava um JSON em disco.
- Se algo der errado: só poderia afetar a tela Rascunhos e o banco de
  questões do Apolo (ainda em construção); nenhuma tela de estudo do aluno é
  tocada. Nenhum rascunho foi aprovado em produção por este PR.

## PR #50 — Modelo do aluno: Elo e memória por questão (APO-09)

- Ponto de restauração: branch `restore/pre-apo-09` (commit `a2d9a71`, main antes do merge).
- Sem migration nova. Nenhum estado novo é gravado no banco — o modelo é
  recalculado do zero a partir do histórico de tentativas de quiz já
  existente a cada leitura.
- O que muda no site: nada visível — este PR só adiciona uma rota nova,
  `GET /api/apolo/perfil`, que calcula a habilidade do aluno por tema e a
  fila de recuperação por questão (dificuldade/estabilidade), sem tela
  própria ainda e sem afetar nota, quiz ou qualquer outra tela.
- Se algo der errado: só poderia afetar essa rota nova, que nada mais do
  site usa ainda; nenhuma tela de estudo do aluno é tocada.

## PR #51 — Estatística de itens e corte automático de questão ruim (APO-10)

- Ponto de restauração: branch `restore/pre-apo-10` (commit `ff1d573`, main antes do merge).
- Sem migration nova. Nenhum estado novo é gravado no banco — a estatística é
  recalculada do zero a partir do histórico de tentativas de quiz já
  existente a cada leitura, igual ao APO-09.
- O que muda no site: a cada quiz enviado, o Apolo passa a medir a questão
  (taxa de acerto, dificuldade Elo própria, correlação item-total, taxa de
  escolha de cada alternativa) e, por conteúdo, o KR-20. Questão que bate uma
  regra de alerta — com amostra mínima de 30 respostas — sai sozinha do
  próximo sorteio e cai na mesma fila de curadoria do APO-07, sem mexer em
  nenhuma nota já emitida. Também adiciona uma rota nova, só leitura,
  `GET /api/apolo/estatisticas`, sem tela própria ainda.
- Se algo der errado: o corte só desativa questões (`lifecycle_state` vira
  'curadoria', `active` vira 0) — nunca apaga nada nem muda nota já emitida;
  uma questão desativada por engano pode ser reativada manualmente no banco.
  Uma falha na auditoria nunca derruba a resposta de um quiz já corrigido
  (está em `try/catch` isolado).

## PR #52 — Planos de prova por instrumento e perfil por área de conhecimento (APO-11)

- Ponto de restauração: branch `restore/pre-apo-11` (commit `d2ed0d7`, main antes do merge).
- Sem migration nova. Nenhum estado novo é gravado no banco — plano é uma
  função pura em código, sem leitura/escrita no D1.
- O que muda no site: nada visível ainda — este PR só adiciona
  `lib/apolo/plans.ts`, que define a composição de cada instrumento (quiz,
  revisão, corretivo, atividade, exame de meio de curso, atividade final,
  recuperação, proficiência) e um perfil por área de conhecimento do tema,
  sem ligar isso à seleção real de questão de nenhuma tela ainda (isso é o
  próximo card, APO-12). O plano do quiz continua sendo exatamente o mesmo
  de hoje (10 questões, mesmo tempo, corte de 70%).
- Também formaliza o DEC-10 (composição das avaliações), confirmado pelo
  Abner no chat do projeto: exame de meio de curso e atividade final passam
  a ter 60 questões no plano (documentado em `docs/APOLO.md`); isso só
  afeta o plano em código, nenhuma tela de exame de meio/atividade final
  existe ainda para usar esse número.
- Se algo der errado: só poderia afetar `lib/apolo/plans.ts`, que nenhuma
  tela ou rota usa ainda; nenhuma tela de estudo do aluno é tocada.

## PR #53 — Correção: atividade_final não teve tamanho confirmado pelo DEC-10

- Ponto de restauração: branch `restore/pre-apo-11-fix` (commit `dadfaf0`, main antes do merge).
- Sem migration nova.
- O que muda no site: nada visível — corrige só um comentário/valor em
  `lib/apolo/plans.ts` (nenhuma tela usa esse plano ainda). O PR #52 tinha
  registrado por engano que o DEC-10 confirmava 60 questões também para a
  atividade final; na verdade só o exame de meio teve esse número
  confirmado, e a atividade final volta a ser rascunho (20 questões, sem
  decisão).
- Se algo der errado: só poderia afetar `lib/apolo/plans.ts`, que nenhuma
  tela ou rota usa ainda.

## PR #54 — Seletor adaptativo de questões (APO-12)

- Ponto de restauração: branch `restore/pre-apo-12` (commit `478ff42`, main antes do merge).
- Sem migration nova. Função pura, sem leitura/escrita no D1.
- O que muda no site: nada visível ainda — `lib/apolo/selector.ts` decide,
  em código, quais questões entrariam numa prova dado o plano (APO-11) e o
  perfil do aluno (APO-09): recuperação vencida primeiro, depois subtópico
  fraco, depois cobertura normal do plano (ou, em modo adaptativo, o item
  mais próximo da habilidade do aluno). Nenhuma tela usa isso ainda — o
  quiz de hoje continua exatamente igual, sorteando do jeito de sempre.
- Se algo der errado: só poderia afetar `lib/apolo/selector.ts`, que
  nenhuma tela ou rota usa ainda; nenhuma tela de estudo do aluno é tocada.

## PR #55 — Corretor e boletim (APO-13)

- Ponto de restauração: branch `restore/pre-apo-13` (commit `7515bc3`, main antes do merge).
- Sem migration nova. Sem rota nova. Sem estado persistido novo.
- O que muda no site: nada visível — `gradeQuestion`/`scoreResults` (a
  correção do quiz) mudaram de arquivo, de `lib/quizzes.ts` para
  `lib/apolo/corrector.ts`, mas a lógica é exatamente a mesma (mesmo
  critério de certo/errado, mesma regra de anulação do cálculo, mesma nota
  mínima). Toda tentativa de quiz, nova ou antiga, continua corrigida do
  jeito de sempre. `buildBoletim` (empacota um resultado já calculado com a
  versão do corretor) existe em código mas nenhuma tela ou rota o usa ainda.
- Se algo der errado: reverter para `restore/pre-apo-13` traz a correção de
  volta a `lib/quizzes.ts` sem perder nenhuma nota já gravada (o resultado
  de cada tentativa enviada é imutável e não muda com este PR).

## PR #56 — Quiz do conteúdo pelo Apolo (APO-14)

- Ponto de restauração: branch `restore/pre-apo-14` (commit `f032cb6`, main antes do merge).
- Sem migration nova. Sem rota nova. Formato gravado na tentativa não muda.
- O que muda no site: **nada, por enquanto** — o quiz passa a pedir a
  prova ao seletor do Apolo (APO-12) só quando o conteúdo já tem banco
  classificado por tema o bastante (10 questões, DEC-10); como nenhum
  conteúdo real foi classificado ainda (falta o APO-08, carga inicial, que
  é trabalho humano do Abner), todo quiz de hoje continua exatamente no
  sorteio local de sempre. Quando um conteúdo for classificado, o quiz
  dele passa a priorizar recuperação vencida, depois subtópico fraco,
  depois cobertura do plano — mas a nota mínima (70%), o quiz dirigido
  (as erradas voltam na hora ao refazer) e o próximo conteúdo travado até
  passar continuam exatamente iguais.
- Se algo der errado: reverter para `restore/pre-apo-14` traz o sorteio
  local de volta para todo conteúdo, sem perder nenhuma tentativa ou nota
  já gravada.

## PR #57 — Revisões, corretivo e fila de recuperação (APO-15)

- Ponto de restauração: branch `restore/pre-apo-15` (commit `7060eab`, main antes do merge).
- Sem migration nova.
- O que muda no site: **nada, por enquanto** — revisão (24h/7d/30d) e
  corretivo passam a ter plano próprio por etapa (tamanho 10→30 ou 10→60,
  conforme o banco permitir) e a fila de recuperação do Apolo ganha uma
  regra de "formatura" (uma questão errada só sai de consideração depois
  de 3 acertos em sessões diferentes desde o último erro), mas isso só
  afeta conteúdo com banco já classificado por tema — e nenhum conteúdo
  real está classificado ainda (depende do APO-08, trabalho humano do
  Abner). Todo quiz/revisão/corretivo de hoje continua exatamente igual.
  A nova rota `GET /api/apolo/recuperacao` existe e lê certo, mas nenhuma
  tela a usa ainda.
- Se algo der errado: reverter para `restore/pre-apo-15` remove a rota
  nova e volta os planos de revisão/corretivo ao tamanho único de antes,
  sem perder nenhuma tentativa ou nota já gravada.

## PR #58 — Modelos de item: moldes transferíveis entre temas (APO-16)

- Ponto de restauração: branch `restore/pre-apo-16` (commit `edf85ff`, main antes do merge).
- Sem migration que mude tabela existente — só insere 11 linhas novas em
  `atlas_item_models` (5 geradores reais + 11 moldes: 10 de Contabilidade
  Geral, 1 de Direito Tributário).
- O que muda no site: **nada** — todo molde nasce "rascunho" e precisa de
  ativação manual depois que o Abner revisar 20 versões de cada um. Nenhuma
  migration liga esses moldes a `atlas_questions`; nenhuma tela usa isso
  ainda. Enquanto nenhum molde for ativado, nada no quiz, revisão ou
  corretivo muda.
- Se algo der errado: reverter para `restore/pre-apo-16` remove os 11
  moldes e os 5 geradores novos, sem afetar nenhum quiz, nota ou tentativa
  já gravada.

## PR #59 — Atividades do conteúdo com nota própria (APO-17, DEC-018)

- Ponto de restauração: branch `restore/pre-apo-17` (commit `f62d65a`, main
  antes do merge).
- Nova tabela não é criada; reaproveita `atlas_quiz_attempts` com
  `purpose='atividade'` e `atlas_evidences` com `kind='atividade'`. Nenhuma
  migration nova.
- O que muda no site: o componente "Atividades" do progresso (peso 20) deixa
  de aparecer sempre vazio e passa a mostrar a melhor nota aprovada quando
  existir alguma tentativa de atividade; sem nenhuma tentativa, continua sem
  dado (igual antes). A rota `POST /api/atividades` passa a existir, mas
  nenhuma tela chama essa rota ainda — sem wiring de UI, ninguém consegue
  começar uma atividade pela interface neste PR.
- Se algo der errado: reverter para `restore/pre-apo-17` remove a rota e a
  lógica de Atividade; como nada grava em tabela nova, nenhum dado de quiz,
  revisão ou progresso existente é afetado.

## PR #60 — Exame de meio de curso por disciplina (APO-18, DEC-010)

- Ponto de restauração: branch `restore/pre-apo-18` (commit `a328f89`, main
  antes do merge).
- Migrations: `atlas_contents` ganha a coluna `level` (vazia em toda linha
  existente); nova tabela `atlas_exam_attempts` (tentativa única por
  disciplina).
- O que muda no site: nada visível ainda — `level` nasce vazio em todo
  conteúdo (precisa de curadoria humana, que ainda não tem tela), e sem
  nenhum conteúdo nivelado o exame cairia na regra de posição; mas iniciar
  um exame (`POST /api/exames`) exige a disciplina já ter 50% dos
  conteúdos concluídos e confirmação explícita, e nenhuma tela chama essa
  rota ainda. O componente "Avaliações" do progresso continua mostrando
  vazio até o primeiro exame ser entregue em alguma disciplina.
- Se algo der errado: reverter para `restore/pre-apo-18` remove a coluna
  `level`, a tabela de exame e a rota `/api/exames`; nenhum dado de quiz,
  atividade ou progresso existente é afetado.

## PR #61 — Atividade final e recuperação (APO-19)

- Ponto de restauração: branch `restore/pre-apo-19` (commit `39152f3`, main
  antes do merge).
- Migrations: nenhuma — reusa a tabela `atlas_exam_attempts` do PR #60 (dois
  instrumentos novos, `atividade_final` e `recuperacao`, no mesmo índice
  único por disciplina).
- O que muda no site: nada visível ainda — mesmo padrão do PR #60, as rotas
  `/api/exames` e `/api/exames/:id` ganham a ação `responder` e aceitam os
  dois instrumentos novos, mas nenhuma tela chama isso ainda. O componente
  "Avaliações" do progresso passa a somar a nota da atividade final/
  recuperação (50/50 com o exame de meio) no cálculo interno, assim que uma
  disciplina tiver as duas provas entregues — sem tela, não há como isso
  acontecer na prática ainda.
- Se algo der errado: reverter para `restore/pre-apo-19` remove a rota de
  atividade final/recuperação (`lib/apolo/final.ts`) e a ação `responder`;
  nenhum dado de quiz, exame de meio, atividade ou progresso existente é
  afetado (nenhuma migration para desfazer).

## PR #62 — Exame de proficiência (APO-20)

- Ponto de restauração: branch `restore/pre-apo-20` (commit `5333b90`, main
  antes do merge).
- Migrations: nenhuma — reusa `atlas_quiz_attempts` (`purpose='proficiencia'`)
  e `atlas_evidences` (`kind='proficiencia'`), colunas de texto livre sem
  CHECK constraint.
- O que muda no site: nada visível ainda — as rotas novas `/api/proficiencia`
  e `/api/proficiencia/:id` existem, mas nenhuma tela chama isso ainda. Só
  quando uma tela usar essas rotas é que um aluno vai conseguir, no estado
  "não iniciado" de um conteúdo, fazer um exame adaptativo que, com nota
  acima de 85%, dispensa o conteúdo direto para "concluído".
- Se algo der errado: reverter para `restore/pre-apo-20` remove o motor de
  proficiência (`lib/apolo/proficiency.ts`) e as duas rotas novas; nenhum
  dado de quiz, exame, atividade ou progresso existente é afetado (nenhuma
  migration para desfazer).

## PR #63 — Progresso e relatórios ligados ao Apolo (APO-21)

- Ponto de restauração: branch `restore/pre-apo-21` (commit `3f62337`, main
  antes do merge).
- Migrations: nenhuma — só leitura adicional de colunas já existentes
  (`id` de `atlas_quiz_attempts`/`atlas_exam_attempts`).
- O que muda no site: nenhuma nota muda — mesmas fórmulas de antes. O que
  muda é o que a API de progresso e de relatório devolvem: cada componente
  da nota (Avaliações, Atividades, Quiz) agora vem com `sources` (a
  tentativa que sustenta o número) e o relatório do conteúdo
  (`/api/relatorio`) ganha `questionTrail` (a correção questão a questão
  da tentativa que vale a nota de quiz/atividade). Nenhuma tela usa isso
  ainda — é dado disponível na API, sem UI nova.
- Se algo der errado: reverter para `restore/pre-apo-21` remove os campos
  `sources`/`questionTrail`; a nota de cada disciplina/conteúdo continua
  idêntica (nenhuma fórmula mudou).

## PR #64 — Painel do banco e do Apolo (APO-22)

- Ponto de restauração: branch `restore/pre-apo-22` (commit `ebe06a3`, main
  antes do merge).
- Migrations: nenhuma — só um campo aditivo (`selectionReasons`) dentro do
  JSON já existente em `atlas_exam_attempts.questions_json`.
- O que muda no site: tela nova, "Painel" (`/painel`), com link na
  navegação — cobertura do banco de questões por tema/conteúdo/Bloom/
  dificuldade (conteúdos com menos de 30 questões ativas aparecem
  marcados), questões em alerta, acervo e espaço ocupado no R2, o ponto do
  usuário por tema e as últimas provas de disciplina montadas (exame de
  meio, atividade final, recuperação) com o motivo de cada questão. Só
  leitura; nenhuma nota muda.
- Se algo der errado: reverter para `restore/pre-apo-22` remove a tela, a
  rota `/api/apolo/painel` e o campo `selectionReasons`; nenhuma nota ou
  tentativa existente é afetada.

## PR #65 — Simulador e testes do Apolo (APO-23)

- Ponto de restauração: branch `restore/pre-apo-23` (commit `360e5da`, main
  antes do merge).
- Migrations: nenhuma — código novo (`lib/apolo/simulator.ts`) e testes só,
  sem tocar D1.
- O que muda no site: nada visível — é um simulador interno (alunos e banco
  sintéticos, sem D1) que prova, com números medidos, que o Elo converge
  para a habilidade verdadeira, que o seletor de questões nunca ultrapassa
  o plano nem a cota por conteúdo, e que o KR-20 de uma prova bem calibrada
  chega à meta de 0,80. Documentado em `docs/APOLO.md`.
- Se algo der errado: reverter para `restore/pre-apo-23` remove o
  simulador e seus testes; nenhum outro código do Apolo é afetado.

## PR #66 — Lançamento completo do Apolo (APO-24)

- Ponto de restauração: branch `restore/pre-apo-24` (commit `ec49141`, main
  antes do merge).
- Migrations: nenhuma — remoção de código só (`lib/quizzes.ts`,
  `lib/recovery.ts`) e testes novos, sem tocar D1.
- O que muda no site: nada visível para um conteúdo que já tinha banco
  grande/temado (todo conteúdo em produção hoje). Para um conteúdo com
  banco pequeno ou sem tema, o quiz/atividade agora é montado sempre pelo
  seletor do Apolo (não mais um sorteio local de reserva) — mesmo
  comportamento de recuperação (as erradas voltam primeiro), só que pelo
  caminho do Apolo em vez de um sorteio separado. Documentado em
  `docs/APOLO.md`.
- Se algo der errado: reverter para `restore/pre-apo-24` traz de volta o
  gate `isApoloReady` e os dois sorteios locais; nenhuma nota ou tentativa
  existente é afetada.

## PR #67 — Base mista inicial de 30 provas autorais no banco de fontes

- Ponto de restauração: branch `restore/pre-apolo-fontes-autorais` (commit
  `26c7fb1`, main antes do merge).
- Migrations: nenhuma — só dados (`data/apolo/fontes-autorais/`) e um
  script de carga novo (`scripts/apolo-fontes-autorais.mjs`).
- O que muda no site: nada ainda — este PR só guarda os dados no
  repositório. Carregar de fato no acervo de fontes (R2 + D1 de produção)
  continua sendo um passo manual do Abner (`wrangler login`), igual a
  qualquer outro script do Apolo; só depois disso as 1800 questões
  (classificadas por tema, aprovação pendente) aparecem em `/rascunhos`
  para curadoria.
- Se algo der errado: reverter para `restore/pre-apolo-fontes-autorais`
  remove os dados e o script; nenhuma fonte ou rascunho já carregado em
  produção seria desfeito por isso (a reversão é só do repositório).

## PR #69 — Carregador do banco adicional de 1.800 questões (curadoria em dupla sessão de IA)

- Ponto de restauração: branch `restore/pre-apolo-banco-novo` (commit `7036989`, main antes do merge).
- O que muda no site: nada visível ainda. As 1.800 questões entram como
  rascunhos "pendente" em `/rascunhos`, igual a qualquer outra fonte — cada
  uma só fica disponível aos alunos depois de aprovada manualmente, uma a
  uma, como sempre.
- O que muda fora do site: novo script `scripts/apolo-banco-novo.mjs`
  (`pnpm run apolo:banco-novo -- --check|--target local|--target production`),
  que carrega esse lote específico sem precisar de um PDF — diferente de
  `apolo-fontes-autorais.mjs`, que sobe um PDF real por prova ao R2, este lote
  nasceu direto como JSON (duas sessões de Claude: uma gerou as questões, a
  outra verificou cada cálculo por script e revisou o conteúdo de domínio
  antes de aceitar). Grava uma única fonte tipo `lista` sem arquivo real no
  R2 (metadados descrevem o próprio JSON) e os 1.800 rascunhos.
- Se algo der errado: a fonte é idempotente pelo sha256 do JSON de entrada —
  rodar de novo não duplica nada; a exclusão da fonte pela tela de
  `/rascunhos` remove os rascunhos pendentes ligados a ela.

## PR #68 — Bagagem de temas e sugestão de Bloom em /rascunhos

- Ponto de restauração: branch `restore/pre-apolo-bagagem-temas-bloom`
  (commit `18d72c4`, main antes do merge).
- Migrations: `drizzle/0021_temas_bagagem_apolo.sql` (cadastra 18 temas em
  `atlas_themes`, sem criar tabela nova).
- O que muda no site: o combo "Tema" em `/rascunhos` passa a mostrar os 18
  temas já usados pelos 1.800 rascunhos das provas autorais (PR #67), já
  pré-selecionados nesses rascunhos (antes o combo estava vazio e aparecia
  sempre como "Sem tema"). O campo "Nível de Bloom" continua manual na
  tela — a sugestão (`pnpm run apolo:sugestao-bloom`) é um passo separado,
  que só preenche rascunhos pendentes sem Bloom ainda definido.
- Se algo der errado: reverter para `restore/pre-apolo-bagagem-temas-bloom`
  remove os 18 temas cadastrados e o classificador; nenhum rascunho ou
  questão aprovada é afetado (a aprovação em si nunca mudou).

## PR #70 — Corrige `apolo:sugestao-bloom` para lotes grandes (>300 rascunhos)

- Ponto de restauração: branch `restore/pre-apolo-sugestao-bloom-batching`
  (commit `d3755d5`, main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda.
- O que muda fora do site: `scripts/apolo-sugestao-bloom.mjs`
  (`pnpm run apolo:sugestao-bloom -- --target local|--target production`)
  mandava todos os `UPDATE` de uma vez num único `wrangler d1 execute
  --command`; com a carga de ~1.800 rascunhos (PR #67/#69) isso passa do
  limite de tamanho de linha de comando do Windows e o script falha sem
  gravar nada. Agora grava em lotes de 300 via arquivo temporário e
  `--file`, igual ao padrão já usado em `apolo-banco-novo.mjs`. A lógica de
  quais rascunhos recebem sugestão (só os pendentes sem Bloom ainda
  definido, nunca sobrescrevendo um já revisado) não muda.
- Se algo der errado: reverter para `restore/pre-apolo-sugestao-bloom-batching`
  volta o script ao estado anterior; nenhum rascunho ou questão aprovada é
  afetado.

## PR #72 — Taxonomia de conteúdo fora do roadmap + script de curadoria em lote

- Ponto de restauração: branch `restore/pre-apolo-taxonomia-conteudo` (commit
  `354d421`, main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda
  (a tela `/rascunhos` continua igual; a edição de `content_label_id` fica
  para um passo futuro).
- O que muda fora do site: migration `0022_taxonomia_conteudo_apolo.sql` cria
  `atlas_content_taxonomy` (aberta, como `atlas_themes`) e a coluna
  `content_label_id` em `atlas_question_drafts` — para rascunhos de temas que
  ainda não têm nó no roadmap de 157 conteúdos (hoje só Contabilidade). Novo
  script `scripts/apolo-aplicar-curadoria.mjs`
  (`pnpm run apolo:aplicar-curadoria -- --file <classificação> --target
  local|production`) grava, em lotes de 300 via `--file`, o `content_id` ou
  `content_label_id` + `knowledge_type` decididos numa thread de curadoria,
  identificando cada rascunho pelo `text_hash` — nunca sobrescreve um
  rascunho já revisado. Nada é aprovado automaticamente.
- Se algo der errado: reverter para `restore/pre-apolo-taxonomia-conteudo`
  volta ao estado anterior; a coluna e a tabela novas ficam vazias até algum
  script gravar nelas, então reverter sem ter rodado o script de aplicação
  não perde nada.
