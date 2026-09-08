# Atlas Project — Campaign

Este documento representa a campanha de desenvolvimento do Atlas Project.

## Regras da campanha

### Prioridades

`P0 > P1 > P2`

- **P0** — Essencial para o MVP ou bloqueia outras funcionalidades.
- **P1** — Importante, mas não bloqueia o núcleo do projeto.
- **P2** — Melhoria secundária ou refinamento.

### Tipos de item

- `QUEST-*` — tarefas concretas de desenvolvimento.
- `DEC-*` — decisões que devem ser resolvidas antes da implementação dependente.
- `FUT-*` — funcionalidades futuras fora do foco atual do MVP.

## Fase 0 — Fundação

### QUEST-001 — Assimilar e documentar a arquitetura atual

**Prioridade:** P0

**Objetivo:** mapear a implementação existente do Atlas e identificar seus principais módulos, fluxos e dependências.

**Dependências:** nenhuma.

**Critérios de conclusão:**

- arquitetura principal identificada;
- módulos relevantes conhecidos;
- inconsistências importantes registradas;
- estado documentado em `ATLAS_STATUS.md`.

## Fase 1 — Núcleo do produto

### QUEST-002 — Integrar o editor formatado P0 do Atlas Notes

**Prioridade:** P0

**Objetivo:** substituir a edição em texto puro por um editor estruturado, mantendo compatibilidade com notas legadas, pesquisa, prévia, vínculos, fila de sincronização e persistência D1.

**Dependências:** QUEST-001 e DEC-NOTES-01 a DEC-NOTES-11.

**Critérios de conclusão:**

- editor formatado P0 integrado ao workspace real;
- documento estruturado versionado e validado no cliente e no servidor;
- projeção textual determinística preservada em `body`;
- migração aditiva de banco gerada e validada;
- compatibilidade legada e proteção contra downgrade testadas;
- testes, análise estática, tipos, build e API validados;
- revisão técnica independente aprovada.

## Decisões resolvidas — Atlas Notes

- **DEC-NOTES-01:** JSON Atlas/Tiptap restrito e versionado como formato canônico.
- **DEC-NOTES-02:** limite de 100 mil unidades UTF-16 visíveis, acompanhado de limites de requisição, documento, profundidade e nós; nunca truncar silenciosamente.
- **DEC-NOTES-03:** notas legadas mantêm `content_json` nulo até salvamento explícito.
- **DEC-NOTES-04:** `body` permanece como projeção textual determinística com LF.
- **DEC-NOTES-05:** colagem P0 em texto simples; conteúdo inválido é rejeitado, não sanitizado silenciosamente.
- **DEC-NOTES-06:** paleta de cores adiada para P1.
- **DEC-NOTES-07:** barra de ferramentas mínima e acessível no P0.
- **DEC-NOTES-08:** Tiptap 3.31.3 aprovado após spike técnico.
- **DEC-NOTES-09:** contrato aditivo com `content_json` e proteção contra downgrade.
- **DEC-NOTES-10:** pnpm 11.19.0 e versões exatas das dependências do editor.
- **DEC-NOTES-11:** implantação em dois gates; ambos concluídos e aprovados.

## Funcionalidades futuras

### P1 — Evolução do editor

- links;
- títulos H4–H6;
- listas de tarefas e aninhamento;
- tachado, destaque e cores de texto/destaque;
- menu de contexto;
- colagem externa formatada.

### P2 — Recursos avançados

- tabelas, mídia e blocos de código;
- fórmulas, diagramas e callouts;
- colaboração e histórico avançado.
