import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

// Backup do DEC-011 (scripts/backup.mjs e scripts/restore-local.mjs). Os testes
// usam só as peças puras e as paradas de uso; nunca chegam ao wrangler nem à rede.
type Rotation = { keep: string[]; remove: string[] };
type BackupModule = {
  backupName(target: string, date: Date): string;
  parseBackupName(name: string, target: string): Date | null;
  planRotation(names: string[], target: string, now: Date, options?: { keep?: number; maxAgeDays?: number }): Rotation;
  isInside(child: string, parent: string): boolean;
  countRowsSql(tables: string[]): string;
  objectsSql(tables: string[]): string | null;
  rowCounts(rows: Record<string, unknown>[]): Record<string, number>;
  compareCounts(expected: Record<string, number>, actual: Record<string, number>): string[];
  restoreOrder(sql: string): string;
  TABLES_SQL: string;
};

const lib = (await import(pathToFileURL(join(process.cwd(), 'scripts/lib/backup.mjs')).href)) as BackupModule;

function run(script: string, args: string[], cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [join(process.cwd(), 'scripts', script), ...args], {
    cwd,
    env: { PATH: process.env.PATH ?? '' } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour, 0, 0);

void test('DEC-011: nome da pasta de backup ida e volta, separado por ambiente', () => {
  const name = lib.backupName('production', new Date(2026, 9, 7, 21, 48, 3));
  assert.equal(name, 'atlas-backup-production-2026-10-07_21-48-03');
  assert.equal(lib.parseBackupName(name, 'production')?.getTime(), new Date(2026, 9, 7, 21, 48, 3).getTime());
  assert.equal(lib.parseBackupName(name, 'local'), null);
  assert.equal(lib.parseBackupName(`${name}.parcial`, 'production'), null);
});

void test('DEC-011: retenção limitada, no máximo 3 cópias e nenhuma anterior com mais de 3 dias', () => {
  const names = [1, 3, 5, 6, 7].map((day) => lib.backupName('production', at(day)));
  const rotation = lib.planRotation([...names, 'outra-pasta', `${names[0]}.parcial`, lib.backupName('local', at(1))], 'production', at(7, 13));
  assert.deepEqual(rotation.keep, [names[4], names[3], names[2]]);
  assert.deepEqual(rotation.remove, [names[1], names[0]]);

  const old = [lib.backupName('production', at(1)), lib.backupName('production', at(20))];
  // A mais nova sempre fica, mesmo velha; as velhas saem mesmo abaixo do limite de quantidade.
  assert.deepEqual(lib.planRotation(old, 'production', at(30)), { keep: [old[1]], remove: [old[0]] });
});

void test('DEC-011: pasta de backup dentro do repositório é detectada', () => {
  assert.equal(lib.isInside(join(process.cwd(), 'backup'), process.cwd()), true);
  assert.equal(lib.isInside(process.cwd(), process.cwd()), true);
  assert.equal(lib.isInside(join(process.cwd(), '..', 'Atlas-backup'), process.cwd()), false);
});

void test('DEC-011: a pasta backup/ é ignorada pelo git', () => {
  assert.equal(spawnSync('git', ['check-ignore', '-q', 'backup/manifest.json']).status, 0);
  const example = JSON.parse(readFileSync('deploy.example.json', 'utf8')) as { production: Record<string, string> };
  assert.match(example.production.backupDir, /^</, 'o modelo não traz pasta real');
});

void test('DEC-011: contagem de linhas numa consulta só e comparação', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE a (id TEXT); CREATE TABLE "b""x" (id TEXT); INSERT INTO a VALUES (1), (2);');
  const tables = (db.prepare(lib.TABLES_SQL).all() as { name: string }[]).map((row) => row.name);
  const counts = lib.rowCounts(db.prepare(lib.countRowsSql(tables)).all() as Record<string, unknown>[]);
  assert.deepEqual(counts, { a: 2, 'b"x': 0 });
  assert.deepEqual(lib.compareCounts(counts, { ...counts }), []);
  assert.deepEqual(lib.compareCounts(counts, { a: 1 }), ['a: backup 2, restaurado 1', 'b"x: backup 0, restaurado ausente']);
});

