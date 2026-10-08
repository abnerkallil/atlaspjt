// APO-15: uma questão errada só sai da fila de recuperação depois de
// acertada em 3 sessões diferentes desde o último erro (não é só o FSRS do
// APO-09 empurrando o dueAt pra longe com um acerto só) — teste de
// calendário com relógio simulado, como o card pede.
import assert from 'node:assert/strict';
import test from 'node:test';
import { recoveryQueueState, type SkillEvent } from '../lib/apolo/skill.js';
import { getRecoveryQueue } from '../lib/apolo/index.js';
import { startQuiz, submitQuiz, listQuestions, type Answers } from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const day = (n: number) => `2026-10-${String(8 + n).padStart(2, '0')}T10:00:00.000Z`;

function event(overrides: Partial<SkillEvent>): SkillEvent {
  return {
    theme: 'contabilidade-geral',
    contentId: 'CG-001',
    subtopicId: null,
    questionId: 'Q1',
    difficulty: 'media',
    correct: true,
    at: day(0),
    ...overrides,
  };
}

void test('APO-15: questão nunca errada não entra na fila', () => {
  const state = recoveryQueueState([event({ correct: true })]);
  assert.equal(state.length, 0);
});

void test('APO-15: errou e ainda não acumulou 3 sessões certas: continua na fila', () => {
  const events = [
    event({ at: day(0), correct: false }),
    event({ at: day(1), correct: true }),
    event({ at: day(2), correct: true }),
  ];
  const [state] = recoveryQueueState(events);
  assert.equal(state.correctStreakSessions, 2);
  assert.equal(state.graduated, false);
});

void test('APO-15: 3 acertos em 3 sessões diferentes graduam a questão', () => {
  const events = [
    event({ at: day(0), correct: false }),
    event({ at: day(1), correct: true }),
    event({ at: day(2), correct: true }),
    event({ at: day(3), correct: true }),
  ];
  const [state] = recoveryQueueState(events);
  assert.equal(state.correctStreakSessions, 3);
  assert.equal(state.graduated, true);
});

void test('APO-15: dois acertos na MESMA sessão contam como um só (não adianta responder duas vezes na mesma tentativa)', () => {
  const events = [
    event({ at: day(0), correct: false }),
    event({ at: day(1), correct: true, questionId: 'Q1' }),
    // mesmo instante (mesma tentativa) — não é uma segunda sessão.
    event({ at: day(1), correct: true, questionId: 'Q1' }),
    event({ at: day(2), correct: true }),
    event({ at: day(3), correct: true }),
  ];
  const [state] = recoveryQueueState(events);
  assert.equal(state.correctStreakSessions, 3);
  assert.equal(state.graduated, true);
});

void test('APO-15: errar de novo depois de ter acertado zera a contagem (recaída)', () => {
  const events = [
    event({ at: day(0), correct: false }),
    event({ at: day(1), correct: true }),
    event({ at: day(2), correct: true }),
    event({ at: day(3), correct: false }),
    event({ at: day(4), correct: true }),
  ];
  const [state] = recoveryQueueState(events);
  assert.equal(state.correctStreakSessions, 1);
  assert.equal(state.graduated, false);
});

void test('APO-15: getRecoveryQueue lê o histórico real do D1 (um quiz de verdade)', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, 'CG-001', { now: day(0), id: 's1' });
  await concludeSession(db, 's1', { now: day(0) });
  raw.prepare("UPDATE atlas_questions SET theme = 'contabilidade-geral' WHERE content_id = 'CG-001'").run();

  await startQuiz(db, 'CG-001', { now: day(0), id: 'a1' });
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get('a1') as { questions_json: string })
      .questions_json,
  ) as { questionIds: string[] };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  // Tudo errado: toda questão respondida entra na fila de recuperação.
  stored.questionIds.forEach((qid) => {
    answers[qid] = { option: (bank.get(qid)!.correctOption! + 1) % (bank.get(qid)!.options?.length ?? 2) };
  });
  await submitQuiz(db, 'a1', { answers }, { now: day(0) });

  const queue = await getRecoveryQueue(db);
  assert.equal(queue.length, stored.questionIds.length);
  for (const item of queue) {
    assert.equal(item.correctStreakSessions, 0);
    assert.equal(item.contentId, 'CG-001');
    assert.equal(item.theme, 'contabilidade-geral');
  }
});
