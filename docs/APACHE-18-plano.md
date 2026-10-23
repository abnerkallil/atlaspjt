# APA-18 — Plano de carga das aulas base do roadmap

Pedido explícito do Abner (2026-10-23) para começar o APA-18: escrever a aula
base (`ApacheLesson`, `model='claude-manual'`) de todo conteúdo do roadmap
atual, grounded em legislação quando aplicável. Esta thread cobre o
inventário, a decisão de mecanismo de carga e a primeira disciplina (piloto).
TOKEN SAVING: cada disciplina seguinte vira uma thread curta própria, usando
este documento como ponto de partida.

## Inventário do roadmap atual (`lib/content-catalog.ts`)

Um único roadmap (`atlas-contabil`), 5 disciplinas, 183 conteúdos:

| Disciplina                                | Conteúdos | Risco de legislação |
|--------------------------------------------|-----------|----------------------|
| Contabilidade de Custos                    | 4         | baixo (cálculo/técnica) |
| Análise das Demonstrações Financeiras      | 6         | baixo (técnica)      |
| Contabilidade Avançada                     | 7         | médio (CPC)           |
| Contabilidade Geral                        | 41        | médio (CPC, legislação societária) |
| Contabilidade Tributária                   | 124       | **alto** (tributos, SPED, reforma tributária) |

Contabilidade Tributária concentra a maior parte do conteúdo e o maior risco
de citar artigo de lei errado — ver "Ordem recomendada" abaixo.

## Mecanismo de carga (decidido nesta thread)

`docs/APACHE.md` (seção APA-18) já exige que a carga passe **pelo mesmo
caminho de gravação que a produção usa** (`saveLesson`, APA-05: R2 gzip +
upsert em D1, versão incrementada, objeto antigo só apagado depois do novo
gravado) — nunca uma migration/seed direta, para a aula manual ficar
indistinguível de uma aula gerada pela IA (exceto pelo campo `model`).

Como `saveLesson` roda só dentro do Worker (bindings reais `DB`/`ATTACHMENTS`),
e não existe nenhuma rota HTTP administrativa para isso, a carga usa um
script novo que chama a Cloudflare pela CLI do `wrangler` — **o mesmo padrão
já usado por `scripts/backup.mjs`, `scripts/deploy.mjs` e
`scripts/apolo-aplicar-curadoria.mjs`** (login do `wrangler`, nunca token
manual; nomes de D1/bucket lidos de `deploy.local.json`, nunca placeholder):

- **`scripts/apache-carregar-aulas.mjs`** (novo na PR #95):
  `pnpm run apache:carregar-aulas -- --file <arquivo.json> --target local|production`.
  Lê um array `{ contentId, lesson }[]`, valida cada `lesson` contra o mesmo
  schema de `lib/apache/schema.ts#validateLesson` (duplicado aqui porque o
  script roda fora do bundle do Worker — mesmo princípio já documentado em
  `apolo-aplicar-curadoria.mjs`), grava o `.json.gz` no R2 (`wrangler r2
  object put`) e faz o upsert em `atlas_apache_lessons` (`wrangler d1
  execute`) com `model='claude-manual'`, na mesma ordem e com a mesma regra de
  versão/limpeza de objeto antigo de `saveLesson`.
- Cada lote (disciplina ou sub-lote) é um arquivo JSON em
  `data/apache/aulas/<disciplina-ou-lote>.json` + uma PR própria, revisada
  por amostragem antes do merge (regra do card).
- `kind='aula_manual'` nunca é regenerado automaticamente pelo processador da
  fila (já implementado no APA-02/APA-08) — se o Abner reportar erro numa
  aula manual, ela entra para revisão humana, nunca é reescrita pelo Llama.

**Por que não migration/seed:** uma migration só escreveria linhas em D1; os
bytes da aula (R2, gzip) ficariam fora do controle de versão do banco e sem a
regra de "apagar o objeto antigo só depois do novo gravado". O script
replica exatamente o que `saveLesson` faz.

## Ordem recomendada entre disciplinas

1. **Contabilidade de Custos (4)** — piloto, PR #95. Conteúdo técnico/de
   cálculo, sem citação de lei: valida o script e o formato com o menor
   risco possível.
2. **Análise das Demonstrações Financeiras (6)** — mesmo perfil de risco
   baixo, confirma o script com mais um lote pequeno. **PR #96.**
3. **Contabilidade Avançada (7)** — primeiro contato com CPC (ainda não é
   "legislação" no sentido tributário, mas exige verificar o pronunciamento).
   **PR aberta nesta thread.**
4. **Contabilidade Geral (41)** — sub-lotes por unidade (ver
   `docs/APACHE.md`); mistura fundamentos técnicos com alguma legislação
   societária. Sub-lote 4a (14/41, CG-001 a CG-006, CG-041, CG-007 a
   CG-013, nesta ordem do catálogo) em
   `data/apache/aulas/contabilidade-geral-1.json`. Restam 27: CG-014 a
   CG-040 (nesta ordem do catálogo).
5. **Contabilidade Tributária (124)** — por último e em vários sub-lotes
   pequenos (não a disciplina inteira de uma vez): é onde a pesquisa de
   legislação (tributos, SPED, reforma tributária) é mais pesada e onde um
   artigo de lei errado faria mais estrago. Merece a revisão por amostragem
   mais rigorosa.

## Checklist desta thread

- [x] Confirmação explícita do Abner para começar
- [x] Inventário de disciplinas/conteúdos
- [x] Mecanismo de carga decidido e implementado (`scripts/apache-carregar-aulas.mjs`)
- [x] Lote 1/5 — Contabilidade de Custos (4/4 conteúdos) — PR #95
- [x] Lote 2/5 — Análise das Demonstrações Financeiras (6/6 conteúdos) — PR #96
- [x] Lote 3/5 — Contabilidade Avançada (7/7 conteúdos)
- [ ] Lote 4/5 — Contabilidade Geral (14/41, em sub-lotes; sub-lote 4a nesta PR)
- [ ] Lote 5/5 — Contabilidade Tributária (0/124, em sub-lotes, pesquisa de legislação)
- [ ] Todos os 183 conteúdos cobertos (regra final do card)

## Como aplicar (Abner, depois do merge)

```
pnpm run apache:carregar-aulas -- --file data/apache/aulas/contabilidade-de-custos.json --target production
pnpm run apache:carregar-aulas -- --file data/apache/aulas/analise-demonstracoes-financeiras.json --target production
pnpm run apache:carregar-aulas -- --file data/apache/aulas/contabilidade-avancada.json --target production
pnpm run apache:carregar-aulas -- --file data/apache/aulas/contabilidade-geral-1.json --target production
```

Não precisa de "Publicar Atlas" — o script grava direto em produção (D1 +
R2) usando o `wrangler` já logado; não há build nem migration nova nesta PR.
