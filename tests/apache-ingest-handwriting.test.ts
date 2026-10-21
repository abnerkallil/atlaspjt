// APA-11: fallback de letra de mão (Workers AI, Llama 3.2 11B vision).
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import {
  MAX_HANDWRITING_FILE_BYTES,
  MAX_OUTPUT_TOKENS,
  extractHandwriting,
  type VisionAi,
} from '../lib/apache/ingest-handwriting.js';
import { NEURON_OVERLIMIT_THRESHOLD, neuronBudgetRemaining } from '../lib/apache/neuron-meter.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const NOW = new Date('2026-10-20T08:00:00.000Z');

function fakeAi(
  run: VisionAi['run'] = async () => ({ response: 'texto transcrito', usage: { prompt_tokens: 3000, completion_tokens: 200 } }),
): VisionAi & { calls: number } {
  let calls = 0;
  return {
    calls: 0,
    async run(model, inputs) {
      calls += 1;
      (this as { calls: number }).calls = calls;
      return run(model, inputs);
    },
  };
}

async function assertApacheError(run: () => Promise<unknown>, status: number, messagePattern?: RegExp) {
  await assert.rejects(run, (err: unknown) => {
    if (!(err instanceof ApacheError) || err.status !== status) return false;
    return messagePattern ? messagePattern.test(err.message) : true;
  });
}

void test('transcreve a imagem, soma neurons reais no medidor e devolve o texto', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi();
  const result = await extractHandwriting(ai, db, new Uint8Array([1, 2, 3]).buffer, 'image/png', NOW);
  assert.equal(result.text, 'texto transcrito');
  assert.ok(result.neuronsUsed > 0);
  assert.equal(ai.calls, 1);
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.equal(budget.used, Math.ceil(result.neuronsUsed));
});

void test('manda max_tokens explícito e a imagem como data URI em content[].image_url.url', async () => {
  const db = d1(migratedDatabase());
  let seenInputs: Parameters<VisionAi['run']>[1] | undefined;
  const ai = fakeAi(async (_model, inputs) => {
    seenInputs = inputs;
    return { response: 'ok', usage: { prompt_tokens: 100, completion_tokens: 10 } };
  });
  await extractHandwriting(ai, db, new Uint8Array([9, 9]).buffer, 'image/jpeg', NOW);
  assert.equal(seenInputs?.max_tokens, MAX_OUTPUT_TOKENS);
  const userContent = seenInputs?.messages[1]?.content;
  assert.ok(Array.isArray(userContent), 'content da mensagem do usuário é a lista [text, image_url]');
  const imagePart = (userContent as { type: string; image_url?: { url: string } }[]).find(
    (part) => part.type === 'image_url',
  );
  assert.ok(imagePart?.image_url?.url.startsWith('data:image/jpeg;base64,'));
});

void test('sem usage na resposta, cai no fallback do estimateNeurons (não fica sem registrar nada)', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(async () => ({ response: 'sem usage' }));
  const result = await extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW);
  assert.ok(result.neuronsUsed > 0);
});

void test('rejeita mimeType que não é imagem suportada, sem chamar a IA', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi();
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'application/pdf', NOW),
    400,
  );
  assert.equal(ai.calls, 0);
});

void test('rejeita arquivo maior que o teto (orçamento de CPU do Workers Free), sem chamar a IA', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi();
  const big = new ArrayBuffer(MAX_HANDWRITING_FILE_BYTES + 1);
  await assertApacheError(() => extractHandwriting(ai, db, big, 'image/png', NOW), 413);
  assert.equal(ai.calls, 0);
});

void test('resposta vazia da IA é rejeitada, mas os neurons já gastos são registrados', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(async () => ({ response: '   ', usage: { prompt_tokens: 3000, completion_tokens: 50 } }));
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    422,
  );
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.ok(budget.used > 0, 'a chamada rodou e gastou neurons mesmo com resposta vazia');
});

void test('resposta em formato inesperado (ex.: objeto de modo JSON) é rejeitada sem tentar serializar, mas registra o gasto', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(
    async () => ({ response: { nota: 'não deveria vir assim' }, usage: { prompt_tokens: 3000, completion_tokens: 50 } }) as never,
  );
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    500,
  );
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.ok(budget.used > 0);
});

void test('erro genérico da IA nunca chega crú ao chamador (DEC-020 item 8), mas registra o pior caso por segurança', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(async () => {
    throw new Error('stack trace interno do provedor, caminho/arquivo.ts:42');
  });
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    500,
    /^Não foi possível ler a letra de mão/,
  );
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.ok(budget.used > 0, 'erro sem código reconhecido: contamos o pior caso, nunca subestimamos');
});

void test('orçamento já no corte de 90%% bloqueia antes de chamar a IA (DEC-019)', async () => {
  const db = d1(migratedDatabase());
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_neuron_meter (day, neurons_used, updated_at) VALUES (?1, ?2, ?3)`,
      )
      .bind(NOW.toISOString().slice(0, 10), NEURON_OVERLIMIT_THRESHOLD, NOW.toISOString()),
  ]);
  const ai = fakeAi();
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    429,
    /Orçamento diário/,
  );
  assert.equal(ai.calls, 0);
});

void test('restam neurons suficientes perto do corte: não gera falso positivo', async () => {
  // Com os limites de hoje (corte em 9000/10000, ~1000 de margem) o pior
  // caso deste modelo (~136 neurons) nunca é o motivo real do bloqueio --
  // o corte de 90% já dispara primeiro quando a margem fica curta. Este
  // teste fixa que a checagem por "restante < pior caso" não bloqueia à
  // toa logo abaixo do corte.
  const db = d1(migratedDatabase());
  const almostAllUsed = NEURON_OVERLIMIT_THRESHOLD - 1; // 8999: overLimit ainda é false
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_neuron_meter (day, neurons_used, updated_at) VALUES (?1, ?2, ?3)`,
      )
      .bind(NOW.toISOString().slice(0, 10), almostAllUsed, NOW.toISOString()),
  ]);
  const budgetBefore = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.equal(budgetBefore.overLimit, false, 'pré-condição: ainda não bateu o corte de 90%');
  const ai = fakeAi();
  const result = await extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW);
  assert.ok(result.text.length > 0);
  assert.equal(ai.calls, 1);
});

void test('código 3036 (cota diária do Workers AI) vira 429 "orçamento esgotado" e não registra neurons', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(async () => {
    throw { code: 3036, message: 'Account limited: daily free allocation of neurons used' };
  });
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    429,
    /Orçamento diário/,
  );
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.equal(budget.used, 0, '3036 significa que nada foi processado -- não há gasto a registrar');
});

void test('código 3040 (capacidade, não cota) vira 429 de capacidade -- mensagem diferente da de orçamento', async () => {
  const db = d1(migratedDatabase());
  const ai = fakeAi(async () => {
    throw { code: 3040, message: 'Capacity temporarily exceeded, please try again.' };
  });
  await assertApacheError(
    () => extractHandwriting(ai, db, new Uint8Array([1]).buffer, 'image/png', NOW),
    429,
    /capacidade/i,
  );
  const budget = await neuronBudgetRemaining(db, NOW.toISOString());
  assert.ok(budget.used > 0, '3040 pode ter consumido capacidade parcialmente -- contamos o pior caso');
});
