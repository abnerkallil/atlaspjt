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
