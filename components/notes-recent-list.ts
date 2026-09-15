export type RecentInteractionNote = { id: string };

/**
 * Moves `note` to the front of `current` (an open or a save, whichever just
 * happened) and caps the result to `limit`. Order is call order, not a
 * timestamp comparison: since both an open and a save always call this with
 * the note's freshest interaction, the most recent action naturally ends up
 * first regardless of which of the two it was.
 */
export function mergeRecentInteraction<T extends RecentInteractionNote>(
  current: T[],
  note: T,
  limit = 5,
): T[] {
  return [
    note,
    ...current.filter((candidate) => candidate.id !== note.id),
  ].slice(0, limit);
}
