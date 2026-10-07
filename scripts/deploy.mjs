// Publica o Atlas em produção com um único comando (ver docs/DEPLOY.md):
// atualiza o main, instala, faz o build, ajusta o wrangler.json, aplica as
// migrations pendentes do D1 e roda `wrangler deploy`.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default. Os nomes
// do Worker, do D1 e do bucket R2 ficam em `deploy.local.json` (ignorado pelo
// git; modelo em `deploy.example.json`). O id do D1 é descoberto pelo wrangler.
// Nada aqui lê `.dev.vars`. Nada é gravado na Cloudflare antes da confirmação.
//
// Uso: pnpm run deploy:atlas -- --target production
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import {
  MIGRATIONS_TABLE,
  SCHEMA_COLUMNS_SQL,
  SCHEMA_OBJECTS_SQL,
  planMigrations,
  registerMigrationsSql,
  schemaFromRows,
} from './lib/d1-migrations.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const DIST_CONFIG = 'dist/server/wrangler.json';
const MIGRATIONS_CONFIG = '.wrangler/deploy-migrations.json';
const WRANGLER = resolve('node_modules/wrangler/bin/wrangler.js');
const isWindows = process.platform === 'win32';

let env = { ...process.env };

function step(title) {
  console.log(`\n=== ${title} ===`);
}

