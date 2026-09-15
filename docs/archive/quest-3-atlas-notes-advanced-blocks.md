# Quest 3 — Atlas Notes: blocos avançados de edição

> **Nota histórica (renomeação Codex → Claude Code):** este é um registro histórico preservado sem alteração. Todas as menções a "Codex" abaixo referem-se à ferramenta de implementação usada na época (CLI Codex da OpenAI), hoje substituída pelo Claude Code. O texto original não foi reescrito.

Status: COMPLETE

## Nota sobre este registro

Esta quest foi executada antes da adoção do fluxo formal de Task Contract via `docs/quests/ACTIVE.md` — o trabalho foi conduzido através de prompts diretos ao Codex (à época, a CLI do Codex da OpenAI). Este documento é um registro retroativo, criado para preservar histórico, e não substitui o fato de que o contrato original não foi versionado formalmente linha a linha.

A única parte desta quest que passou pelo fluxo formal de Task Contract foi seu item final, QUEST-003 (aviso visual do limite de profundidade), cujo registro completo está em `docs/archive/quest-003-list-depth-notice.md`.

## Escopo entregue

- Listas aninhadas (bullet, numbered, task list), respeitando o limite de profundidade definido em DEC-003 (`ATLAS_NOTES_LIMITS.depth = 16`);
- Links: popup ao passar o mouse mostrando a URL, com opção de abrir (via confirmação de segurança antes de sair da página) e opção de editar;
- Notas de rodapé (footnotes): título padrão = título da nota, editável ao passar o mouse, independente de mudanças posteriores no título da nota;
- Tabelas configuráveis: usuário define número de colunas, número de linhas e título de cada coluna na criação;
- Blocos de matemática (inline e em bloco);
- Callouts;
- Correção do aviso visual de limite de profundidade em listas aninhadas (QUEST-003) — o bloqueio já funcionava, mas o aviso não era renderizado; causa raiz e correção documentadas no registro dessa quest.

## Referências

- Formato canônico: DEC-001 (Atlas Notes v2), DEC-002 (estrutura de listas aninhadas), DEC-003 (limite de profundidade 16).
- Implementação: `lib/atlas-notes-document.ts`, `components/notes-editor.tsx`, `components/notes-editor-extensions.ts`, `components/notes-editor-list-guard.ts`, `components/notes-workspace.tsx`.
- Testes: `tests/atlas-notes-document.test.ts`, `tests/atlas-notes-input.test.ts`.

## Validação

Validado manualmente no navegador pelo usuário, incluindo salvar, recarregar e reabrir notas com cada tipo de bloco.
