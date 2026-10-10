// Carrega o banco adicional de questões curadas por IA (1800 questões, gerado
// e verificado por duas sessões Claude em paralelo — uma gera, a outra
// recomputa cada cálculo em Python e revisa o conteúdo de domínio antes de
// aceitar) no acervo de fontes do Apolo.
//
// Diferente de scripts/apolo-fontes-autorais.mjs (30 provas com PDF real),
// este lote não tem um arquivo de origem para subir ao R2: nasceu direto como
// JSON, sem prova escaneada ou escrita como PDF. Por isso grava UMA única
// fonte tipo "lista" cujos metadados (file_name/mime_type/size_bytes/sha256)
// descrevem o próprio JSON de entrada, e cujo object_key usa o prefixo
// `apolo/sem-arquivo/` em vez de `apolo/fontes/<tema>/` — sinaliza que não há
// objeto correspondente no R2 (a rota de download already retorna 404
// "Arquivo não encontrado" nesse caso, sem erro). Nenhum byte sobe ao R2
// nesta carga.
//
// Como em apolo-fontes-autorais.mjs: nunca grava em atlas_questions direto —
// os 1800 rascunhos entram como "pendente" em atlas_question_drafts, para
// aprovação manual em /rascunhos (APO-07), um por um.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default.
//
// Uso:
//   pnpm run apolo:banco-novo -- --check
//   pnpm run apolo:banco-novo -- --target local
//   pnpm run apolo:banco-novo -- --target production
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { hashQuestionText, lintQuestions } from './lib/question-bank.mjs';
import { requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-banco-novo-d1.json';
const SQL_FILE = '.wrangler/apolo-banco-novo.sql';
const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc' };
const DEFAULT_FILE = '/mnt/project-files/apolo/banco-novo/aceitas.json';
const SOURCE_TITLE = 'Banco adicional de questões — curadoria em dupla sessão de IA (2026-10-10)';
const DRAFT_CHUNK_SIZE = 300;

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function readQuestions(file) {
  if (!existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
  const raw = readFileSync(file, 'utf8');
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error(`${file}: esperava um array de questões, não vazio.`);
  }
  return { questions, raw };
}

function lintAll(questions) {
  const forLinter = questions.map((q, i) => ({
    __line: q.index ?? i + 1,
    id: String(q.index ?? i + 1),
    prompt: q.prompt,
    options: q.options,
    correctOption: q.correctOption,
  }));
  const issues = lintQuestions(forLinter);
  const errors = issues.filter((issue) => issue.severity === 'erro');
  if (errors.length) {
    throw new Error(
      `${errors.length} erro(s) de linter (ex.: questão ${errors[0].id} — ${errors[0].message}).`,
    );
  }
  const warningsById = new Map();
  for (const issue of issues) {
    if (issue.severity !== 'aviso') continue;
    const list = warningsById.get(issue.id) ?? [];
    list.push(issue.message);
    warningsById.set(issue.id, list);
  }
  return warningsById;
}

function draftRows(questions, warningsById, sourceId, now) {
  return questions.map((q, i) => {
    const id = randomUUID();
    const key = String(q.index ?? i + 1);
    const warnings = warningsById.get(key) ?? [];
    const sql =
      `INSERT INTO atlas_question_drafts
       (id, source_id, theme, kind, prompt, options_json, correct_option, explanation, origin, text_hash,
        lint_warnings_json, status, created_at)
       VALUES (${literal(id)}, ${literal(sourceId)}, ${literal(q.theme)}, ${literal(q.kind)}, ${literal(q.prompt)}, ` +
      `${literal(JSON.stringify(q.options))}, ${literal(q.correctOption)}, ${literal(q.explanation)}, 'oficial', ` +
      `${literal(hashQuestionText(q.prompt))}, ${literal(warnings.length ? JSON.stringify(warnings) : null)}, 'pendente', ${literal(now)});`;
    return sql;
  });
}

function resolveTarget(target, wranglerJson) {
  if (target !== 'production') return { d1: LOCAL.d1, config: LOCAL.config, where: '--local' };
  if (!existsSync(LOCAL_CONFIG)) throw new Error(`Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`);
  const production = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8')).production;
  if (!production?.d1 || String(production.d1).startsWith('<')) {
    throw new Error(`Preencha "production.d1" em ${LOCAL_CONFIG} com o nome real.`);
  }
  const database = wranglerJson(['d1', 'list'], 'Não consegui listar os D1. Rode "npx wrangler login".').find(
    (item) => item.name === production.d1,
  );
  if (!database) throw new Error(`O D1 "${production.d1}" não existe nesta conta Cloudflare.`);
  writeFileSync(
    REMOTE_D1_CONFIG,
    JSON.stringify({
      name: 'apolo-banco-novo',
      d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }],
    }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      file: { type: 'string' },
      check: { type: 'boolean' },
    },
  });
  const file = values.file ?? DEFAULT_FILE;
  const { questions, raw } = readQuestions(file);
  console.log(`${questions.length} questão(ões) em ${file}.`);

  const warningsById = lintAll(questions);
  const warningCount = [...warningsById.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(`Linter: 0 erro(s), ${warningCount} aviso(s) (não bloqueiam a carga).`);

  if (values.check) {
    console.log('Só --check: nada foi gravado.');
    return;
  }

  const target = requireTarget(values.target);
  const { wrangler, wranglerJson, d1Rows } = createRunner(process.env);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  const sizeBytes = Buffer.byteLength(raw, 'utf8');
  const sha256 = createHash('sha256').update(raw).digest('hex');

  const duplicate = d1Rows(
    [d1, where, '--config', config],
    `SELECT id, title FROM atlas_question_sources WHERE sha256 = ${literal(sha256)}`,
    'Não consegui conferir duplicidade no D1.',
  )[0];
  if (duplicate) {
    console.log(`Já carregado: fonte "${duplicate.title}" (id ${duplicate.id}). Nada a fazer.`);
    return;
  }

  const sourceId = randomUUID();
  const objectKey = `apolo/sem-arquivo/${sourceId}`;
  const now = new Date().toISOString();
  const fileName = file.split('/').pop() ?? 'banco-novo.json';

  const sourceSql =
    `INSERT INTO atlas_question_sources
     (id, title, theme, source_type, exam_board, exam_org, exam_year, page_count, file_name, mime_type, size_bytes, sha256, object_key, created_at)
     VALUES (${literal(sourceId)}, ${literal(SOURCE_TITLE)}, NULL, 'lista', NULL, NULL, NULL, NULL, ${literal(fileName)}, ` +
    `'application/json', ${literal(sizeBytes)}, ${literal(sha256)}, ${literal(objectKey)}, ${literal(now)});`;

  console.log(`Gravando fonte "${SOURCE_TITLE}" (sem arquivo no R2, ${(sizeBytes / 1024).toFixed(0)} KB de JSON)...`);
  writeFileSync(SQL_FILE, `${sourceSql}\n`);
  try {
    wrangler(
      ['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'],
      'Falha ao registrar a fonte no D1.',
    );
  } finally {
    writeFileSync(SQL_FILE, '');
  }

  const rows = draftRows(questions, warningsById, sourceId, now);
  let written = 0;
  for (let i = 0; i < rows.length; i += DRAFT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + DRAFT_CHUNK_SIZE);
    writeFileSync(SQL_FILE, `${chunk.join('\n')}\n`);
    try {
      wrangler(
        ['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'],
        `Falha ao gravar o lote de rascunhos ${i + 1}-${i + chunk.length}. A fonte já foi gravada ` +
          `(id ${sourceId}); rode de novo só os rascunhos que faltam ou apague a fonte e recomece.`,
      );
    } finally {
      writeFileSync(SQL_FILE, '');
    }
    written += chunk.length;
    console.log(`  ${written}/${rows.length} rascunhos gravados...`);
  }

  console.log(`Pronto: fonte ${sourceId}, ${written} rascunho(s) pendente(s) na fila de curadoria em ${d1}.`);
});
