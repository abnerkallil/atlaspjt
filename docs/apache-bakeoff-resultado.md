# APA-17 — Resultado do bake-off de modelo (enriquecimento)

Pendente: este arquivo é regravado automaticamente por `scripts/apache-bakeoff.ts`
quando o script roda contra a conta Cloudflare real. Ainda não rodou.

## Como rodar

Não precisa de API Token nem de Account ID manual — o script usa
`getPlatformProxy` do pacote `wrangler` para pegar um binding `AI` remoto de
verdade, autenticado com o MESMO login (`wrangler login`, OAuth) que já é
usado para `wrangler d1 execute --remote` no Publicar Atlas. Se esse login
já está feito na máquina, é só rodar.

No PowerShell, em `C:\Users\abner\OneDrive\Desktop\Projetos\Atlas\atlaspjt-atual`,
na branch deste PR:

```powershell
git fetch origin claude/project-thread-oj1mbh; git checkout claude/project-thread-oj1mbh; pnpm install; pnpm run apache:bakeoff; git add docs/apache-bakeoff-resultado.md; git commit -m "docs: resultado real do bake-off APA-17"; git push origin claude/project-thread-oj1mbh; git checkout main
```

O script faz 6 chamadas (3 modelos × 2 casos de teste). No PIOR CASO (toda
chamada gastando o teto de 500 tokens de saída) custa até ~300 neurons no
total — bem abaixo da cota diária de 10.000 (compartilhada com o resto do
Apache); na prática o gasto real é bem menor, porque a ficha de
enriquecimento é curta. Regrava este arquivo com a tabela de resultados, a
saída bruta de cada chamada e uma seção de recomendação a preencher depois
da análise de qualidade.

O comando acima já commita e dá push do resultado no mesmo branch do PR e
volta a pasta para `main` no final, para não deixar nada fora do estado do
GitHub (necessário para o Publicar Atlas funcionar). Depois disso, é só
avisar na thread que rodou — eu leio o resultado direto do PR e volto com a
análise e a recomendação final de `APACHE_ENRICHMENT_MODEL`.
