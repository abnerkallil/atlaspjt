# Atlas Notes — contrato da primeira versão

## Responsabilidades

- O Atlas armazena o título, a projeção textual pesquisável e, para notas formatadas, o documento estruturado canônico no D1.
- `body` é sempre a projeção determinística com LF, usada por pesquisa, prévia e contagem; nunca é editada separadamente do conteúdo canônico.
- Notas legadas permanecem com `content_json` nulo até um salvamento explícito pelo editor formatado.
- O catálogo de classificação é um snapshot rastreável da planilha oficial, não uma fonte paralela de progresso.
- O usuário confirma ou remove cada vínculo sugerido.
- Todo vínculo novo recebe o estado `Anotado — ainda não trabalhado`.
- Salvar uma nota não escreve em campos de estudo, revisão, quiz, proficiência, penalidade ou progresso.

## Fila de sincronização

Cada criação ou edição gera uma operação em `atlas_sync_operations` com chave idempotente única. O payload contém somente:

- identificador e título da nota;
- contagem de caracteres;
- IDs de conteúdo e estado do vínculo;
- data da atualização no Atlas.

O corpo da nota não entra no payload. Estados previstos: `queued`, `processing`, `synced` e `failed`. Uma falha deve atualizar a mesma operação e mantê-la na fila para retentativa; não deve escrever por outro caminho.

## Contrato do editor formatado P0

- Fonte canônica: envelope Atlas/Tiptap versão 1, restrito a parágrafo, H1–H3, listas simples, citação, negrito e itálico.
- Colagem P0: somente texto simples; construções fora da allowlist são rejeitadas, não removidas silenciosamente.
- Limites: 100 mil unidades UTF-16 visíveis, 1 MiB estruturado, 1,25 MiB por requisição, profundidade 8 e 20 mil nós.
- API: `content` é aditivo e pode ser nulo em registros legados; escritas estruturadas mantêm `body` como projeção validada pelo servidor.
- Compatibilidade: abrir nota legada converte somente em memória. A migração ocorre quando o usuário salva explicitamente.
- Downgrade: uma nota que já possui `content_json` não aceita atualização apenas textual.
- Idempotência: a primeira escrita vence; um mesmo `operationId` não pode ser reutilizado em outra nota.

## Histórico de versões (MVP-03, DEC-012)

- Definição do Atlas (Abner, 2026-10-07): o histórico só permite ver e restaurar, e guarda duas versões, a atual e a imediatamente anterior.
- A atual é a linha de `atlas_notes`; a anterior fica em `atlas_note_versions` (uma linha por nota, snapshot de título, `body` e `content_json` como estavam gravados). Pasta, privacidade, vínculos e anexos não são versionados.
- Cada gravação que muda título ou conteúdo copia a versão atual para a anterior no mesmo batch. Salvar sem mudança não mexe na anterior.
- Restaurar troca as duas: a anterior volta a ser a atual (regravada como envelope v2, inclusive quando era legada ou v1) e a que estava atual vira a anterior, então restaurar de novo desfaz.
- Rotas: `GET /api/notes/{id}/previous-version` e `POST /api/notes/{id}/previous-version`, sob a mesma sessão do DEC-007.

## Integração pendente

A interface e a persistência não exigem segredo externo. O consumo real da fila e a escrita de metadados na planilha exigem uma credencial Google restrita, armazenada como segredo do ambiente hospedado, além de uma decisão explícita sobre a aba/range de destino. Como a planilha não define hoje uma tabela de notas do Atlas, esta versão não cria uma silenciosamente e mantém as operações em `queued`.
