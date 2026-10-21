// APA-07: fila, geração lazy e diff na leitura.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import type { AiLike } from '../lib/apache/lesson-writer.js';
import { LESSON_MODEL } from '../lib/apache/lesson-writer.js';
import { readLesson, type R2Like } from '../lib/apache/lesson-store.js';
import { recordNeuronUsage } from '../lib/apache/neuron-meter.js';
import {
  enqueueLessonIfNeeded,
  findQueueItemsPendingSinceLastReset,
  handleGetAula,
  processQueueItem,
} from '../lib/apache/queue.js';
import type { ApacheLesson } from '../lib/apache/schema.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-21T12:00:00.000Z';

function seedContent(sqlite: ReturnType<typeof migratedDatabase>, contentId: string) {
  sqlite.exec(`
    INSERT OR IGNORE INTO atlas_roadmaps (id, title, created_at, updated_at) VALUES ('rm', 'Roadmap', '${now}', '${now}');
    INSERT OR IGNORE INTO atlas_phases (id, roadmap_id, position, title) VALUES ('f1', 'rm', 1, 'Base');
    INSERT OR IGNORE INTO atlas_disciplines (id, phase_id, position, title) VALUES ('cg', 'f1', 1, 'Contabilidade Geral');
    INSERT INTO atlas_contents (id, discipline_id, position, title, keywords) VALUES ('${contentId}', 'cg', 1, 'Patrimônio líquido', 'PL');
  `);
}

function queueRow(sqlite: ReturnType<typeof migratedDatabase>, id: string) {
  return sqlite
    .prepare('SELECT id, content_id, kind, status, attempts, started_at, last_error FROM atlas_apache_queue WHERE id = ?')
    .get(id) as
    | { id: string; content_id: string; kind: string; status: string; attempts: number; started_at: string | null; last_error: string | null }
    | undefined;
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

function sampleLesson(): ApacheLesson {
  return {
    v: 1,
    obj: 'Entender o patrimônio líquido',
    cc: [{ id: 'c1', nome: 'Patrimônio líquido', def: 'Ativo menos passivo.' }],
    rl: [],
    fm: [],
    ex: [],
    pg: [],
    rs: 'resumo',
  };
}

function fakeAi(run: AiLike['run']): AiLike {
  return { run };
}

function recordingScheduler() {
  const scheduled: Promise<void>[] = [];
  return { scheduled, schedule: (p: Promise<void>) => scheduled.push(p) };
}

void test('enqueueLessonIfNeeded cria 1 item pendente quando a fila está vazia', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);

  const id = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.ok(id);
  const row = queueRow(sqlite, id!);
  assert.equal(row?.status, 'pendente');
  assert.equal(row?.kind, 'aula');
});

void test('enqueueLessonIfNeeded não duplica quando já existe um pendente saudável (dedupe)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);

  const first = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  const second = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.equal(first, second);
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1);
});

void test('enqueueLessonIfNeeded não cria nada quando já existe um processando saudável', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 0, '${now}', '${now}')`,
  );

  const result = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.equal(result, null);
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1);
});

void test('enqueueLessonIfNeeded recupera um item preso em processando (started_at > 5min) e o devolve como pendente', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const staleStart = new Date(new Date(now).getTime() - 10 * 60 * 1000).toISOString();
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 1, '${staleStart}', '${staleStart}')`,
  );

  const result = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.equal(result, 'q1');
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'pendente');
  assert.equal(row?.attempts, 2);
  assert.equal(row?.started_at, null);
});

