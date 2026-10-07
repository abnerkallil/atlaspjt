// MVP-03 "Histórico" (DEC-012): o Atlas guarda a versão atual e a anterior de
// cada nota; dá para ver a anterior e restaurá-la. Roda sobre as migrations
// reais num SQLite em memória, com a semântica de batch do D1.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  capturePreviousVersion,
  getPreviousVersion,
  noteContentChanged,
  restorePreviousVersion,
} from '../lib/note-versions.js';
import {
  legacyTextToAtlasNotesContent,
  prepareAtlasNotesForSave,
} from '../lib/atlas-notes-document.js';
import {
  fetchPreviousVersion,
  previousVersionUrl,
  restorePreviousVersion as requestRestore,
} from '../components/notes-history.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..', '..');

const at = (minute: number) =>
  `2026-10-07T12:${String(minute).padStart(2, '0')}:00.000Z`;

type NoteRow = {
  title: string;
  body: string;
  content_json: string | null;
  updated_at: string;
  folder_id: string | null;
  is_private: number;
};

function setup() {
  const raw = migratedDatabase();
  const db = d1(raw);
  raw.exec(
    `INSERT INTO atlas_note_folders (id, name, created_at, updated_at) VALUES ('pasta', 'Pasta', '${at(0)}', '${at(0)}');`,
  );
  // Nota legada (content_json NULL), como as que vieram do seed de produção.
  raw.exec(
    `INSERT INTO atlas_notes (id, title, body, content_json, created_at, updated_at, folder_id, is_private)
     VALUES ('n1', 'Ativo', 'Bens e direitos', NULL, '${at(0)}', '${at(0)}', 'pasta', 1);`,
  );
  const note = () =>
    raw
      .prepare(
        'SELECT title, body, content_json, updated_at, folder_id, is_private FROM atlas_notes WHERE id = ?',
      )
      .get('n1') as NoteRow;
  const versionCount = () =>
    (raw.prepare('SELECT COUNT(*) AS n FROM atlas_note_versions').get() as { n: number }).n;
  return { raw, db, note, versionCount };
}

// O que saveNote faz no batch: captura a versão atual e depois sobrescreve.
async function save(
  db: ReturnType<typeof setup>['db'],
  title: string,
  text: string,
  now: string,
) {
  const prepared = prepareAtlasNotesForSave(legacyTextToAtlasNotesContent(text));
  await db.batch([
    capturePreviousVersion(db, 'n1', now),
    db
      .prepare(
        'UPDATE atlas_notes SET title = ?2, body = ?3, content_json = ?4, updated_at = ?5 WHERE id = ?1',
      )
      .bind('n1', title, prepared.body, prepared.contentJson, now),
  ]);
}

void test('nota nunca alterada não tem versão anterior e não há o que restaurar', async () => {
  const { db, note } = setup();
  assert.equal(await getPreviousVersion(db, 'n1'), null);
  assert.equal(await restorePreviousVersion(db, 'n1', at(5)), false);
  assert.equal(note().title, 'Ativo');
});

void test('salvar guarda o conteúdo substituído como versão anterior, só a última', async () => {
  const { db, versionCount } = setup();
  await save(db, 'Ativo v2', 'Bens, direitos e valores', at(1));
  let previous = await getPreviousVersion(db, 'n1');
  assert.deepEqual(previous, {
    noteId: 'n1',
    title: 'Ativo',
    body: 'Bens e direitos',
    savedAt: at(0),
    replacedAt: at(1),
  });

  await save(db, 'Ativo v3', 'Recursos controlados', at(2));
  previous = await getPreviousVersion(db, 'n1');
  assert.equal(previous?.title, 'Ativo v2', 'só a versão imediatamente anterior fica');
  assert.equal(previous?.savedAt, at(1));
  assert.equal(versionCount(), 1, 'duas versões no total: a atual e uma anterior');
});

