// APA-18: carga administrativa de aulas base escritas à mão
// (`model='claude-manual'`), disciplina por disciplina (ou lote menor).
//
// `docs/APACHE.md` (seção APA-18) exige que isso passe pelo MESMO caminho de
// gravação que a produção usa (`saveLesson`, APA-05 — `lib/apache/lesson-store.ts`):
// R2 gzip + upsert em D1, versão incrementada a partir do que já existe,
// objeto antigo apagado só depois do novo já gravado. `saveLesson` só roda
// dentro do Worker (bindings reais `DB`/`ATTACHMENTS`) e não existe rota HTTP
// administrativa para isso, então este script duplica a mesma lógica usando a
// CLI do `wrangler` — mesmo padrão já usado por `scripts/backup.mjs`,
// `scripts/deploy.mjs` e `scripts/apolo-aplicar-curadoria.mjs` (login do
// `wrangler`, nunca token manual; nomes de D1/bucket lidos de
// `deploy.local.json`, nunca placeholder). Se `lib/apache/lesson-store.ts`
// ou `lib/apache/schema.ts` mudarem o formato de gravação/validação, atualize
// este script também.
//
// Uso (um lote por vez):
//   pnpm run apache:carregar-aulas -- --file data/apache/aulas/<lote>.json --target local
//   pnpm run apache:carregar-aulas -- --file data/apache/aulas/<lote>.json --target production
//
// Uso (TODOS os lotes de data/apache/aulas/, em ordem alfabética, um comando
// só — regra do Abner de não mandar um comando por sub-lote quando a carga
// inteira já está pronta): --all no lugar de --file. Carrega lote a lote e
// PARA no primeiro erro (nenhum lote depois do que falhou é tocado); idempotente
// porque cada lote já é (reexecutar depois de um erro corrigido retoma do
// zero, sem duplicar: lotes já carregados só ganham uma nova versão com o
// mesmo conteúdo, o que é inofensivo).
//   pnpm run apache:carregar-aulas -- --all --target production
//   pnpm run apache:carregar-todas-aulas -- --target production
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { requireTarget, requireOption, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
// Mesmos nomes dos bindings locais do vite.config.ts / wrangler.local.jsonc.
const LOCAL_RESOURCES = { d1: 'site-creator-d1', bucket: 'site-creator-r2' };
const REMOTE_D1_CONFIG = '.wrangler/apache-carregar-aulas-d1.json';
const TMP_DIR = '.wrangler/apache-carregar-aulas-tmp';
const MODEL = 'claude-manual';
const LOTES_DIR = 'data/apache/aulas';

// Mesmos limites de lib/apache/schema.ts (Gate APA-14 item 6).
const MAX_FIELD_CHARS = 2000;
const MAX_LIST_ITEMS = 20;

// Cloudflare Workers Free (D1): 100.000 linhas escritas / dia, reset 00:00 UTC
// (ver docs/APACHE.md e memória do projeto). Cada aula carregada gera no
// máximo 1 UPDATE/INSERT (1 linha escrita). Um aviso, não um bloqueio: a
// carga completa (183 aulas) fica bem abaixo do teto mesmo somada a outro
// tráfego do dia, mas o aviso ajuda a notar se `--all` crescer muito no
// futuro.
const D1_DAILY_WRITE_WARN_THRESHOLD = 20000;

export function listLoteFiles() {
  return readdirSync(LOTES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => join(LOTES_DIR, name));
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

function checkField(value, field, allowEmpty = true) {
  if (typeof value !== 'string') throw new Error(`campo "${field}" ausente ou não é string`);
  if (!allowEmpty && value.trim().length === 0) throw new Error(`campo "${field}" não pode ser vazio`);
  if (value.length > MAX_FIELD_CHARS) throw new Error(`campo "${field}" excede ${MAX_FIELD_CHARS} caracteres`);
  return value;
}

function checkList(value, field, allowEmpty = true) {
  if (!Array.isArray(value)) throw new Error(`campo "${field}" ausente ou não é lista`);
  if (!allowEmpty && value.length === 0) throw new Error(`campo "${field}" não pode ser vazio`);
  if (value.length > MAX_LIST_ITEMS) throw new Error(`campo "${field}" excede ${MAX_LIST_ITEMS} itens`);
  return value;
}

// Mesma validação de lib/apache/schema.ts#validateLesson (duplicada: ver
// aviso no topo do arquivo).
export function validateLesson(data, label) {
  if (typeof data !== 'object' || data === null) throw new Error(`${label}: aula inválida (não é objeto)`);
  if (data.v !== 1) throw new Error(`${label}: campo "v" ausente ou diferente de 1`);
  checkField(data.obj, `${label}.obj`, false);
  checkList(data.cc, `${label}.cc`, false).forEach((c, i) => {
    checkField(c?.id, `${label}.cc[${i}].id`);
    checkField(c?.nome, `${label}.cc[${i}].nome`);
    checkField(c?.def, `${label}.cc[${i}].def`);
  });
  checkList(data.rl, `${label}.rl`).forEach((r, i) => {
    checkField(r?.de, `${label}.rl[${i}].de`);
    checkField(r?.para, `${label}.rl[${i}].para`);
    checkField(r?.tipo, `${label}.rl[${i}].tipo`);
  });
  checkList(data.fm, `${label}.fm`).forEach((f, i) => {
    checkField(f?.id, `${label}.fm[${i}].id`);
    checkField(f?.expr, `${label}.fm[${i}].expr`);
    checkField(f?.legenda, `${label}.fm[${i}].legenda`);
  });
  checkList(data.ex, `${label}.ex`).forEach((e, i) => {
    checkField(e?.conceitoId, `${label}.ex[${i}].conceitoId`);
    checkField(e?.texto, `${label}.ex[${i}].texto`);
  });
  checkList(data.pg, `${label}.pg`).forEach((p, i) => checkField(p, `${label}.pg[${i}]`));
  checkField(data.rs, `${label}.rs`, false);
}

function lessonObjectKey(contentId, version) {
  return `apache/aulas/${contentId}/v${version}.json.gz`;
}

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function readLoteEntries(file) {
  if (!existsSync(file)) throw new Error(`Arquivo "${file}" não encontrado.`);
  const entries = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`"${file}" precisa ser uma lista não vazia de aulas.`);
  }
  entries.forEach((entry, index) => {
    if (typeof entry?.contentId !== 'string' || !entry.contentId) {
      throw new Error(`entries[${index}]: "contentId" ausente ou vazio.`);
    }
    validateLesson(entry.lesson, `entries[${index}] (${entry.contentId})`);
  });
  return entries;
}

