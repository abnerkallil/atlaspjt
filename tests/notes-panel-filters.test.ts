import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyNotesPanelFilters,
  matchesNotesPanelSearch,
  sortNotesPanel,
  type NotesPanelNote,
} from '../components/notes-panel-filters.js';

function note(overrides: Partial<NotesPanelNote> & { id: string }): NotesPanelNote {
  return {
    title: 'Título padrão',
    body: 'Corpo padrão',
    updatedAt: '2026-01-01T00:00:00.000Z',
    links: [],
    ...overrides,
  };
}

void test('matches by title, case-insensitively', () => {
  const n = note({ id: 'a', title: 'Direito Constitucional' });
  assert.equal(matchesNotesPanelSearch(n, 'constitucional'), true);
  assert.equal(matchesNotesPanelSearch(n, 'CONSTITUCIONAL'), true);
  assert.equal(matchesNotesPanelSearch(n, 'penal'), false);
});

void test('matches by body text', () => {
  const n = note({ id: 'a', title: 'Nota', body: 'Fala sobre controle de constitucionalidade.' });
  assert.equal(matchesNotesPanelSearch(n, 'controle de'), true);
  assert.equal(matchesNotesPanelSearch(n, 'inexistente'), false);
});

void test('matches by linked content title or id (texto incluído na nota)', () => {
  const n = note({
    id: 'a',
    title: 'Nota',
    body: 'Corpo sem a palavra buscada',
    links: [{ contentId: 'DC-102', contentTitle: 'Controle de Constitucionalidade' }],
  });
  assert.equal(matchesNotesPanelSearch(n, 'constitucionalidade'), true);
  assert.equal(matchesNotesPanelSearch(n, 'dc-102'), true);
  assert.equal(matchesNotesPanelSearch(n, 'DC-102'), true);
  assert.equal(matchesNotesPanelSearch(n, 'penal'), false);
});

void test('an empty or whitespace-only query matches everything', () => {
  const n = note({ id: 'a' });
  assert.equal(matchesNotesPanelSearch(n, ''), true);
  assert.equal(matchesNotesPanelSearch(n, '   '), true);
});

