// MVP-04: quiz pré-cadastrado com execução, timer, envio, correção, tentativas,
// resultado e registro por conteúdo (DEC-04, DEC-10).
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentState, listAudit } from '../lib/pedagogy/transitions.js';
import {
  PASSING_SCORE,
  QuizError,
  gradeQuestion,
  listQuestions,
  listQuizQueue,
  optionOrder,
  scoreResults,
  selectQuestions,
  lockQuiz,
  shuffleQuestion,
  startQuiz,
  submitQuiz,
  totalSeconds,
  type Answers,
  type Question,
} from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const t0 = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) =>
  new Date(Date.parse(t0) + seconds * 1000).toISOString();

const multipla: Question = {
  id: 'Q1',
  contentId: 'CG-001',
  position: 1,
  kind: 'multipla',
  prompt: '?',
  context: null,
  options: ['certa', 'errada 1', 'errada 2', 'errada 3'],
  correctOption: 0,
  modelAnswer: null,
  expectedValue: null,
  tolerance: null,
  verification: null,
  explanation: 'porque sim',
};

const calculo: Question = {
  ...multipla,
  id: 'Q2',
  kind: 'calculo',
  options: null,
  correctOption: null,
  expectedValue: 180000,
  tolerance: 0.5,
  verification: Array.from({ length: 5 }, (_, index) => ({
    prompt: `v${index}`,
    options: ['x', 'y'],
    correct: 1,
  })),
};

async function readyForQuiz(contentId = 'CG-001') {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, contentId, { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });
  return { raw, db };
}

// Respostas certas na ordem exibida da tentativa (as alternativas são embaralhadas).
async function correctAnswers(
  raw: ReturnType<typeof migratedDatabase>,
  db: ReturnType<typeof d1>,
  attemptId: string,
) {
  const row = raw
    .prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?')
    .get(attemptId) as { questions_json: string };
  const stored = JSON.parse(row.questions_json) as {
    questionIds: string[];
    optionOrders: Record<string, number[]>;
  };
  const bank = new Map(
    (await listQuestions(db, 'CG-001')).map((item) => [item.id, item]),
  );
  const answers: Answers = {};
  for (const id of stored.questionIds) {
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    answers[id] =
      question.kind === 'multipla'
        ? { option: question.correctOption! }
        : { text: 'minha resposta', selfAssessment: 'certa' };
  }
  return answers;
}

void test('DEC-10: tempo de 1 min por múltipla e 5 min por dissertativa; cálculo sem limite', () => {
  assert.equal(
    totalSeconds([{ kind: 'multipla' }, { kind: 'dissertativa' }]),
    360,
  );
  assert.equal(totalSeconds([{ kind: 'multipla' }, { kind: 'calculo' }]), null);
});

void test('sorteio: até 10 questões, determinístico pela tentativa e na ordem do banco', () => {
  const bank = Array.from({ length: 14 }, (_, index) => ({
    id: `Q${index}`,
    position: index + 1,
  }));
  const first = selectQuestions(bank, 'tentativa-1');
  assert.equal(first.length, 10);
  assert.deepEqual(selectQuestions(bank, 'tentativa-1'), first);
  assert.deepEqual(
    first.map((item) => item.position),
    first.map((item) => item.position).sort((a, b) => a - b),
  );
  assert.equal(selectQuestions(bank.slice(0, 6), 'x').length, 6);
});

void test('alternativas embaralhadas: a correção segue a ordem exibida', () => {
  const order = optionOrder(4, 'tentativa:Q1');
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    [0, 1, 2, 3],
  );
  const shown = shuffleQuestion(multipla, order);
  assert.equal(shown.options![shown.correctOption!], 'certa');
  assert.equal(
    gradeQuestion(shown, { option: shown.correctOption! }).correct,
    true,
  );
});

