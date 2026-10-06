// Seed pontual de notas no D1 (QUEST-008, Bloco B / DEC-005).
// Lê scripts/seed-data/atlas-export-production-20260928.json e insere cada nota
// (e seus vínculos) preservando id, title, body, createdAt e updatedAt.
// Idempotente: notas que já existem (mesmo id) são ignoradas.
//
// DEC-009: o destino é sempre explícito. `--target local` grava no D1 emulado
// (Miniflare); `--target production` grava no D1 remoto e exige `--config`.
// Sem `--target` o script para sem gerar nem executar nada.
//
// Uso:
//   node scripts/seed-notes.mjs --target local --db <nome-do-d1> --config wrangler.local.jsonc
//   node scripts/seed-notes.mjs --target production --db <nome-do-d1> --config <wrangler.json>
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    db: { type: 'string' },
    config: { type: 'string' },
    file: {
      type: 'string',
      default: 'scripts/seed-data/atlas-export-production-20260928.json',
    },
    target: { type: 'string' },
  },
});
let target;
let db;
await runCli(() => {
  target = requireTarget(values.target);
  db = requireOption(values, 'db', 'o nome do banco');
  if (target === 'production') requireOption(values, 'config', 'o wrangler.json de produção');
});
const remote = target === 'production';

const { notes } = JSON.parse(await readFile(values.file, 'utf8'));
const q = (value) => `'${String(value).replaceAll("'", "''")}'`;

const statements = [];
for (const note of notes) {
  statements.push(
    `INSERT OR IGNORE INTO atlas_notes (id, title, body, content_json, created_at, updated_at, last_interacted_at, folder_id, is_private) VALUES (${q(note.id)}, ${q(note.title)}, ${q(note.body)}, NULL, ${q(note.createdAt)}, ${q(note.updatedAt)}, NULL, NULL, 0);`,
  );
  for (const link of note.links) {
    statements.push(
      `INSERT OR IGNORE INTO atlas_note_links (note_id, content_id, content_title, subject, status, created_at) VALUES (${q(note.id)}, ${q(link.contentId)}, ${q(link.contentTitle)}, ${q(link.subject)}, ${q(link.status)}, ${q(note.updatedAt)});`,
    );
  }
}

const dir = await mkdtemp(join(tmpdir(), 'atlas-seed-'));
const sqlPath = join(dir, 'seed.sql');
await writeFile(sqlPath, `${statements.join('\n')}\n`, 'utf8');

const args = ['wrangler', 'd1', 'execute', db, '--file', sqlPath];
args.push(remote ? '--remote' : '--local');
if (values.config) args.push('--config', values.config);
console.log(`Semeando ${notes.length} notas em "${db}" [${target}]...`);

// No Windows, `npx` é um .cmd e só inicia através de um shell.
const isWindows = process.platform === 'win32';
const result = spawnSync(
  isWindows ? 'npx.cmd' : 'npx',
  isWindows ? args.map((arg) => `"${arg}"`) : args,
  { stdio: 'inherit', shell: isWindows },
);
if (result.error) {
  console.error(`Falha ao executar o wrangler: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`O wrangler terminou com erro (código ${result.status}). Nada foi confirmado.`);
  process.exit(result.status ?? 1);
}
console.log('Seed concluído.');
