import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeRecentInteraction } from '../components/notes-recent-list.js';

type Note = { id: string; label: string };

void test('moves the interacted note to the front, ahead of anything already there', () => {
  const current: Note[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ];
  const result = mergeRecentInteraction(current, { id: 'c', label: 'C' });
  assert.deepEqual(
    result.map((note) => note.id),
    ['c', 'a', 'b'],
  );
});

void test('a later interaction on an already-listed note supersedes its earlier position, not duplicates it', () => {
  // Models "open vs. edit, whichever is more recent wins": every call
  // represents whatever interaction just happened (an open OR a save), so
  // simply moving that note to the front on each call is exactly the
  // "most recent interaction wins" rule — no separate timestamp comparison
  // is needed on the client, since calls already arrive in chronological
  // order.
  const current: Note[] = [
    { id: 'a', label: 'A (opened first)' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];
  // "a" gets edited and saved later than it was opened - it should move
  // back to the front rather than appear twice.
  const result = mergeRecentInteraction(current, {
    id: 'a',
    label: 'A (edited later)',
  });
  assert.deepEqual(
    result.map((note) => note.id),
    ['a', 'b', 'c'],
  );
  assert.equal(result[0].label, 'A (edited later)');
  assert.equal(result.length, 3);
});

void test('caps the result to the given limit, dropping the oldest interactions', () => {
  const current: Note[] = Array.from({ length: 5 }, (_, index) => ({
    id: `old-${index}`,
    label: `old ${index}`,
  }));
  const result = mergeRecentInteraction(
    current,
    { id: 'new', label: 'new' },
    5,
  );
  assert.equal(result.length, 5);
  assert.equal(result[0].id, 'new');
  assert.deepEqual(
    result.map((note) => note.id),
    ['new', 'old-0', 'old-1', 'old-2', 'old-3'],
  );
  // The 5th and oldest existing entry ("old-4") is the one bumped out.
  assert.ok(!result.some((note) => note.id === 'old-4'));
});

void test('handles fewer than the limit and an empty starting list without special-casing', () => {
  assert.deepEqual(
    mergeRecentInteraction([], { id: 'a', label: 'A' }, 5).map((n) => n.id),
    ['a'],
  );
  const twoItems = mergeRecentInteraction(
    [{ id: 'a', label: 'A' }],
    { id: 'b', label: 'B' },
    5,
  );
  assert.deepEqual(
    twoItems.map((note) => note.id),
    ['b', 'a'],
  );
});
