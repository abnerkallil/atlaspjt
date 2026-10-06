// Planeja as migrations do D1 de produção para `scripts/deploy.mjs`.
// O registro de quais migrations já rodaram é a tabela `d1_migrations` do
// próprio wrangler. As migrations 0004 a 0006 foram aplicadas em produção à
// mão (sem registro), então antes de chamar `wrangler d1 migrations apply` o
// plano confere o schema real: migration pendente cujas tabelas, índices e
// colunas já existem é só registrada; a que não existe é aplicada; a que existe
// pela metade para o deploy.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MIGRATIONS_TABLE = 'd1_migrations';

// Mesmo DDL que o wrangler usa ao criar a tabela de controle.
export const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`;

export function listMigrationFiles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

const unquote = (name) => name.replace(/^[`"[]|[`"\]]$/g, '');
const IDENT = '([`"[]?[\\w]+[`"\\]]?)';

// Objetos de schema que uma migration cria. DROP/RENAME não são detectados:
// uma migration só com esses comandos é tratada como migration de dados.
export function schemaObjects(sql) {
  const tables = [
    ...sql.matchAll(
      new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${IDENT}`,
        'gi',
      ),
    ),
  ].map((m) => unquote(m[1]));
  const indexes = [
    ...sql.matchAll(
      new RegExp(
        `CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${IDENT}`,
        'gi',
      ),
    ),
  ].map((m) => unquote(m[1]));
  const columns = [
    ...sql.matchAll(
      new RegExp(
        `ALTER\\s+TABLE\\s+${IDENT}\\s+ADD\\s+(?:COLUMN\\s+)?${IDENT}`,
        'gi',
      ),
    ),
  ].map((m) => [unquote(m[1]), unquote(m[2])]);
  return { tables, indexes, columns };
}

// schema: { tables: Set, indexes: Set, columns: Set de "tabela.coluna" }
export function classifyMigration(sql, schema) {
  const { tables, indexes, columns } = schemaObjects(sql);
  const checks = [
    ...tables.map((name) => schema.tables.has(name)),
    ...indexes.map((name) => schema.indexes.has(name)),
    ...columns.map(([table, column]) =>
      schema.columns.has(`${table}.${column}`),
    ),
  ];
  if (checks.length === 0) return 'data';
  if (checks.every(Boolean)) return 'present';
  if (checks.some(Boolean)) return 'partial';
  return 'absent';
}

// applied: nomes já registrados em d1_migrations.
// Retorna o que registrar sem rodar, o que o wrangler vai aplicar e os conflitos.
export function planMigrations({ dir, applied, schema }) {
  const done = new Set(applied);
  const plan = { register: [], apply: [], partial: [] };
  for (const name of listMigrationFiles(dir)) {
    if (done.has(name)) continue;
    const kind = classifyMigration(
      readFileSync(join(dir, name), 'utf8'),
      schema,
    );
    if (kind === 'present') plan.register.push(name);
    else if (kind === 'partial') plan.partial.push(name);
    else plan.apply.push(name);
  }
  return plan;
}

// Converte linhas de sqlite_master/pragma_table_info no formato de classifyMigration.
export function schemaFromRows(objectRows, columnRows) {
  const schema = { tables: new Set(), indexes: new Set(), columns: new Set() };
  for (const row of objectRows) {
    if (row.type === 'table') schema.tables.add(row.name);
    if (row.type === 'index') schema.indexes.add(row.name);
  }
  for (const row of columnRows) schema.columns.add(`${row.t}.${row.c}`);
  return schema;
}

export const SCHEMA_OBJECTS_SQL =
  "SELECT type, name FROM sqlite_master WHERE type IN ('table', 'index')";
export const SCHEMA_COLUMNS_SQL =
  // O D1 recusa pragma_table_info nas tabelas internas (_cf_*, sqlite_*).
  "SELECT m.name AS t, p.name AS c FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type = 'table' AND substr(m.name, 1, 4) <> '_cf_' AND substr(m.name, 1, 7) <> 'sqlite_'";

export function registerMigrationsSql(names) {
  const values = names
    .map((name) => `('${name.replace(/'/g, "''")}')`)
    .join(', ');
  return `${CREATE_MIGRATIONS_TABLE}; INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ${values};`;
}
