// Carrega questões de provas reais de concurso já curadas (conteúdo do
// roadmap, bloom e explicação já decididos por quem gerou o arquivo) como
// rascunhos "pendente" em atlas_question_drafts — nunca em atlas_questions
// diretamente. Pensado para o caso em que o enunciado real exige leitura
// humana/IA para separar o que é de Contabilidade e, quando a prova não trai
// gabarito, para resolver a resposta certa; o corte determinístico de
// scripts/apolo-extrair.mjs não serve aqui (opções em minúscula "a)" fora do
// padrão A-E que ele reconhece, e nenhuma classificação de conteúdo).
//
// Cada rascunho sai já com content_id, bloom_level, knowledge_type e
// explanation preenchidos, então scripts/apolo-aprovar-rascunhos-roadmap.mjs
// (PR #116) pode aprová-lo no mesmo lote, sem outro passo de curadoria manual
// — igual ao pedido do Abner (thread "Aprovar rascunhos do roadmap de
// contabilidade", 2026-11-11): nunca sobrescreve nada, só insere.
//
// Formato do arquivo (array JSON): prompt, kind ("multipla" por ora), options
// (array A..E), correctOption (índice 0-based), contentId, bloomLevel,
// knowledgeType, explanation, examBoard, examOrg, examYear.
//
// Uso:
//   pnpm run apolo:carregar-provas-curadas -- --file caminho.json --check
//   pnpm run apolo:carregar-provas-curadas -- --file caminho.json --target local
//   pnpm run apolo:carregar-provas-curadas -- --file caminho.json --target production
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { hashQuestionText, lintQuestions } from './lib/question-bank.mjs';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc', where: '--local' };
const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/apolo-carregar-provas-curadas-d1.json';
const SQL_FILE = '.wrangler/apolo-carregar-provas-curadas.sql';
const CHUNK_SIZE = 200;
const KINDS = ['multipla', 'certo_errado'];
const BLOOM_LEVELS = ['lembrar', 'entender', 'aplicar', 'analisar', 'avaliar', 'criar'];
const KNOWLEDGE_TYPES = ['factual', 'conceitual', 'procedimental', 'metacognitivo'];

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function resolveTarget(target, wranglerJson) {
  if (target !== 'production') return LOCAL;
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
      name: 'apolo-carregar-provas-curadas',
      d1_databases: [{ binding: 'DB', database_name: production.d1, database_id: database.uuid }],
    }),
  );
  return { d1: production.d1, config: REMOTE_D1_CONFIG, where: '--remote' };
}

function loadDrafts(path) {
  const entries = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(entries)) throw new Error(`${path} precisa ser uma lista de questões.`);
  for (const [index, entry] of entries.entries()) {
    const line = index + 1;
    if (!entry.prompt) throw new Error(`Item ${line}: falta "prompt".`);
    if (!KINDS.includes(entry.kind)) throw new Error(`Item ${line}: "kind" deve ser ${KINDS.join(' ou ')}.`);
    if (entry.kind === 'multipla') {
      if (!Array.isArray(entry.options) || entry.options.length < 2) {
        throw new Error(`Item ${line}: "options" precisa ter ao menos 2 alternativas.`);
      }
      if (
        !Number.isInteger(entry.correctOption) ||
        entry.correctOption < 0 ||
        entry.correctOption >= entry.options.length
      ) {
        throw new Error(`Item ${line}: "correctOption" precisa ser um índice válido de "options".`);
      }
    }
    if (!entry.contentId) throw new Error(`Item ${line}: falta "contentId" (ex.: CG-001).`);
    if (!BLOOM_LEVELS.includes(entry.bloomLevel)) {
      throw new Error(`Item ${line}: "bloomLevel" deve ser um de ${BLOOM_LEVELS.join(', ')}.`);
    }
    if (!KNOWLEDGE_TYPES.includes(entry.knowledgeType)) {
      throw new Error(`Item ${line}: "knowledgeType" deve ser um de ${KNOWLEDGE_TYPES.join(', ')}.`);
    }
    if (!entry.explanation) throw new Error(`Item ${line}: falta "explanation".`);
  }
  return entries;
}

