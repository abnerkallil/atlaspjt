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
`3 anulada`). O resultado é só um JSON de rascunhos em disco — **nada é
gravado no D1** por este comando; a curadoria decide o que vira questão de
verdade.

## Exclusão e backup

Remover uma fonte (pela tela ou DELETE `/api/apolo/fontes/:id`) apaga o PDF
do R2 e a linha do D1 de imediato — sem soft-delete, seguindo o compromisso
de exclusão em até 3 dias do DEC-08. O backup manual (`pnpm run backup:atlas`,
DEC-011) já copia o acervo de fontes junto com os demais anexos do R2.
