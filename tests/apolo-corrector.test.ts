// APO-13: o corretor movido para lib/apolo/corrector.ts dá exatamente a
// mesma nota que a correção antiga de lib/quizzes.ts (mesmas regras, mesmos
// exports, reexportados de lá) — e buildBoletim só empacota esse resultado.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APOLO_CORRECTOR_VERSION,
  buildBoletim,
  gradeQuestion,
  scoreResults,
  PASSING_SCORE,
  VERIFICATION_MINIMUM,
} from '../lib/apolo/corrector.js';
import type { Question } from '../lib/quizzes.js';

function question(overrides: Partial<Question>): Question {
  return {
    id: 'q1',
    contentId: 'CG-001',
    position: 1,
    kind: 'multipla',
    prompt: '2 + 2?',
    context: null,
    options: ['3', '4', '5'],
    correctOption: 1,
    modelAnswer: null,
    expectedValue: null,
    tolerance: null,
    verification: null,
    explanation: 'porque sim',
    ...overrides,
  };
}

void test('APO-13: multipla/certo_errado corrige por igualdade de opção', () => {
  const multipla = question({ kind: 'multipla', correctOption: 1 });
  assert.equal(gradeQuestion(multipla, { option: 1 }).correct, true);
  assert.equal(gradeQuestion(multipla, { option: 0 }).correct, false);
  assert.equal(gradeQuestion(multipla, undefined).correct, false);
  assert.equal(gradeQuestion(multipla, { option: 1 }).voided, false);
});

void test('APO-13: dissertativa corrige pela autoavaliação, só com texto', () => {
  const dissertativa = question({ kind: 'dissertativa', options: null, correctOption: null });
  assert.equal(
    gradeQuestion(dissertativa, { text: 'resposta', selfAssessment: 'certa' }).correct,
    true,
  );
  assert.equal(
    gradeQuestion(dissertativa, { text: '  ', selfAssessment: 'certa' }).correct,
    false,
  );
  assert.equal(
    gradeQuestion(dissertativa, { text: 'resposta', selfAssessment: 'errada' }).correct,
    false,
  );
});

void test('APO-13: lacuna_numerica corrige por tolerância e nunca anula', () => {
  const lacuna = question({
    kind: 'lacuna_numerica',
    options: null,
    correctOption: null,
    expectedValue: 10,
    tolerance: 0.5,
  });
  assert.equal(gradeQuestion(lacuna, { value: 10.3 }).correct, true);
  assert.equal(gradeQuestion(lacuna, { value: 11 }).correct, false);
  assert.equal(gradeQuestion(lacuna, { value: 11 }).voided, false);
});

void test('APO-13: calculo exige 3 de 5 verificações, senão anula', () => {
  const calculo = question({
    kind: 'calculo',
    options: null,
    correctOption: null,
    expectedValue: 42,
    tolerance: 0.1,
    verification: Array.from({ length: 5 }, (_, i) => ({
      prompt: `passo ${i}`,
      options: ['a', 'b'],
      correct: 0,
    })),
  });
  const ok = gradeQuestion(calculo, {
    value: 42,
    verification: [0, 0, 0, 1, 1],
  });
  assert.equal(ok.correct, true);
  assert.equal(ok.voided, false);
  assert.equal(ok.verificationCorrect, VERIFICATION_MINIMUM);

  const voided = gradeQuestion(calculo, {
    value: 42,
    verification: [0, 0, 1, 1, 1],
  });
  assert.equal(voided.voided, true);
});

void test('APO-13: scoreResults ignora anuladas e usa PASSING_SCORE', () => {
  const calculo = question({
    kind: 'calculo',
    options: null,
    correctOption: null,
    expectedValue: 42,
    tolerance: 0.1,
    verification: Array.from({ length: 5 }, () => ({
      prompt: 'p',
      options: ['a', 'b'],
      correct: 0,
    })),
  });
  const multipla = question({ kind: 'multipla', correctOption: 0 });
  const voided = gradeQuestion(calculo, { value: 42, verification: [1, 1, 1, 1, 1] });
  const right = gradeQuestion(multipla, { option: 0 });
  const score = scoreResults([voided, right]);
  assert.equal(score.counted, 1);
  assert.equal(score.correct, 1);
  assert.equal(score.score, 100);
  assert.equal(score.passed, 100 >= PASSING_SCORE);
});

void test('APO-13: buildBoletim empacota o resultado já calculado, com versão e motivo por questão', () => {
  const multipla = question({ id: 'q1', kind: 'multipla', correctOption: 0 });
  const dissertativa = question({
    id: 'q2',
    kind: 'dissertativa',
    options: null,
    correctOption: null,
  });
  const results = [
    gradeQuestion(multipla, { option: 1 }),
    gradeQuestion(dissertativa, { text: 'ok', selfAssessment: 'certa' }),
  ];
  const boletim = buildBoletim('tentativa-1', results, '2026-10-08T12:00:00.000Z', 3);
  assert.equal(boletim.corretorVersion, APOLO_CORRECTOR_VERSION);
  assert.equal(boletim.planVersion, 3);
  assert.equal(boletim.attemptId, 'tentativa-1');
  assert.equal(boletim.issuedAt, '2026-10-08T12:00:00.000Z');
  assert.equal(boletim.questions.length, 2);
  assert.equal(boletim.questions[0].reason, 'incorreta');
  assert.equal(boletim.questions[1].reason, 'correta');
  assert.equal(boletim.correct, 1);
  assert.equal(boletim.counted, 2);
  assert.equal(boletim.passed, false);
});

void test('APO-13: buildBoletim marca questão anulada como "anulada", nunca certa ou errada', () => {
  const calculo = question({
    kind: 'calculo',
    options: null,
    correctOption: null,
    expectedValue: 1,
    tolerance: 0,
    verification: Array.from({ length: 5 }, () => ({
      prompt: 'p',
      options: ['a', 'b'],
      correct: 0,
    })),
  });
  const voided = gradeQuestion(calculo, { value: 1, verification: [1, 1, 1, 1, 1] });
  const boletim = buildBoletim('tentativa-2', [voided], '2026-10-08T12:00:00.000Z');
  assert.equal(boletim.questions[0].reason, 'anulada');
  assert.equal(boletim.planVersion, null);
});
