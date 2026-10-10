// Carrega o lote de 30 provas autorais Atlas (60 questoes cada, 1800 no
// total) no acervo de fontes do Apolo: para cada prova, sobe o PDF para o
// R2 (APO-05, mesmo prefixo apolo/fontes/<tema>/<id> de scripts/apolo-fonte.mjs)
// e grava a fonte (tipo "lista", sem banca/orgao/ano — sao provas escritas
// pela Atlas, nao provas de concurso reais digitalizadas) e os 60 rascunhos
// de questao (atlas_question_drafts, "pendente") em uma unica execucao por
// prova, reaproveitando o linter de Haladyna (APO-04) como em apolo-extrair.mjs.
//
// Nunca grava em atlas_questions diretamente — isso so acontece quando um
// humano aprova cada rascunho na tela /rascunhos (APO-07), exatamente como
// qualquer outro rascunho extraido de PDF. Pedido de Abner (thread "Cards em
// escada do Apolo", 2026-10-10): alimentar o banco de fontes com uma base
// mista inicial para o Apolo "ter um chao pra rodar".
//
// DEC-009: o ambiente vem de --target a cada execucao, sem default.
//
// Uso:
//   pnpm run apolo:fontes-autorais -- --check
//   pnpm run apolo:fontes-autorais -- --target local --dir data/apolo/fontes-autorais
//   pnpm run apolo:fontes-autorais -- --target production --dir data/apolo/fontes-autorais --only ATLAS-SIM-01
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { hashQuestionText, lintQuestions } from './lib/question-bank.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-fontes-autorais-d1.json';
const SQL_FILE = '.wrangler/apolo-fontes-autorais.sql';
const LOCAL = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };
const DEFAULT_DIR = 'data/apolo/fontes-autorais';
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Mesma normalizacao de lib/apolo/sources.ts (duplicada aqui de propósito,
// como em apolo-fonte.mjs: este script roda fora do bundle da Worker).
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

function readManifest(dir) {
  const path = join(dir, 'manifest.json');
  if (!existsSync(path)) throw new Error(`Manifesto não encontrado: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadExam(dir, entry) {
  const jsonPath = join(dir, entry.jsonFile);
  const pdfPath = join(dir, 'pdf', entry.pdfFile);
  if (!existsSync(jsonPath)) throw new Error(`Arquivo de questões não encontrado: ${jsonPath}`);
  if (!existsSync(pdfPath)) throw new Error(`PDF não encontrado: ${pdfPath}`);
  const exam = JSON.parse(readFileSync(jsonPath, 'utf8'));
  return { exam, pdfPath };
}

function resolveTarget(target, wranglerJson) {
  if (target !== 'production') return { d1: LOCAL.d1, bucket: LOCAL.bucket, config: LOCAL.config, where: '--local' };
  if (!existsSync(LOCAL_CONFIG)) throw new Error(`Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`);
  const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  for (const key of ['d1', 'bucket']) {
    if (!production?.[key] || String(production[key]).startsWith('<')) {
      throw new Error(`Preencha "production.${key}" em ${LOCAL_CONFIG} com o nome real.`);
    }
  }
  const database = wranglerJson(['d1', 'list'], 'Não consegui listar os D1. Rode "npx wrangler login".').find(
    (item) => item.name === production.d1,
  );
  if (!database) throw new Error(`O D1 "${production.d1}" não existe nesta conta Cloudflare.`);
  writeFileSync(
    REMOTE_D1_CONFIG,
    JSON.stringify({
      name: 'apolo-fontes-autorais',
      d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }],
    }),
  );
  return { d1: production.d1, bucket: production.bucket, config: REMOTE_D1_CONFIG, where: '--remote' };
}

// Mesma forma de draft de scripts/apolo-extrair.mjs: certo_errado usa
// ['Errado','Certo'] com indice 1 = Certo, igual ao linter/corretor esperam.
function draftRows(exam, sourceId, now) {
  const forLinter = exam.questions.map((q) => ({
    __line: q.index,
    id: String(q.index),
    prompt: q.prompt,
    options: q.options,
    correctOption: q.correctOption,
  }));
  const warningsById = new Map();
  for (const issue of lintQuestions(forLinter)) {
    if (issue.severity !== 'aviso') continue;
    const list = warningsById.get(issue.id) ?? [];
    list.push(issue.message);
    warningsById.set(issue.id, list);
  }
  const errors = lintQuestions(forLinter).filter((issue) => issue.severity === 'erro');
  if (errors.length) {
    throw new Error(
      `${exam.examId}: ${errors.length} erro(s) de linter (ex.: questão ${errors[0].id} — ${errors[0].message}).`,
    );
  }
  return exam.questions.map((q) => {
    const id = randomUUID();
    const warnings = warningsById.get(String(q.index)) ?? [];
    const sql =
      `INSERT INTO atlas_question_drafts
       (id, source_id, theme, kind, prompt, options_json, correct_option, explanation, origin, text_hash,
        lint_warnings_json, status, created_at)
       VALUES (${literal(id)}, ${literal(sourceId)}, ${literal(q.theme)}, ${literal(q.kind)}, ${literal(q.prompt)}, ` +
      `${literal(JSON.stringify(q.options))}, ${literal(q.correctOption)}, ${literal(q.explanation)}, 'oficial', ` +
      `${literal(hashQuestionText(q.prompt))}, ${literal(warnings.length ? JSON.stringify(warnings) : null)}, 'pendente', ${literal(now)});`;
    return { id, sql };
  });
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      dir: { type: 'string' },
      only: { type: 'string' },
      check: { type: 'boolean' },
    },
  });
  const dir = values.dir ?? DEFAULT_DIR;
  const manifest = readManifest(dir);
  const entries = values.only ? manifest.filter((entry) => entry.examId === values.only) : manifest;
  if (!entries.length) throw new Error(`Nenhuma prova encontrada (--only "${values.only}"?).`);

  console.log(`${entries.length} prova(s) no lote, ${entries.reduce((sum, e) => sum + e.questionCount, 0)} questão(ões) no total.`);

  if (values.check) {
    for (const entry of entries) {
      const { exam } = loadExam(dir, entry);
      draftRows(exam, null, new Date().toISOString());
      console.log(`  ok: ${exam.examId} (${exam.questions.length} questões, sem erro de linter).`);
    }
    console.log('Só --check: nada foi gravado.');
    return;
  }

  const target = requireTarget(values.target);
  const { wrangler, wranglerJson, d1Rows } = createRunner(process.env);
  const { d1, bucket, config, where } = resolveTarget(target, wranglerJson);

  let totalSources = 0;
  let totalDrafts = 0;
  for (const entry of entries) {
    const { exam, pdfPath } = loadExam(dir, entry);
    const size = statSync(pdfPath).size;
    if (size <= 0 || size > MAX_SOURCE_BYTES) {
      throw new Error(`${exam.examId}: PDF com tamanho inválido (${size} bytes).`);
    }
    const bytes = readFileSync(pdfPath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    const duplicate = d1Rows(
      [d1, where, '--config', config],
      `SELECT id, title FROM atlas_question_sources WHERE sha256 = ${literal(sha256)}`,
      `Não consegui conferir duplicidade de ${exam.examId} no D1.`,
    )[0];
    if (duplicate) {
      console.log(`  pulando ${exam.examId}: já está no acervo ("${duplicate.title}", id ${duplicate.id}).`);
      continue;
    }

    const sourceId = randomUUID();
    const objectKey = `apolo/fontes/${themeSlug(null)}/${sourceId}`;
    const now = new Date().toISOString();

    console.log(`Gravando ${exam.examId} (${(size / 1024).toFixed(0)} KB) no R2 ${bucket}...`);
    wrangler(
      ['r2', 'object', 'put', `${bucket}/${objectKey}`, where, '--file', pdfPath, '--content-type', 'application/pdf'],
      `Falha ao gravar o PDF de ${exam.examId} no R2.`,
    );

    const rows = draftRows(exam, sourceId, now);
    const sourceSql =
      `INSERT INTO atlas_question_sources
       (id, title, theme, source_type, exam_board, exam_org, exam_year, page_count, file_name, mime_type, size_bytes, sha256, object_key, created_at)
       VALUES (${literal(sourceId)}, ${literal(exam.title)}, NULL, 'lista', NULL, NULL, NULL, NULL, ${literal(`${exam.examId}.pdf`)}, ` +
      `'application/pdf', ${literal(size)}, ${literal(sha256)}, ${literal(objectKey)}, ${literal(now)});`;
    writeFileSync(SQL_FILE, `${sourceSql}\n${rows.map((row) => row.sql).join('\n')}\n`);
    try {
      wrangler(
        ['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'],
        `Falha ao registrar ${exam.examId} no D1. O PDF já está no R2; rode de novo (é idempotente pelo sha256) ou apague o objeto.`,
      );
    } finally {
      writeFileSync(SQL_FILE, '');
    }
    totalSources += 1;
    totalDrafts += rows.length;
    console.log(`  ok: ${exam.examId} — fonte ${sourceId}, ${rows.length} rascunho(s) pendente(s).`);
  }
  console.log(`Pronto: ${totalSources} fonte(s) nova(s), ${totalDrafts} rascunho(s) na fila de curadoria em ${d1}.`);
});
