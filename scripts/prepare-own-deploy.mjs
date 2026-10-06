// Ajusta dist/server/wrangler.json (gerado por `pnpm run build`) para o deploy
// independente na conta Cloudflare própria (QUEST-008 Bloco B / DEC-005).
// O build sempre regenera o arquivo com o database_id de placeholder; rode este
// script depois de cada build e antes de `wrangler deploy`.
//
// DEC-009: só existe um ambiente remoto (produção) e ele nunca é implícito —
// --target production, o nome do Worker, o nome e o id do D1 são obrigatórios
// em toda execução; nenhum deles tem valor padrão.
//
// Uso: node scripts/prepare-own-deploy.mjs --target production --name <worker> --db <d1-nome> --id <d1-id>
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      id: { type: 'string' },
      db: { type: 'string' },
      name: { type: 'string' },
      file: { type: 'string', default: 'dist/server/wrangler.json' },
    },
  });
  requireTarget(values.target, ['production']);
  const name = requireOption(values, 'name', 'o nome do Worker');
  const db = requireOption(values, 'db', 'o nome do D1');
  const id = requireOption(values, 'id', 'o database_id do D1');

  const config = JSON.parse(await readFile(values.file, 'utf8'));
  const binding = config.d1_databases?.find((item) => item.binding === 'DB');
  if (!binding) throw new Error('Binding D1 "DB" não encontrado no wrangler.json.');

  config.name = name;
  binding.database_name = db;
  binding.database_id = id;
  await writeFile(values.file, JSON.stringify(config));
  console.log(`OK [production]: worker "${config.name}" -> D1 "${binding.database_name}" (${binding.database_id})`);
});
