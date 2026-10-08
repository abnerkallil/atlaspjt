// MVP-04: importação do banco de questões em CSV (scripts/lib/question-bank.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { migratedDatabase } from './support/migrated-db.js';

type BankQuestion = {
  id: string;
  contentId: string;
  kind: string;
  options: string[] | null;
  correctOption: number | null;
  verification: unknown;
};
type BankModule = {
  parseCsv(text: string): Record<string, string>[];
  rowsToQuestions(rows: Record<string, string>[]): BankQuestion[];
  questionsSql(
    questions: BankQuestion[],
    options: { mode: 'seed' | 'import'; updatedAt: string },
  ): string;
};
const lib = (await import(
  pathToFileURL(join(process.cwd(), 'scripts/lib/question-bank.mjs')).href
)) as BankModule;

const HEADER =
  'conteudo;ordem;tipo;enunciado;a;b;c;correta;gabarito;valor_esperado;tolerancia;verificacao;explicacao';

function run(db: DatabaseSync, sql: string) {
  for (const statement of sql.split('--> statement-breakpoint'))
    db.exec(statement);
}

void test('CSV com ponto e vírgula, aspas e quebra de linha dentro do campo', () => {
  const rows = lib.parseCsv(
    `${HEADER}\nCG-001;1;multipla;"Qual; ""o"" item?\nlinha 2";x;y;;b;;;;;explica\n`,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].enunciado, 'Qual; "o" item?\nlinha 2');
  const [question] = lib.rowsToQuestions(rows);
  assert.equal(question.id, 'CG-001-Q01');
  assert.deepEqual(question.options, ['x', 'y']);
  assert.equal(question.correctOption, 1);
});

void test('validação aponta a linha do arquivo', () => {
  const bad = (line: string) => () =>
    lib.rowsToQuestions(lib.parseCsv(`${HEADER}\n${line}\n`));
  assert.throws(bad('CG-001;1;outro;E;x;y;;a;;;;;e'), /Linha 2: "tipo"/);
  assert.throws(bad('CG-001;1;multipla;E;x;y;;d;;;;;e'), /Linha 2: "correta"/);
  assert.throws(bad('CG-001;1;dissertativa;E;;;;;;;;;e'), /gabarito/);
  assert.throws(bad('CG-001;1;calculo;E;;;;;;10;;[];e'), /5 perguntas/);
  assert.throws(
    () =>
      lib.rowsToQuestions(
        lib.parseCsv(
          `${HEADER}\nCG-001;1;multipla;E;x;y;;a;;;;;e\nCG-001;1;multipla;F;x;y;;a;;;;;e\n`,
        ),
      ),
    /id repetido/,
  );
});

void test('cálculo lê valor com vírgula decimal e as 5 verificações', () => {
  const verification = JSON.stringify(
    Array.from({ length: 5 }, () => ({
      prompt: 'p',
      options: ['a', 'b'],
      correct: 0,
    })),
  );
  const csv = `${HEADER}\nCG-003;1;calculo;Calcule;;;;;;"180000,5";0,5;"${verification.replaceAll('"', '""')}";e\n`;
  const [question] = lib.rowsToQuestions(lib.parseCsv(csv)) as (BankQuestion & {
    expectedValue: number;
    tolerance: number;
  })[];
  assert.equal(question.expectedValue, 180000.5);
  assert.equal(question.tolerance, 0.5);
  assert.equal((question.verification as unknown[]).length, 5);
});

void test('seed não sobrescreve; import atualiza e marca a origem', () => {
  const db = migratedDatabase();
  const csv = `${HEADER}\nCG-001;1;multipla;Nova versão;x;y;;a;;;;;e\n`;
  const questions = lib.rowsToQuestions(lib.parseCsv(csv));
  run(
    db,
    lib.questionsSql(questions, {
      mode: 'seed',
      updatedAt: '2026-10-08T00:00:00.000Z',
    }),
  );
  const before = db
    .prepare(
      "SELECT prompt, source FROM atlas_questions WHERE id = 'CG-001-Q01'",
    )
    .get() as Record<string, string>;
  assert.notEqual(before.prompt, 'Nova versão', 'o banco inicial continua');
  run(
    db,
    lib.questionsSql(questions, {
      mode: 'import',
      updatedAt: '2026-10-09T00:00:00.000Z',
    }),
  );
  const after = db
    .prepare(
      "SELECT prompt, source, options_json FROM atlas_questions WHERE id = 'CG-001-Q01'",
    )
    .get() as Record<string, string>;
  assert.deepEqual(
    { ...after },
    { prompt: 'Nova versão', source: 'importado', options_json: '["x","y"]' },
  );
});

void test('o banco inicial do repositório é válido e bate com a migration 0010', () => {
  const questions = lib.rowsToQuestions(
    lib.parseCsv(readFileSync('data/questoes/banco-inicial.csv', 'utf8')),
  );
  assert.equal(questions.length, 60);
  const migration = readFileSync('drizzle/0010_question_bank.sql', 'utf8');
  const expected = lib.questionsSql(questions, {
    mode: 'seed',
    updatedAt: '2026-10-08T00:00:00.000Z',
  });
  assert.ok(
    migration.includes(expected),
    'regere a migration com scripts/import-questions.mjs --seed-migration',
  );
});
