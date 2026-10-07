# Publicar o Atlas em produção

Um comando faz o deploy inteiro a partir do `main` do GitHub. Ele segue o
DEC-009: o ambiente é informado a cada execução (não existe padrão) e nada é
gravado na Cloudflare antes de você confirmar.

## Uma vez por computador

1. `npx wrangler login` (entra na conta Cloudflare pelo navegador).
2. Copie `deploy.example.json` para `deploy.local.json` e preencha os nomes reais
   do Worker, do D1 e do bucket R2 de anexos. `accountId` só é necessário se o
   login tiver acesso a mais de uma conta. O `deploy.local.json` é ignorado pelo
   git e nunca vai para o GitHub; o id do D1 não precisa ser copiado, o script
   descobre pelo wrangler.
   O nome precisa ser exatamente `deploy.local.json` (não `deploy.json`), e os
   valores vão sem os sinais `< >` do modelo, por exemplo `"worker": "meu-worker"`.
   Não apague o `deploy.example.json`: ele é o modelo versionado e os testes o usam.

## Toda vez que quiser publicar

Dê dois cliques em `Publicar Atlas.cmd` e digite `production` quando ele pedir o
ambiente. Ou, num terminal na pasta do projeto:

```
pnpm run deploy:atlas -- --target production
```

O script mostra o commit, o Worker, o D1, o bucket e as migrations que vai
aplicar, e só continua se você digitar `PUBLICAR`.

Para só testar a configuração sem publicar, rode o comando e, na confirmação,
digite qualquer coisa diferente de `PUBLICAR` (ou feche a janela). Até ali ele
só fez pull, install, build e leituras na Cloudflare.

## O que o comando faz

1. Confere que a pasta está no `main` e sem alterações locais, e roda
   `git pull --ff-only`.
2. `pnpm install --frozen-lockfile`.
3. `pnpm run build`.
4. Só leitura na Cloudflare: acha o id do D1 pelo nome, confere que o bucket R2
   existe, roda `prepare-own-deploy.mjs` e lê quais migrations o D1 já tem.
5. Depois do `PUBLICAR`: registra as migrations cujo schema já existe (ver abaixo).
6. `wrangler d1 migrations apply --remote` aplica só as pendentes.
7. `wrangler deploy`.

Se qualquer passo falhar, o comando para com a mensagem do passo. Falha antes do
passo 5 não altera nada na Cloudflare. Rodar de novo é seguro: migrations já
aplicadas não rodam outra vez.

## Como as migrations pendentes são detectadas

O wrangler guarda as migrations aplicadas na tabela `d1_migrations` do próprio
D1. Em produção, as migrations 0004 a 0006 foram aplicadas à mão sem esse
registro, então antes de aplicar o script compara cada migration pendente com o
schema real:

- tabelas, índices e colunas que ela cria já existem: só registra, não roda;
- nada dela existe: o wrangler aplica;
- parte existe e parte não: o deploy para sem alterar nada, para correção manual;
- migration só de dados (como `0005_catalog_seed.sql`): o wrangler aplica, por
  isso migrations de dados precisam ser idempotentes (`ON CONFLICT` / `OR IGNORE`).

Na primeira execução depois desta mudança o esperado é registrar 0004 e 0006 e
aplicar 0005 (que só regrava o catálogo com os mesmos valores).

## Depois do deploy

O HTML raiz é servido com `s-maxage` longo, então uma aba aberta antes do deploy
pode mostrar a versão antiga até ser recarregada. Se precisar que todos vejam a
versão nova na hora, purgue o cache do domínio no painel da Cloudflare.

## Histórico

- 2026-10-06: deploy manual (pull, install, build, `prepare-own-deploy`,
  migrations e `wrangler deploy` digitados um a um) substituído por
  `scripts/deploy.mjs`, `Publicar Atlas.cmd` e `deploy.local.json`.
