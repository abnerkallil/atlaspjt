## PR #44 — Temas e mapa do conhecimento (APO-02, DEC-014)

- Ponto de restauração: branch `restore/pre-apo-02` (commit `ca8e984`, main antes do merge).
- Migration nova: `0014_temas_apo02` (nova tabela `atlas_themes` — tema aberto,
  tema pai opcional, área de conhecimento; coluna aditiva `atlas_contents.theme_id`,
  nullable). O `Publicar Atlas.cmd` aplica sozinho; conteúdos sem tema continuam
  funcionando normalmente.
- O que muda no site: nada visível ainda. `GET /api/roadmap` passa a devolver
  o tema de cada conteúdo (quando houver um cadastrado), mas nenhuma tela lê
  esse campo ainda — é a base de dados por trás do mapa do conhecimento do
  Apolo. Nenhum tema foi cadastrado em produção por este PR.
- Se algo der errado: só poderia afetar a resposta de `/api/roadmap` (campo
  de tema a mais); nenhuma tela do Atlas muda de comportamento.
