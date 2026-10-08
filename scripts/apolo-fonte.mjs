// Upload de fonte para o acervo do Apolo (APO-05, DEC-015): grava o PDF no R2
// (prefixo apolo/fontes/<tema>/<id>) e registra os metadados no D1, numa só
// execução. Pensado para a curadoria em lote (Abner reúne provas/apostilas/
// listas e sobe uma de cada vez); o upload pela tela usa a rota do Worker.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default.
//
// Uso:
//   pnpm run apolo:fonte -- --target local --file prova.pdf --titulo "Prova TJ-SP 2023" \
//     --tipo prova_concurso --tema direito-constitucional --banca FGV --orgao TJ-SP --ano 2023
//   pnpm run apolo:fonte -- --target production --file apostila.pdf --titulo "Apostila módulo 1" --tipo apostila
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-fonte-d1.json';
const SQL_FILE = '.wrangler/apolo-fonte.sql';
const LOCAL = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };
const SOURCE_TYPES = ['prova_concurso', 'apostila', 'lista'];
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Mesmo princípio de tema em atlas_questions (DEC-014): texto livre, sem enum.
// Duplicado de lib/apolo/sources.ts: este script roda fora do bundle da
// Worker (mesmo motivo de scripts/lib/question-bank.mjs duplicar o FNV-1a).
function themeSlug(theme) {
  const clean = (theme ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'sem-tema';
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      file: { type: 'string' },
      titulo: { type: 'string' },
      tema: { type: 'string' },
      tipo: { type: 'string' },
      banca: { type: 'string' },
      orgao: { type: 'string' },
      ano: { type: 'string' },
    },
  });
  const target = requireTarget(values.target);
  const file = requireOption(values, 'file', 'o PDF');
  const title = requireOption(values, 'titulo', 'o título da fonte');
  const sourceType = requireOption(values, 'tipo', `o tipo (${SOURCE_TYPES.join('|')})`);
  if (!SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`--tipo "${sourceType}" inválido. Use: ${SOURCE_TYPES.join(', ')}.`);
  }
  if (!existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
  if (!file.toLowerCase().endsWith('.pdf')) throw new Error('Só arquivos PDF.');
  const size = statSync(file).size;
  if (size <= 0) throw new Error('Arquivo vazio.');
  if (size > MAX_SOURCE_BYTES) throw new Error(`O arquivo excede o limite de ${MAX_SOURCE_BYTES / 1024 / 1024}MB.`);

  const theme = values.tema?.trim() || null;
  const examYear = values.ano ? Number(values.ano) : null;
  if (values.ano && (!Number.isInteger(examYear) || examYear < 1900 || examYear > 2100)) {
    throw new Error(`--ano "${values.ano}" inválido.`);
  }
  const examBoard = sourceType === 'prova_concurso' ? (values.banca?.trim() || null) : null;
  const examOrg = sourceType === 'prova_concurso' ? (values.orgao?.trim() || null) : null;

  const bytes = readFileSync(file);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const id = randomUUID();
  const objectKey = `apolo/fontes/${themeSlug(theme)}/${id}`;
  const now = new Date().toISOString();

  const env = target === 'production' && existsSync(LOCAL_CONFIG)
    ? (() => {
        const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
        return production?.accountId ? { ...process.env, CLOUDFLARE_ACCOUNT_ID: production.accountId } : process.env;
      })()
    : process.env;
  const { wrangler, wranglerJson, d1Rows } = createRunner(env);

  let d1 = LOCAL.d1;
  let bucket = LOCAL.bucket;
  let config = LOCAL.config;
  const where = target === 'production' ? '--remote' : '--local';
  if (target === 'production') {
    if (!existsSync(LOCAL_CONFIG)) {
      throw new Error(`Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`);
    }
    const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
    for (const key of ['d1', 'bucket']) {
      if (!production?.[key] || String(production[key]).startsWith('<')) {
        throw new Error(`Preencha "production.${key}" em ${LOCAL_CONFIG} com o nome real.`);
      }
    }
    d1 = production.d1;
    bucket = production.bucket;
    const database = wranglerJson(
      ['d1', 'list'],
      'Não consegui listar os D1. Rode "npx wrangler login".',
    ).find((item) => item.name === d1);
    if (!database) throw new Error(`O D1 "${d1}" não existe nesta conta Cloudflare.`);
    writeFileSync(
      REMOTE_D1_CONFIG,
      JSON.stringify({ name: 'apolo-fonte', d1_databases: [{ binding: 'DB', database_name: d1, database_id: database.uuid }] }),
    );
    config = REMOTE_D1_CONFIG;
  }

  const duplicate = d1Rows(
    [d1, where, '--config', config],
    `SELECT id, title FROM atlas_question_sources WHERE sha256 = ${literal(sha256)}`,
    'Não consegui conferir duplicidade no D1.',
  )[0];
  if (duplicate) {
    throw new Error(`Este arquivo já está no acervo: "${duplicate.title}" (id ${duplicate.id}).`);
  }

  console.log(`Gravando ${file} (${(size / 1024).toFixed(0)} KB) no R2 ${bucket}...`);
  wrangler(
    ['r2', 'object', 'put', `${bucket}/${objectKey}`, where, '--file', file, '--content-type', 'application/pdf'],
    'Falha ao gravar o PDF no R2. Nada foi registrado no D1.',
  );

  const sql =
    `INSERT INTO atlas_question_sources
     (id, title, theme, source_type, exam_board, exam_org, exam_year, page_count, file_name, mime_type, size_bytes, sha256, object_key, created_at)
     VALUES (${literal(id)}, ${literal(title)}, ${literal(theme)}, ${literal(sourceType)}, ${literal(examBoard)}, ${literal(examOrg)}, ${literal(examYear)}, NULL, ${literal(file.split(/[\\/]/).pop())}, ${literal('application/pdf')}, ${literal(size)}, ${literal(sha256)}, ${literal(objectKey)}, ${literal(now)});\n`;
  writeFileSync(SQL_FILE, sql);
  try {
    wrangler(
      ['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'],
      'Falha ao registrar a fonte no D1. O PDF já está no R2; rode de novo ou apague o objeto.',
    );
  } finally {
    writeFileSync(SQL_FILE, '');
  }
  console.log(`Pronto: fonte "${title}" registrada (id ${id}, ${objectKey}).`);
});
