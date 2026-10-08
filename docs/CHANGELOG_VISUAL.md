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

## PR #30 — Backup do D1 e R2 com restauração de teste (DEC-011)

- Ponto de restauração: branch `restore/pre-backup-dec011` (commit `d4d3145`, main antes do merge).
- O que muda no site: nada visível. Nenhuma tela, nota, anexo ou número muda.
- O que muda fora do site: novos comandos `Backup Atlas.cmd` (copia o D1 e os
  anexos de produção para a pasta `backupDir` do `deploy.local.json`) e
  `Testar Restauracao Atlas.cmd` (restaura a cópia num banco local separado e
  confere). Uso em `docs/BACKUP.md`.
- Se algo der errado: só o backup em si pode falhar; ele apenas lê da
  Cloudflare, então não altera dados do site.

## PR #31 — Sessões de estudo reais (MVP-02, ATLAS-ESC-13)

- Ponto de restauração: branch `restore/pre-mvp-02` (commit `858c181`, main antes do merge).
- Migration nova: `0008_study_sessions` (tabela `atlas_study_sessions`). O
  `Publicar Atlas.cmd` aplica sozinho.
- O que muda no site:
  - **Estudar**: a tela deixa de ser demonstração. Mostra a sessão aberta (ou
    o próximo conteúdo liberado do roadmap) e a lista de conteúdos da
    disciplina. Endereço `/estudar?sessao=...` abre uma sessão específica.
  - **Sessão de estudo**: relógio com **Pausar** / **Retomar** (aparece um
    aviso "Sessão pausada"), o ponto atual e o rascunho da nota são salvos
    sozinhos (a cada 2 s e ao fechar a aba), e **Concluir** registra a
    evidência e leva o conteúdo para "aguardando quiz". As datas de revisão
    de exemplo sumiram da sessão.
  - **Hoje**: o cartão "Continue de onde parou" usa a sessão real (some se
    não houver nada aberto).
  - **Roadmap**: o botão "Começar a estudar / Estudar" cria a sessão e abre
    a tela de estudo.
- Se algo der errado: tempo de estudo errado, sessão que não retoma, conteúdo
  que não passa para "aguardando quiz" ou cartão "Continue de onde parou"
  estranho vêm deste PR.
