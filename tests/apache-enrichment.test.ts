// APA-12: pipeline de enriquecimento.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import type { AiLike } from '../lib/apache/lesson-writer.js';
import type { R2Like } from '../lib/apache/lesson-store.js';
import {
  chunkMaterialText,
  enrichmentObjectKey,
  enrichmentTempObjectKey,
  mergeChunkResults,
  processEnrichmentQueueItem,
  sha256Hex,
  submitEnrichment,
  type EnrichmentQueueLike,
} from '../lib/apache/enrichment.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-21T12:00:00.000Z';
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const USER_ID = 'atlas-owner';

function seedContent(sqlite: ReturnType<typeof migratedDatabase>, contentId: string) {
  sqlite.exec(`
    INSERT OR IGNORE INTO atlas_roadmaps (id, title, created_at, updated_at) VALUES ('rm', 'Roadmap', '${now}', '${now}');
    INSERT OR IGNORE INTO atlas_phases (id, roadmap_id, position, title) VALUES ('f1', 'rm', 1, 'Base');
    INSERT OR IGNORE INTO atlas_disciplines (id, phase_id, position, title) VALUES ('cg', 'f1', 1, 'Contabilidade Geral');
    INSERT INTO atlas_contents (id, discipline_id, position, title, keywords) VALUES ('${contentId}', 'cg', 1, 'Patrimônio líquido', 'PL');
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

function fakeAi(run: AiLike['run']): AiLike {
  return { run };
}

function fakeQueue(): EnrichmentQueueLike & { sent: { queueId: string; contentId: string }[] } {
  const sent: { queueId: string; contentId: string }[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

function jsonResponse(payload: unknown) {
  return { response: JSON.stringify(payload), usage: { prompt_tokens: 100, completion_tokens: 50 } };
}

void test('APA-12: chunkMaterialText acumula parágrafos pequenos no mesmo chunk', () => {
  const a = 'a'.repeat(400);
  const b = 'b'.repeat(400);
  const c = 'c'.repeat(1500);
  const chunks = chunkMaterialText(`${a}\n\n${b}\n\n${c}`);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0], `${a}\n\n${b}`);
  assert.equal(chunks[1], c);
});

void test('APA-12: chunkMaterialText com texto vazio não gera chunks', () => {
  assert.deepEqual(chunkMaterialText('   \n\n  '), []);
});

void test('APA-12: mergeChunkResults só descarta quando TODO chunk é irrelevante', () => {
  const mixed = mergeChunkResults([
    { conceitos: [], irrelevante: true },
    { conceitos: [{ id: 'c1', nome: 'PL', def: 'def' }], irrelevante: false },
  ]);
  assert.equal(mixed.irrelevante, false);
  assert.equal(mixed.conceitos.length, 1);

  const allIrrelevant = mergeChunkResults([
    { conceitos: [], irrelevante: true },
    { conceitos: [], irrelevante: true },
  ]);
  assert.equal(allIrrelevant.irrelevante, true);
});

void test('APA-12: processa síncrono (1 chunk), salva a ficha e debita a cota', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct1');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  let calls = 0;
  const ai = fakeAi(async () => {
    calls += 1;
    return jsonResponse({ v: 1, conceitos: [{ id: 'c1', nome: 'PL', def: 'Ativo menos passivo.' }], irrelevante: false });
  });

  const text = 'Patrimônio líquido é a diferença entre ativo e passivo.';
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

  const outcome = await submitEnrichment({
    db: database,
    bucket,
    ai,
    model: MODEL,
    queue: null,
    contentId: 'ct1',
    userId: USER_ID,
    text,
    pages: 1,
    sourceHash: hash,
    now,
  });

  assert.deepEqual(outcome, { kind: 'sync', status: 'concluido' });
  assert.equal(calls, 1);
  assert.ok(bucket.store.has(enrichmentObjectKey('ct1', USER_ID)));

  const row = sqlite
    .prepare('SELECT status, pages_used FROM atlas_apache_enrichments WHERE content_id = ? AND user_id = ?')
    .get('ct1', USER_ID) as { status: string; pages_used: number };
  assert.equal(row.status, 'concluido');
  assert.equal(row.pages_used, 1);

  const quota = sqlite.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?').get(USER_ID) as {
    pages_used: number;
  };
  assert.equal(quota.pages_used, 1);
});

void test('APA-12: ficha irrelevante vira descartado, sem salvar objeto, cota ainda debitada', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct2');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  const ai = fakeAi(async () => jsonResponse({ v: 1, conceitos: [], irrelevante: true }));

  const text = 'Receita de bolo de fubá, sem relação com o conteúdo.';
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

  const outcome = await submitEnrichment({
    db: database,
    bucket,
    ai,
    model: MODEL,
    queue: null,
    contentId: 'ct2',
    userId: USER_ID,
    text,
    pages: 1,
    sourceHash: hash,
    now,
  });

  assert.deepEqual(outcome, { kind: 'sync', status: 'descartado' });
  assert.equal(bucket.store.size, 0);
  const row = sqlite
    .prepare('SELECT status, pages_used FROM atlas_apache_enrichments WHERE content_id = ? AND user_id = ?')
    .get('ct2', USER_ID) as { status: string; pages_used: number };
  assert.equal(row.status, 'descartado');
  assert.equal(row.pages_used, 1);
});

void test('APA-12: reenvio do mesmo arquivo (hash igual) é reaproveitado, sem gastar neurons/páginas', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct3');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  let calls = 0;
  const ai = fakeAi(async () => {
    calls += 1;
    return jsonResponse({ v: 1, conceitos: [{ id: 'c1', nome: 'PL', def: 'def' }], irrelevante: false });
  });

  const text = 'Patrimônio líquido é a diferença entre ativo e passivo.';
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);
  const input = {
    db: database,
    bucket,
    ai,
    model: MODEL,
    queue: null,
    contentId: 'ct3',
    userId: USER_ID,
    text,
    pages: 1,
    sourceHash: hash,
    now,
  };

  await submitEnrichment(input);
  assert.equal(calls, 1);

  const second = await submitEnrichment({ ...input, now: '2026-10-21T13:00:00.000Z' });
  assert.deepEqual(second, { kind: 'reused' });
  assert.equal(calls, 1, 'não deve chamar a IA de novo');

  const quota = sqlite.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?').get(USER_ID) as {
    pages_used: number;
  };
  assert.equal(quota.pages_used, 1, 'não deve debitar páginas de novo');
});

void test('APA-12: 2+ chunks vão para a fila (texto temporário em R2 + mensagem enviada)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct4');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  const queue = fakeQueue();
  const ai = fakeAi(async () => jsonResponse({ v: 1, conceitos: [], irrelevante: false }));

  const bigParagraph = (label: string) => `${label} ${'x'.repeat(2500)}`;
  const text = `${bigParagraph('p1')}\n\n${bigParagraph('p2')}`;
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

  const outcome = await submitEnrichment({
    db: database,
    bucket,
    ai,
    model: MODEL,
    queue,
    contentId: 'ct4',
    userId: USER_ID,
    text,
    pages: 3,
    sourceHash: hash,
    now,
  });

  assert.deepEqual(outcome, { kind: 'queued' });
  assert.equal(queue.sent.length, 1);
  const queueId = queue.sent[0].queueId;
  assert.ok(bucket.store.has(enrichmentTempObjectKey(queueId)));

  const row = sqlite
    .prepare('SELECT kind, user_id, temp_object_key, status FROM atlas_apache_queue WHERE id = ?')
    .get(queueId) as { kind: string; user_id: string; temp_object_key: string; status: string };
  assert.equal(row.kind, 'enriquecimento');
  assert.equal(row.user_id, USER_ID);
  assert.equal(row.status, 'pendente');
});

void test('APA-12: consumer da fila processa os chunks, salva a ficha e apaga o texto temporário', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct5');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  const queue = fakeQueue();
  let calls = 0;
  const ai = fakeAi(async () => {
    calls += 1;
    return jsonResponse({ v: 1, conceitos: [{ id: `c${calls}`, nome: `Conceito ${calls}`, def: 'def' }], irrelevante: false });
  });

  const bigParagraph = (label: string) => `${label} ${'x'.repeat(2500)}`;
  const text = `${bigParagraph('p1')}\n\n${bigParagraph('p2')}`;
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

  await submitEnrichment({
    db: database,
    bucket,
    ai,
    model: MODEL,
    queue,
    contentId: 'ct5',
    userId: USER_ID,
    text,
    pages: 3,
    sourceHash: hash,
    now,
  });
  assert.equal(calls, 0, 'o chunk só deve ser processado pelo consumer, não no envio');

  const queueId = queue.sent[0].queueId;
  await processEnrichmentQueueItem(database, bucket, ai, MODEL, queueId, 'ct5', USER_ID, enrichmentTempObjectKey(queueId), now);

  assert.equal(calls, 2, 'um chunk por parágrafo');
  assert.ok(bucket.store.has(enrichmentObjectKey('ct5', USER_ID)));
  assert.ok(!bucket.store.has(enrichmentTempObjectKey(queueId)), 'texto temporário deve ser apagado ao final');

  const enrichmentRow = sqlite
    .prepare('SELECT status, partial_result FROM atlas_apache_enrichments WHERE content_id = ? AND user_id = ?')
    .get('ct5', USER_ID) as { status: string; partial_result: string | null };
  assert.equal(enrichmentRow.status, 'concluido');
  assert.equal(enrichmentRow.partial_result, null);

  const queueRow = sqlite.prepare('SELECT status FROM atlas_apache_queue WHERE id = ?').get(queueId) as { status: string };
  assert.equal(queueRow.status, 'concluido');
});

void test('APA-12: falha de sistema devolve as páginas debitadas (refund)', async () => {
  const sqlite = migratedDatabase();
  seedContent(sqlite, 'ct6');
  const database = d1(sqlite);
  const bucket = fakeBucket();
  const ai = fakeAi(async () => {
    throw new Error('falha de rede simulada');
  });

  const text = 'Material qualquer sobre o conteúdo.';
  const hash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

  await assert.rejects(
    () =>
      submitEnrichment({
        db: database,
        bucket,
        ai,
        model: MODEL,
        queue: null,
        contentId: 'ct6',
        userId: USER_ID,
        text,
        pages: 2,
        sourceHash: hash,
        now,
      }),
    ApacheError,
  );

  const quota = sqlite.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?').get(USER_ID) as
    | { pages_used: number }
    | undefined;
  assert.equal(quota?.pages_used ?? 0, 0, 'páginas devem ter sido devolvidas');

  const row = sqlite
    .prepare('SELECT status FROM atlas_apache_enrichments WHERE content_id = ? AND user_id = ?')
    .get('ct6', USER_ID) as { status: string };
  assert.equal(row.status, 'erro');
});
