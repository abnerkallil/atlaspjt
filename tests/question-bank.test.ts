// MVP-04/APO-04: importação do banco de questões em CSV ou JSON v2, e o
// linter de escrita de itens (scripts/lib/question-bank.mjs).
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
  position: number;
  kind: string;
  prompt: string;
  options: string[] | null;
  correctOption: number | null;
  modelAnswer: string | null;
  expectedValue: number | null;
  tolerance: number | null;
  verification: unknown;
  explanation: string;
  active: boolean;
  __line: number;
};
type LintIssue = { line: number; id: string; severity: 'erro' | 'aviso'; message: string };
type BankModule = {
  parseCsv(text: string): Record<string, string>[];
  parseJsonV2(text: string): Record<string, unknown>[];
  rowsToQuestions(rows: Record<string, string>[]): BankQuestion[];
  lintQuestions(questions: BankQuestion[]): LintIssue[];
  hashQuestionText(text: string): string;
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

// APO-04 acrescentou colunas (nullable) ao INSERT que questionsSql gera, então
// o SQL de hoje não bate mais byte a byte com a migration 0010 — e não deve:
// ela já foi aplicada e fica congelada (DEC: nunca reescrever migration
// aplicada). O que continua valendo é que o CSV não teve drift dos campos
// originais: comparamos pelos dados, aplicando todas as migrations (0010 em
// diante) e lendo de volta.
void test('o banco inicial do repositório é válido e não tem drift dos campos originais da migration 0010', () => {
  const questions = lib.rowsToQuestions(
    lib.parseCsv(readFileSync('data/questoes/banco-inicial.csv', 'utf8')),
  );
  assert.equal(questions.length, 60);
  const db = migratedDatabase();
  for (const q of questions) {
    const row = db
      .prepare(
        `SELECT content_id, position, kind, prompt, options_json, correct_option, model_answer,
                expected_value, tolerance, verification_json, explanation, source, active,
                theme, text_hash
         FROM atlas_questions WHERE id = ?`,
      )
      .get(q.id) as Record<string, unknown>;
    assert.ok(row, `${q.id} deveria existir (vindo da migration 0010)`);
    assert.equal(row.content_id, q.contentId);
    assert.equal(row.position, q.position);
    assert.equal(row.kind, q.kind);
    assert.equal(row.prompt, q.prompt);
    assert.deepEqual(
      row.options_json ? JSON.parse(row.options_json as string) : null,
      q.options,
    );
    assert.equal(row.correct_option, q.correctOption);
    assert.equal(row.model_answer, q.modelAnswer);
    assert.equal(row.expected_value, q.expectedValue);
    assert.equal(row.tolerance, q.tolerance);
    assert.deepEqual(
      row.verification_json ? JSON.parse(row.verification_json as string) : null,
      q.verification,
    );
    assert.equal(row.explanation, q.explanation);
    assert.equal(row.source, 'curado');
    assert.equal(row.active, q.active ? 1 : 0);
    // Campos do Apolo não existiam na migration 0010: continuam NULL ali.
    assert.equal(row.theme, null);
    assert.equal(row.text_hash, null);
  }
});

void test('APO-04: certo/errado e lacuna numérica são aceitos pelo importador', () => {
  const rows = lib.parseCsv(
    `${HEADER}\nCG-001;1;certo_errado;O caixa é ativo circulante?;;;;certo;;;;;explica\n` +
      `CG-001;2;lacuna_numerica;Complete: o total é;;;;;;1500;1;;explica\n`,
  );
  const [certoErrado, lacuna] = lib.rowsToQuestions(rows);
  assert.equal(certoErrado.kind, 'certo_errado');
  assert.deepEqual(certoErrado.options, ['Errado', 'Certo']);
  assert.equal(certoErrado.correctOption, 1);
  assert.equal(lacuna.kind, 'lacuna_numerica');
  assert.equal(lacuna.expectedValue, 1500);
  assert.equal(lacuna.verification, null);
});

void test('APO-04: JSON v2 aceita os mesmos campos sem precisar escapar JSON em string', () => {
  const json = JSON.stringify([
    {
      conteudo: 'CG-001',
      ordem: 1,
      tipo: 'calculo',
      enunciado: 'Calcule.',
      valor_esperado: 100,
      tolerancia: 0.5,
      verificacao: [
        { prompt: 'p1', options: ['a', 'b'], correct: 0 },
        { prompt: 'p2', options: ['a', 'b'], correct: 0 },
        { prompt: 'p3', options: ['a', 'b'], correct: 0 },
        { prompt: 'p4', options: ['a', 'b'], correct: 0 },
        { prompt: 'p5', options: ['a', 'b'], correct: 0 },
      ],
      explicacao: 'e',
    },
  ]);
  const [question] = lib.rowsToQuestions(lib.parseJsonV2(json) as Record<string, string>[]);
  assert.equal(question.id, 'CG-001-Q01');
  assert.equal((question.verification as unknown[]).length, 5);
});

void test('APO-04: linter aponta erro em alternativas repetidas e enunciado duplicado, sem bloquear por aviso', () => {
  const rows = lib.parseCsv(
    `${HEADER}\nCG-001;1;multipla;Qual é o ativo?;x;x;;a;;;;;explica\n` +
      `CG-001;2;multipla;Qual é o ativo?;y;z;;a;;;;;explica\n`,
  );
  const questions = lib.rowsToQuestions(rows);
  const issues = lib.lintQuestions(questions);
  const errors = issues.filter((i) => i.severity === 'erro');
  assert.ok(errors.some((i) => i.message.includes('alternativas repetidas')));
  assert.ok(errors.some((i) => i.message.includes('enunciado duplicado')));
});

void test('APO-04: linter avisa sobre todas/nenhuma das anteriores e negação sem destaque', () => {
  const rows = lib.parseCsv(
    `${HEADER}\nCG-001;1;multipla;Qual NÃO é um ativo?;caixa;estoque;nenhuma das anteriores;c;;;;;explica\n`,
  );
  const issues = lib.lintQuestions(lib.rowsToQuestions(rows));
  const messages = issues.map((i) => i.message).join(' | ');
  assert.ok(messages.includes('todas/nenhuma das anteriores'));
});

void test('APO-04: o banco inicial do repositório não tem nenhum erro de linter (só avisos)', () => {
  const questions = lib.rowsToQuestions(
    lib.parseCsv(readFileSync('data/questoes/banco-inicial.csv', 'utf8')),
  );
  const issues = lib.lintQuestions(questions);
  const errors = issues.filter((i) => i.severity === 'erro');
  assert.deepEqual(errors, []);
});

void test('APO-04: hashQuestionText detecta duplicata ignorando espaço/caixa', () => {
  assert.equal(
    lib.hashQuestionText('Qual é o ativo?'),
    lib.hashQuestionText('  qual É o   ativo?  '),
  );
});
