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
