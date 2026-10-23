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

// APA-16: mesma classe de corrida do enqueueLessonIfNeeded (ver
// tests/apache-queue.test.ts) -- 2 chamadas sem await entre elas simulam 2
// requisições quase simultâneas ("reportar erro" clicado 2x, ou um report
// junto com o poll de 5s que também enfileira). Sem o INSERT atômico, isto
// criava 2 linhas na fila para o mesmo conteúdo.
void test('markReported sob concorrência real (2 chamadas simultâneas) cria só 1 linha na fila (APA-16)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);

  const [a, b] = await Promise.all([
    markReported(db, 'X-001', now),
    markReported(db, 'X-001', now),
  ]);
  const queued = [a, b].filter((result) => result.queued);
  assert.equal(queued.length, 1, 'só uma das 2 chamadas concorrentes deve considerar que enfileirou algo novo');
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1, 'concorrência real não deve criar uma segunda linha na fila');
  const lessonRow = sqlite
    .prepare('SELECT reported_count FROM atlas_apache_lessons WHERE content_id = ?')
    .get('X-001') as Record<string, unknown>;
  assert.equal(lessonRow.reported_count, 2, 'as 2 chamadas ainda somam o contador, só a fila não duplica');
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

void test('markReported recusa aula pendente/erro (409): nada pronto para reportar', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}')`,
  );
  const db = d1(sqlite);
  await assert.rejects(markReported(db, 'X-001', now), (error) => {
    assert.ok(error instanceof ApacheError);
    assert.equal(error.status, 409);
    return true;
  });
});

void test('markReported ignora item processando preso há mais de 5 min: não bloqueia novo pedido', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);
  const staleStart = '2026-10-20T12:00:00.000Z';
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula_manual', 'processando', 1, '${staleStart}', '${staleStart}')`,
  );
  const tenMinutesLater = '2026-10-20T12:10:00.000Z';
  await markReported(db, 'X-001', tenMinutesLater);
  const count = sqlite
    .prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue WHERE content_id = ?')
    .get('X-001') as { n: number };
  assert.equal(count.n, 2, 'processando preso (>5min) não bloqueia; um novo item é enfileirado');
});

void test('markReported não duplica quando o processando ainda está fresco (<5min)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'claude-manual', now);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula_manual', 'processando', 1, '${now}', '${now}')`,
  );
  const twoMinutesLater = '2026-10-20T12:02:00.000Z';
  await markReported(db, 'X-001', twoMinutesLater);
  const count = sqlite
    .prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue WHERE content_id = ?')
    .get('X-001') as { n: number };
  assert.equal(count.n, 1, 'processando fresco ainda bloqueia um novo pedido');
});

void test('saveLesson não salta para v2 quando a linha já existia pendente, sem object_key', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}')`,
  );
  const db = d1(sqlite);
  const bucket = fakeBucket();

  const result = await saveLesson(db, bucket, 'X-001', sampleLesson(), 'modelo-a', now);
  assert.equal(result.version, 1, 'linha pendente sem object_key ainda não teve nenhuma versão gravada');
});

void test('readLesson com bytes corrompidos no bucket lança ApacheError 500 genérico', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'modelo-a', now);
  const key = objectKeyFor(sqlite, 'X-001');
  bucket.store.set(key, new Uint8Array([1, 2, 3, 4])); // não é gzip válido

  await assert.rejects(readLesson(db, bucket, 'X-001'), (error) => {
    assert.ok(error instanceof ApacheError);
    assert.equal(error.status, 500);
    assert.equal((error as ApacheError).message, 'Aula armazenada corrompida.');
    return true;
  });
});

void test('markFailed trunca a mensagem em 200 caracteres', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  await saveLesson(db, bucket, 'X-001', sampleLesson(), 'modelo-a', now);

  await markFailed(db, 'X-001', 'x'.repeat(500), now);

  const row = sqlite
    .prepare('SELECT error_message FROM atlas_apache_lessons WHERE content_id = ?')
    .get('X-001') as { error_message: string };
  assert.equal(row.error_message.length, 200);
});
