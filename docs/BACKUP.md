# Backup e restauração do Atlas

Segue o DEC-011: backup manual, disparado por você, que copia o D1 inteiro
(dump SQL) e os anexos do R2 na mesma execução para uma pasta no seu
computador, fora da conta Cloudflare. A restauração de teste roda só no
Miniflare local; nada aqui grava na Cloudflare.

## Uma vez por computador

Use a mesma preparação do deploy (`docs/DEPLOY.md`): `npx wrangler login` e o
`deploy.local.json` com os nomes reais do D1 e do bucket. Acrescente nele, na
seção `production`, a pasta onde as cópias ficam, com o caminho completo e as
barras dobradas:

```json
"backupDir": "C:\\Users\\voce\\Projetos\\Atlas\\backup"
```

A pasta `backup/` na raiz do projeto é ignorada pelo git, então pode ficar
dentro da pasta do Atlas. Se a pasta escolhida estiver dentro do repositório e
não for ignorada, o script recusa. Os dados de backup nunca vão para o GitHub.

## Fazer um backup

Dê dois cliques em `Backup Atlas.cmd` e digite `production` quando ele pedir o
ambiente. Ou, num terminal na pasta do projeto:

```
pnpm run backup:atlas -- --target production
```

O que ele faz, só com leituras na Cloudflare:

1. Acha o D1 pelo nome.
2. `wrangler d1 export --remote` grava o dump completo em `d1.sql` e conta as
   linhas de cada tabela. Durante o export o D1 pode ficar indisponível por
   alguns segundos, então não use o Atlas enquanto o backup roda.
3. Copia do R2 o arquivo de cada anexo listado no D1 para `r2/` (anexos de
   notas, arquivos de material de estudo e o acervo de fontes do Apolo —
   APO-05, prefixo `apolo/fontes/`).
4. Grava `manifest.json` (data, commit, contagens, nome e hash de cada arquivo)
   e só então renomeia a pasta de `...parcial` para o nome final. Uma execução
   interrompida não deixa backup pela metade com cara de completo.

Cada execução cria uma pasta `atlas-backup-production-AAAA-MM-DD_HH-MM-SS`.
Um anexo que existe no D1 mas não no R2 vira aviso e fica anotado em
`missing` no manifesto.

Para ensaiar sem tocar a Cloudflare, `--target local --dir <pasta>` copia o
D1/R2 locais do `pnpm dev`.

## Retenção

Depois de um backup completo, ficam no máximo as 3 cópias mais novas, e as
anteriores com mais de 3 dias são apagadas. A cópia recém-feita sempre fica.
Isso mantém o compromisso de exclusão em 3 dias do DEC-08 enquanto você fizer
backups com regularidade. Se excluir dados que não podem ficar em cópia
nenhuma, apague à mão as pastas de backup anteriores à exclusão.

As cópias contêm tudo em texto, inclusive notas privadas. Trate a pasta como
dado pessoal.

## Restauração de teste

Dê dois cliques em `Testar Restauracao Atlas.cmd` e digite `local`. Ou:

```
pnpm run backup:restore-local -- --target local
```

Sem `--from <pasta-do-backup>`, ele usa o backup de produção mais novo da
`backupDir`. Ele:

1. confere o hash do dump e de cada anexo contra o manifesto;
2. restaura o dump num D1 do Miniflare novo, em `.wrangler/restore-test`
   (não mexe nos dados do `pnpm dev`, que ficam em `.wrangler/state`), e compara
   a contagem de linhas de cada tabela com a do backup;
3. grava cada anexo no R2 local e relê para comparar byte a byte;
4. confere que todo anexo do D1 restaurado tem o arquivo no R2.

Só aceita `--target local`. Termina com "Restauração de teste concluída com
sucesso" ou para no primeiro problema, dizendo qual.

O dump do wrangler cria cada tabela seguida dos seus dados; como algumas
tabelas referenciam outras criadas depois, a restauração reordena o arquivo
(todas as tabelas primeiro, depois os dados, depois os índices) e grava essa
versão em `.wrangler/restore-test/d1-restauracao.sql`.

## Recuperação de verdade

Não é automatizada (DEC-011: o teste roda só no local). Se um dia precisar
recuperar produção a partir de uma cópia, rode antes a restauração de teste
dessa cópia, crie um D1 novo e vazio, aplique nele o `d1-restauracao.sql` com
`wrangler d1 execute <d1-novo> --remote --file .wrangler/restore-test/d1-restauracao.sql`,
envie cada arquivo de `r2/` para a chave anotada no manifesto com
`wrangler r2 object put <bucket>/<chave> --remote --file <arquivo>`, aponte
`deploy.local.json` para o D1 novo e publique. Peça ajuda ao Claude antes: é
uma operação em produção.

## Histórico

- 2026-10-07: `scripts/backup.mjs`, `scripts/restore-local.mjs`,
  `Backup Atlas.cmd` e `Testar Restauracao Atlas.cmd` (DEC-011, QUEST-010 item 4).
