// Backup manual do Atlas (DEC-011, ver docs/BACKUP.md): dump SQL completo do D1
// e cópia dos anexos do R2 na mesma execução, para uma pasta fora da conta
// Cloudflare, com retenção limitada.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default. Em produção
// os nomes do D1 e do bucket e a pasta de destino (`backupDir`) vêm de
// `deploy.local.json`, ignorado pelo git. `--target local` copia o D1/R2 locais
// do Miniflare e serve para ensaiar o processo sem tocar a Cloudflare.
// O backup só lê da Cloudflare; nada é gravado lá.
//
// Uso: pnpm run backup:atlas -- --target production [--dir <pasta>]
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  DUMP_FILE,
  MANIFEST_FILE,
  OBJECTS_DIR,
  PARTIAL_SUFFIX,
  TABLES_SQL,
  backupName,
  countRowsSql,
  isInside,
  objectsSql,
  objectFileName,
  planRotation,
  rowCounts,
  sha256File,
} from './lib/backup.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/backup-d1.json';
// Mesmos nomes dos bindings locais do vite.config.ts / wrangler.local.jsonc.
const LOCAL_RESOURCES = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };

function step(title) {
  console.log(`\n=== ${title} ===`);
}

function readProductionConfig() {
  if (!existsSync(LOCAL_CONFIG)) {
    throw new Error(
      `Arquivo ${LOCAL_CONFIG} não encontrado. Copie deploy.example.json para ${LOCAL_CONFIG} ` +
        'e preencha os nomes reais (ele é ignorado pelo git).',
    );
  }
  const section = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  if (!section) throw new Error(`${LOCAL_CONFIG} não tem a seção "production".`);
  for (const key of ['d1', 'bucket']) {
    if (!section[key] || String(section[key]).startsWith('<')) {
      throw new Error(`Preencha "production.${key}" em ${LOCAL_CONFIG} com o nome real, sem os sinais < >.`);
    }
  }
  return section;
}