void test('DEC-011: dump reordenado restaura com chaves estrangeiras ligadas', () => {
  // Mesmo formato do `wrangler d1 export`: tabela seguida dos seus INSERTs, a
  // referência criada depois, quebras de linha como char(10).
  const dump = [
    'PRAGMA defer_foreign_keys=TRUE;',
    'CREATE TABLE `notes` (',
    '\t`id` text PRIMARY KEY NOT NULL,',
    '\t`body` text,',
    '\t`folder_id` text REFERENCES folders(id) ON DELETE SET NULL);',
    "INSERT INTO \"notes\" VALUES('n1',replace('a;\\nb','\\n',char(10)),'f1');",
    'CREATE TABLE `folders` (',
    '\t`id` text PRIMARY KEY NOT NULL',
    ');',
    "INSERT INTO \"folders\" VALUES('f1');",
    'CREATE INDEX `idx_notes_folder` ON `notes` (`folder_id`);',
    '',
  ].join('\n');

  const broken = new DatabaseSync(':memory:');
  broken.exec('PRAGMA foreign_keys = ON;');
  assert.throws(() => broken.exec(`BEGIN;\n${dump}COMMIT;`), /no such table/);

  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  // O D1 roda o arquivo numa transação só, onde o defer_foreign_keys vale.
  db.exec(`BEGIN;\n${lib.restoreOrder(dump)}COMMIT;`);
  assert.deepEqual({ ...db.prepare('SELECT body, folder_id FROM notes').get() }, { body: 'a;\nb', folder_id: 'f1' });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name = 'idx_notes_folder'").get()?.n, 1);
});

void test('DEC-011/UX-01: backup copia do R2 os anexos de notas e os arquivos de material', () => {
  assert.equal(lib.objectsSql(['atlas_notes']), null);
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE atlas_note_attachments (id TEXT, object_key TEXT, mime_type TEXT, size_bytes INTEGER);
    CREATE TABLE atlas_content_materials (id TEXT, object_key TEXT, mime_type TEXT, size_bytes INTEGER);
    INSERT INTO atlas_note_attachments VALUES ('b', 'attachments/n/b', 'image/png', 3);
    INSERT INTO atlas_content_materials VALUES ('a', 'materials/c/a', 'application/pdf', 5), ('c', NULL, NULL, NULL);`);
  const both = lib.objectsSql(['atlas_note_attachments', 'atlas_content_materials'])!;
  assert.deepEqual(db.prepare(both).all().map((row) => row.object_key), ['materials/c/a', 'attachments/n/b']);
  const notesOnly = lib.objectsSql(['atlas_note_attachments'])!;
  assert.deepEqual(db.prepare(notesOnly).all().map((row) => row.id), ['b']);
});

void test('APO-05/DEC-015: backup também copia o acervo de fontes (prefixo apolo/fontes/)', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE atlas_question_sources (id TEXT, object_key TEXT, mime_type TEXT, size_bytes INTEGER);
    INSERT INTO atlas_question_sources VALUES ('s1', 'apolo/fontes/direito/s1', 'application/pdf', 7);`);
  const sql = lib.objectsSql(['atlas_question_sources'])!;
  assert.deepEqual(db.prepare(sql).all().map((row) => row.object_key), ['apolo/fontes/direito/s1']);
});

void test('DEC-009/DEC-011: backup e restauração param sem ambiente explícito', () => {
  for (const script of ['backup.mjs', 'restore-local.mjs']) {
    const result = run(script, []);
    assert.equal(result.status, 1);
    assert.match(result.output, /--target/);
    assert.doesNotMatch(result.output, /at .*\.mjs:\d+/);
  }
});

void test('DEC-011: restauração de teste nunca aceita produção', () => {
  const result = run('restore-local.mjs', ['--target', 'production', '--from', tmpdir()]);
  assert.equal(result.status, 1);
  assert.match(result.output, /--target "production" inválido\. Use: local\./);
});

void test('DEC-011: backup de produção sem deploy.local.json para antes de qualquer passo', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'atlas-backup-'));
  const result = run('backup.mjs', ['--target', 'production'], cwd);
  assert.equal(result.status, 1);
  assert.match(result.output, /deploy\.local\.json/);
  assert.doesNotMatch(result.output, /===/);
});

void test('DEC-011: backup recusa pasta do repositório que o git não ignora', () => {
  const result = run('backup.mjs', ['--target', 'local', '--dir', join(process.cwd(), 'docs', 'copias')]);
  assert.equal(result.status, 1);
  assert.match(result.output, /não é ignorada pelo git/);
  assert.doesNotMatch(result.output, /===/);
});
