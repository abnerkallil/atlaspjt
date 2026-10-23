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
  handleGetAula,
  handleLessonQueueBatch,
  handleReportAula,
  processQueueItem,
  sweepQueue,
  type LessonQueueMessage,
  type QueueLike,
  type QueueMessageLike,
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

type QueueRowFixture = {
  id: string;
  content_id: string;
  kind: string;
  status: string;
  attempts: number;
  started_at: string | null;
  last_error: string | null;
  created_at: string;
};

function queueRow(sqlite: ReturnType<typeof migratedDatabase>, id: string): QueueRowFixture | undefined {
  return sqlite
    .prepare('SELECT id, content_id, kind, status, attempts, started_at, last_error, created_at FROM atlas_apache_queue WHERE id = ?')
    .get(id) as QueueRowFixture | undefined;
}

function lessonStatus(sqlite: ReturnType<typeof migratedDatabase>, contentId: string): string | undefined {
  const row = sqlite.prepare('SELECT status FROM atlas_apache_lessons WHERE content_id = ?').get(contentId) as
    | { status: string }
    | undefined;
  return row?.status;
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

// Fake do binding `Queue` (produtor) — só registra as mensagens enviadas,
// sem processar nada (quem processa de verdade é o consumer, testado
// separadamente com handleLessonQueueBatch abaixo).
function fakeQueue(): QueueLike & { sent: LessonQueueMessage[] } {
  const sent: LessonQueueMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

type FakeMessage = QueueMessageLike & { acked: boolean; retried: boolean };

function fakeMessage(body: LessonQueueMessage): FakeMessage {
  const message: FakeMessage = {
    body,
    acked: false,
    retried: false,
    ack() {
      message.acked = true;
    },
    retry() {
      message.retried = true;
    },
  };
  return message;
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

// APA-16: a chamada sequencial acima (await, depois await) nunca exercitou a
// janela real entre a leitura e o INSERT — as duas chamadas aqui saem juntas
// (sem await entre elas) pra simular 2 requisições HTTP quase simultâneas ao
// mesmo content_id (ex.: 2 abas abertas no mesmo conteúdo). Sem o INSERT
// atômico (`WHERE NOT EXISTS`) do enqueueLessonIfNeeded, isto criava 2 linhas
// e as duas IDs retornadas eram diferentes — regressão real encontrada
// escrevendo este teste, corrigida no próprio enqueueLessonIfNeeded.
void test('enqueueLessonIfNeeded sob concorrência real (2 chamadas simultâneas) cria só 1 linha na fila (APA-16)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);

  const [a, b] = await Promise.all([
    enqueueLessonIfNeeded(db, 'X-001', 'aula', now),
    enqueueLessonIfNeeded(db, 'X-001', 'aula', now),
  ]);
  // Exatamente 1 das 2 chamadas cria o item (a outra perde a corrida e
  // devolve null -- nunca "adota" o item da vencedora, ver enqueueLessonIfNeeded).
  const ids = [a, b].filter((id): id is string => id !== null);
  assert.equal(ids.length, 1, 'só uma das 2 chamadas concorrentes deve criar/devolver um id');
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1, 'concorrência real não deve criar uma segunda linha para o mesmo content_id+kind');
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

void test('depois de 3 tentativas presas, o item e a aula viram erro — sem reenfileirar', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'gerando', 1, '${now}')`,
  );
  const db = d1(sqlite);
  const staleStart = new Date(new Date(now).getTime() - 10 * 60 * 1000).toISOString();
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 2, '${staleStart}', '${staleStart}')`,
  );

  const result = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.equal(result, null, 'um item erro é terminal — nada novo deve ser criado nem devolvido para processar');
  const row = queueRow(sqlite, 'q1');
  assert.equal(row?.status, 'erro');
  assert.equal(row?.attempts, 3);
  assert.equal(lessonStatus(sqlite, 'X-001'), 'erro', 'a aula precisa virar erro, senão fica pendente para sempre');
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1, 'não deve ter criado um item novo');
});