function resolveBackupDir(value, run) {
  if (!value || String(value).startsWith('<')) {
    throw new Error(
      `Informe a pasta de backup em "production.backupDir" no ${LOCAL_CONFIG} ou com --dir <pasta>. Não existe pasta padrão.`,
    );
  }
  if (!isAbsolute(value)) throw new Error(`A pasta de backup precisa ser um caminho completo: "${value}".`);
  // Dentro do repositório, só uma pasta que o git ignora (ex.: backup/).
  if (isInside(value, process.cwd())) {
    try {
      run('git', ['check-ignore', '-q', join(value, MANIFEST_FILE)], '', { capture: true });
    } catch {
      throw new Error(`A pasta "${value}" está dentro do repositório e não é ignorada pelo git. Use backup/ ou uma pasta fora do projeto.`);
    }
  }
  return resolve(value);
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, dir: { type: 'string' } },
  });
  const target = requireTarget(values.target);
  const production = target === 'production' ? readProductionConfig() : null;
  const env = production?.accountId ? { ...process.env, CLOUDFLARE_ACCOUNT_ID: production.accountId } : process.env;
  const { run, wrangler, wranglerJson, d1Rows } = createRunner(env);
  const backupDir = resolveBackupDir(values.dir ?? production?.backupDir, run);
  const d1 = production ? production.d1 : LOCAL_RESOURCES.d1;
  const bucket = production ? production.bucket : LOCAL_RESOURCES.bucket;
  const where = production ? '--remote' : '--local';

  const started = new Date();
  const name = backupName(target, started);
  const partial = join(backupDir, `${name}${PARTIAL_SUFFIX}`);
  const final = join(backupDir, name);

  console.log(`Backup do Atlas (${target === 'production' ? 'PRODUÇÃO, só leitura' : 'local, Miniflare'})`);
  console.log(`  D1:      ${d1}`);
  console.log(`  R2:      ${bucket}`);
  console.log(`  destino: ${final}`);

  mkdirSync(backupDir, { recursive: true });
  for (const entry of readdirSync(backupDir)) {
    if (entry.startsWith(`atlas-backup-${target}-`) && entry.endsWith(PARTIAL_SUFFIX)) {
      rmSync(join(backupDir, entry), { recursive: true, force: true });
      console.log(`Removido backup incompleto anterior: ${entry}`);
    }
  }
  mkdirSync(join(partial, OBJECTS_DIR), { recursive: true });

  let d1Config = LOCAL_RESOURCES.config;
  if (production) {
    step('1/4 Conferindo a conta Cloudflare (só leitura)');
    const database = wranglerJson(
      ['d1', 'list'],
      'Não consegui listar os D1. Rode "npx wrangler login" e tente de novo.',
    ).find((item) => item.name === d1);
    if (!database) throw new Error(`O D1 "${d1}" não existe nesta conta Cloudflare.`);
    mkdirSync('.wrangler', { recursive: true });
    writeFileSync(
      REMOTE_D1_CONFIG,
      JSON.stringify({ name: 'atlas-backup', d1_databases: [{ binding: 'DB', database_name: d1, database_id: database.uuid }] }),
    );
    d1Config = REMOTE_D1_CONFIG;
  } else step('1/4 Usando o D1/R2 locais do Miniflare');

  step('2/4 Exportando o D1 (dump SQL completo)');
  const dumpPath = join(partial, DUMP_FILE);
  wrangler(
    ['d1', 'export', d1, where, '--config', d1Config, '--output', dumpPath, '--skip-confirmation'],
    'Falha no wrangler d1 export. Nenhum backup novo foi gravado.',
  );
  const tables = d1Rows([d1, where, '--config', d1Config], TABLES_SQL, 'Não consegui listar as tabelas do D1.').map(
    (row) => row.name,
  );
  const counts = tables.length
    ? rowCounts(d1Rows([d1, where, '--config', d1Config], countRowsSql(tables), 'Não consegui contar as linhas do D1.'))
    : {};
  const objectsQuery = objectsSql(tables);
  const attachments = objectsQuery
    ? d1Rows([d1, where, '--config', d1Config], objectsQuery, 'Não consegui ler a lista de anexos do D1.')
    : [];

  step(`3/4 Copiando ${attachments.length} anexo(s) do R2`);
  const objects = [];
  const missing = [];
  attachments.forEach((row, index) => {
    const file = objectFileName(index);
    const path = join(partial, file);
    try {
      wrangler(['r2', 'object', 'get', `${bucket}/${row.object_key}`, where, '--file', path], '', { capture: true });
    } catch {
      missing.push(row.object_key);
      console.log(`  AVISO: o anexo ${row.id} está no D1 mas o objeto não existe no R2.`);
      return;
    }
    objects.push({
      attachmentId: row.id,
      key: row.object_key,
      file,
      mimeType: row.mime_type,
      sizeBytes: statSync(path).size,
      sha256: sha256File(path),
    });
    if ((index + 1) % 10 === 0) console.log(`  ${index + 1}/${attachments.length}`);
  });

  step('4/4 Fechando o backup');
  let commit = null;
  try {
    commit = run('git', ['log', '-1', '--format=%h %s'], '', { capture: true }).trim();
  } catch {
    // Fora de um checkout git o backup continua válido; só não registra o commit.
  }
  const manifest = {
    format: 'atlas-backup',
    version: 1,
    target,
    createdAt: started.toISOString(),
    commit,
    d1: { name: d1, file: DUMP_FILE, bytes: statSync(dumpPath).size, sha256: sha256File(dumpPath), tables: counts },
    r2: { bucket, objects, missing },
  };
  writeFileSync(join(partial, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(partial, final);

  const rotation = planRotation(readdirSync(backupDir), target, new Date());
  for (const old of rotation.remove) {
    rmSync(join(backupDir, old), { recursive: true, force: true });
  }

  const totalRows = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`\nPronto: ${final}`);
  console.log(`  D1: ${tables.length} tabela(s), ${totalRows} linha(s), ${manifest.d1.bytes} bytes`);
  console.log(`  R2: ${objects.length} anexo(s) copiado(s)${missing.length ? `, ${missing.length} faltando no R2` : ''}`);
  console.log(`  Cópias guardadas: ${rotation.keep.join(', ')}`);
  if (rotation.remove.length) console.log(`  Cópias antigas apagadas: ${rotation.remove.join(', ')}`);
});