function loadFile(file, { target, d1, bucket, where, d1Config, wrangler, d1Rows }) {
  const entries = readLoteEntries(file);

  console.log(`\nCarregando ${entries.length} aula(s) de "${file}" em ${target.toUpperCase()}`);

  mkdirSync(TMP_DIR, { recursive: true });

  for (const entry of entries) {
    const { contentId, lesson } = entry;
    const existing =
      d1Rows(
        [d1, where, '--config', d1Config],
        `SELECT version, object_key FROM atlas_apache_lessons WHERE content_id = ${literal(contentId)};`,
        `Não consegui ler o status atual de "${contentId}".`,
      )[0] ?? null;
    // Mesma regra de lib/apache/lesson-store.ts#saveLesson: uma linha
    // 'pendente' sem object_key não conta como versão anterior.
    const version = existing?.object_key ? existing.version + 1 : 1;
    const objectKey = lessonObjectKey(contentId, version);
    const now = new Date().toISOString();

    const bytes = gzipSync(Buffer.from(JSON.stringify(lesson)));
    const tmpFile = join(TMP_DIR, `${contentId}-v${version}.json.gz`);
    writeFileSync(tmpFile, bytes);
    wrangler(
      ['r2', 'object', 'put', `${bucket}/${objectKey}`, where, '--file', tmpFile, '--content-type', 'application/json', '--content-encoding', 'gzip'],
      `Falha ao gravar "${objectKey}" no R2.`,
      { capture: true },
    );
    rmSync(tmpFile);

    const sql = existing
      ? `UPDATE atlas_apache_lessons SET status = 'gerada', version = ${version}, model = ${literal(MODEL)}, object_key = ${literal(objectKey)}, generated_at = ${literal(now)}, error_message = NULL, updated_at = ${literal(now)} WHERE content_id = ${literal(contentId)};`
      : `INSERT INTO atlas_apache_lessons (id, content_id, status, version, model, object_key, generated_at, reported_count, error_message, updated_at) VALUES (${literal(randomUUID())}, ${literal(contentId)}, 'gerada', ${version}, ${literal(MODEL)}, ${literal(objectKey)}, ${literal(now)}, 0, NULL, ${literal(now)});`;
    wrangler(['d1', 'execute', d1, where, '--config', d1Config, '--command', sql], `Falha ao gravar o status de "${contentId}" no D1.`, {
      capture: true,
    });

    // Objeto antigo só é apagado depois do novo já gravado (mesma ordem de saveLesson).
    if (existing?.object_key && existing.object_key !== objectKey) {
      wrangler(['r2', 'object', 'delete', `${bucket}/${existing.object_key}`, where], '', { capture: true });
    }
    console.log(`  OK  ${contentId}  (v${version})`);
  }

  console.log(`${entries.length} aula(s) gravada(s) com model="${MODEL}" a partir de "${file}".`);
  return entries.length;
}