// Roda um comando; em falha para com a mensagem do passo.
function run(command, args, failure, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    env,
    encoding: 'utf8',
    shell: isWindows && command !== process.execPath,
    // stdin fora do terminal: o wrangler não pergunta de novo o que já foi confirmado aqui.
    stdio: capture
      ? ['ignore', 'pipe', 'pipe']
      : ['ignore', 'inherit', 'inherit'],
  });
  if (result.error || result.status !== 0) {
    if (capture)
      process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`);
    throw new Error(failure);
  }
  return result.stdout ?? '';
}

const wrangler = (args, failure, options) =>
  run(process.execPath, [WRANGLER, ...args], failure, options);

function wranglerJson(args, failure) {
  const output = wrangler([...args, '--json'], failure, { capture: true });
  try {
    return JSON.parse(output.slice(output.search(/[[{]/)));
  } catch {
    process.stderr.write(output);
    throw new Error(`${failure} (resposta inesperada do wrangler)`);
  }
}

function d1Query(db, sql, failure) {
  const results = wranglerJson(
    [
      'd1',
      'execute',
      db,
      '--remote',
      '--config',
      MIGRATIONS_CONFIG,
      '--command',
      sql,
    ],
    failure,
  );
  return results.flatMap((item) => item.results ?? []);
}

function readLocalConfig(target) {
  if (!existsSync(LOCAL_CONFIG) && existsSync('deploy.json')) {
    throw new Error(`Renomeie deploy.json para ${LOCAL_CONFIG}: o script só lê ${LOCAL_CONFIG}, que o git ignora.`);
  }
  if (!existsSync(LOCAL_CONFIG)) {
    throw new Error(
      `Arquivo ${LOCAL_CONFIG} não encontrado. Copie deploy.example.json para ${LOCAL_CONFIG} ` +
        'e preencha os nomes reais (ele é ignorado pelo git).',
    );
  }
  const section = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8'))[target];
  if (!section) throw new Error(`${LOCAL_CONFIG} não tem a seção "${target}".`);
  for (const key of ['worker', 'd1', 'bucket']) {
    if (!section[key] || String(section[key]).startsWith('<')) {
      throw new Error(`Preencha "${target}.${key}" em ${LOCAL_CONFIG} com o nome real, sem os sinais < >.`);
    }
  }
  return section;
}

async function confirm(question) {
  if (!process.stdin.isTTY)
    throw new Error(
      'A confirmação precisa de um terminal interativo. Nada foi publicado.',
    );
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toUpperCase() === 'PUBLICAR';
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' } },
  });
  const target = requireTarget(values.target, ['production']);
  const config = readLocalConfig(target);
  if (config.accountId)
    env = { ...env, CLOUDFLARE_ACCOUNT_ID: config.accountId };

  step('1/7 Atualizando o main');
  const branch = run(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    'Não consegui ler o branch atual do git.',
    {
      capture: true,
    },
  ).trim();
  if (branch !== 'main')
    throw new Error(
      `O deploy sai sempre do main, mas a pasta está no branch "${branch}".`,
    );
  const dirty = run(
    'git',
    ['status', '--porcelain'],
    'Não consegui ler o estado do git.',
    { capture: true },
  ).trim();
  if (dirty) {
    throw new Error(
      `Há alterações locais não commitadas; o deploy só publica o que está no GitHub:\n${dirty}`,
    );
  }
  run(
    'git',
    ['pull', '--ff-only', 'origin', 'main'],
    'Não consegui atualizar o main a partir do GitHub (git pull).',
  );
  const commit = run(
    'git',
    ['log', '-1', '--format=%h %s'],
    'Não consegui ler o commit atual.',
    {
      capture: true,
    },
  ).trim();

  step('2/7 Instalando dependências');
  run('pnpm', ['install', '--frozen-lockfile'], 'Falha no pnpm install.');

  step('3/7 Build');
  run('pnpm', ['run', 'build'], 'Falha no build. Nada foi publicado.');

  step('4/7 Conferindo a conta Cloudflare (só leitura)');
  const database = wranglerJson(
    ['d1', 'list'],
    'Não consegui listar os D1. Rode "npx wrangler login" e tente de novo.',
  ).find((item) => item.name === config.d1);
  if (!database)
    throw new Error(`O D1 "${config.d1}" não existe nesta conta Cloudflare.`);
  wrangler(
    ['r2', 'bucket', 'info', config.bucket],
    `O bucket R2 "${config.bucket}" não foi encontrado nesta conta.`,
    {
      capture: true,
    },
  );
  run(
    process.execPath,
    [
      'scripts/prepare-own-deploy.mjs',
      '--target',
      target,
      '--name',
      config.worker,
      '--db',
      config.d1,
      '--id',
      database.uuid,
      '--bucket',
      config.bucket,
    ],
    'Falha ao ajustar dist/server/wrangler.json.',
  );
  mkdirSync('.wrangler', { recursive: true });
  writeFileSync(
    MIGRATIONS_CONFIG,
    JSON.stringify({
      name: config.worker,
      d1_databases: [
        {
          binding: 'DB',
          database_name: config.d1,
          database_id: database.uuid,
          migrations_dir: '../drizzle',
        },
      ],
    }),
  );

  const objects = d1Query(
    config.d1,
    SCHEMA_OBJECTS_SQL,
    'Não consegui ler o schema do D1 de produção.',
  );
  const hasTable = objects.some(
    (row) => row.type === 'table' && row.name === MIGRATIONS_TABLE,
  );
  const applied = hasTable
    ? d1Query(
        config.d1,
        `SELECT name FROM ${MIGRATIONS_TABLE}`,
        'Não consegui ler as migrations já aplicadas.',
      ).map((row) => row.name)
    : [];
  const columns = d1Query(
    config.d1,
    SCHEMA_COLUMNS_SQL,
    'Não consegui ler as colunas do D1 de produção.',
  );
  const plan = planMigrations({
    dir: 'drizzle',
    applied,
    schema: schemaFromRows(objects, columns),
  });
  if (plan.partial.length) {
    throw new Error(
      `Migration aplicada pela metade em produção: ${plan.partial.join(', ')}. ` +
        'Parte das tabelas/colunas existe e parte não; corrija à mão antes de publicar. Nada foi alterado.',
    );
  }

  console.log(`\nVai publicar em PRODUÇÃO:`);
  console.log(`  commit:  ${commit}`);
  console.log(`  Worker:  ${config.worker}`);
  console.log(`  D1:      ${config.d1}`);
  console.log(`  R2:      ${config.bucket}`);
  console.log(`  migrations a aplicar: ${plan.apply.join(', ') || 'nenhuma'}`);
  if (plan.register.length) {
    console.log(
      `  migrations já presentes no schema, só serão registradas: ${plan.register.join(', ')}`,
    );
  }
  if (!(await confirm('\nDigite PUBLICAR para continuar: '))) {
    console.log('Cancelado. Nada foi alterado na Cloudflare.');
    return;
  }

  step('5/7 Registrando migrations já presentes');
  if (plan.register.length) {
    d1Query(
      config.d1,
      registerMigrationsSql(plan.register),
      'Falha ao registrar as migrations já presentes.',
    );
    console.log(`Registradas: ${plan.register.join(', ')}`);
  } else console.log('Nada a registrar.');

  step('6/7 Aplicando migrations pendentes');
  if (plan.apply.length) {
    wrangler(
      [
        'd1',
        'migrations',
        'apply',
        config.d1,
        '--remote',
        '--config',
        MIGRATIONS_CONFIG,
      ],
      'Falha ao aplicar as migrations. O Worker antigo continua no ar; veja o erro acima.',
    );
  } else console.log('Nenhuma migration pendente.');

  step('7/7 Publicando o Worker');
  wrangler(
    ['deploy', '--config', DIST_CONFIG],
    'Falha no wrangler deploy. As migrations já aplicadas continuam aplicadas.',
  );

  console.log(`\nPronto: ${commit} publicado em produção.`);
});
