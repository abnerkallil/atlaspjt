import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeContentCoverage,
  computeOverallCoverage,
  type CoverageCatalogItem,
  type CoverageNote,
} from '../components/notes-coverage.js';

const catalog: CoverageCatalogItem[] = [
  { id: 'CG-001', subject: 'Contabilidade Geral' },
  { id: 'CG-002', subject: 'Contabilidade Geral' },
  { id: 'CG-003', subject: 'Contabilidade Geral' },
  { id: 'CT-001', subject: 'Contabilidade Tributária' },
  { id: 'CT-002', subject: 'Contabilidade Tributária' },
];

function note(contentIds: string[]): CoverageNote {
  return { links: contentIds.map((contentId) => ({ contentId })) };
}

void test('computeContentCoverage: no notes means zero coverage for every subject, not an empty list', () => {
  const result = computeContentCoverage([], catalog);
  assert.deepEqual(
    result.map((entry) => [entry.subject, entry.total, entry.covered, entry.ratio]),
    [
      ['Contabilidade Geral', 3, 0, 0],
      ['Contabilidade Tributária', 2, 0, 0],
    ],
  );
});

void test('computeContentCoverage: a content id linked by any note counts once, duplicates do not inflate it', () => {
  const notes = [note(['CG-001']), note(['CG-001'])];
  const result = computeContentCoverage(notes, catalog);
  const geral = result.find((entry) => entry.subject === 'Contabilidade Geral')!;
  assert.equal(geral.covered, 1);
  assert.equal(geral.total, 3);
  assert.equal(geral.ratio, 1 / 3);
});

void test('computeContentCoverage: covered content ids that are not in the catalog are ignored', () => {
  const notes = [note(['CG-001', 'NAO-EXISTE'])];
  const result = computeContentCoverage(notes, catalog);
  const geral = result.find((entry) => entry.subject === 'Contabilidade Geral')!;
  assert.equal(geral.covered, 1);
});

void test('computeContentCoverage: full coverage of a subject yields ratio 1', () => {
  const notes = [note(['CT-001', 'CT-002'])];
  const result = computeContentCoverage(notes, catalog);
  const tributaria = result.find(
    (entry) => entry.subject === 'Contabilidade Tributária',
  )!;
  assert.equal(tributaria.covered, 2);
  assert.equal(tributaria.total, 2);
  assert.equal(tributaria.ratio, 1);
});

void test('computeContentCoverage: subjects are sorted alphabetically (pt-BR)', () => {
  const result = computeContentCoverage([], catalog);
  assert.deepEqual(
    result.map((entry) => entry.subject),
    ['Contabilidade Geral', 'Contabilidade Tributária'],
  );
});

void test('computeContentCoverage: an empty catalog returns an empty list without throwing', () => {
  assert.deepEqual(computeContentCoverage([note(['CG-001'])], []), []);
});

void test('computeContentCoverage updates when a note gains a new link (create/vincular)', () => {
  const before = computeContentCoverage([note(['CG-001'])], catalog);
  const after = computeContentCoverage([note(['CG-001', 'CG-002'])], catalog);
  const beforeGeral = before.find((e) => e.subject === 'Contabilidade Geral')!;
  const afterGeral = after.find((e) => e.subject === 'Contabilidade Geral')!;
  assert.equal(beforeGeral.covered, 1);
  assert.equal(afterGeral.covered, 2);
});

void test('computeContentCoverage updates when a note loses a link (desvincular)', () => {
  const before = computeContentCoverage([note(['CG-001', 'CG-002'])], catalog);
  const after = computeContentCoverage([note(['CG-001'])], catalog);
  const beforeGeral = before.find((e) => e.subject === 'Contabilidade Geral')!;
  const afterGeral = after.find((e) => e.subject === 'Contabilidade Geral')!;
  assert.equal(beforeGeral.covered, 2);
  assert.equal(afterGeral.covered, 1);
});

void test('computeOverallCoverage: aggregates total/covered/ratio across all subjects', () => {
  const bySubject = computeContentCoverage([note(['CG-001', 'CT-001'])], catalog);
  const overall = computeOverallCoverage(bySubject);
  assert.equal(overall.total, 5);
  assert.equal(overall.covered, 2);
  assert.equal(overall.ratio, 2 / 5);
});

void test('computeOverallCoverage: an empty subject list yields zero without dividing by zero', () => {
  const overall = computeOverallCoverage([]);
  assert.deepEqual(overall, { total: 0, covered: 0, ratio: 0 });
});
