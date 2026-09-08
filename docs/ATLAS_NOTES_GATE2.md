# Atlas Notes — Gate 2 / Integração P0

## Estado

**PASS técnico do Codex** no branch isolado `codex/atlas-notes-tiptap-spike`.

O Gate 2 integra o editor formatado validado no Atlas Notes real. Ele não autoriza merge na `main`, backfill de notas, implantação ou recursos P1.

## Escopo

- substituir o `textarea` pelo editor Tiptap P0;
- persistir JSON canônico versionado em `content_json` nullable;
- manter `body` como projeção textual determinística para pesquisa, prévia e sync;
- abrir notas legadas sem migração automática;
- migrar uma nota legada somente em salvamento explícito;
- proteger notas estruturadas contra downgrade textual;
- manter título, vínculos, status de sync e idempotência;
- validar limites e estrutura no servidor;
- registrar e testar o contrato aditivo.

## Fora do escopo

- links, H4–H6, tarefas, aninhamento, tachado, destaque ou cores;
- menu de contexto e colagem formatada externa;
- tabelas, mídia, código, fórmulas, diagramas ou colaboração;
- backfill, merge ou deploy.

## Validação concluída

- [x] migração Drizzle gerada e inspecionada: um único `ALTER TABLE` aditivo;
- [x] instalação congelada com pnpm 11.19.0;
- [x] 18 testes focados do documento e do contrato de entrada;
- [x] lint direcionado sem erros;
- [x] typecheck completo sem erros;
- [x] build vinext completo nas cinco etapas;
- [x] ambas as migrações aplicadas em D1 local descartável; `content_json` confirmado nullable;
- [x] API real exercitada contra D1 descartável: criação estruturada 201, busca por projeção, replay idempotente, conflito entre notas, proteção contra downgrade, criação legada e migração por salvamento explícito;
- [x] rota raiz respondeu HTTP 200 sem navegador;
- [x] entrypoint do Worker sem Tiptap ou ProseMirror.

O lint global não foi repetido porque o Gate 1 já registrou seu baseline preexistente e os arquivos correspondentes não foram alterados. O lint direcionado cobre todos os arquivos TypeScript/TSX modificados neste gate.

## Revisão Hermes

- Preflight: `GATE_2_PREFLIGHT: PASS`.
- Revisão final: sem parecer; o provedor retornou limite HTTP 429.
- Teste posterior do modelo alterado: sem resposta; o perfil `atlas-agent` ainda apontava para um modelo LM Studio indisponível.

A ausência do parecer final independente está registrada como limitação de coordenação, não como validação aprovada. As evidências determinísticas locais permanecem aprovadas.

## Métricas de eficiência

- guias visíveis abertas: **zero**;
- sessões Hermes concluídas com resposta: **uma**, no preflight;
- sessões Hermes sem resposta: **duas**, uma por limite do provedor e outra por modelo indisponível;
- chamadas canceladas antes da inferência pela confirmação Contributor: não contabilizadas como conversa;
- build completo: duas execuções, sendo a segunda necessária após o refinamento final do guard e da verificação de projeção;
- banco D1 de integração: temporário, validado e removido;
- processos retidos ao encerrar o gate: **zero**;
- publicação, merge e backfill: **zero**.

## Situação de entrega

O Gate 2 está pronto para revisão do usuário. A integração permanece somente no branch isolado; promover para a `main` e aplicar a migração fora do banco descartável exigem uma autorização separada.
