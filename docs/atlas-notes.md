# Atlas Notes — contrato da primeira versão

## Responsabilidades

- O Atlas armazena o título e o texto integral da nota no D1.
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

## Integração pendente

A interface e a persistência não exigem segredo externo. O consumo real da fila e a escrita de metadados na planilha exigem uma credencial Google restrita, armazenada como segredo do ambiente hospedado, além de uma decisão explícita sobre a aba/range de destino. Como a planilha não define hoje uma tabela de notas do Atlas, esta versão não cria uma silenciosamente e mantém as operações em `queued`.