void test('depois de 3 tentativas presas, o item vira erro e um item novo (attempts=0) é criado em seu lugar', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const staleStart = new Date(new Date(now).getTime() - 10 * 60 * 1000).toISOString();
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 2, '${staleStart}', '${staleStart}')`,
  );

  const result = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.ok(result && result !== 'q1', 'um item erro não bloqueia o dedupe — um novo item deve ser criado');
  const old = queueRow(sqlite, 'q1');
  assert.equal(old?.status, 'erro');
  assert.equal(old?.attempts, 3);
  const fresh = queueRow(sqlite, result!);
  assert.equal(fresh?.status, 'pendente');
  assert.equal(fresh?.attempts, 0);
});

void test('findQueueItemsPendingSinceLastReset só encontra itens pendentes criados antes da meia-noite UTC mais recente', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  seedContent(sqlite, 'X-002');
  sqlite.exec(`
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('old', 'X-001', 'aula', 'pendente', 0, '2026-10-20T23:00:00.000Z');
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('today', 'X-002', 'aula', 'pendente', 0, '2026-10-21T01:00:00.000Z');
  `);
  const db = d1(sqlite);

  const results = await findQueueItemsPendingSinceLastReset(db, now);
  assert.deepEqual(results.map((r) => r.id), ['old']);
});

void test('processQueueItem deixa pendente sem chamar a IA quando o orçamento de neurons já passou de 90%', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  await recordNeuronUsage(db, 9_500, now);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
  );
  let called = false;
  const ai = fakeAi(async () => {
    called = true;
    return { response: JSON.stringify(sampleLesson()) };
  });

  await processQueueItem(db, fakeBucket(), ai, 'q1', 'X-001', now);
  assert.equal(called, false);
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'pendente');
});

void test('processQueueItem gera e marca concluido em caso de sucesso', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
  );
  const lesson = sampleLesson();
  const ai = fakeAi(async (model) => {
    assert.equal(model, LESSON_MODEL);
    return { response: JSON.stringify(lesson) };
  });
  const bucket = fakeBucket();

  await processQueueItem(db, bucket, ai, 'q1', 'X-001', now);
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'concluido');
  const stored = await readLesson(db, bucket, 'X-001');
  assert.deepEqual(stored?.lesson, lesson);
});

void test('processQueueItem deixa pendente (não erro) quando o writer lança 429 por cota esgotada', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
  );
  const ai = fakeAi(async () => {
    throw new Error('3036: Rate limit exceeded for model, retry later (HTTP code: 429)');
  });

  await processQueueItem(db, fakeBucket(), ai, 'q1', 'X-001', now);
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'pendente');
});

void test('processQueueItem marca erro quando o writer desiste de verdade (502)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
  );
  const ai = fakeAi(async () => ({ response: 'não é json' }));

  await processQueueItem(db, fakeBucket(), ai, 'q1', 'X-001', now);
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'erro');
  assert.ok(row?.last_error && row.last_error.length > 0);
});

void test('handleGetAula na primeira chamada cria a linha pendente, enfileira e agenda o processamento', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  const ai = fakeAi(async () => ({ response: JSON.stringify(sampleLesson()) }));
  const { scheduled, schedule } = recordingScheduler();

  const response = await handleGetAula(db, bucket, ai, 'X-001', now, schedule);
  assert.deepEqual(response, { status: 'pendente' });
  assert.equal(scheduled.length, 1);
  await scheduled[0];

  const stored = await readLesson(db, bucket, 'X-001');
  assert.ok(stored, 'o processamento agendado deveria ter gerado a aula');
});

void test('handleGetAula não enfileira de novo numa segunda chamada enquanto ainda está pendente', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  let calls = 0;
  const ai = fakeAi(async () => {
    calls += 1;
    return new Promise(() => {}); // nunca resolve: simula geração em andamento
  });
  const { schedule } = recordingScheduler();

  await handleGetAula(db, bucket, ai, 'X-001', now, schedule);
  await handleGetAula(db, bucket, ai, 'X-001', now, schedule);
  assert.equal(calls, 1, 'a segunda chamada não deveria enfileirar/disparar outra geração');
});

void test('handleGetAula responde a aula já gerada, sem chamar a IA', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  const lesson = sampleLesson();
  const ai = fakeAi(async () => ({ response: JSON.stringify(lesson) }));
  const { scheduled, schedule } = recordingScheduler();

  await handleGetAula(db, bucket, ai, 'X-001', now, schedule);
  assert.equal(scheduled.length, 1);
  await scheduled[0]; // processa de verdade o único item agendado

  let aiCalledAgain = false;
  const readAi = fakeAi(async () => {
    aiCalledAgain = true;
    return { response: JSON.stringify(lesson) };
  });
  const { schedule: readSchedule } = recordingScheduler();
  const response = await handleGetAula(db, bucket, readAi, 'X-001', now, readSchedule);

  assert.equal(aiCalledAgain, false);
  assert.equal(response.status, 'gerada');
  assert.deepEqual(response.lesson?.objetivo, lesson.obj);
});

void test('handleGetAula responde erro com a mensagem guardada quando a aula está em erro', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, error_message, updated_at)
     VALUES ('l1', 'X-001', 'erro', 1, 'falha real', '${now}')`,
  );
  const db = d1(sqlite);
  const { schedule } = recordingScheduler();

  const response = await handleGetAula(db, fakeBucket(), fakeAi(async () => ({})), 'X-001', now, schedule);
  assert.deepEqual(response, { status: 'erro', errorMessage: 'falha real' });
});

void test('handleGetAula lança 404 para conteúdo inexistente', async () => {
  const sqlite = migratedDatabase();
  const db = d1(sqlite);
  const { schedule } = recordingScheduler();

  await assert.rejects(
    handleGetAula(db, fakeBucket(), fakeAi(async () => ({})), 'X-999', now, schedule),
    (error) => {
      assert.ok(error instanceof ApacheError);
      assert.equal(error.status, 404);
      return true;
    },
  );
});

void test('handleGetAula sem bindings de AI/R2 (dev sem APACHE_AI_DEV=1) só lê status, sem agendar nada', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const { scheduled, schedule } = recordingScheduler();

  const response = await handleGetAula(db, null, null, 'X-001', now, schedule);
  assert.deepEqual(response, { status: 'pendente' });
  assert.equal(scheduled.length, 0);
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 0, 'sem ai/bucket não deve nem criar o item na fila');
});
