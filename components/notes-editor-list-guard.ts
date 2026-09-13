import type { Node as PMNode } from '@tiptap/pm/model';

export function maxNodeDepth(node: PMNode): number {
  let deepest = 0;
  node.forEach((child) => {
    deepest = Math.max(deepest, 1 + maxNodeDepth(child));
  });
  return deepest;
}

export function canSinkListItemWithinDepth(
  listLevel: number,
  itemSubtreeDepth: number,
  maxDepth: number,
): boolean {
  const targetItemDepth = 2 * (listLevel + 1) + 1;
  return targetItemDepth + itemSubtreeDepth <= maxDepth;
}
