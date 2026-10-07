# Changelog visual do Atlas

Cada PR mesclado na `main` tem aqui uma entrada com o que muda para quem usa o
site e a tag git de restauração criada logo antes do merge. Se algo no site
ficar estranho (uma nota, uma tela, um número), procure a entrada que mexe
naquela parte; para voltar ao estado anterior a um PR, use a tag dele:

```
git checkout restore/<nome-da-tag>
```

ou peça ao Claude para reverter o PR. Publicar continua sendo um passo seu
(`Publicar Atlas.cmd`): nada daqui aparece no site antes disso.

## PR #30 — Backup do D1 e R2 com restauração de teste (DEC-011)

- Tag de restauração: `restore/pre-backup-dec011` (main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda.
- O que muda fora do site: novos comandos `Backup Atlas.cmd` (copia o D1 e os
  anexos de produção para a pasta `backupDir` do `deploy.local.json`) e
  `Testar Restauracao Atlas.cmd` (restaura a cópia num banco local separado e
  confere). Uso em `docs/BACKUP.md`.
- Se algo der errado: só o backup em si pode falhar; ele apenas lê da
  Cloudflare, então não altera dados do site.
