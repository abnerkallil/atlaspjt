// Restauração de teste de um backup do Atlas (DEC-011, ver docs/BACKUP.md).
// Restaura o dump do D1 e os anexos num D1/R2 do Miniflare NOVO, em
// `.wrangler/restore-test`, e confere tudo contra o manifesto. Nunca toca a
// Cloudflare nem os dados do `pnpm dev` (que ficam em `.wrangler/state`).
//
// DEC-009/DEC-011: só aceita --target local, informado a cada execução.
//
// Uso: pnpm run backup:restore-local -- --target local [--from <pasta-do-backup>]
// Sem --from, usa o backup de produção mais novo da pasta `backupDir` do
// deploy.local.json.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  MANIFEST_FILE,
  TABLES_SQL,
  compareCounts,
  countRowsSql,
  objectsSql,
  parseBackupName,
  restoreOrder,
  rowCounts,
  sha256File,
} from './lib/backup.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const PERSIST = resolve('.wrangler/restore-test');
// Dump reordenado para restauração (tabelas antes dos dados); é o arquivo a usar
// numa recuperação de verdade (docs/BACKUP.md).
const RESTORE_SQL = 'd1-restauracao.sql';
const LOCAL = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };

function step(title) {
  console.log(`\n=== ${title} ===`);
}

function newestProductionBackup() {
  const configFile = 'deploy.local.json';
  const dir = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')).production?.backupDir : null;
  if (!dir || String(dir).startsWith('<') || !existsSync(dir)) {
    throw new Error('Informe o backup com --from <pasta-do-backup> (ou preencha "production.backupDir" no deploy.local.json).');
  }
  const newest = readdirSync(dir)
    .map((name) => ({ name, date: parseBackupName(name, 'production') }))
    .filter((item) => item.date)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  if (!newest) throw new Error(`Nenhum backup de produção completo em "${dir}". Rode o backup primeiro.`);
  return join(dir, newest.name);
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, from: { type: 'string' } },
  });
  requireTarget(values.target, ['local']);
  const from = resolve(values.from ?? newestProductionBackup());
  const manifestPath = join(from, MANIFEST_FILE);
  if (!existsSync(manifestPath)) throw new Error(`"${from}" não tem ${MANIFEST_FILE}; não é um backup completo do Atlas.`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.format !== 'atlas-backup' || manifest.version !== 1) {
    throw new Error(`Formato de backup desconhecido em ${manifestPath}.`);
  }
  const { wrangler, d1Rows } = createRunner();
  const local = ['--local', '--persist-to', PERSIST];
  const d1Args = [LOCAL.d1, ...local, '--config', LOCAL.config];

  console.log('Restauração de TESTE no Miniflare local (a Cloudflare não é tocada)');
  console.log(`  backup:  ${from}`);
  console.log(`  criado:  ${manifest.createdAt} (${manifest.target}, commit ${manifest.commit ?? 'desconhecido'})`);
  console.log(`  destino: ${PERSIST}`);

  step('1/4 Conferindo a integridade dos arquivos');
  const problems = [];
  if (sha256File(join(from, manifest.d1.file)) !== manifest.d1.sha256) problems.push(`${manifest.d1.file} alterado ou corrompido`);
  for (const object of manifest.r2.objects) {
    const path = join(from, object.file);
    if (!existsSync(path)) problems.push(`${object.file} (anexo ${object.attachmentId}) não existe`);
    else if (sha256File(path) !== object.sha256) problems.push(`${object.file} (anexo ${object.attachmentId}) alterado ou corrompido`);
  }
  if (problems.length) throw new Error(`O backup não está íntegro:\n  ${problems.join('\n  ')}`);
  console.log(`OK: dump e ${manifest.r2.objects.length} anexo(s) batem com o manifesto.`);

  step('2/4 Restaurando o D1 num Miniflare novo');
  rmSync(PERSIST, { recursive: true, force: true });
  mkdirSync(PERSIST, { recursive: true });
  const ordered = join(PERSIST, RESTORE_SQL);
  writeFileSync(ordered, restoreOrder(readFileSync(join(from, manifest.d1.file), 'utf8')));
  wrangler(['d1', 'execute', ...d1Args, '--file', ordered, '--yes'], 'Falha ao restaurar o dump no D1 local.');
  const tables = d1Rows(d1Args, TABLES_SQL, 'Não consegui listar as tabelas restauradas.').map((row) => row.name);
  const counts = tables.length ? rowCounts(d1Rows(d1Args, countRowsSql(tables), 'Não consegui contar as linhas restauradas.')) : {};
  const differences = compareCounts(manifest.d1.tables, counts);
  if (differences.length) throw new Error(`Contagem de linhas diferente do backup:\n  ${differences.join('\n  ')}`);
  console.log(`OK: ${tables.length} tabela(s) com as mesmas contagens do backup.`);

  step(`3/4 Restaurando ${manifest.r2.objects.length} anexo(s) no R2 local`);
  const check = mkdtempSync(join(tmpdir(), 'atlas-restore-'));
  try {
    manifest.r2.objects.forEach((object, index) => {
      const path = `${LOCAL.bucket}/${object.key}`;
      wrangler(
        ['r2', 'object', 'put', path, ...local, '--file', join(from, object.file), '--content-type', object.mimeType],
        `Falha ao gravar o anexo ${object.attachmentId} no R2 local.`,
        { capture: true },
      );
      const copy = join(check, `${index}.bin`);
      wrangler(['r2', 'object', 'get', path, ...local, '--file', copy], `Falha ao reler o anexo ${object.attachmentId}.`, {
        capture: true,
      });
      if (sha256File(copy) !== object.sha256) throw new Error(`O anexo ${object.attachmentId} voltou diferente do backup.`);
    });
  } finally {
    rmSync(check, { recursive: true, force: true });
  }
  console.log('OK: todos os anexos relidos do R2 local batem byte a byte.');

  step('4/4 Conferindo D1 e R2 juntos');
  const objectsQuery = objectsSql(tables);
  const rows = objectsQuery ? d1Rows(d1Args, objectsQuery, 'Não consegui ler os anexos restaurados.') : [];
  const restored = new Set(manifest.r2.objects.map((object) => object.key));
  const orphanRows = rows.filter((row) => !restored.has(row.object_key));
  const known = new Set(manifest.r2.missing ?? []);
  const unexpected = orphanRows.filter((row) => !known.has(row.object_key));
  if (unexpected.length) {
    throw new Error(`Anexo(s) no D1 restaurado sem objeto no R2: ${unexpected.map((row) => row.id).join(', ')}`);
  }
  if (orphanRows.length) {
    console.log(`AVISO: ${orphanRows.length} anexo(s) já estavam sem objeto no R2 quando o backup foi feito (ver "missing" no manifesto).`);
  }
  console.log(`OK: ${rows.length - orphanRows.length} de ${rows.length} anexo(s) do D1 têm o arquivo no R2.`);

  console.log('\nRestauração de teste concluída com sucesso. Produção não foi tocada.');
  console.log(`A cópia restaurada e o ${RESTORE_SQL} ficam em ${PERSIST} até a próxima restauração de teste; pode apagar a pasta.`);
});
