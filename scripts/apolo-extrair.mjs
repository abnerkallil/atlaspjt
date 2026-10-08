// Extrator determinístico de questões (APO-06) + carga na fila de curadoria
// (APO-07): lê um PDF do acervo de fontes (APO-05) ou um arquivo local, tira
// o texto com unpdf e corta em rascunhos de questão por regra
// (scripts/lib/extractor.mjs) — nunca IA (DEC-014). Com --target, os
// rascunhos entram em atlas_question_drafts como "pendente"; sem --target,
// só grava o JSON em disco (modo de ensaio). Nunca gera `atlas_questions`
// diretamente — isso só acontece quando um humano aprova na tela /rascunhos.
//
// DEC-009: o ambiente vem de --target a cada execução, sem default.
//
// Uso:
//   pnpm run apolo:extrair -- --file prova.pdf --formato cebraspe --gabarito gabarito.txt
//   pnpm run apolo:extrair -- --target local --fonte <id-da-fonte>
//   pnpm run apolo:extrair -- --target local --file prova.pdf --gabarito gabarito.txt --saida rascunhos.json
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { cleanText, detectFormat, extractQuestions, parseGabarito } from './lib/extractor.mjs';
import { hashQuestionText, lintQuestions } from './lib/question-bank.mjs';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-extrair-d1.json';
const SQL_FILE = '.wrangler/apolo-rascunhos.sql';
const LOCAL = { d1: 'site-creator-d1', bucket: 'site-creator-r2', config: 'wrangler.local.jsonc' };
const FORMATS = ['cebraspe', 'alternativas', 'generico'];

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function readPdfText(path) {
  const { extractText } = await import('unpdf');
  const bytes = new Uint8Array(readFileSync(path));
  const { text, totalPages } = await extractText(bytes, { mergePages: true });
  return { text, totalPages };
}

// d1/r2 do alvo: o R2 usa o nome do bucket direto (sem --config); o D1 exige
// um arquivo com o id real do banco, resolvido via "wrangler d1 list".
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
    JSON.stringify({ name: 'apolo-extrair', d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }] }),
  );
  return { d1: production.d1, bucket: production.bucket, config: REMOTE_D1_CONFIG, where: '--remote' };
}