// Só roda a carga quando o arquivo é executado diretamente (CLI) -- quando
// importado (como no teste tests/apache-carregar-aulas.test.ts, que só usa
// as funções puras exportadas acima), não deve tentar ler --target de
// process.argv nem tocar wrangler/D1/R2.
const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isMainModule) {
  await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { file: { type: 'string' }, all: { type: 'boolean' }, target: { type: 'string' } },
  });
  const target = requireTarget(values.target);

  let files;
  if (values.all) {
    if (values.file) throw new Error('Use "--all" OU "--file", não os dois ao mesmo tempo.');
    files = listLoteFiles();
    if (files.length === 0) throw new Error(`Nenhum lote encontrado em "${LOTES_DIR}".`);
  } else {
    files = [requireOption(values, 'file', 'o caminho do arquivo JSON de aulas (ou use --all para carregar todos os lotes)')];
  }

  // Valida TODOS os lotes antes de gravar qualquer coisa — um erro de schema
  // num lote do fim da lista não deve deixar os anteriores já gravados numa
  // carga parcial sem aviso prévio de que o restante ia falhar.
  const entriesByFile = files.map((file) => ({ file, entries: readLoteEntries(file) }));
  const totalEntries = entriesByFile.reduce((sum, { entries }) => sum + entries.length, 0);

  console.log(`${files.length} lote(s), ${totalEntries} aula(s) no total.`);
  console.log(`Estimativa D1 (Workers Free, 100.000 linhas escritas/dia): ~${totalEntries} linha(s) escrita(s), ~${totalEntries} lida(s).`);
  console.log(`Estimativa R2: ~${totalEntries} put(s) (+ delete apenas em recarga de aula já existente).`);
  if (totalEntries > D1_DAILY_WRITE_WARN_THRESHOLD) {
    console.log(
      `AVISO: ${totalEntries} linha(s) escrita(s) nesta carga está acima do limite informal de ${D1_DAILY_WRITE_WARN_THRESHOLD}/carga ` +
        'usado neste projeto para não se aproximar do teto diário de 100.000 do D1 Free — considere dividir em lotes menores.',
    );
  }

  const production = target === 'production' ? readProductionConfig() : null;
  const env = production?.accountId ? { ...process.env, CLOUDFLARE_ACCOUNT_ID: production.accountId } : process.env;
  const { wrangler, d1Rows } = createRunner(env);
  const d1 = production ? production.d1 : LOCAL_RESOURCES.d1;
  const bucket = production ? production.bucket : LOCAL_RESOURCES.bucket;
  const where = production ? '--remote' : '--local';

  let d1Config = 'wrangler.local.jsonc';
  if (production) {
    const database = wrangler(
      ['d1', 'list', '--json'],
      'Não consegui listar os D1. Rode "npx wrangler login" e tente de novo.',
      { capture: true },
    );
    const match = JSON.parse(database.slice(database.search(/[[{]/))).find((item) => item.name === d1);
    if (!match) throw new Error(`O D1 "${d1}" não existe nesta conta Cloudflare.`);
    mkdirSync('.wrangler', { recursive: true });
    writeFileSync(
      REMOTE_D1_CONFIG,
      JSON.stringify({ name: 'apache-carregar-aulas', d1_databases: [{ binding: 'DB', database_name: d1, database_id: match.uuid }] }),
    );
    d1Config = REMOTE_D1_CONFIG;
  }

  console.log(`  D1: ${d1}`);
  console.log(`  R2: ${bucket}`);

  const context = { target, production, d1, bucket, where, d1Config, wrangler, d1Rows };

  // Carrega lote a lote, na ordem já validada acima, e PARA no primeiro erro
  // (a mensagem diz qual lote falhou; os lotes antes dele já foram gravados —
  // idempotente, então reexecutar o mesmo comando depois de corrigir o
  // problema é seguro e não duplica nada).
  let loaded = 0;
  for (const { file } of entriesByFile) {
    try {
      loaded += loadFile(file, context);
    } catch (error) {
      throw new Error(
        `Carga interrompida em "${file}" (${loaded}/${totalEntries} aula(s) já gravada(s) com sucesso antes deste lote): ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(`\nConcluído: ${loaded} aula(s) gravada(s) em ${entriesByFile.length} lote(s).`);
  });
}