void test('DEC-04: dissertativa só conta com texto e autoavaliação "certa"', () => {
  const question: Question = {
    ...multipla,
    kind: 'dissertativa',
    options: null,
    correctOption: null,
    modelAnswer: 'gabarito',
  };
  assert.equal(
    gradeQuestion(question, { text: 'resposta', selfAssessment: 'certa' })
      .correct,
    true,
  );
  assert.equal(
    gradeQuestion(question, { text: '  ', selfAssessment: 'certa' }).correct,
    false,
  );
  assert.equal(
    gradeQuestion(question, { text: 'resposta', selfAssessment: 'errada' })
      .correct,
    false,
  );
});

void test('DEC-10: cálculo com menos de 3 verificações certas é anulado e sai da nota', () => {
  const ok = gradeQuestion(calculo, {
    value: 180000.4,
    verification: [1, 1, 1, 0, 0],
  });
  assert.deepEqual(
    [ok.correct, ok.voided, ok.verificationCorrect],
    [true, false, 3],
  );
  const voided = gradeQuestion(calculo, {
    value: 180000,
    verification: [1, 1, 0, 0, 0],
  });
  assert.equal(voided.voided, true);
  const score = scoreResults([voided, gradeQuestion(multipla, { option: 0 })]);
  assert.deepEqual(score, { correct: 1, counted: 1, score: 100, passed: true });
});

