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

## Exclusão e backup

Remover uma fonte (pela tela ou DELETE `/api/apolo/fontes/:id`) apaga o PDF
do R2 e a linha do D1 de imediato — sem soft-delete, seguindo o compromisso
de exclusão em até 3 dias do DEC-08. O backup manual (`pnpm run backup:atlas`,
DEC-011) já copia o acervo de fontes junto com os demais anexos do R2.
