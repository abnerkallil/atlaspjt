// QUEST-006 QA — structural regression guard for the "Todas as notas" panel.
//
// Why this file exists: `notes-workspace.tsx` is a React client component
// (imports @tiptap/react, lucide-react, etc.) and this sandbox has no
// network access to install a DOM test runner (jsdom / @testing-library),
// so it cannot be rendered or interacted with here. What CAN be checked
// without a DOM is the *source itself* — this file reads notes-workspace.tsx
// and app/globals.css as plain text and asserts the specific structural
// invariants the Task Contract's Acceptance Criteria depend on:
//
//   - the new panel lives as a full-width sibling BELOW the 3-column grid
//     (not nested inside it);
//   - the left column keeps only Favoritos + Notas recentes, with the old
//     search/full-list markup gone;
//   - the panel's search/filter/sort controls exist with the right
//     aria-labels, and clicking a panel item reuses the existing openNote()
//     handler (so "abre no editor, como já acontece" is structurally true,
//     not a re-implementation that could drift);
//   - the CSS has a narrow-viewport rule set for the panel's controls/list
//     (the "responsivo em tela estreita" requirement) and a scrolling
//     container for "muitas notas" rather than unbounded growth.
//
// This is a regression guard, not a substitute for real browser/DOM
// testing — see the accompanying QA report for what still needs manual or
// jsdom-based verification in an environment that can install those deps.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This file is compiled by tsc into `<outDir>/tests/...` and run from
// there, two levels below the repo root (outDir mirrors rootDir="."), so
// the sources it inspects are reached with `../..`, not `..`.
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..', '..');
const workspaceSource = readFileSync(
  path.join(repoRoot, 'components', 'notes-workspace.tsx'),
  'utf8',
);
const cssSource = readFileSync(
  path.join(repoRoot, 'app', 'globals.css'),
  'utf8',
);

function extractBalanced(
  source: string,
  startNeedle: string,
  tagName: string,
): string {
  const start = source.indexOf(startNeedle);
  assert.ok(start !== -1, `expected to find "${startNeedle}" in source`);
  const closeTag = `</${tagName}>`;
  const openTag = `<${tagName}`;
  let depth = 0;
  let cursor = start;
  while (true) {
    const nextOpen = source.indexOf(openTag, cursor);
    const nextClose = source.indexOf(closeTag, cursor);
    assert.ok(nextClose !== -1, `unbalanced <${tagName}> starting at ${start}`);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + openTag.length;
    } else {
      depth -= 1;
      cursor = nextClose + closeTag.length;
      if (depth === 0) return source.slice(start, cursor);
    }
  }
}

function extractCssBlock(source: string, selectorNeedle: string): string {
  const selectorStart = source.indexOf(selectorNeedle);
  assert.ok(selectorStart !== -1, `expected to find "${selectorNeedle}" in globals.css`);
  const braceStart = source.indexOf('{', selectorStart);
  assert.ok(braceStart !== -1, `expected "{" after "${selectorNeedle}"`);
  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(braceStart, i + 1);
    }
  }
  throw new Error(`unbalanced braces for "${selectorNeedle}"`);
}

const leftColumn = extractBalanced(
  workspaceSource,
  '<aside className="notes-index"',
  'aside',
);
const allNotesPanel = extractBalanced(
  workspaceSource,
  '<section className="notes-all-panel"',
  'section',
);

void test('structure: the left column ("notes-index") no longer renders the old search box', () => {
  assert.ok(
    !leftColumn.includes('aria-label="Pesquisar notas"'),
    'left column should not contain the removed "Pesquisar notas" search input',
  );
  assert.ok(
    !leftColumn.includes('Pesquisar título ou texto'),
    'left column should not contain the removed search placeholder',
  );
});

void test('structure: the left column no longer renders the old full notes list', () => {
  // The old code rendered the complete list with `notes.map((note) => (`.
  // `recentNotes.map(` / `favorites.map(` are still expected and must not
  // be confused with it (case-sensitive check avoids that false positive).
  assert.ok(
    !leftColumn.includes('notes.map('),
    'left column should not map over the full unfiltered `notes` array anymore',
  );
});

