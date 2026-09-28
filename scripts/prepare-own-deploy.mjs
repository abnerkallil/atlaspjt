// Ajusta dist/server/wrangler.json (gerado por `pnpm run build`) para o deploy
// independente na conta Cloudflare própria (QUEST-008 Bloco B / DEC-005).
// O build sempre regenera o arquivo com o database_id de placeholder; rode este
// script depois de cada build e antes de `wrangler deploy`.
//
// Uso: node scripts/prepare-own-deploy.mjs --id <database_id> [--db atlas-notes-own] [--name atlas-notes]
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    id: { type: 'string' },
    db: { type: 'string', default: 'atlas-notes-own' },
    name: { type: 'string', default: 'atlas-notes' },
    file: { type: 'string', default: 'dist/server/wrangler.json' },
  },
});
if (!values.id) throw new Error('Informe o database_id com --id <id>.');

const config = JSON.parse(await readFile(values.file, 'utf8'));
const binding = config.d1_databases?.find((item) => item.binding === 'DB');
if (!binding) throw new Error('Binding D1 "DB" não encontrado no wrangler.json.');

config.name = values.name;
binding.database_name = values.db;
binding.database_id = values.id;
await writeFile(values.file, JSON.stringify(config));
console.log(`OK: worker "${config.name}" -> D1 "${binding.database_name}" (${binding.database_id})`);