// Grava cada rascunho em atlas_question_drafts, "pendente" (APO-07 decide o
// resto). Linter de Haladyna (APO-04) roda aqui, só para gerar os avisos
// mostrados na curadoria — nenhum erro bloqueia a extração, diferente da
// importação direta: um rascunho malformado é problema da curadoria resolver.
function draftsSql(drafts, { sourceId, theme, examBoard, examOrg, examYear, now }) {
  const forLinter = drafts.map((d, index) => ({
    __line: d.number,
    id: String(d.number ?? index),
    prompt: d.prompt,
    options: d.options ?? null,
    correctOption: d.correctOption ?? null,
  }));
  const warningsById = new Map();
  for (const issue of lintQuestions(forLinter)) {
    if (issue.severity !== 'aviso') continue;
    const list = warningsById.get(issue.id) ?? [];
    list.push(issue.message);
    warningsById.set(issue.id, list);
  }
  return drafts.map((draft, index) => {
    const id = randomUUID();
    const lintId = String(draft.number ?? index);
    const warnings = warningsById.get(lintId) ?? [];
    const sql =
      `INSERT INTO atlas_question_drafts
       (id, source_id, theme, kind, prompt, options_json, correct_option, model_answer, origin, exam_board, exam_org,
        exam_year, text_hash, lint_warnings_json, status, created_at)
       VALUES (${literal(id)}, ${literal(sourceId)}, ${literal(theme)}, ${literal(draft.kind)}, ${literal(draft.prompt)}, ` +
      `${literal(draft.options ? JSON.stringify(draft.options) : null)}, ${literal(draft.correctOption ?? null)}, ` +
      `${literal(draft.modelAnswer ?? null)}, 'oficial', ${literal(examBoard)}, ${literal(examOrg)}, ${literal(examYear)}, ` +
      `${literal(hashQuestionText(draft.prompt))}, ${literal(warnings.length ? JSON.stringify(warnings) : null)}, 'pendente', ${literal(now)});`;
    return { id, sql };
  });
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      file: { type: 'string' },
      fonte: { type: 'string' },
      formato: { type: 'string' },
      gabarito: { type: 'string' },
      saida: { type: 'string' },
    },
  });
  if (values.formato && !FORMATS.includes(values.formato)) {
    throw new Error(`--formato "${values.formato}" inválido. Use: ${FORMATS.join(', ')}.`);
  }

  let pdfPath = values.file;
  let cleanupDir = null;
  let fonte = null;
  let targetInfo = null;
  if (values.target) {
    const target = requireTarget(values.target);
    const { wrangler, wranglerJson, d1Rows } = createRunner(process.env);
    targetInfo = { ...resolveTarget(target, wranglerJson), wrangler, d1Rows };
  }

  if (!pdfPath) {
    const fonteId = requireOption(values, 'fonte', 'o id da fonte (ou use --file para um PDF local)');
    if (!targetInfo) throw new Error('Informe --target para baixar a fonte do R2.');
    const rows = targetInfo.d1Rows(
      [targetInfo.d1, targetInfo.where, '--config', targetInfo.config],
      `SELECT object_key, title, theme, exam_board, exam_org, exam_year FROM atlas_question_sources WHERE id = ${literal(fonteId)}`,
      'Não consegui consultar a fonte no D1.',
    );
    const row = rows[0];
    if (!row) throw new Error(`Fonte "${fonteId}" não encontrada.`);
    fonte = { id: fonteId, ...row };
    cleanupDir = mkdtempSync(join(tmpdir(), 'apolo-extrair-'));
    pdfPath = join(cleanupDir, 'fonte.pdf');
    console.log(`Baixando "${row.title}" do R2...`);
    targetInfo.wrangler(
      ['r2', 'object', 'get', `${targetInfo.bucket}/${row.object_key}`, targetInfo.where, '--file', pdfPath],
      'Falha ao baixar o PDF do R2.',
      { capture: true },
    );
  }
  if (!existsSync(pdfPath)) throw new Error(`Arquivo não encontrado: ${pdfPath}`);

  try {
    console.log(`Lendo ${pdfPath}...`);
    const { text, totalPages } = await readPdfText(pdfPath);
    console.log(`${totalPages} página(s) de texto extraídas.`);

    const format = values.formato ?? detectFormat(cleanText(text));
    const gabarito = values.gabarito ? parseGabarito(readFileSync(values.gabarito, 'utf8'), format) : new Map();
    const result = extractQuestions(text, { format, gabarito });

    console.log(`Formato: ${result.format}.`);
    console.log(
      `${result.drafts.length} rascunho(s) cortado(s) automaticamente, ${result.manual.length} manual(is), ${result.voided} anulada(s).`,
    );
    for (const line of result.report) console.log(`  ${line}`);

    const output = values.saida ?? '.wrangler/apolo-rascunhos.json';
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Rascunhos gravados em ${output}.`);

    if (targetInfo) {
      const rows = draftsSql(result.drafts, {
        sourceId: fonte?.id ?? null,
        theme: fonte?.theme ?? null,
        examBoard: fonte?.exam_board ?? null,
        examOrg: fonte?.exam_org ?? null,
        examYear: fonte?.exam_year ?? null,
        now: new Date().toISOString(),
      });
      if (rows.length) {
        writeFileSync(SQL_FILE, `${rows.map((row) => row.sql).join('\n')}\n`);
        try {
          targetInfo.wrangler(
            ['d1', 'execute', targetInfo.d1, targetInfo.where, '--config', targetInfo.config, '--file', SQL_FILE, '--yes'],
            'Falha ao gravar os rascunhos no D1.',
          );
        } finally {
          writeFileSync(SQL_FILE, '');
        }
      }
      console.log(`${rows.length} rascunho(s) na fila de curadoria ("pendente") em ${targetInfo.d1}.`);
    } else {
      console.log('Sem --target: só o JSON foi gravado (ensaio). Use --target para entrar na fila de curadoria.');
    }
  } finally {
    if (cleanupDir) rmSync(cleanupDir, { recursive: true, force: true });
  }
});
