// MVP-08: recuperação e bloqueios — estudo dirigido, quiz dirigido com as
// questões erradas, reincidência e desbloqueio ao passar (DEC-03, DEC-04).
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, listAgenda, syncAgenda } from '../lib/agenda.js';
import { currentState } from '../lib/pedagogy/transitions.js';
import { computeProgress, loadProgressInput } from '../lib/progress.js';
import { listQuestions, shuffleQuestion, startQuiz, submitQuiz, type Answers } from '../lib/quizzes.js';
import { directedSelection, failureStreak, recoveryStatus, wrongQuestionIds } from '../lib/recovery.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const day = '2026-10-08';
const at = (hour: number) => `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;

type Raw = ReturnType<typeof migratedDatabase>;
type Db = ReturnType<typeof d1>;

// Banco maior que o quiz, para o sorteio não repetir sempre as mesmas 10.
function growBank(raw: Raw) {
  const rows = raw.prepare("SELECT * FROM atlas_questions WHERE content_id = 'CG-001' AND kind = 'multipla' LIMIT 5").all() as Record<string, unknown>[];
  for (const [index, row] of rows.entries()) {
    const copy = { ...row, id: `CG-001-extra-${index}`, position: 100 + index };
    const keys = Object.keys(copy);
    raw.prepare(`INSERT INTO atlas_questions (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...(Object.values(copy) as (string | number | null)[]));
  }
}

async function takeQuiz(raw: Raw, db: Db, id: string, now: string, correctCount: number) {
  const attempt = await startQuiz(db, 'CG-001', { now, id });
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(id) as { questions_json: string }).questions_json,
  ) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  stored.questionIds.forEach((questionId, index) => {
    if (index >= correctCount) return;
    const question = shuffleQuestion(bank.get(questionId)!, stored.optionOrders[questionId]);
    answers[questionId] = question.kind === 'multipla' ? { option: question.correctOption! } : { text: 'resposta', selfAssessment: 'certa' };
  });
  const done = await submitQuiz(db, id, { answers }, { now });
  return { attempt, done, questionIds: stored.questionIds };
}

async function studyAgain(db: Db, id: string, hour: number) {
  await startSession(db, 'CG-001', { now: at(hour), id });
  await concludeSession(db, id, { now: at(hour + 1) });
}

void test('regras puras: reprovações seguidas, questões erradas e seleção dirigida', () => {
  assert.equal(failureStreak([{ passed: false }, { passed: false }, { passed: true }, { passed: false }]), 2);
  assert.equal(failureStreak([{ passed: true }, { passed: false }]), 0);
  assert.deepEqual(
    wrongQuestionIds(JSON.stringify({ results: [{ questionId: 'a', correct: false, voided: false }, { questionId: 'b', correct: false, voided: true }, { questionId: 'c', correct: true, voided: false }] })),
    ['a'],
  );
  const bank = ['q1', 'q2', 'q3', 'q4', 'q5'].map((id) => ({ id }));
  assert.deepEqual(
    directedSelection(['q5', 'q4'], bank, [bank[0], bank[4], bank[1]], 3).map((item) => item.id),
    ['q5', 'q4', 'q1'],
  );
});

void test('reprovar, estudo dirigido, quiz dirigido, reincidência e desbloqueio ao refazer', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  growBank(raw);
  await studyAgain(db, 's1', 6);

  // 1ª reprovação: bloqueado, e a recuperação lista as questões erradas.
  const first = await takeQuiz(raw, db, 'q1', at(8), 4);
  assert.equal(first.done.passed, false);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'bloqueado');
  const recovery = await recoveryStatus(db, 'CG-001');
  assert.equal(recovery?.failures, 1);
  const wrong = first.done.results!.filter((item) => !item.correct && !item.voided).map((item) => item.questionId);
  assert.deepEqual(new Set(recovery?.missed.map((item) => item.id)), new Set(wrong));
  assert.ok(recovery?.missed.every((item) => item.prompt && item.explanation));
  assert.ok(recovery?.missed.some((item) => item.answer), 'mostra a resposta certa');

  await syncAgenda(db, { today: day, now: at(9) });
  const [urgent] = (await listAgenda(db, { from: day, to: addDays(day, 7) })).filter((item) => item.status === 'pendente');
  assert.deepEqual([urgent.kind, urgent.priority], ['quiz', 'urgente']);
  assert.match(urgent.reason, new RegExp(`${wrong.length} questões erradas voltam no quiz`));

  // Revisou as notas numa sessão: o quiz é dirigido (as erradas voltam todas).
  await studyAgain(db, 's2', 10);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'aguardando-quiz');
  await syncAgenda(db, { today: day, now: at(11) });
  const quizItem = (await listAgenda(db, { from: day, to: addDays(day, 7) })).find((item) => item.kind === 'quiz' && item.status === 'pendente');
  // O item urgente continua até passar (as erradas voltam no quiz).
  assert.match(quizItem?.reason ?? '', /questões erradas voltam no quiz/);
  const second = await takeQuiz(raw, db, 'q2', at(12), 0);
  assert.equal(second.attempt.directed, wrong.length);
  for (const id of wrong) assert.ok(second.questionIds.includes(id), `questão ${id} voltou`);

  // 2ª reprovação seguida: reincidência na agenda e em Progresso.
  assert.equal((await recoveryStatus(db, 'CG-001'))?.failures, 2);
  await syncAgenda(db, { today: day, now: at(13) });
  const again = (await listAgenda(db, { from: day, to: addDays(day, 7) })).find((item) => item.kind === 'quiz' && item.status === 'pendente');
  assert.match(again?.reason ?? '', /Reincidência: 2ª reprovação seguida/);
  const progress = computeProgress(await loadProgressInput(db), { now: at(13), today: day, tzOffsetMinutes: 0 });
  assert.equal(progress.atRisk[0]?.failures, 2);
  assert.match(progress.atRisk[0]?.reason ?? '', /Reincidência/);
  assert.equal(progress.disciplines.find((item) => item.frozenBy.length)?.frozenBy.length, 1);

  // Refez o quiz direto (sem nova sessão) e passou: concluído e desbloqueado.
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'bloqueado');
  const third = await takeQuiz(raw, db, 'q3', at(16), 10);
  assert.equal(third.done.passed, true);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido');
  assert.equal(await recoveryStatus(db, 'CG-001'), null);
  const after = computeProgress(await loadProgressInput(db), { now: at(17), today: day, tzOffsetMinutes: 0 });
  assert.equal(after.atRisk.length, 0);
  assert.ok(after.disciplines.every((item) => item.frozenBy.length === 0));
});
