// APA-15: medidor diário de neurons do Workers AI.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DAILY_NEURON_BUDGET,
  NEURON_OVERLIMIT_THRESHOLD,
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
