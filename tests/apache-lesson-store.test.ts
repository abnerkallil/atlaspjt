// APA-05: storage R2 (gzip) + status/versão em D1 (atlas_apache_lessons) da
// aula base do Apache.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import {
  lessonObjectKey,
  markFailed,
  markReported,
  readLesson,
  saveLesson,
  type R2Like,
} from '../lib/apache/lesson-store.js';
import type { ApacheLesson } from '../lib/apache/schema.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-20T12:00:00.000Z';

function seedContent(db: ReturnType<typeof migratedDatabase>, contentId: string) {
  db.exec(`
    INSERT INTO atlas_roadmaps (id, title, created_at, updated_at) VALUES ('rm', 'Roadmap', '${now}', '${now}');
    INSERT INTO atlas_phases (id, roadmap_id, position, title) VALUES ('f1', 'rm', 1, 'Base');
    INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('cg', 'f1', 1, 'Contabilidade Geral');
    INSERT INTO atlas_contents (id, discipline_id, position, title) VALUES ('${contentId}', 'cg', 1, 'Conceitos');
  `);
}

function fakeBucket(): R2Like & { store: Map<string, Uint8Array> } {
  const store = new Map<string, Uint8Array>();
  return {
    store,
    async put(key, bytes) {
      store.set(key, bytes);
    },
    async get(key) {
      const bytes = store.get(key);
      if (!bytes) return null;
      return { body: new Blob([bytes.slice().buffer]).stream() };
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

function sampleLesson(resumo = 'resumo v1'): ApacheLesson {
  return {
    v: 1,
    obj: 'Entender o patrimônio líquido',
    cc: [{ id: 'c1', nome: 'Patrimônio líquido', def: 'Ativo menos passivo.' }],
    rl: [],
    fm: [],
    ex: [],
    pg: [],
    rs: resumo,
  };
}

function objectKeyFor(db: ReturnType<typeof migratedDatabase>, contentId: string): string {
  const row = db
    .prepare('SELECT object_key FROM atlas_apache_lessons WHERE content_id = ?')
    .get(contentId) as { object_key: string } | undefined;
  if (!row) throw new Error('linha não encontrada');
  return row.object_key;
}

void test('saveLesson grava gzip no bucket e cria a linha em D1 com version 1', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();

  const result = await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);
  assert.equal(result.version, 1);
  assert.equal(result.objectKey, lessonObjectKey('X-001', 1));
  assert.equal(bucket.store.size, 1);

  const row = sqlite
    .prepare('SELECT status, version, model, object_key FROM atlas_apache_lessons WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(row.status, 'gerada');
  assert.equal(row.version, 1);
  assert.equal(row.model, 'claude-manual');
  assert.equal(row.object_key, lessonObjectKey('X-001', 1));
});

void test('round-trip: grava, lê de volta igual ao que foi gravado', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();

  const lesson = sampleLesson();
  await saveLesson(db, bucket, 'X-001', lesson, '@cf/meta/llama-3.3-70b-instruct-fp8-fast', now);
  const read = await readLesson(db, bucket, 'X-001');
  assert.deepEqual(read, { lesson, version: 1 });
});

void test('regrava versão 2: a versão 1 some do bucket e version/object_key avançam', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();

  await saveLesson(db, bucket, 'X-001', sampleLesson('v1'), 'modelo-a', now);
  const v1Key = objectKeyFor(sqlite, 'X-001');
  assert.ok(bucket.store.has(v1Key));

  const later = '2026-10-20T13:00:00.000Z';
  const result = await saveLesson(db, bucket, 'X-001', sampleLesson('v2'), 'modelo-b', later);
  assert.equal(result.version, 2);
  assert.equal(bucket.store.has(v1Key), false, 'versão 1 deve ser apagada do bucket, sem histórico');
  assert.equal(bucket.store.size, 1);

  const read = await readLesson(db, bucket, 'X-001');
  assert.equal(read?.version, 2);
  assert.equal(read?.lesson.rs, 'v2');
});

void test('readLesson devolve null quando a aula não está pronta (pendente/erro)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();

  assert.equal(await readLesson(db, bucket, 'X-001'), null, 'sem nenhuma linha ainda');

  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'modelo-a', now);
  await markFailed(db, 'X-001', 'erro de geração', '2026-10-20T13:00:00.000Z');
  assert.equal(await readLesson(db, bucket, 'X-001'), null, 'status erro não deve ser exibido');
});

void test('markFailed em conteúdo sem aula lança ApacheError 404', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  await assert.rejects(markFailed(db, 'X-001', 'erro', now), (error) => {
    assert.ok(error instanceof ApacheError);
    assert.equal(error.status, 404);
    return true;
  });
});

void test('markReported marca reportada, soma reported_count e enfileira kind=aula_manual para model claude-manual', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);

  await markReported(db, 'X-001', '2026-10-20T13:00:00.000Z');

  const lessonRow = sqlite
    .prepare('SELECT status, reported_count FROM atlas_apache_lessons WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(lessonRow.status, 'reportada');
  assert.equal(lessonRow.reported_count, 1);

  const queueRow = sqlite
    .prepare('SELECT kind, status FROM atlas_apache_queue WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(queueRow.kind, 'aula_manual');
  assert.equal(queueRow.status, 'pendente');
});

void test('markReported enfileira kind=aula para aula gerada por IA', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), '@cf/meta/llama-3.3-70b-instruct-fp8-fast', now);

  await markReported(db, 'X-001', '2026-10-20T13:00:00.000Z');

  const queueRow = sqlite
    .prepare('SELECT kind FROM atlas_apache_queue WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(queueRow.kind, 'aula');
});

void test('markReported não duplica a fila se já existe um pedido pendente do mesmo kind', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);

  await markReported(db, 'X-001', '2026-10-20T13:00:00.000Z');
  await markReported(db, 'X-001', '2026-10-20T14:00:00.000Z');

  const count = sqlite
    .prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue WHERE content_id = ?')
    .get('X-001') as { n: number };
  assert.equal(count.n, 1, 'segundo report não deve duplicar o item na fila');

  const lessonRow = sqlite
    .prepare('SELECT reported_count FROM atlas_apache_lessons WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(lessonRow.reported_count, 2, 'o contador soma mesmo sem duplicar a fila');
});

void test('markReported em conteúdo sem aula lança ApacheError 404', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  await assert.rejects(markReported(db, 'X-001', now), (error) => {
    assert.ok(error instanceof ApacheError);
    assert.equal(error.status, 404);
    return true;
  });
});
