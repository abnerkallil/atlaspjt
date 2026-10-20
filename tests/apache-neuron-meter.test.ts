// APA-15: medidor diário de neurons do Workers AI.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import {
  DAILY_NEURON_BUDGET,
  NEURON_OVERLIMIT_THRESHOLD,
  estimateNeurons,
  neuronBudgetRemaining,
  recordNeuronUsage,
} from '../lib/apache/neuron-meter.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

void test('dia sem uso: remaining é o orçamento inteiro, nunca overLimit', async () => {
  const db = d1(migratedDatabase());
  assert.deepEqual(await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z'), {
    used: 0,
    remaining: DAILY_NEURON_BUDGET,
    overLimit: false,
  });
});

void test('recordNeuronUsage soma no dia UTC e neuronBudgetRemaining reflete', async () => {
  const db = d1(migratedDatabase());
  await recordNeuronUsage(db, 20, '2026-10-20T08:00:00.000Z');
  await recordNeuronUsage(db, 130, '2026-10-20T23:59:00.000Z');
  assert.deepEqual(await neuronBudgetRemaining(db, '2026-10-20T10:00:00.000Z'), {
    used: 150,
    remaining: DAILY_NEURON_BUDGET - 150,
    overLimit: false,
  });
  // dia diferente (reset 00:00 UTC) não acumula com o dia anterior.
  assert.deepEqual(await neuronBudgetRemaining(db, '2026-10-21T00:05:00.000Z'), {
    used: 0,
    remaining: DAILY_NEURON_BUDGET,
    overLimit: false,
  });
});

void test('corte em 90%, sempre, sem exceção', async () => {
  const db = d1(migratedDatabase());
  await recordNeuronUsage(db, NEURON_OVERLIMIT_THRESHOLD - 1, '2026-10-20T08:00:00.000Z');
  assert.equal((await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z')).overLimit, false);
  await recordNeuronUsage(db, 1, '2026-10-20T08:00:00.000Z');
  assert.equal((await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z')).overLimit, true, 'used == 9000 já é overLimit');
});

void test('chamadas concorrentes não perdem incremento (upsert atômico)', async () => {
  const db = d1(migratedDatabase());
  await Promise.all(
    Array.from({ length: 10 }, () => recordNeuronUsage(db, 20, '2026-10-20T08:00:00.000Z')),
  );
  assert.equal((await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z')).used, 200);
});

void test('amount zero ou inválido não grava', async () => {
  const db = d1(migratedDatabase());
  await recordNeuronUsage(db, 0, '2026-10-20T08:00:00.000Z');
  await recordNeuronUsage(db, -5, '2026-10-20T08:00:00.000Z');
  await recordNeuronUsage(db, Number.NaN, '2026-10-20T08:00:00.000Z');
  assert.equal((await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z')).used, 0);
});

void test('data inválida rejeitada em recordNeuronUsage e neuronBudgetRemaining', async () => {
  const db = d1(migratedDatabase());
  await assert.rejects(
    recordNeuronUsage(db, 20, 'não-é-data'),
    (error: ApacheError) => error instanceof ApacheError && error.status === 500 && /Data inválida/.test(error.message),
  );
  await assert.rejects(
    neuronBudgetRemaining(db, 'não-é-data'),
    (error: ApacheError) => error instanceof ApacheError && error.status === 500 && /Data inválida/.test(error.message),
  );
});

void test('Math.ceil: uso fracionário nunca vira 0', async () => {
  const db = d1(migratedDatabase());
  await recordNeuronUsage(db, 0.3, '2026-10-20T08:00:00.000Z');
  assert.equal((await neuronBudgetRemaining(db, '2026-10-20T08:00:00.000Z')).used, 1);
});

void test('estimateNeurons: tokens × taxa do modelo, com fallback de 3k/2k tokens', () => {
  const llama = estimateNeurons('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  assert.ok(Math.abs(llama - 489.6) < 1, `esperava ~490, veio ${llama}`);

  const gemma = estimateNeurons('@cf/google/gemma-4-26b-a4b-it');
  assert.ok(Math.abs(gemma - 81.8) < 1, `esperava ~82, veio ${gemma}`);

  const qwen = estimateNeurons('@cf/qwen/qwen3-30b-a3b-fp8');
  assert.ok(Math.abs(qwen - 74.8) < 1, `esperava ~75, veio ${qwen}`);

  const vision = estimateNeurons('@cf/meta/llama-3.2-11b-vision-instruct');
  assert.ok(Math.abs(vision - 136.2) < 1, `esperava ~136, veio ${vision}`);

  // usage real da chamada tem prioridade sobre o fallback de 3k/2k.
  const usoReal = estimateNeurons('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    promptTokens: 1_000_000,
    completionTokens: 0,
  });
  assert.equal(usoReal, 26_668);

  assert.throws(
    () => estimateNeurons('@cf/desconhecido/modelo-x'),
    (error: ApacheError) => error instanceof ApacheError && error.status === 500 && /sem taxa de neurons/.test(error.message),
  );
});
