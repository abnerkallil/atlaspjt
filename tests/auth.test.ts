import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SESSION_RENEW_AFTER_SECONDS,
  SESSION_TTL_SECONDS,
  checkSessionToken,
  createSessionToken,
  hashPassword,
  readCookie,
  safeNextPath,
  verifyPassword,
} from '../lib/auth.js';

const SECRET = 'test-secret';
const NOW = 1_800_000_000;

void test('verifyPassword aceita a senha correta e recusa a errada', async () => {
  const hash = await hashPassword('senha-correta-123');
  assert.equal(await verifyPassword('senha-correta-123', hash), true);
  assert.equal(await verifyPassword('senha-errada', hash), false);
  assert.equal(await verifyPassword('x', 'lixo'), false);
});

void test('sessão válida, sem renovação logo após o login', async () => {
  const token = await createSessionToken(SECRET, NOW);
  assert.deepEqual(await checkSessionToken(token, SECRET, NOW + 60), { valid: true, renew: false });
});

void test('sessão pede renovação depois do intervalo', async () => {
  const token = await createSessionToken(SECRET, NOW);
  const result = await checkSessionToken(token, SECRET, NOW + SESSION_RENEW_AFTER_SECONDS);
  assert.deepEqual(result, { valid: true, renew: true });
});

void test('sessão expirada, adulterada, de outro secret ou ausente é recusada', async () => {
  const token = await createSessionToken(SECRET, NOW);
  assert.equal((await checkSessionToken(token, SECRET, NOW + SESSION_TTL_SECONDS)).valid, false);
  const [v, issued, , sig] = token.split('.');
  const forged = `${v}.${issued}.${NOW + SESSION_TTL_SECONDS * 10}.${sig}`;
  assert.equal((await checkSessionToken(forged, SECRET, NOW)).valid, false);
  assert.equal((await checkSessionToken(token, 'outro-secret', NOW)).valid, false);
  assert.equal((await checkSessionToken(undefined, SECRET, NOW)).valid, false);
  assert.equal((await checkSessionToken('a.b', SECRET, NOW)).valid, false);
});

void test('readCookie e safeNextPath', () => {
  assert.equal(readCookie('a=1; atlas_session=xyz; b=2', 'atlas_session'), 'xyz');
  assert.equal(readCookie(null, 'atlas_session'), undefined);
  assert.equal(safeNextPath('/notas?x=1'), '/notas?x=1');
  assert.equal(safeNextPath('//evil.com'), '/');
  assert.equal(safeNextPath('https://evil.com'), '/');
  assert.equal(safeNextPath(null), '/');
});
