import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APACHE_DAILY_PAGE_LIMIT,
  ApacheQuotaError,
  assertQuota,
  refundQuota,
} from '../lib/apache/quota.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

function seeded() {
  return d1(migratedDatabase());
}

void test('APA-13: aceita páginas até o limite diário', async () => {
  const db = seeded();
  await assertQuota(db, 'u1', 40, new Date('2026-10-20T10:00:00.000Z'));
  await assertQuota(db, 'u1', 50, new Date('2026-10-20T11:00:00.000Z'));
  const row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 90);
});

void test('APA-13: rejeita ao passar do limite na mesma janela', async () => {
  const db = seeded();
  await assertQuota(db, 'u1', 90, new Date('2026-10-20T10:00:00.000Z'));
  await assert.rejects(
    () => assertQuota(db, 'u1', 1, new Date('2026-10-20T10:30:00.000Z')),
    ApacheQuotaError,
  );
  const row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 90, 'a tentativa rejeitada não deve alterar pages_used');
});

void test('APA-13: rejeita de cara um envio maior que o limite diário inteiro, mesmo sem uso prévio', async () => {
  const db = seeded();
  await assert.rejects(
    () => assertQuota(db, 'novo-usuario', APACHE_DAILY_PAGE_LIMIT + 1, new Date('2026-10-20T10:00:00.000Z')),
    ApacheQuotaError,
  );
});

void test('APA-13: janela rolante de 24h libera cota de novo', async () => {
  const db = seeded();
  await assertQuota(db, 'u1', 90, new Date('2026-10-20T10:00:00.000Z'));
  await assert.rejects(() => assertQuota(db, 'u1', 1, new Date('2026-10-21T09:59:00.000Z')), ApacheQuotaError);
  // passou de 24h desde a primeira página da janela
  await assertQuota(db, 'u1', 90, new Date('2026-10-21T10:00:01.000Z'));
  const row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 90);
});

void test('APA-13: usuários diferentes têm cotas independentes', async () => {
  const db = seeded();
  await assertQuota(db, 'u1', 90, new Date('2026-10-20T10:00:00.000Z'));
  await assertQuota(db, 'u2', 90, new Date('2026-10-20T10:00:00.000Z'));
});

void test('APA-13: duas chamadas concorrentes não passam de 90 no total', async () => {
  const db = seeded();
  const now = new Date('2026-10-20T10:00:00.000Z');
  const results = await Promise.allSettled([
    assertQuota(db, 'u1', 60, now),
    assertQuota(db, 'u1', 60, now),
  ]);
  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter((result) => result.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  const row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 60);
});

void test('APA-13: refundQuota devolve páginas em erro de sistema, sem passar de zero', async () => {
  const db = seeded();
  await assertQuota(db, 'u1', 30, new Date('2026-10-20T10:00:00.000Z'));
  await refundQuota(db, 'u1', 10);
  let row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 20);

  await refundQuota(db, 'u1', 999);
  row = await db.prepare('SELECT pages_used FROM atlas_apache_quota WHERE user_id = ?1').bind('u1').first<{
    pages_used: number;
  }>();
  assert.equal(row?.pages_used, 0);
});
