import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

// DEC-009: scripts que tocam recursos remotos param sem ambiente explícito.
// Os testes rodam a partir da raiz do repositório e nunca chegam à rede.
function run(script: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [`scripts/${script}`, ...args], {
    env: { PATH: process.env.PATH ?? '', ...env } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

for (const script of ['prepare-own-deploy.mjs', 'seed-notes.mjs', 'export-data.mjs', 'deploy.mjs']) {
  void test(`DEC-009: ${script} sem --target para antes de agir`, () => {
    const result = run(script, []);
    assert.equal(result.status, 1);
    assert.match(result.output, /--target/);
    assert.doesNotMatch(result.output, /at .*\.mjs:\d+/, 'erro de uso não deve virar stack trace');
  });
}

void test('DEC-009: prepare-own-deploy não tem nome de Worker nem D1 padrão', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-deploy-'));
  const file = join(dir, 'wrangler.json');
  const original = {
    name: 'placeholder',
    d1_databases: [{ binding: 'DB', database_name: 'x', database_id: 'y' }],
    r2_buckets: [{ binding: 'ATTACHMENTS', bucket_name: 'site-creator-r2' }],
  };
  writeFileSync(file, JSON.stringify(original));

  const local = run('prepare-own-deploy.mjs', ['--target', 'local', '--id', 'abc', '--file', file]);
  assert.equal(local.status, 1, 'só existe um alvo remoto: production');

  const missing = run('prepare-own-deploy.mjs', ['--target', 'production', '--id', 'abc', '--file', file]);
  assert.equal(missing.status, 1);
  assert.match(missing.output, /--name/);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), original, 'nada é gravado quando falta argumento');

  const noBucket = run('prepare-own-deploy.mjs', ['--target', 'production', '--name', 'w', '--db', 'd', '--id', 'abc', '--file', file]);
  assert.equal(noBucket.status, 1, 'o bucket R2 de anexos (DEC-008) também não tem padrão');
  assert.match(noBucket.output, /--bucket/);

  const ok = run('prepare-own-deploy.mjs', [
    '--target', 'production', '--name', 'w', '--db', 'd', '--id', 'abc', '--bucket', 'b', '--file', file,
  ]);
  assert.equal(ok.status, 0, ok.output);
  const written = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(written.name, 'w');
  assert.equal(written.d1_databases[0].database_id, 'abc');
  assert.equal(written.r2_buckets[0].bucket_name, 'b');
});

void test('DEC-009: seed-notes em produção exige --config; export em produção exige --url', () => {
  const seed = run('seed-notes.mjs', ['--target', 'production', '--db', 'd']);
  assert.equal(seed.status, 1);
  assert.match(seed.output, /--config/);

  const exported = run('export-data.mjs', ['--target', 'production'], { ATLAS_EXPORT_PASSWORD: 'x' });
  assert.equal(exported.status, 1);
  assert.match(exported.output, /--url/);
});

void test('DEC-009: export nunca lê a senha de .dev.vars', () => {
  const result = run('export-data.mjs', ['--target', 'local']);
  assert.equal(result.status, 1);
  assert.match(result.output, /ATLAS_EXPORT_PASSWORD/);
  for (const script of ['prepare-own-deploy.mjs', 'seed-notes.mjs', 'export-data.mjs', 'deploy.mjs', 'lib/target-env.mjs']) {
    assert.doesNotMatch(readFileSync(`scripts/${script}`, 'utf8'), /readFile[^\n]*\.dev\.vars/);
  }
});

void test('DEC-009: dev, build e start não executam scripts de dados ou deploy', () => {
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
  for (const name of ['dev', 'build', 'start', 'predev', 'prebuild', 'postbuild', 'prestart']) {
    assert.doesNotMatch(scripts[name] ?? '', /prepare-own-deploy|seed-notes|export-data|scripts\/deploy/, name);
  }
});

void test('DEC-009: deploy só aceita production e para sem deploy.local.json antes de tocar git ou rede', () => {
  const local = run('deploy.mjs', ['--target', 'local']);
  assert.equal(local.status, 1);
  assert.match(local.output, /production/);

  const cwd = mkdtempSync(join(tmpdir(), 'atlas-deploy-'));
  const result = spawnSync(process.execPath, [join(process.cwd(), 'scripts/deploy.mjs'), '--target', 'production'], {
    cwd,
    env: { PATH: process.env.PATH ?? '' } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /deploy\.local\.json/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /===/, 'nenhum passo começou');
});

void test('DEC-009: deploy.local.json (nomes reais de produção) é ignorado pelo git', () => {
  const ignored = spawnSync('git', ['check-ignore', '-q', 'deploy.local.json']);
  assert.equal(ignored.status, 0);
  const example = JSON.parse(readFileSync('deploy.example.json', 'utf8')) as { production: Record<string, string> };
  for (const key of ['worker', 'd1', 'bucket']) assert.match(example.production[key], /^</, key);
});
