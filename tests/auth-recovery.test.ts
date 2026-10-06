import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { checkSessionToken, createSessionToken, verifyPassword } from '../lib/auth.js';

// O script roda a partir da raiz do repositório (onde o `pnpm run` executa).
function runScript(args: string[], password?: string): Map<string, string> {
  const output = execFileSync(process.execPath, ['scripts/hash-password.mjs', ...args], {
    env: { ...process.env, ATLAS_PASSWORD: password ?? '' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Map(
    output
      .trim()
      .split('\n')
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
}

void test('recuperação: nova senha gera hash aceito pelo Worker e a senha antiga deixa de valer', async () => {
  const first = runScript([], 'senha-antiga-123');
  const second = runScript([], 'senha-nova-456789');
  const newHash = second.get('ATLAS_PASSWORD_HASH') ?? '';
  assert.equal(await verifyPassword('senha-nova-456789', newHash), true);
  assert.equal(await verifyPassword('senha-antiga-123', newHash), false);
  assert.notEqual(first.get('ATLAS_SESSION_SECRET'), second.get('ATLAS_SESSION_SECRET'));
});

void test('recuperação: --only-session gera só o secret de sessão, sem pedir senha', () => {
  const values = runScript(['--only-session']);
  assert.deepEqual([...values.keys()], ['ATLAS_SESSION_SECRET']);
  assert.ok((values.get('ATLAS_SESSION_SECRET') ?? '').length >= 43);
});

void test('recuperação: trocar o secret de sessão invalida todas as sessões emitidas antes', async () => {
  const now = 1_800_000_000;
  const oldSecret = runScript(['--only-session']).get('ATLAS_SESSION_SECRET') ?? '';
  const newSecret = runScript(['--only-session']).get('ATLAS_SESSION_SECRET') ?? '';
  const token = await createSessionToken(oldSecret, now);
  assert.deepEqual(await checkSessionToken(token, newSecret, now + 60), { valid: false });
});

void test('recuperação: senha curta é recusada', () => {
  assert.throws(() => runScript([], 'curta'));
});