void test('sortNotesPanel: date-desc puts the most recently updated first (default)', () => {
  const notes = [
    note({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
    note({ id: 'new', updatedAt: '2026-03-01T00:00:00.000Z' }),
    note({ id: 'mid', updatedAt: '2026-02-01T00:00:00.000Z' }),
  ];
  assert.deepEqual(
    sortNotesPanel(notes, 'date-desc').map((n) => n.id),
    ['new', 'mid', 'old'],
  );
});

void test('sortNotesPanel: date-asc puts the oldest first', () => {
  const notes = [
    note({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
    note({ id: 'new', updatedAt: '2026-03-01T00:00:00.000Z' }),
    note({ id: 'mid', updatedAt: '2026-02-01T00:00:00.000Z' }),
  ];
  assert.deepEqual(
    sortNotesPanel(notes, 'date-asc').map((n) => n.id),
    ['old', 'mid', 'new'],
  );
});

void test('sortNotesPanel: title-asc and title-desc order alphabetically', () => {
  const notes = [
    note({ id: 'b', title: 'Banana' }),
    note({ id: 'a', title: 'Abacaxi' }),
    note({ id: 'c', title: 'Caju' }),
  ];
  assert.deepEqual(
    sortNotesPanel(notes, 'title-asc').map((n) => n.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    sortNotesPanel(notes, 'title-desc').map((n) => n.id),
    ['c', 'b', 'a'],
  );
});

void test('sortNotesPanel never mutates the input array', () => {
  const notes = [
    note({ id: 'b', title: 'Banana' }),
    note({ id: 'a', title: 'Abacaxi' }),
  ];
  const original = notes.map((n) => n.id);
  sortNotesPanel(notes, 'title-asc');
  assert.deepEqual(notes.map((n) => n.id), original);
});

void test('applyNotesPanelFilters: filters by linked content id in isolation', () => {
  const notes = [
    note({ id: 'linked', links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }] }),
    note({ id: 'other-link', links: [{ contentId: 'DP-01', contentTitle: 'Penal' }] }),
    note({ id: 'no-link' }),
  ];
  const result = applyNotesPanelFilters(notes, { linkedContentId: 'DC-102' });
  assert.deepEqual(result.map((n) => n.id), ['linked']);
});

void test('applyNotesPanelFilters: search and linked-content filter combine (AND, not OR)', () => {
  const notes = [
    note({
      id: 'match-both',
      title: 'Resumo de constitucional',
      links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }],
    }),
    note({
      id: 'match-search-only',
      title: 'Resumo de constitucional',
      links: [{ contentId: 'DP-01', contentTitle: 'Penal' }],
    }),
    note({
      id: 'match-filter-only',
      title: 'Sem relação nenhuma',
      body: 'Nada a ver com o termo buscado',
      links: [{ contentId: 'DC-102', contentTitle: 'Direito Administrativo' }],
    }),
  ];
  const result = applyNotesPanelFilters(notes, {
    search: 'constitucional',
    linkedContentId: 'DC-102',
  });
  assert.deepEqual(result.map((n) => n.id), ['match-both']);
});

void test('applyNotesPanelFilters: combines search, filter and sort together', () => {
  const notes = [
    note({
      id: 'z-newer',
      title: 'Zebra constitucional',
      updatedAt: '2026-03-01T00:00:00.000Z',
      links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }],
    }),
    note({
      id: 'a-older',
      title: 'Abelha constitucional',
      updatedAt: '2026-01-01T00:00:00.000Z',
      links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }],
    }),
    note({
      id: 'excluded-by-filter',
      title: 'Constitucional também',
      updatedAt: '2026-02-01T00:00:00.000Z',
      links: [{ contentId: 'DP-01', contentTitle: 'Penal' }],
    }),
  ];
  const result = applyNotesPanelFilters(notes, {
    search: 'constitucional',
    linkedContentId: 'DC-102',
    sort: 'title-asc',
  });
  assert.deepEqual(result.map((n) => n.id), ['a-older', 'z-newer']);
});

void test('applyNotesPanelFilters: defaults to date-desc and no filtering when options are omitted', () => {
  const notes = [
    note({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
    note({ id: 'new', updatedAt: '2026-02-01T00:00:00.000Z' }),
  ];
  assert.deepEqual(
    applyNotesPanelFilters(notes, {}).map((n) => n.id),
    ['new', 'old'],
  );
});

// --- QA additions (QUEST-006 acceptance-criteria audit) -------------------
//
// The block above (12 tests) is what shipped with the quest. Everything
// below was added while auditing that work against the Task Contract's
// Acceptance Criteria — targeting edge cases the original suite left
// uncovered, not just re-testing what it already proved.

void test('acceptance: painel funciona com zero notas — filtering an empty list never throws and returns []', () => {
  assert.deepEqual(applyNotesPanelFilters([], {}), []);
  assert.deepEqual(
    applyNotesPanelFilters([], { search: 'qualquer coisa', linkedContentId: 'DC-102', sort: 'title-asc' }),
    [],
  );
});

void test('acceptance: painel funciona com uma única nota (poucas notas)', () => {
  const notes = [note({ id: 'only', title: 'Única nota' })];
  assert.deepEqual(applyNotesPanelFilters(notes, {}).map((n) => n.id), ['only']);
  assert.deepEqual(
    applyNotesPanelFilters(notes, { search: 'não bate com nada' }).map((n) => n.id),
    [],
  );
});

void test('linked-content filter: a contentId that no note has produces an empty result, not everything', () => {
  const notes = [
    note({ id: 'a', links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }] }),
    note({ id: 'b', links: [] }),
  ];
  assert.deepEqual(
    applyNotesPanelFilters(notes, { linkedContentId: 'NAO-EXISTE' }),
    [],
  );
});

