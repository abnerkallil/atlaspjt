// APO-03 (DEC-014): banco de questões v2. Migração aditiva (subtópico,
// dimensão de conhecimento, proveniência, dados de prova, fonte no R2, hash
// do enunciado) e dois tipos novos de questão (certo/errado, lacuna
// numérica) com correção própria.
import assert from 'node:assert/strict';
import test from 'node:test';
import { hashQuestionText } from '../lib/apolo/index.js';
import { gradeQuestion, totalSeconds, type Question } from '../lib/quizzes.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

void test('APO-03: migração aditiva não afeta questões curadas existentes', () => {
  const raw = migratedDatabase();
  const row = raw
    .prepare(
      `SELECT subtopic_id as subtopicId, knowledge_type as knowledgeType, origin,
              exam_board as examBoard, text_hash as textHash
       FROM atlas_questions LIMIT 1`,
    )
    .get() as { subtopicId: string | null; knowledgeType: string | null; origin: string | null; examBoard: string | null; textHash: string | null };
  assert.equal(row.subtopicId, null);
  assert.equal(row.knowledgeType, null);
  assert.equal(row.origin, null);
  assert.equal(row.examBoard, null);
  assert.equal(row.textHash, null);
});

void test('APO-03: tentativa antiga (quiz de múltipla/cálculo) ainda abre e corrige igual', async () => {
  const { raw } = { raw: migratedDatabase() };
  const { listQuestions } = await import('../lib/quizzes.js');
  const questions = await listQuestions(d1(raw), 'CG-001');
  assert.ok(questions.length > 0, 'o banco seedado de CG-001 continua intacto');
  for (const question of questions) {
    assert.ok(['multipla', 'dissertativa', 'calculo'].includes(question.kind));
  }
});

const base: Question = {
  id: 'Q-CE-1',
  contentId: 'CG-001',
  position: 1,
  kind: 'certo_errado',
  prompt: 'O ativo circulante inclui o caixa?',
  context: null,
  options: ['Errado', 'Certo'],
  correctOption: 1,
  modelAnswer: null,
  expectedValue: null,
  tolerance: null,
  verification: null,
  explanation: 'Caixa é ativo circulante por definição.',
};

void test('APO-03: certo/errado corrige como julgamento binário (sem verificação de raciocínio)', () => {
  const correct = gradeQuestion(base, { option: 1 });
  const wrong = gradeQuestion(base, { option: 0 });
  assert.equal(correct.correct, true);
  assert.equal(correct.voided, false);
  assert.equal(wrong.correct, false);
  assert.equal(totalSeconds([base]), 60);
});

const lacuna: Question = {
  ...base,
  id: 'Q-LN-1',
  kind: 'lacuna_numerica',
  options: null,
  correctOption: null,
  expectedValue: 1500,
  tolerance: 1,
};

void test('APO-03: lacuna numérica corrige por valor e tolerância, nunca é anulada', () => {
  const close = gradeQuestion(lacuna, { value: 1500.5 });
  const far = gradeQuestion(lacuna, { value: 2000 });
  const missing = gradeQuestion(lacuna, {});
  assert.equal(close.correct, true);
  assert.equal(close.voided, false, 'diferente de cálculo, lacuna numérica nunca anula');
  assert.equal(far.correct, false);
  assert.equal(missing.correct, false);
  assert.equal(totalSeconds([lacuna]), null, 'sem limite de tempo, como cálculo');
});

void test('APO-03: hash do enunciado é determinístico e ignora espaçamento/caixa', () => {
  const a = hashQuestionText('Quanto é 2 + 2?');
  const b = hashQuestionText('quanto é   2 + 2?  ');
  const c = hashQuestionText('Quanto é 2 + 3?');
  assert.equal(a, b);
  assert.notEqual(a, c);
});
