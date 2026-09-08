# Atlas Notes — Gate 1 / Spike Tiptap

## Estado

**PASS técnico** no branch isolado `codex/atlas-notes-tiptap-spike`. Gate 2 permanece não autorizado.

Este gate valida a viabilidade técnica do editor formatado. Ele não substitui o editor real, não altera a API, não cria migração D1 e não autoriza merge ou deploy.

## Escopo aprovado

- Tiptap 3.31.3 com `@tiptap/react`, `@tiptap/pm` e `@tiptap/starter-kit`;
- rota isolada `/notes-spike`;
- toolbar P0 com parágrafo, H1–H3, listas simples, citação, negrito, itálico, desfazer e refazer;
- colagem convertida em texto simples;
- bloqueio de listas aninhadas no cliente;
- validador, canonicalizador e projetor em TypeScript puro, sem DOM ou Tiptap;
- fixtures para projeção, legado, limites e entradas hostis;
- pnpm 11.19.0 como gerenciador oficial do spike.

## Não objetivos

- substituir o `textarea` atual;
- alterar `app/api/notes`, store ou schema D1;
- persistir `content_json`;
- migrar notas existentes;
- implementar recursos P1;
- mesclar na main, publicar ou implantar.

## Decisões congeladas para o Gate 1

- Documento canônico: envelope Atlas versão 1 com JSON Tiptap restrito.
- Texto derivado: blocos unidos por LF, sem marcadores visuais, com `trim()` bilateral.
- Legado: cada linha vira um parágrafo; leitura nunca migra.
- Limites: 100 mil unidades UTF-16 visíveis, 1 MiB estruturado, 1,25 MiB de requisição, profundidade 8 e 20 mil nós.
- Segurança: servidor rejeita conteúdo fora da allowlist; nada é silenciosamente removido.
- Listas: um único parágrafo por item e nenhum aninhamento.
- Biblioteca: Tiptap permanece condicional às evidências deste spike.

## Evidências exigidas

- [x] instalação reproduzível com pnpm e lockfile congelado;
- [x] typecheck de todo o projeto;
- [x] lint direcionado de todos os novos arquivos TypeScript/TSX;
- [x] build vinext/SSR com a rota `/notes-spike`;
- [x] 11 testes de JSON e projeção exatos;
- [x] fixtures legadas e normalização CRLF/CR para LF;
- [x] limites e rejeição de payload hostil;
- [x] lista aninhada rejeitada pelo predicado compartilhado e pelo guard de transações;
- [x] toolbar com nomes acessíveis, estados pressionado/desabilitado e foco visível;
- [x] corpo projetado continua legível para rollback.

## Resultado observado

- Instalação congelada: passou com pnpm 11.19.0.
- Testes focados: 11 aprovados, nenhuma falha.
- Typecheck: passou.
- Build: passou nas cinco etapas, incluindo cliente, servidor, RSC e SSR.
- Runtime local: `/notes-spike` respondeu HTTP 200.
- Lint direcionado: passou sem erros nos arquivos do Gate 1.
- Lint global: continua falhando somente em arquivos preexistentes e não modificados; o baseline foi preservado e não foi mascarado.
- Bundle isolado final: 403.494 bytes de JavaScript não comprimido e 2.980 bytes de CSS. Como nenhum limite foi acordado antes do spike, o dado segue para análise de otimização no Gate 2.
- Revisão Hermes: `GATE_1_VERDICT: PASS`; `GATE_2_STATUS: NOT_AUTHORIZED`.

## Métricas de eficiência

- Guias visíveis abertas após a adoção da política de baixo consumo: **0**.
- Antes dessa política, houve uma única solicitação de preview enfileirada; ela não será repetida automaticamente.
- Processos de desenvolvimento mantidos ativos ao encerrar o gate: **0**.
- Sessões Hermes usadas na revisão final do Gate 1: **1**, com prompt técnico sanitizado.
- As validações conclusivas foram reutilizadas na consolidação documental; build e servidor não foram reiniciados sem mudança funcional.

Não houve alteração do editor real, API, store ou schema D1. A habilidade de construção do projeto influenciou a validação ao exigir build SSR e uma resposta real da rota experimental, sem publicar ou implantar o spike.

A integração de produção continua bloqueada até aprovação separada do Gate 2.