void test('structure: the left column still has the unchanged Favoritos toggle', () => {
  assert.match(leftColumn, /Favoritos/);
  assert.match(leftColumn, /favorites-entry/);
});

void test('structure: the left column still has the unchanged "Notas recentes" block', () => {
  assert.match(leftColumn, /Notas recentes/);
  assert.match(leftColumn, /recentNotes\.map\(/);
});

void test('structure: the "Todas as notas" panel is a sibling AFTER the 3-column grid, not nested inside it', () => {
  // In the shipped source, the 3-column grid's closing </div> is followed
  // immediately by the new <section className="notes-all-panel">. If a
  // future edit nested the panel inside the grid instead, this sequence
  // would no longer match.
  assert.match(
    workspaceSource,
    /<\/aside>\s*<\/div>\s*<section className="notes-all-panel"/,
    'expected the notes-all-panel section to sit right after the notes-workspace grid closes',
  );
});

void test('structure: the panel has a labeled search input, linked-content filter and sort control', () => {
  assert.match(allNotesPanel, /aria-label="Pesquisar em todas as notas"/);
  assert.match(allNotesPanel, /aria-label="Filtrar por conteúdo vinculado"/);
  assert.match(allNotesPanel, /aria-label="Ordenar notas"/);
});

void test('structure: the sort control exposes all 4 required sort options', () => {
  assert.match(allNotesPanel, /value="date-desc"/);
  assert.match(allNotesPanel, /value="date-asc"/);
  assert.match(allNotesPanel, /value="title-asc"/);
  assert.match(allNotesPanel, /value="title-desc"/);
});

void test('structure: clicking a panel item reuses the existing openNote() handler (no parallel re-implementation)', () => {
  assert.match(allNotesPanel, /onClick=\{\(\) => openNote\(note\)\}/);
});

void test('structure: the panel drives its list from applyNotesPanelFilters (the tested pure module), not ad-hoc filtering', () => {
  assert.match(
    workspaceSource,
    /applyNotesPanelFilters\(notes,\s*\{[\s\S]*?search:\s*allNotesQuery/,
  );
  assert.match(workspaceSource, /from '\.\/notes-panel-filters'/);
});

void test('structure: the panel renders a distinct empty state (covers the "zero notas" case)', () => {
  assert.match(allNotesPanel, /notes-empty/);
  assert.match(allNotesPanel, /filteredAllNotes\.length/);
});

void test('structure: reusing "note-list-item" for panel rows, per the UX Constraint to reuse the existing item pattern', () => {
  assert.match(allNotesPanel, /className=\{?\s*[\s\S]*?note-list-item/);
});

void test('css: the panel list scrolls instead of growing unbounded (covers "muitas notas")', () => {
  const rule = extractCssBlock(cssSource, '.notes-all-list {');
  assert.match(rule, /overflow-y:\s*auto/);
  assert.match(rule, /max-height:\s*520px/);
});

void test('css: narrow-viewport media query collapses the panel controls to a single column', () => {
  const narrowBlock = extractCssBlock(cssSource, '@media (max-width: 620px)');
  assert.match(
    narrowBlock,
    /\.notes-all-controls\s*\{[^}]*flex-direction:\s*column/,
    'expected the search + 2 filters to stack vertically under 620px',
  );
  assert.match(
    narrowBlock,
    /\.notes-all-list\s*\{[^}]*grid-template-columns:\s*1fr/,
    'expected the list to fall back to a single column under 620px',
  );
});

void test('css: the panel list grid never sets a min column width wider than the 620px breakpoint itself', () => {
  // A `minmax(Npx, 1fr)` wider than the breakpoint would force horizontal
  // overflow on narrow screens — the specific failure mode the Acceptance
  // Criteria call out ("filtros não quebram o layout").
  const wideRule = extractCssBlock(cssSource, '.notes-all-list {');
  const match = wideRule.match(/minmax\((\d+)px/);
  assert.ok(match, 'expected a minmax(...) column width on .notes-all-list');
  assert.ok(
    Number(match![1]) < 620,
    `minmax base of ${match![1]}px is wider than the 620px breakpoint`,
  );
});
