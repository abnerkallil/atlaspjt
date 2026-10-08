// Peças puras do backup do DEC-011, usadas por `scripts/backup.mjs` e
// `scripts/restore-local.mjs` (ver docs/BACKUP.md). Nada aqui toca rede nem
// Cloudflare; os testes importam este módulo direto.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const MANIFEST_FILE = 'manifest.json';
export const DUMP_FILE = 'd1.sql';
export const OBJECTS_DIR = 'r2';
export const PARTIAL_SUFFIX = '.parcial';

// Retenção limitada (DEC-011, compatível com a exclusão em 3 dias do DEC-08):
// depois de um backup completo, ficam no máximo KEEP cópias, e cópia anterior
// com mais de MAX_AGE_DAYS dias sai. A mais nova sempre fica.
export const KEEP = 3;
export const MAX_AGE_DAYS = 3;

const pad = (n) => String(n).padStart(2, '0');

// atlas-backup-production-2026-10-07_21-48-03 (hora local do computador).
export function backupName(target, date) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `atlas-backup-${target}-${day}_${time}`;
}

export function parseBackupName(name, target) {
  const match = new RegExp(
    `^atlas-backup-${target}-(\\d{4})-(\\d{2})-(\\d{2})_(\\d{2})-(\\d{2})-(\\d{2})$`,
  ).exec(name);
  if (!match) return null;
  const [y, mo, d, h, mi, s] = match.slice(1).map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}

// Decide quais pastas de backup completas daquele ambiente ficam e quais saem.
// Pastas com outro nome (inclusive as `.parcial`) não entram na conta.
export function planRotation(names, target, now, { keep = KEEP, maxAgeDays = MAX_AGE_DAYS } = {}) {
  const backups = names
    .map((name) => ({ name, date: parseBackupName(name, target) }))
    .filter((item) => item.date)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const result = { keep: [], remove: [] };
  backups.forEach((item, index) => {
    const fresh = now.getTime() - item.date.getTime() <= maxAgeMs;
    if (index === 0 || (index < keep && fresh)) result.keep.push(item.name);
    else result.remove.push(item.name);
  });
  return result;
}

export function isInside(child, parent) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// Arquivo do objeto dentro da pasta do backup. O nome não usa a chave do R2,
// que pode ter caracteres que o Windows não aceita; o mapa fica no manifesto.
export function objectFileName(index) {
  return `${OBJECTS_DIR}/${String(index + 1).padStart(6, '0')}.bin`;
}

// Tabelas que o dump do D1 copia: tudo menos as internas do SQLite e da Cloudflare.
export const TABLES_SQL =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND substr(name, 1, 4) <> '_cf_' ORDER BY name";

// Uma linha só, uma coluna por tabela: o D1 recusa UNION ALL com muitos termos.
export function countRowsSql(tables) {
  const ident = (name) => `"${name.replaceAll('"', '""')}"`;
  return `SELECT ${tables.map((name) => `(SELECT COUNT(*) FROM ${ident(name)}) AS ${ident(name)}`).join(', ')}`;
}

// Todos os objetos do R2 que o D1 referencia: anexos de notas, arquivos de
// material de estudo (UX-01) e o acervo de fontes do Apolo (APO-05, prefixo
// apolo/fontes/), conforme as tabelas que existem no banco.
const OBJECT_SOURCES = [
  "SELECT id, object_key, mime_type, size_bytes FROM atlas_note_attachments",
  "SELECT id, object_key, mime_type, size_bytes FROM atlas_content_materials WHERE object_key IS NOT NULL",
  "SELECT id, object_key, mime_type, size_bytes FROM atlas_question_sources",
];
const OBJECT_TABLES = ['atlas_note_attachments', 'atlas_content_materials', 'atlas_question_sources'];

export function objectsSql(tables) {
  const parts = OBJECT_SOURCES.filter((_, index) => tables.includes(OBJECT_TABLES[index]));
  return parts.length ? `${parts.join(' UNION ALL ')} ORDER BY id` : null;
}

export function rowCounts(rows) {
  return Object.fromEntries(Object.entries(rows[0] ?? {}).map(([name, count]) => [name, Number(count)]));
}

// Diferenças entre as contagens do manifesto e as do banco restaurado.
export function compareCounts(expected, actual) {
  const names = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  return names
    .filter((name) => expected[name] !== actual[name])
    .map((name) => `${name}: backup ${expected[name] ?? 'ausente'}, restaurado ${actual[name] ?? 'ausente'}`);
}

// O dump do `wrangler d1 export` grava cada tabela seguida dos seus INSERTs, em
// ordem alfabética de criação; com chaves estrangeiras ligadas, um INSERT numa
// tabela cuja referência ainda não foi criada falha ("no such table"). Para
// restaurar, todas as CREATE TABLE vêm antes dos dados. Cada INSERT do dump fica
// numa linha só (quebras de linha viram char(10)); CREATE TABLE pode ter várias.
export function restoreOrder(sql) {
  const statements = [];
  let current = [];
  for (const line of sql.split('\n')) {
    if (!current.length && !line.trim()) continue;
    current.push(line);
    if (line.trimEnd().endsWith(';')) {
      statements.push(current.join('\n'));
      current = [];
    }
  }
  if (current.join('').trim()) statements.push(current.join('\n'));
  const rank = (statement) => {
    if (/^PRAGMA\b/i.test(statement)) return 0;
    if (/^CREATE\s+TABLE\b/i.test(statement)) return 1;
    if (/^CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(statement)) return 3;
    return 2;
  };
  return `${statements
    .map((statement, index) => ({ statement, index, rank: rank(statement) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.statement)
    .join('\n')}\n`;
}
