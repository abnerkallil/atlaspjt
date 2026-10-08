import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

// Planejamento das migrations do D1 de produção usado por scripts/deploy.mjs.
// O schema vem de um SQLite em memória com as migrations reais do repositório.
type Plan = { register: string[]; apply: string[]; partial: string[] };
type Row = Record<string, string>;
type MigrationsModule = {
  listMigrationFiles(dir: string): string[];
  planMigrations(input: {
    dir: string;
    applied: string[];
    schema: unknown;
  }): Plan;
  schemaFromRows(objects: Row[], columns: Row[]): unknown;
  registerMigrationsSql(names: string[]): string;
  SCHEMA_OBJECTS_SQL: string;
  SCHEMA_COLUMNS_SQL: string;
};

const lib = (await import(
  pathToFileURL(join(process.cwd(), 'scripts/lib/d1-migrations.mjs')).href
)) as MigrationsModule;
const files = lib.listMigrationFiles('drizzle');
// Produção como estava antes do deploy de 2026-10-07: só até a 0006.
const upTo0006 = files.slice(0, files.indexOf('0006_attachments.sql') + 1);

function databaseWith(migrations: string[]) {
  const db = new DatabaseSync(':memory:');
  for (const name of migrations) {
    for (const statement of readFileSync(`drizzle/${name}`, 'utf8').split(
      '--> statement-breakpoint',
    )) {
      if (statement.trim()) db.exec(statement);
    }
  }
  return db;
}

function schemaOf(db: DatabaseSync) {
  return lib.schemaFromRows(
    db.prepare(lib.SCHEMA_OBJECTS_SQL).all() as Row[],
    db.prepare(lib.SCHEMA_COLUMNS_SQL).all() as Row[],
  );
}

void test('produção atual: 0004 e 0006 aplicadas à mão são só registradas, 0005 (idempotente) e as novas (0007+) rodam', () => {
  const db = databaseWith(upTo0006);
  const plan = lib.planMigrations({
    dir: 'drizzle',
    applied: files.slice(0, 4),
    schema: schemaOf(db),
  });
  assert.deepEqual(plan.register, [
    '0004_canonical_spine.sql',
    '0006_attachments.sql',
  ]);
  assert.deepEqual(plan.apply, [
    '0005_catalog_seed.sql',
    '0007_note_versions.sql',
    '0008_study_sessions.sql',
    '0009_quizzes.sql',
    '0010_question_bank.sql',
    '0011_agenda.sql',
    '0012_content_materials.sql',
    '0013_apolo_base.sql',
    '0014_temas_apo02.sql',
  ]);
  assert.deepEqual(plan.partial, []);
});

void test('migration nova ainda não aplicada vai para apply', () => {
  const db = databaseWith(
    upTo0006.filter((name) => name !== '0006_attachments.sql'),
  );
  const plan = lib.planMigrations({
    dir: 'drizzle',
    applied: files.slice(0, 6),
    schema: schemaOf(db),
  });
  assert.deepEqual(plan, {
    register: [],
    apply: [
      '0006_attachments.sql',
      '0007_note_versions.sql',
      '0008_study_sessions.sql',
      '0009_quizzes.sql',
      '0010_question_bank.sql',
      '0011_agenda.sql',
      '0012_content_materials.sql',
      '0013_apolo_base.sql',
      '0014_temas_apo02.sql',
    ],
    partial: [],
  });
});

void test('tudo registrado: nada a fazer, e reexecutar continua sem fazer nada', () => {
  const db = databaseWith(files);
  const plan = lib.planMigrations({
    dir: 'drizzle',
    applied: files,
    schema: schemaOf(db),
  });
  assert.deepEqual(plan, { register: [], apply: [], partial: [] });
});

void test('migration aplicada pela metade para o deploy', () => {
  const db = databaseWith(files);
  db.exec('DROP INDEX idx_atlas_note_attachments_note_id');
  const plan = lib.planMigrations({
    dir: 'drizzle',
    applied: files.slice(0, 6),
    schema: schemaOf(db),
  });
  assert.deepEqual(plan.partial, ['0006_attachments.sql']);
});

void test('registrar migrations usa a mesma tabela de controle do wrangler', () => {
  const db = databaseWith(files);
  db.exec(
    lib.registerMigrationsSql([
      '0004_canonical_spine.sql',
      '0006_attachments.sql',
    ]),
  );
  db.exec(lib.registerMigrationsSql(['0005_catalog_seed.sql']));
  const names = (
    db.prepare('SELECT name FROM d1_migrations ORDER BY id').all() as Row[]
  ).map((row) => row.name);
  assert.deepEqual(names, [
    '0004_canonical_spine.sql',
    '0006_attachments.sql',
    '0005_catalog_seed.sql',
  ]);
});
