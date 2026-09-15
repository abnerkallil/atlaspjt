# Atlas Notes — Gate 2 / Integração P0

> **Nota histórica (renomeação Codex → Claude Code):** este é um registro histórico preservado sem alteração. Todas as menções a "Codex" abaixo referem-se à ferramenta de implementação usada na época (CLI Codex da OpenAI), hoje substituída pelo Claude Code. O texto original não foi reescrito.

## Estado

**PASS técnico do Codex**, posteriormente integrado à branch `main` com autorização do usuário.

O Gate 2 integra o editor formatado validado no Atlas Notes real. Backfill de notas, implantação e recursos P1 permanecem fora desta entrega.

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
- Primeira revisão final Muse: sem parecer; o provedor retornou limite HTTP 429.
- Teste posterior do Bonsai/LM Studio: respondeu com atraso, mas foi excluído da avaliação após o usuário determinar que apenas Muse Spark deveria ser usado.
- Tentativa de revisão pelo Bonsai: interrompida imediatamente após a correção do usuário e sem resposta.
- Revisão final no Muse Spark: `ACCEPT_IMPLEMENTATION`; `GATE_2_VERDICT: PASS`.

O parecer final independente do Muse Spark confirma as evidências determinísticas locais e não identificou contradição ou teste bloqueador.

## Métricas de eficiência

- guias visíveis abertas: **zero**;
- sessões Hermes concluídas com resposta: **três** — preflight Muse, teste de conectividade Bonsai e veredito final Muse;
- sessões Hermes sem resposta: **duas** — uma por limite do provedor e uma chamada Bonsai interrompida;
- uso medido nas três sessões concluídas: 24.478 tokens no total e três chamadas, com custo estimado informado como US$ 0,00;
- chamadas canceladas antes da inferência pela confirmação Contributor: não contabilizadas como conversa;
- build completo: duas execuções, sendo a segunda necessária após o refinamento final do guard e da verificação de projeção;
- banco D1 de integração: temporário, validado e removido;
- processos retidos ao encerrar o gate: **zero**;
- publicação, merge e backfill: **zero**.

## Situação de entrega

O Gate 2 foi aprovado pelo usuário, integrado à `main` e publicado como versão oficial 5 no site privado. O pacote incluiu a migração D1 aditiva; o backfill permanece fora do escopo.
