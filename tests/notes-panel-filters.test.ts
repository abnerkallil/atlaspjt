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