void test('enqueueLessonIfNeeded não reprocessa (nem duplica) um item adiado por cota — só a varredura pós-reset pode', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, last_error, created_at)
     VALUES ('q1', 'X-001', 'aula', 'pendente', 0, 'cota_diaria_esgotada', '${now}')`,
  );

  const result = await enqueueLessonIfNeeded(db, 'X-001', 'aula', now);
  assert.equal(result, null, 'adiado por cota: nem reprocessa agora, nem cria um item novo a cada poll');
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 1);
});

void test('sweepQueue só agenda itens pendentes criados antes da meia-noite UTC mais recente (kind=aula e enriquecimento, nunca aula_manual)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  seedContent(sqlite, 'X-002');
  seedContent(sqlite, 'X-003');
  seedContent(sqlite, 'X-004');
  sqlite.exec(`
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('old', 'X-001', 'aula', 'pendente', 0, '2026-10-20T23:00:00.000Z');
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('today', 'X-002', 'aula', 'pendente', 0, '2026-10-21T01:00:00.000Z');
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('old-enrich', 'X-003', 'enriquecimento', 'pendente', 0, '2026-10-20T20:00:00.000Z');
    INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
      VALUES ('old-manual', 'X-004', 'aula_manual', 'pendente', 0, '2026-10-20T20:00:00.000Z');
  `);
  const db = d1(sqlite);
  const queue = fakeQueue();

  await sweepQueue(db, queue, now);
  assert.deepEqual(
    new Set(queue.sent.map((m) => m.queueId)),
    new Set(['old', 'old-enrich']),
    'kind=aula e kind=enriquecimento antigos são retomados; aula_manual nunca (fora do escopo da IA)',
  );
  assert.equal(queueRow(sqlite, 'today')?.status, 'pendente', 'ainda não passou da meia-noite seguinte');
  assert.equal(queueRow(sqlite, 'old-manual')?.status, 'pendente', 'kind=aula_manual nunca é tocado por esta varredura');
});

void test('sweepQueue recupera processando preso há mais de 5 min (independente de created_at)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const staleStart = new Date(new Date(now).getTime() - 10 * 60 * 1000).toISOString();
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 0, '${staleStart}', '${now}')`,
  );
  const queue = fakeQueue();

  await sweepQueue(db, queue, now);
  assert.deepEqual(queue.sent, [{ queueId: 'q1', contentId: 'X-001' }]);
  assert.equal(queueRow(sqlite, 'q1')?.status, 'pendente', 'recuperado para pendente — quem reivindica de novo é o consumer');
  assert.equal(queueRow(sqlite, 'q1')?.attempts, 1);
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
  assert.equal(row?.last_error, 'cota_diaria_esgotada');
  assert.equal(row?.created_at, now, 'created_at precisa virar "agora", senão a varredura reenvia a cada poll');
});

void test('deferForQuota atualiza created_at — sweepQueue não reenvia o item adiado no mesmo dia a cada poll', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  await recordNeuronUsage(db, 9_500, now);
  // Item criado ANTES da meia-noite de hoje (ontem) — é esse o caso que
  // revelava o bug: sem atualizar created_at no adiamento, a linha
  // continuava com created_at de ontem, e o filtro de sweepQueue
  // (created_at < meia-noite mais recente) a pegava de novo em todo poll.
  const yesterday = '2026-10-20T23:00:00.000Z';
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${yesterday}')`,
  );
  const ai = fakeAi(async () => ({ response: JSON.stringify(sampleLesson()) }));

  await processQueueItem(db, fakeBucket(), ai, 'q1', 'X-001', now);
  assert.equal(queueRow(sqlite, 'q1')?.last_error, 'cota_diaria_esgotada');

  // Poll seguinte, ainda no mesmo dia (mesma meia-noite de referência): a
  // varredura não deve mandar o item pra fila de novo.
  const laterSameDay = '2026-10-21T12:05:00.000Z';
  const queue = fakeQueue();
  await sweepQueue(db, queue, laterSameDay);
  assert.deepEqual(queue.sent, [], 'adiado por cota hoje — não deve ser reenviado antes da próxima meia-noite UTC');
});