function runBatched(wrangler, d1, where, config, statements, label) {
  let written = 0;
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    writeFileSync(SQL_FILE, `${chunk.join('\n')}\n`);
    try {
      wrangler(
        ['d1', 'execute', d1, where, '--config', config, '--file', SQL_FILE, '--yes'],
        `Falha ao gravar o lote de ${label} ${i + 1}-${i + chunk.length}.`,
      );
    } finally {
      writeFileSync(SQL_FILE, '');
    }
    written += chunk.length;
    console.log(`  ${label}: ${written}/${statements.length}...`);
  }
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { target: { type: 'string' }, check: { type: 'boolean' }, file: { type: 'string' } },
  });

  const filePath = requireOption(values, 'file', 'o caminho do arquivo de questões curadas');
  const entries = loadDrafts(filePath);
  console.log(`${entries.length} questão(ões) no arquivo.`);

  const warnings = lintQuestions(
    entries.map((entry, index) => ({
      id: String(index + 1),
      prompt: entry.prompt,
      options: entry.options ?? null,
      correctOption: entry.correctOption ?? null,
    })),
  ).filter((issue) => issue.severity === 'aviso');
  const warningsById = new Map();
  for (const issue of warnings) {
    const list = warningsById.get(issue.id) ?? [];
    list.push(issue.message);
    warningsById.set(issue.id, list);
  }

  const { wranglerJson, d1Rows, wrangler } = createRunner(process.env);
  const target = values.check ? 'local' : requireTarget(values.target);
  const { d1, config, where } = resolveTarget(target, wranglerJson);

  const validContentIds = new Set(
    d1Rows([d1, where, '--config', config], `SELECT id FROM atlas_contents`, 'Não consegui ler os conteúdos no D1.').map(
      (row) => row.id,
    ),
  );
  for (const [index, entry] of entries.entries()) {
    if (!validContentIds.has(entry.contentId)) {
      throw new Error(`Item ${index + 1}: content_id "${entry.contentId}" não existe em atlas_contents.`);
    }
  }

  const now = new Date().toISOString();
  const rows = entries.map((entry, index) => {
    const textHash = hashQuestionText(entry.prompt);
    const id = randomUUID();
    const lintId = String(index + 1);
    const lintWarnings = warningsById.get(lintId) ?? [];
    return {
      id,
      textHash,
      sql:
        `INSERT INTO atlas_question_drafts
         (id, content_id, theme, kind, prompt, options_json, correct_option, explanation, bloom_level,
          knowledge_type, origin, exam_board, exam_org, exam_year, text_hash, lint_warnings_json, status, created_at)
         VALUES (${literal(id)}, ${literal(entry.contentId)}, ${literal(entry.theme ?? null)}, ${literal(entry.kind)}, ` +
        `${literal(entry.prompt)}, ${literal(entry.options ? JSON.stringify(entry.options) : null)}, ` +
        `${literal(entry.correctOption ?? null)}, ${literal(entry.explanation)}, ${literal(entry.bloomLevel)}, ` +
        `${literal(entry.knowledgeType)}, 'oficial', ${literal(entry.examBoard ?? null)}, ${literal(entry.examOrg ?? null)}, ` +
        `${literal(entry.examYear ?? null)}, ${literal(textHash)}, ` +
        `${literal(lintWarnings.length ? JSON.stringify(lintWarnings) : null)}, 'pendente', ${literal(now)});`,
    };
  });

  const existingHashes = new Set(
    d1Rows(
      [d1, where, '--config', config],
      `SELECT text_hash FROM atlas_question_drafts WHERE text_hash IN (${rows.map((r) => literal(r.textHash)).join(', ')})
       UNION SELECT text_hash FROM atlas_questions WHERE text_hash IN (${rows.map((r) => literal(r.textHash)).join(', ')})`,
      'Não consegui conferir duplicidade por text_hash no D1.',
    ).map((row) => row.text_hash),
  );
  const toInsert = rows.filter((row) => !existingHashes.has(row.textHash));
  const skippedDuplicates = rows.length - toInsert.length;
  if (skippedDuplicates) console.log(`${skippedDuplicates} questão(ões) já existia(m) por text_hash — ignorada(s).`);
  console.log(`${toInsert.length} rascunho(s) novo(s) a inserir.`);

  if (values.check) {
    console.log('Só --check: nada foi gravado.');
    return;
  }
  if (!toInsert.length) {
    console.log('Nada para inserir.');
    return;
  }

  runBatched(wrangler, d1, where, config, toInsert.map((row) => row.sql), 'rascunhos curados');
  console.log(
    `Pronto: ${toInsert.length} rascunho(s) inserido(s) em ${d1}, já com conteúdo/bloom/explicação — rode ` +
      `"pnpm run apolo:aprovar-roadmap -- --target ${target}" para aprová-los.`,
  );
});
