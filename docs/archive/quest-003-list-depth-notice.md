# QUEST-003 — Atlas Notes: aviso visual de limite de profundidade em listas aninhadas

Status: COMPLETE (validado manualmente pelo usuário em 2026-09-13)

## Priority
P1

## Complexity
SMALL

## Hermes Gate
NO

---

## Objective

Ao tentar aninhar um item de lista além da profundidade máxima permitida, o usuário deve receber um aviso visual claro no momento do bloqueio. O bloqueio em si já funcionava corretamente (o item não descia, o cursor permanecia no lugar), mas nenhuma notificação aparecia na tela.

## Causa raiz

O aviso (`<output>` com a mensagem) era renderizado dentro da própria árvore do editor com `position: absolute`, ficando sujeito ao contexto de clipping/stacking de algum ancestral do editor — por isso nunca aparecia visualmente, mesmo com o bloqueio funcionando.

## Correção aplicada

- `components/notes-editor.tsx`: o aviso passou a ser renderizado via `createPortal(..., document.body)`, saindo da árvore do editor;
- `components/notes-editor.module.css`: `.listDepthNotice` mudou de `position: absolute` (`right: 14px; bottom: 14px; z-index: 25`) para `position: fixed` (`right: 24px; bottom: 24px; z-index: 1000`).

Nenhuma outra lógica foi alterada — o guard de profundidade (`canSinkListItemWithinDepth`), o limite (`ATLAS_NOTES_LIMITS.depth = 16`, DEC-003) e o timer de auto-dismiss (2,6s) permaneceram intactos.

## Acceptance Criteria

- [x] ao atingir o limite de profundidade tentando aninhar mais um subnível, o item de lista não desce;
- [x] a notificação aparece de fato na tela nesse momento — validado manualmente no navegador;
- [x] a notificação não aparece em nenhuma outra situação além do bloqueio real de profundidade;
- [x] os testes já existentes relacionados a este comportamento continuam passando;
- [x] nenhuma regressão visual ou funcional no editor de notas fora deste comportamento específico.

## Validação

Validado manualmente no navegador pelo usuário: lista aninhada até o limite, aviso "Profundidade máxima da lista atingida." aparece no canto inferior direito e some sozinho depois de alguns segundos.