void test('processQueueItem não processa 2x o mesmo item (claim atômico: WHERE status=pendente)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
     VALUES ('q1', 'X-001', 'aula', 'processando', 0, '${now}', '${now}')`,
  );
  let calls = 0;
  const ai = fakeAi(async () => {
    calls += 1;
    return { response: JSON.stringify(sampleLesson()) };
  });

  await processQueueItem(db, fakeBucket(), ai, 'q1', 'X-001', now);
  assert.equal(calls, 0, 'o item já estava processando (não pendente) — o claim não deve pegá-lo');
});

void test('processQueueItem gera, marca concluido e passa a aula por gerando no caminho', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
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
  assert.equal(lessonStatus(sqlite, 'X-001'), 'gerada');
  const stored = await readLesson(db, bucket, 'X-001');
  assert.deepEqual(stored?.lesson, lesson);
});

void test('processQueueItem adia (não marca erro) e devolve a aula a pendente quando o writer lança 429 por cota esgotada', async () => {
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
  assert.equal(row?.last_error, 'cota_diaria_esgotada');
  assert.equal(lessonStatus(sqlite, 'X-001'), 'pendente', 'não deve ficar travada em gerando depois do adiamento');
});

void test('processQueueItem marca erro (item e aula) quando o writer desiste de verdade (502)', async () => {
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
  assert.equal(lessonStatus(sqlite, 'X-001'), 'erro');
});

void test('handleGetAula na primeira chamada cria a linha pendente e manda 1 mensagem pra fila', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  const queue = fakeQueue();

  const response = await handleGetAula(db, bucket, queue, 'X-001', now);
  assert.deepEqual(response, { status: 'pendente' });
  assert.equal(queue.sent.length, 1);
  assert.equal(queue.sent[0].contentId, 'X-001');

  // Simula o consumer (worker-entry.ts) recebendo a mensagem que o produtor
  // acima mandou — é ele que de fato chama a IA e gera a aula.
  const ai = fakeAi(async () => ({ response: JSON.stringify(sampleLesson()) }));
  const message = fakeMessage(queue.sent[0]);
  await handleLessonQueueBatch({ messages: [message] }, db, bucket, ai);
  assert.equal(message.acked, true);

  const stored = await readLesson(db, bucket, 'X-001');
  assert.ok(stored, 'o consumer deveria ter gerado a aula');
});

void test('handleGetAula não manda nada pra fila quando já existe um processando saudável para o conteúdo', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'gerando', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, started_at, created_at)
       VALUES ('q1', 'X-001', 'aula', 'processando', 0, '${now}', '${now}')`,
  );
  const queue = fakeQueue();

  const response = await handleGetAula(db, bucket, queue, 'X-001', now);
  assert.deepEqual(response, { status: 'pendente' });
  assert.equal(queue.sent.length, 0, 'já existe um processando saudável — não deve mandar nada novo pra fila');
});