void test('linked-content filter: an empty string behaves like "no filter" (the panel\'s "Todos" option)', () => {
  const notes = [
    note({ id: 'a', links: [{ contentId: 'DC-102', contentTitle: 'Constitucional' }] }),
    note({ id: 'b', links: [] }),
  ];
  assert.deepEqual(
    applyNotesPanelFilters(notes, { linkedContentId: '' }).map((n) => n.id).sort(),
    ['a', 'b'],
  );
});

void test('search matches a note when only its SECOND link (not the first) matches', () => {
  const n = note({
    id: 'a',
    title: 'Nota qualquer',
    body: 'Corpo qualquer',
    links: [
      { contentId: 'DP-01', contentTitle: 'Direito Penal' },
      { contentId: 'DC-102', contentTitle: 'Controle de Constitucionalidade' },
    ],
  });
  assert.equal(matchesNotesPanelSearch(n, 'constitucionalidade'), true);
});

void test('search: a partial (substring) match against a linked contentId still counts as "texto incluído"', () => {
  const n = note({
    id: 'a',
    links: [{ contentId: 'DC-102', contentTitle: 'Controle de Constitucionalidade' }],
  });
  assert.equal(matchesNotesPanelSearch(n, 'DC-1'), true);
  assert.equal(matchesNotesPanelSearch(n, 'dc-102-nope'), false);
});

void test('search query surrounded by whitespace is trimmed before matching', () => {
  const n = note({ id: 'a', title: 'Direito Constitucional' });
  assert.equal(matchesNotesPanelSearch(n, '  constitucional  '), true);
});

void test('search does not cross-match: a term present only in one note must not match a different note', () => {
  const notes = [
    note({ id: 'match', title: 'Direito Constitucional' }),
    note({ id: 'no-match', title: 'Direito Penal', body: 'Nada sobre o outro tema' }),
  ];
  const result = applyNotesPanelFilters(notes, { search: 'constitucional' });
  assert.deepEqual(result.map((n) => n.id), ['match']);
});

void test('sortNotesPanel: title sort is case-insensitive-ish via localeCompare (lowercase title still sorts correctly)', () => {
  const notes = [
    note({ id: 'b', title: 'banana' }),
    note({ id: 'a', title: 'Abacaxi' }),
  ];
  assert.deepEqual(
    sortNotesPanel(notes, 'title-asc').map((n) => n.id),
    ['a', 'b'],
  );
});

void test('sortNotesPanel: date-asc and date-desc are exact reverses of each other', () => {
  const notes = [
    note({ id: 'x', updatedAt: '2026-01-01T00:00:00.000Z' }),
    note({ id: 'y', updatedAt: '2026-05-01T00:00:00.000Z' }),
    note({ id: 'z', updatedAt: '2026-03-01T00:00:00.000Z' }),
  ];
  const asc = sortNotesPanel(notes, 'date-asc').map((n) => n.id);
  const desc = sortNotesPanel(notes, 'date-desc').map((n) => n.id);
  assert.deepEqual(asc, [...desc].reverse());
});

void test('sortNotesPanel: title-asc and title-desc are exact reverses of each other', () => {
  const notes = [
    note({ id: 'x', title: 'Zebra' }),
    note({ id: 'y', title: 'Abelha' }),
    note({ id: 'z', title: 'Mico' }),
  ];
  const asc = sortNotesPanel(notes, 'title-asc').map((n) => n.id);
  const desc = sortNotesPanel(notes, 'title-desc').map((n) => n.id);
  assert.deepEqual(asc, [...desc].reverse());
});

void test('applyNotesPanelFilters never mutates the input array (filter + sort combined)', () => {
  const notes = [
    note({ id: 'b', title: 'Banana', links: [{ contentId: 'DC-102', contentTitle: 'X' }] }),
    note({ id: 'a', title: 'Abacaxi', links: [{ contentId: 'DC-102', contentTitle: 'X' }] }),
  ];
  const originalOrder = notes.map((n) => n.id);
  applyNotesPanelFilters(notes, { linkedContentId: 'DC-102', sort: 'title-asc' });
  assert.deepEqual(notes.map((n) => n.id), originalOrder);
});
