# Plano: questões aprovadas para todo o roadmap de Contabilidade

Pedido do Abner (2026-11-11, thread "Criar questões para todo o roadmap de
contabilidade"): o que importa agora é ter **amplas questões aprovadas para
cada um dos 182 conteúdos do roadmap atual de Contabilidade**. Rascunhos ou
questões de outros temas (direito, fiscal solto, português, etc.) não fazem
parte deste objetivo, exceto quando já podem ser reaproveitados para um
conteúdo específico do roadmap.

## 1. Meta por conteúdo

**15 questões ativas aprovadas por `content_id`.** Por quê: o Apolo exige pelo
menos 10 para revisões (regra já definida — ver DEC-014/APO-* no
`docs/APOLO.md`), e quiz + atividades do mesmo conteúdo sorteiam dessa mesma
base; 15 dá folga para não repetir a mesma questão em tentativas seguidas sem
exigir um banco desproporcional por conteúdo. Esta é uma decisão desta thread,
não um DEC novo — pode ser ajustada depois sem gate de arquitetura (é conteúdo
de currículo, não modelo de dados).

Catálogo: `lib/content-catalog.ts`, 182 conteúdos — 41 CG, 124 CT, 4 CC, 6 AD,
7 CA (`roadmap-seed.ts` carrega isso no D1 como `atlas_contents`).

## 2. Estado em 2026-11-11 (levantamento do Abner, read-only em produção)

- **Só CG-001 a CG-006 (10 cada) e CT-040 e CT-046 (1 cada) têm questão
  aprovada.** Todo o resto dos 182 está em 0 aprovadas.
- A maioria dos CG, todos os CC, AD e CA **já têm rascunhos vinculados por
  `content_id`** (ex.: CG-031 com 29, CG-037 com 32, AD-001 com 46, CC-003 com
  25) — isso é fila de aprovação direta em `/rascunhos`, não precisa de
  questão nova.
- Um grupo grande de rascunhos de temas fiscal/tributário está **solto**
  (`content_label_id`, sem `content_id` do roadmap) mas casa por palavra-chave
  com vários CT. A thread da PR #116 está relabelando e aprovando esses
  candidatos — ver
  `/mnt/project-files/notes/levantamento-rascunhos-vs-roadmap-ct-2026-11-11.md`
  para a tabela completa de candidatos por CT.
- **Conteúdos sem nenhum candidato encontrado (gap real — precisam de questão
  nova, autoral)**, por faixa do catálogo (ver `/tmp/catalog_list.txt` gerado
  nesta thread, ou `lib/content-catalog.ts` diretamente):
  - `CT-001`, `CT-002` (Fundamentos) — **feito nesta thread, lote 1**.
  - `CT-011`–`CT-029` (Responsabilidade/interpretação da legislação,
    contabilização de tributos, cadastros e documentos fiscais eletrônicos).
  - `CT-073`–`CT-077` (IPI específico; o que é compartilhado com ICMS já tem
    candidato).
  - `CT-098`–`CT-117` (cruzamentos/malha fiscal fora do que já foi mapeado,
    Reforma Tributária CT-099–CT-107, governança/domínio CT-108–CT-117).
  - `CT-118`–`CT-124` já tem fonte (apostila de documentos fiscais, PR #78) —
    conferir se já gerou rascunho/questão antes de tratar como gap.
  - CG com 0 aprovadas **e** 0 rascunhos próprios: `CG-007`, `CG-009` a
    `CG-012`, `CG-014`, `CG-016` a `CG-020`, `CG-026`, `CG-029`, `CG-030`,
    `CG-032`, `CG-033`, `CG-035`, `CG-040`.
  - `CG-041` (Princípios contábeis fundamentais, criado na PR #79) — conferir
    se já tem rascunho.

Este levantamento é por nome/tema, não questão a questão — cada lote abaixo
deve reconferir o estado real do conteúdo (`SELECT` por `content_id`) antes de
escrever questão nova, porque threads paralelas (PR #116 e outras) estão
mudando esses números.

## 3. Fontes de cobertura, em ordem de preferência

1. **Rascunho já vinculado por `content_id`** → só aprovar em `/rascunhos`
   (trabalho de curadoria humana ou de script já autorizado, não desta
   thread).
2. **Rascunho solto que casa por tema/palavra-chave** → relabelar
   (`content_label_id` → `content_id`) e aprovar (PR #116 e threads
   equivalentes).
3. **Nenhum candidato** → questão nova, autoral, fundamentada na aula base do
   conteúdo em `data/apache/aulas/*.json` (quando existir) e em legislação
   vigente. Regras de questão autoral (já em uso no Apolo): nunca inventar
   banca/órgão/ano; verificar o fato legal antes de escrever a explicação;
   classificar `knowledge_type` o mais específico possível; `origin = autoral`.

## 4. Carga em produção

Questão nova e já validada (sem ambiguidade de conteúdo) entra **direto como
aprovada** em `atlas_questions`, via
`pnpm run questoes:importar -- --target production --file <lote>.csv`
(mesmo loader do banco inicial, grava por `id` determinístico
`<content_id>-Q<ordem>`, nunca duplica). Isso é diferente do fluxo normal de
extração de PDF (que sempre passa por rascunho/`/rascunhos`): aqui a thread
que escreve a questão já é a revisão humana-equivalente exigida, porque o
texto é gerado e revisado nesta mesma etapa, não extraído de fonte externa
ambígua.

Caps do D1 grátis (ver `docs/APACHE.md`/memória do projeto): ≤20k writes por
carga, bem abaixo do limite diário de 5M linhas lidas. 182 conteúdos × 15
questões = no máximo ~2.730 linhas no fim do plano — cabe em poucas cargas.

**Esta thread não envia comando de carga ao Abner.** Cada lote de questão
nova fica como arquivo CSV commitado; o coordenador acumula os lotes das
threads encadeadas e manda **um único comando** de carga ao Abner no final
(mesmo modelo da APA-18), para não interromper o Abner por lote.

## 5. Lotes (mesmo modelo de encadeamento da APA-18: uma thread curta por lote)

| Lote | Conteúdos | Status |
|---|---|---|
| 1 | CT-001, CT-002 (10 questões cada, autoral) | **Feito nesta thread** — `data/questoes/lote-ct-001-002.csv` |
| 2 | CT-011–CT-019 (Fundamentos/Contabilização) | **Feito** — `data/questoes/lote-ct-011-019.csv` (135 questões, 15 por conteúdo) |
| 3 | CT-020–CT-029 (Cadastros e documentos fiscais) | **Feito** — `data/questoes/lote-ct-020-029.csv` (150 questões, 15 por conteúdo) |
| 3b | CT-030–CT-039 (Simples Nacional) | **Feito** — `data/questoes/lote-ct-030-039.csv` (150 questões, 15 por conteúdo) |
| 3c | CT-040–CT-049 (Lucro Presumido CT-040–045, Lucro Real CT-046–049) | **Feito** — `data/questoes/lote-ct-040-049.csv` (148 questões: CT-040 e CT-046 já tinham 1 questão aprovada em produção, com id `CT-040-Q01`/`CT-046-Q01`, então o lote preserva essa questão e completa 14 novas em cada um desses dois conteúdos, ordem 2 a 15; os demais 8 conteúdos recebem 15 novas, ordem 1 a 15) |
| 4 | CT-073–CT-077 (IPI específico) | **Feito** — `data/questoes/lote-ct-073-077.csv` (75 questões, 15 por conteúdo) |
| 5 | CT-098, CT-108–CT-117 (Malha fiscal fora do mapeado + Governança/domínio) | **Feito** — `data/questoes/lote-ct-108-117.csv` (165 questões, 15 por conteúdo; nenhum dos onze tinha questão aprovada antes) |
| 6 | CT-099–CT-107 (Reforma Tributária, fundamentos) | **Feito** — `data/questoes/lote-ct-099-107.csv` (135 questões, 15 por conteúdo) |
| 7 | CT-118–CT-124 (Reforma tributária — Documentos fiscais) | **Feito** — `data/questoes/lote-ct-118-124.csv` (105 questões, 15 por conteúdo; nenhum dos sete tinha questão aprovada em produção antes; fundamentado na aula `data/apache/aulas/contabilidade-tributaria-15.json`) |
| 8 | CG-007, CG-009–CG-012, CG-014 | **Feito** — `data/questoes/lote-cg-007-014.csv` (90 questões, 15 por conteúdo; nenhum dos seis tinha questão aprovada ou rascunho próprio antes; confirmado que as provas RF curadas nas PRs #123/#125 não tocam esses `content_id`; fundamentado nas aulas `data/apache/aulas/contabilidade-geral-1.json` e `contabilidade-geral-2.json`) |
| 9 | CG-016–CG-020, CG-026 | **Feito** — `data/questoes/lote-cg-016-026.csv` (87 questões; CG-016, CG-017, CG-018, CG-020 com 15 novas cada; CG-019 com 14 novas, ordem 2–15, pois há 1 questão da prova ATRFB 2012 Área Geral (PR #123) ainda como rascunho pendente para esse conteúdo; CG-026 com 13 novas, ordem 3–15, por já ter 2 questões da mesma prova) |
| 10 | CG-029, CG-030, CG-032, CG-033, CG-035, CG-040, CG-041 (conferir) | Pendente |
| — | Reconferir CT cobertos pela PR #116 (CT-003–CT-010, CT-040–CT-072, CT-078–CT-098, CT-112) após ela mergear; só escrever questão nova nos que ainda estiverem abaixo de 15 (CT-030–CT-039 já tratado no lote 3b, independente dessa reconferência) | Pendente, depende da PR #116 |
| — | Aprovar em `/rascunhos` (ou script equivalente) os CG/CC/AD/CA que já têm rascunho vinculado por `content_id` | Fora desta thread (fila de curadoria existente) |

Cada lote pendente: uma thread nova (herdando este plano por `message_id` ou
por este arquivo), reconfere o estado real do(s) conteúdo(s), escreve e
valida o CSV (`node scripts/import-questions.mjs --file <csv> --check`),
comita, e reporta ao coordenador — sem mandar comando de carga.
