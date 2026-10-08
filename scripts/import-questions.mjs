// Importa um banco de questões em CSV para o D1 (MVP-04, ver docs/QUESTOES.md).
//
// DEC-009: o ambiente vem de --target a cada execução, sem default. Em produção
// o nome do D1 vem de `deploy.local.json` (ignorado pelo git).
// O arquivo do usuário vale: questões com o mesmo id são atualizadas; as demais
// ficam como estão. Para tirar uma questão de uso, marque ativa = nao.
//
// Uso:
//   pnpm run questoes:importar -- --target local --file data/questoes/minhas.csv
//   pnpm run questoes:importar -- --target production --file minhas.csv
//   pnpm run questoes:importar -- --file minhas.csv --check   (só valida)
//   node scripts/import-questions.mjs --file data/questoes/banco-inicial.csv --seed-migration drizzle/0010_question_bank.sql
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { parseArgs } from 'node:util';
import {
  parseCsv,
  questionsSql,
  rowsToQuestions,
} from './lib/question-bank.mjs';
import { requireOption, requireTarget, runCli } from './lib/target-env.mjs';
import { createRunner } from './lib/wrangler-cli.mjs';

const LOCAL_CONFIG = 'deploy.local.json';
const REMOTE_D1_CONFIG = '.wrangler/questions-d1.json';
const SQL_FILE = '.wrangler/questions-import.sql';
const LOCAL = { d1: 'site-creator-d1', config: 'wrangler.local.jsonc' };
// Data fixa no banco inicial: a migration precisa gerar sempre o mesmo SQL.
const SEED_UPDATED_AT = '2026-10-08T00:00:00.000Z';

function summary(questions) {
  const byContent = new Map();
  for (const question of questions) {
    byContent.set(
      question.contentId,
      (byContent.get(question.contentId) ?? 0) + 1,
    );
  }
  return [...byContent]
    .map(([content, count]) => `${content}: ${count}`)
    .join(', ');
}

await runCli(async () => {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      target: { type: 'string' },
      file: { type: 'string' },
      check: { type: 'boolean' },
      'seed-migration': { type: 'string' },
    },
  });
  const file = requireOption(values, 'file', 'o arquivo CSV');
  if (!existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
  const questions = rowsToQuestions(parseCsv(readFileSync(file, 'utf8')));
  if (questions.length === 0)
    throw new Error('O arquivo não tem nenhuma questão.');
  console.log(
    `${questions.length} questão(ões) válidas (${summary(questions)}).`,
  );

  if (values.check) return;
  if (values['seed-migration']) {
    const sql = questionsSql(questions, {
      mode: 'seed',
      updatedAt: SEED_UPDATED_AT,
    });
    writeFileSync(
      values['seed-migration'],
      `-- Banco inicial de questões (MVP-04), gerado de ${file} por scripts/import-questions.mjs.\n` +
        '-- ON CONFLICT DO NOTHING: não sobrescreve questões já importadas ou editadas.\n' +
        `${sql}\n`,
    );
    console.log(`Migration escrita em ${values['seed-migration']}.`);
    return;
  }

  const target = requireTarget(values.target);
  let d1 = LOCAL.d1;
  let config = LOCAL.config;
  let where = '--local';
  let env = process.env;
  if (target === 'production') {
    if (!existsSync(LOCAL_CONFIG))
      throw new Error(
        `Arquivo ${LOCAL_CONFIG} não encontrado (veja deploy.example.json).`,
      );
    const production = JSON.parse(
      readFileSync(LOCAL_CONFIG, 'utf8'),
    ).production;
    if (!production?.d1 || String(production.d1).startsWith('<')) {
      throw new Error(
        `Preencha "production.d1" em ${LOCAL_CONFIG} com o nome real.`,
      );
    }
    d1 = production.d1;
    where = '--remote';
    if (production.accountId)
      env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: production.accountId };
  }
  const { wrangler, wranglerJson } = createRunner(env);
  mkdirSync('.wrangler', { recursive: true });
  if (target === 'production') {
    const database = wranglerJson(
      ['d1', 'list'],
      'Não consegui listar os D1. Rode "npx wrangler login".',
    ).find((item) => item.name === d1);
    if (!database)
      throw new Error(`O D1 "${d1}" não existe nesta conta Cloudflare.`);
    writeFileSync(
      REMOTE_D1_CONFIG,
      JSON.stringify({
        name: 'atlas-questions',
        d1_databases: [
          { binding: 'DB', database_name: d1, database_id: database.uuid },
        ],
      }),
    );
    config = REMOTE_D1_CONFIG;
  }

  const sql = questionsSql(questions, {
    mode: 'import',
    updatedAt: new Date().toISOString(),
  }).replaceAll('\n--> statement-breakpoint\n', '\n');
  writeFileSync(SQL_FILE, `${sql}\n`);
  console.log(
    `Gravando no D1 ${d1} (${target === 'production' ? 'PRODUÇÃO' : 'local'})...`,
  );
  try {
    wrangler(
      [
        'd1',
        'execute',
        d1,
        where,
        '--config',
        config,
        '--file',
        SQL_FILE,
        '--yes',
      ],
      'Falha ao gravar as questões. Nada foi alterado se o erro veio antes do envio.',
    );
  } finally {
    rmSync(SQL_FILE, { force: true });
  }
  console.log(
    'Pronto. As questões novas já entram no próximo quiz de cada conteúdo.',
  );
});