void test('handleGetAula responde a aula já gerada, sem tocar a fila', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);
  const bucket = fakeBucket();
  const lesson = sampleLesson();
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, model, object_key, generated_at, reported_count, updated_at)
     VALUES ('l1', 'X-001', 'gerada', 1, '${LESSON_MODEL}', 'apache/aulas/X-001/v1.json.gz', '${now}', 0, '${now}')`,
  );
  await bucket.put(
    'apache/aulas/X-001/v1.json.gz',
    await (async () => {
      const stream = new Blob([new TextEncoder().encode(JSON.stringify(lesson))])
        .stream()
        .pipeThrough(new CompressionStream('gzip'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    })(),
  );
  const queue = fakeQueue();

  const response = await handleGetAula(db, bucket, queue, 'X-001', now);

  assert.equal(queue.sent.length, 0);
  assert.equal(response.status, 'gerada');
  assert.deepEqual(response.lesson?.objetivo, lesson.obj);
});

void test('handleGetAula responde erro com uma mensagem genérica, nunca o error_message guardado (Gate APA-14 item 8)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, error_message, updated_at)
     VALUES ('l1', 'X-001', 'erro', 1, 'stack trace interno sensível', '${now}')`,
  );
  const db = d1(sqlite);

  const response = await handleGetAula(db, fakeBucket(), fakeQueue(), 'X-001', now);
  assert.equal(response.status, 'erro');
  assert.ok(response.errorMessage && !response.errorMessage.includes('stack trace'));
});

void test('handleGetAula lança 404 para conteúdo inexistente', async () => {
  const sqlite = migratedDatabase();
  const db = d1(sqlite);

  await assert.rejects(
    handleGetAula(db, fakeBucket(), fakeQueue(), 'X-999', now),
    (error) => {
      assert.ok(error instanceof ApacheError);
      assert.equal(error.status, 404);
      return true;
    },
  );
});

void test('handleGetAula lança 404 para um contentId em formato inválido, sem tocar o D1', async () => {
  const sqlite = migratedDatabase();
  const db = d1(sqlite);

  await assert.rejects(
    handleGetAula(db, fakeBucket(), fakeQueue(), '../etc/passwd', now),
    (error) => {
      assert.ok(error instanceof ApacheError);
      assert.equal(error.status, 404);
      return true;
    },
  );
});

void test('handleGetAula sem bindings de fila/R2 (dev sem a fila configurada) só lê status, sem tentar enfileirar', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const db = d1(sqlite);

  const response = await handleGetAula(db, null, null, 'X-001', now);
  assert.deepEqual(response, { status: 'pendente' });
  const count = sqlite.prepare('SELECT COUNT(*) AS n FROM atlas_apache_queue').get() as { n: number };
  assert.equal(count.n, 0, 'sem fila/bucket não deve nem criar o item na fila');
});

void test('handleLessonQueueBatch processa cada mensagem do lote e dá ack em cada uma no sucesso', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  seedContent(sqlite, 'X-002');
  const db = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l2', 'X-002', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q2', 'X-002', 'aula', 'pendente', 0, '${now}')`,
  );
  const ai = fakeAi(async () => ({ response: JSON.stringify(sampleLesson()) }));
  const bucket = fakeBucket();
  const m1 = fakeMessage({ queueId: 'q1', contentId: 'X-001' });
  const m2 = fakeMessage({ queueId: 'q2', contentId: 'X-002' });

  await handleLessonQueueBatch({ messages: [m1, m2] }, db, bucket, ai);

  assert.equal(m1.acked, true);
  assert.equal(m2.acked, true);
  assert.equal(queueRow(sqlite, 'q1')?.status, 'concluido');
  assert.equal(queueRow(sqlite, 'q2')?.status, 'concluido');
});

void test('handleLessonQueueBatch dá retry (não ack) quando processQueueItem lança (falha de infraestrutura real, ex.: D1 fora do ar)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  const realDb = d1(sqlite);
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, updated_at) VALUES ('l1', 'X-001', 'pendente', 1, '${now}');
     INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at) VALUES ('q1', 'X-001', 'aula', 'pendente', 0, '${now}')`,
  );
  // db.batch lançando simula uma falha real de infraestrutura (D1 fora do
  // ar) — bem diferente de uma falha de geração (que processQueueItem
  // sempre converte em estado no banco, nunca propaga).
  const brokenDb = {
    prepare: realDb.prepare.bind(realDb),
    async batch(): Promise<{ meta: { changes: number } }[]> {
      throw new Error('D1 indisponível');
    },
  };
  const ai = fakeAi(async () => ({ response: JSON.stringify(sampleLesson()) }));
  const message = fakeMessage({ queueId: 'q1', contentId: 'X-001' });

  await handleLessonQueueBatch({ messages: [message] }, brokenDb, fakeBucket(), ai);
  assert.equal(message.retried, true);
  assert.equal(message.acked, false);
});

