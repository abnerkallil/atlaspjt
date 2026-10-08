// MVP-06: revisões 24h/7d/30d — agendamento, quiz principal, corretivo,
// recuperação urgente e resumo final (DEC-09, DEC-03).
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, listAgenda, syncAgenda } from '../lib/agenda.js';
import { currentState } from '../lib/pedagogy/transitions.js';
import {
  listQuestions,
  listQuizQueue,
  shuffleQuestion,
  startQuiz,
  submitQuiz,
  type Answers,
} from '../lib/quizzes.js';
import { localDateOf, nextReview } from '../lib/reviews.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const day0 = '2026-10-08';
const at = (date: string, hour: number) => `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;

type Raw = ReturnType<typeof migratedDatabase>;
type Db = ReturnType<typeof d1>;

async function takeQuiz(raw: Raw, db: Db, id: string, now: string, pass: boolean) {
  const attempt = await startQuiz(db, 'CG-001', { now, id });
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(id) as { questions_json: string }).questions_json,
  ) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  if (pass) {
    for (const questionId of stored.questionIds) {
      const question = shuffleQuestion(bank.get(questionId)!, stored.optionOrders[questionId]);
      answers[questionId] =
        question.kind === 'multipla' ? { option: question.correctOption! } : { text: 'resposta', selfAssessment: 'certa' };
    }
  }
  const done = await submitQuiz(db, id, { answers }, { now });
  return { attempt, done };
}

async function pending(db: Db, date: string) {
  return (await listAgenda(db, { from: date, to: addDays(date, 40) })).filter((item) => item.status === 'pendente');
}

void test('prazos 24h/7d/30d contados da conclusão e data local pelo fuso', () => {
  const anchor = '2026-10-08T02:30:00.000Z';
  assert.equal(localDateOf(anchor, 180), '2026-10-07', 'UTC−3: ainda é dia 7');
  assert.deepEqual(nextReview({ anchor, passed: 0 }), { stage: '24h', dueAt: '2026-10-09T02:30:00.000Z' });
  assert.equal(nextReview({ anchor, passed: 2 })?.stage, '30d');
  assert.equal(nextReview({ anchor, passed: 3 }), null);
});

void test('ciclo completo: revisão, falha, recuperação urgente, corretivo e resumo final', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, 'CG-001', { now: at(day0, 8), id: 's1' });
  await concludeSession(db, 's1', { now: at(day0, 9) });
  await takeQuiz(raw, db, 'q1', at(day0, 10), true);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido');

  // Agendamento: a revisão de 24h já aparece para amanhã.
  await syncAgenda(db, { today: day0, now: at(day0, 11) });
  const day1 = addDays(day0, 1);
  const [review24] = (await pending(db, day0)).filter((item) => item.kind === 'revisao');
  assert.equal(review24.sourceRef, '24h');
  assert.equal(review24.dueDate, day1);
  assert.match(review24.reason, /Revisão de 24h/);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido', 'antes do prazo nada muda');

  // Chegou o prazo: aguardando revisão e quiz de revisão na fila.
  await syncAgenda(db, { today: day1, now: at(day1, 6) });
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'aguardando-revisao');
  const [queued] = await listQuizQueue(db);
  assert.deepEqual([queued.purpose, queued.stage], ['revisao', '24h']);
  const { attempt: r1, done: r1done } = await takeQuiz(raw, db, 'r1', at(day1, 9), true);
  assert.deepEqual([r1.purpose, r1.stage], ['revisao', '24h']);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'revalidado');
  assert.equal(r1done.review?.next?.stage, '7d');
  assert.equal(r1done.review?.cycleDone, false);
  const evidence = raw.prepare("SELECT kind, summary FROM atlas_evidences WHERE source_ref = 'r1'").get() as Record<string, string>;
  assert.deepEqual({ ...evidence }, { kind: 'revisao', summary: 'Revisão de 24h aprovada: 10/10 (100%).' });

  await syncAgenda(db, { today: day1, now: at(day1, 10) });
  const agenda1 = await listAgenda(db, { from: day1, to: addDays(day0, 40) });
  assert.equal(agenda1.find((item) => item.sourceRef === '24h')?.completion, 'evidencia');
  assert.equal(agenda1.find((item) => item.sourceRef === '7d' && item.status === 'pendente')?.dueDate, addDays(day0, 7));

  // 7d: falha, conteúdo reaberto e quiz corretivo urgente, que pode ser refeito direto.
  const day7 = addDays(day0, 7);
  await syncAgenda(db, { today: day7, now: at(day7, 6) });
  const { done: r2done } = await takeQuiz(raw, db, 'r2', at(day7, 9), false);
  assert.equal(r2done.review?.passed, false);
  assert.equal(r2done.review?.next, null);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'em-revisao-ativa');
  await syncAgenda(db, { today: day7, now: at(day7, 10) });
  const [urgent] = await pending(db, day7);
  assert.deepEqual([urgent.kind, urgent.priority], ['quiz', 'urgente']);
  assert.match(urgent.reason, /Falhou na revisão: refaça o quiz corretivo/);
  assert.equal((await listQuizQueue(db))[0].purpose, 'corretivo');

  // Reprovar o corretivo mantém a revisão ativa; o quiz volta na hora.
  const { attempt: c0 } = await takeQuiz(raw, db, 'c0', at(day7, 11), false);
  assert.equal(c0.purpose, 'corretivo');
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'em-revisao-ativa');
  const { attempt: c1, done: c1done } = await takeQuiz(raw, db, 'c1', at(day7, 15), true);
  assert.deepEqual([c1.purpose, c1.stage], ['corretivo', '7d']);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'revalidado');
  assert.equal(c1done.review?.next?.stage, '30d');

  // 30d: aprovada fecha o ciclo (resumo final) e não agenda mais revisões.
  const day30 = addDays(day0, 30);
  await syncAgenda(db, { today: day30, now: at(day30, 6) });
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'aguardando-revisao');
  const { done: r3done } = await takeQuiz(raw, db, 'r3', at(day30, 9), true);
  assert.deepEqual([r3done.review?.stage, r3done.review?.cycleDone, r3done.review?.next], ['30d', true, null]);
  await syncAgenda(db, { today: day30, now: at(day30, 10) });
  assert.equal((await pending(db, day30)).filter((item) => item.kind === 'revisao').length, 0);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'revalidado');
});