void test('quiz só abre com o conteúdo "aguardando quiz" e com questões no banco', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await assert.rejects(
    startQuiz(db, 'CG-001', { now: t0 }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  const ready = await readyForQuiz();
  ready.raw
    .prepare("DELETE FROM atlas_questions WHERE content_id = 'CG-001'")
    .run();
  await assert.rejects(
    startQuiz(ready.db, 'CG-001', { now: t0 }),
    /ainda não tem questões/,
  );
});

void test('banco inicial: Fundamentos (CG-001 a CG-006) têm 10 questões cada', async () => {
  const db = d1(migratedDatabase());
  for (const id of [
    'CG-001',
    'CG-002',
    'CG-003',
    'CG-004',
    'CG-005',
    'CG-006',
  ]) {
    assert.equal((await listQuestions(db, id)).length, 10, id);
  }
  assert.equal((await listQuestions(db, 'CG-007')).length, 0);
});

void test('tentativa: começa com timer, não expõe gabarito e retoma a mesma', async () => {
  const { db } = await readyForQuiz();
  const [item] = await listQuizQueue(db);
  assert.equal(item.contentId, 'CG-001');
  assert.equal(item.questionCount, 10);

  const attempt = await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  assert.equal(attempt.status, 'em-andamento');
  assert.equal(attempt.questions.length, 10);
  assert.equal(attempt.deadlineAt, at(100 + 8 * 60 + 2 * 300));
  assert.equal(
    JSON.stringify(attempt.questions).includes('"correct'),
    false,
    'sem gabarito durante a tentativa',
  );
  assert.equal(
    attempt.questions.some((question) => 'modelAnswer' in question),
    false,
  );
  assert.equal(
    (await startQuiz(db, 'CG-001', { now: at(200), id: 'a2' })).id,
    'a1',
  );
  assert.equal((await listQuizQueue(db))[0].openAttemptId, 'a1');
});

void test('aprovado: grava evidência, nota e leva o conteúdo a "concluído"', async () => {
  const { raw, db } = await readyForQuiz();
  await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  const answers = await correctAnswers(raw, db, 'a1');
  const done = await submitQuiz(
    db,
    'a1',
    { answers },
    { now: at(400), evidenceId: 'ev-quiz' },
  );
  assert.equal(done.status, 'enviado');
  assert.equal(done.score, 100);
  assert.equal(done.passed, true);
  assert.equal(done.late, false);
  assert.equal(done.results?.length, 10);
  assert.ok(done.results?.every((item) => item.explanation.length > 0));
  const evidence = raw
    .prepare(
      'SELECT kind, source_ref, summary FROM atlas_evidences WHERE id = ?',
    )
    .get('ev-quiz') as Record<string, string>;
  assert.deepEqual(
    { ...evidence },
    { kind: 'quiz', source_ref: 'a1', summary: 'Quiz aprovado: 10/10 (100%).' },
  );
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido');
  const [last] = await listAudit(db);
  assert.equal(last.event, 'quiz-aprovado');
  assert.equal(last.evidenceId, 'ev-quiz');
  await assert.rejects(
    submitQuiz(db, 'a1', { answers }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
});

void test('reprovado: abaixo do mínimo bloqueia o conteúdo (DEC-04) e o quiz se refaz direto até passar', async () => {
  const { db } = await readyForQuiz();
  await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  const failed = await submitQuiz(db, 'a1', {}, { now: at(200) });
  assert.equal(failed.passed, false);
  assert.ok((failed.score ?? 100) < PASSING_SCORE);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'bloqueado');
  assert.equal((await listAudit(db))[0].event, 'quiz-reprovado');
  // Refaz direto, sem nova sessão: reprovar de novo continua bloqueado.
  const retry = await startQuiz(db, 'CG-001', { now: at(300), id: 'a2' });
  assert.equal(retry.purpose, 'quiz');
  await submitQuiz(db, 'a2', {}, { now: at(400) });
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'bloqueado');
  assert.equal((await listAudit(db))[0].event, 'quiz-reprovado');
});

void test('envio depois do prazo é aceito e marcado como atrasado', async () => {
  const { db } = await readyForQuiz();
  const attempt = await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  const late = await submitQuiz(
    db,
    'a1',
    {},
    { now: new Date(Date.parse(attempt.deadlineAt!) + 120_000).toISOString() },
  );
  assert.equal(late.late, true);
  const onTime = await readyForQuiz();
  const second = await startQuiz(onTime.db, 'CG-001', {
    now: at(100),
    id: 'b1',
  });
  const grace = await submitQuiz(
    onTime.db,
    'b1',
    {},
    { now: new Date(Date.parse(second.deadlineAt!) + 20_000).toISOString() },
  );
  assert.equal(grace.late, false, 'até 30 s de folga para o envio automático');
});

void test('dissertativas: travar mostra o gabarito, para o tempo e só aceita a autoavaliação', async () => {
  const { raw, db } = await readyForQuiz();
  const attempt = await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  assert.equal(attempt.modelAnswers, null, 'sem gabarito antes de travar');
  const answers = await correctAnswers(raw, db, 'a1');
  const essays = Object.keys(answers).filter((id) => answers[id].text);
  for (const id of essays) answers[id] = { text: 'minha resposta' };
  const locked = await lockQuiz(db, 'a1', answers, { now: at(200) });
  assert.equal(locked.status, 'autoavaliacao');
  assert.deepEqual(
    Object.keys(locked.modelAnswers ?? {}).sort(),
    [...essays].sort(),
  );
  await assert.rejects(
    lockQuiz(db, 'a1', answers),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  assert.equal(
    (await startQuiz(db, 'CG-001', { now: at(250), id: 'a2' })).id,
    'a1',
    'continua a mesma tentativa',
  );

  // Depois do prazo: a autoavaliação não conta tempo e as respostas travadas valem.
  const late = new Date(
    Date.parse(attempt.deadlineAt!) + 3600_000,
  ).toISOString();
  const tampered = { ...answers, [Object.keys(answers)[0]]: { option: 99 } };
  const done = await submitQuiz(
    db,
    'a1',
    {
      answers: tampered,
      selfAssessments: { [essays[0]]: 'certa', [essays[1]]: 'errada' },
    },
    { now: late },
  );
  assert.equal(done.late, false);
  assert.equal(done.score, 90);
  assert.equal(done.passed, true);
  assert.equal(done.modelAnswers?.[essays[0]]?.length ? true : false, true);
});