void test('salvar sem mudar o conteúdo não substitui a versão anterior', () => {
  const same = { title: 'A', body: 'x', contentJson: '{"a":1}' };
  assert.equal(noteContentChanged(same, { ...same }), false);
  assert.equal(noteContentChanged(same, { ...same, title: 'B' }), true);
  assert.equal(noteContentChanged(same, { ...same, contentJson: null }), true);
});

void test('restaurar troca atual e anterior, mantém pasta e privacidade, e pode ser desfeito', async () => {
  const { db, note } = setup();
  await save(db, 'Ativo v2', 'Bens, direitos e valores', at(1));

  assert.equal(await restorePreviousVersion(db, 'n1', at(3)), true);
  const restored = note();
  assert.equal(restored.title, 'Ativo');
  assert.equal(restored.body, 'Bens e direitos');
  assert.equal(restored.updated_at, at(3));
  assert.equal(restored.folder_id, 'pasta');
  assert.equal(restored.is_private, 1);
  // A nota legada volta como documento estruturado v2 (DEC-001), nunca como
  // texto puro sobre uma nota formatada.
  const envelope = JSON.parse(restored.content_json ?? 'null') as { version: number };
  assert.equal(envelope.version, 2);

  const previous = await getPreviousVersion(db, 'n1');
  assert.equal(previous?.title, 'Ativo v2', 'a versão que estava atual virou a anterior');

  assert.equal(await restorePreviousVersion(db, 'n1', at(4)), true);
  assert.equal(note().title, 'Ativo v2', 'restaurar de novo desfaz a restauração');
});

void test('versão anterior em envelope v1 é restaurada como v2 com a mesma projeção', async () => {
  const { raw, db, note } = setup();
  const v1 = JSON.stringify({
    format: 'atlas-notes',
    version: 1,
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Passivo' }] }] },
  });
  raw.exec(
    `INSERT INTO atlas_note_versions (note_id, title, body, content_json, saved_at, replaced_at)
     VALUES ('n1', 'Antiga', 'Passivo', '${v1}', '${at(0)}', '${at(1)}');`,
  );
  assert.equal(await restorePreviousVersion(db, 'n1', at(2)), true);
  const restored = note();
  assert.equal(restored.body, 'Passivo');
  assert.equal((JSON.parse(restored.content_json ?? 'null') as { version: number }).version, 2);
});

void test('excluir a nota apaga a versão anterior junto', async () => {
  const { raw, db, versionCount } = setup();
  await save(db, 'Ativo v2', 'Bens, direitos e valores', at(1));
  raw.exec("DELETE FROM atlas_notes WHERE id = 'n1';");
  assert.equal(versionCount(), 0);
});

void test('editor busca e restaura a versão anterior pela rota da nota', async () => {
  const calls: { url: string; method?: string }[] = [];
  const fake = (body: unknown, status = 200) =>
    async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method });
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    };
  assert.equal(previousVersionUrl('a b'), '/api/notes/a%20b/previous-version');
  assert.equal(await fetchPreviousVersion('n1', fake({ version: null })), null);
  const note = await requestRestore<{ id: string }>('n1', fake({ note: { id: 'n1' } }));
  assert.equal(note.id, 'n1');
  assert.equal(calls[1]?.method, 'POST');
  await assert.rejects(
    requestRestore('n1', fake({ error: 'Esta nota não tem versão anterior.' }, 404)),
    /não tem versão anterior/,
  );
});

void test('saveNote captura a versão anterior antes de sobrescrever, e só quando o conteúdo muda', () => {
  const store = readFileSync(path.join(repoRoot, 'lib', 'notes-store.ts'), 'utf8');
  const capture = store.indexOf('capturePreviousVersion(db, input.id, now)');
  const upsert = store.indexOf('INSERT INTO atlas_notes (id, title');
  assert.ok(capture > 0 && capture < upsert, 'a captura entra no batch antes do upsert da nota');
  assert.match(store, /contentChanged \? \[capturePreviousVersion/);

  const workspace = readFileSync(path.join(repoRoot, 'components', 'notes-workspace.tsx'), 'utf8');
  assert.match(workspace, /Versão anterior/);
  assert.match(workspace, /Restaurar esta versão/);
});