void test('handleReportAula (APA-08) marca reportada e manda a aula pra fila para kind=aula', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, model, object_key, generated_at, reported_count, updated_at)
     VALUES ('l1', 'X-001', 'gerada', 1, '${LESSON_MODEL}', 'apache/aulas/X-001/v1.json.gz', '${now}', 0, '${now}')`,
  );
  const db = d1(sqlite);
  const queue = fakeQueue();

  await handleReportAula(db, queue, 'X-001', now);

  assert.equal(lessonStatus(sqlite, 'X-001'), 'reportada');
  assert.equal(queue.sent.length, 1);
  assert.equal(queue.sent[0]?.contentId, 'X-001');
  const row = sqlite
    .prepare(`SELECT kind, status FROM atlas_apache_queue WHERE content_id = 'X-001'`)
    .get() as { kind: string; status: string } | undefined;
  assert.equal(row?.kind, 'aula');
  assert.equal(row?.status, 'pendente');
});

void test('handleReportAula não manda pra fila quando a aula é claude-manual (kind=aula_manual)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, model, object_key, generated_at, reported_count, updated_at)
     VALUES ('l1', 'X-001', 'gerada', 1, 'claude-manual', 'apache/aulas/X-001/v1.json.gz', '${now}', 0, '${now}')`,
  );
  const db = d1(sqlite);
  const queue = fakeQueue();

  await handleReportAula(db, queue, 'X-001', now);

  assert.equal(lessonStatus(sqlite, 'X-001'), 'reportada');
  assert.equal(queue.sent.length, 0);
  const row = sqlite
    .prepare(`SELECT kind, status FROM atlas_apache_queue WHERE content_id = 'X-001'`)
    .get() as { kind: string; status: string } | undefined;
  assert.equal(row?.kind, 'aula_manual');
});

void test('handleReportAula lança 404 para um contentId inválido, sem tocar o D1', async () => {
  const sqlite = migratedDatabase();
  const db = d1(sqlite);
  const queue = fakeQueue();

  await assert.rejects(
    handleReportAula(db, queue, '../etc/passwd', now),
    (error) => {
      assert.ok(error instanceof ApacheError);
      assert.equal(error.status, 404);
      return true;
    },
  );
  assert.equal(queue.sent.length, 0);
});

void test('handleReportAula é idempotente: reportar de novo não manda uma segunda mensagem pra fila', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'X-001');
  sqlite.exec(
    `INSERT INTO atlas_apache_lessons (id, content_id, status, version, model, object_key, generated_at, reported_count, updated_at)
     VALUES ('l1', 'X-001', 'gerada', 1, '${LESSON_MODEL}', 'apache/aulas/X-001/v1.json.gz', '${now}', 0, '${now}')`,
  );
  const db = d1(sqlite);
  const queue = fakeQueue();

  await handleReportAula(db, queue, 'X-001', now);
  const later = '2026-10-21T12:01:00.000Z';
  await handleReportAula(db, queue, 'X-001', later);

  assert.equal(queue.sent.length, 1);
  const rows = sqlite
    .prepare(`SELECT status FROM atlas_apache_lessons WHERE content_id = 'X-001'`)
    .get() as { status: string } | undefined;
  assert.equal(rows?.status, 'reportada');
  const count = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM atlas_apache_queue WHERE content_id = 'X-001'`)
    .get() as { n: number };
  assert.equal(count.n, 1);
});
