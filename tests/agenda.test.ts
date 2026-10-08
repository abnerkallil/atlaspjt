// MVP-05: agenda interna (DEC-09) — estudo, quiz, recuperação urgente,
// conclusão por evidência ou manual e reagendamento explicável.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AgendaError,
  addDays,
  adjustItem,
  completeItem,
  layoutDay,
  listAgenda,
  quizMinutes,
  rescheduleItem,
  syncAgenda,
  type AgendaItem,
} from '../lib/agenda.js';
import { startQuiz, submitQuiz } from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const today = '2026-10-08';
const t = (hour: number) => `${today}T${String(hour).padStart(2, '0')}:00:00.000Z`;

function setup() {
  return d1(migratedDatabase());
}

async function day(db: ReturnType<typeof setup>, date = today) {
  return listAgenda(db, { from: date, to: date });
}

const pending = (items: AgendaItem[]) => items.filter((item) => item.status === 'pendente');

void test('horários: 7h por padrão, em sequência pela prioridade; hora fixada fica', () => {
  const base = { createdAt: t(1), startTime: null, durationMinutes: 30 };
  const laid = layoutDay([
    { ...base, id: 'e', kind: 'estudo' as const, priority: 'normal' as const },
    { ...base, id: 'r', kind: 'recuperacao' as const, priority: 'urgente' as const, durationMinutes: 45 },
    { ...base, id: 'q', kind: 'quiz' as const, priority: 'alta' as const, startTime: '19:30' },
  ]);
  assert.deepEqual(
    laid.map((item) => [item.id, item.startsAt]),
    [['r', '07:00'], ['q', '19:30'], ['e', '07:45']],
  );
  assert.equal(quizMinutes(['multipla', 'multipla', 'dissertativa']), 7);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});

void test('primeiro dia: o próximo conteúdo liberado vira estudo das 7h com o motivo', async () => {
  const db = setup();
  await syncAgenda(db, { today, now: t(6) });
  const [item, ...rest] = await day(db);
  assert.equal(rest.length, 0);
  assert.equal(item.kind, 'estudo');
  assert.equal(item.contentId, 'CG-001');
  assert.equal(item.startsAt, '07:00');
  assert.equal(item.priority, 'normal');
  assert.match(item.reason, /Próximo conteúdo liberado/);
  await syncAgenda(db, { today, now: t(7) });
  assert.equal((await day(db)).length, 1, 'sincronizar de novo não duplica');
});

void test('sessão concluída conclui o estudo por evidência e agenda o quiz com prioridade alta', async () => {
  const db = setup();
  await syncAgenda(db, { today, now: t(6) });
  await startSession(db, 'CG-001', { now: t(7), id: 's1' });
  await concludeSession(db, 's1', { now: t(8), evidenceId: 'ev-s1' });
  await syncAgenda(db, { today, now: t(9) });
  const items = await day(db);
  const study = items.find((item) => item.kind === 'estudo' && item.contentId === 'CG-001');
  assert.equal(study?.status, 'concluido');
  assert.equal(study?.completion, 'evidencia');
  assert.equal(study?.evidenceId, 'ev-s1');
  const quiz = pending(items).find((item) => item.kind === 'quiz');
  assert.equal(quiz?.contentId, 'CG-001');
  assert.equal(quiz?.priority, 'alta');
  assert.equal(quiz?.durationMinutes, 18, '8 múltipla + 2 dissertativas do banco inicial');
});

void test('reprovar no quiz agenda o quiz de novo, urgente, na frente do dia', async () => {
  const db = setup();
  await startSession(db, 'CG-001', { now: t(7), id: 's1' });
  await concludeSession(db, 's1', { now: t(8) });
  await syncAgenda(db, { today, now: t(9) });
  await startQuiz(db, 'CG-001', { now: t(10), id: 'a1' });
  await submitQuiz(db, 'a1', {}, { now: t(11) });
  await syncAgenda(db, { today, now: t(12) });
  const open = pending(await day(db));
  assert.equal(open[0].kind, 'quiz');
  assert.equal(open[0].priority, 'urgente');
  assert.equal(open[0].startsAt, '07:00');
  assert.match(open[0].reason, /Reprovado no quiz: refaça até passar com 70%/);
  assert.ok(!open.some((item) => item.kind === 'estudo'), 'o Atlas não propõe conteúdo novo enquanto há reprovação');
  const quiz = (await day(db)).find((item) => item.kind === 'quiz' && item.status === 'concluido');
  assert.equal(quiz?.status, 'concluido', 'o quiz feito conclui o item, mesmo reprovado');
});

void test('o que ficou para trás passa para hoje com o motivo', async () => {
  const db = setup();
  const yesterday = addDays(today, -1);
  await syncAgenda(db, { today: yesterday, now: `${yesterday}T06:00:00.000Z` });
  await syncAgenda(db, { today, now: t(6) });
  const [item] = await day(db);
  assert.equal(item.dueDate, today);
  assert.equal(item.originalDate, yesterday);
  assert.equal(item.rescheduleCount, 1);
  assert.equal(item.changeReason, 'Não foi feita em 07/10; o Atlas passou para hoje.');
});

void test('reagendar à mão: data futura, hora opcional e motivo; sem duplicar o estudo de hoje', async () => {
  const db = setup();
  await syncAgenda(db, { today, now: t(6) });
  const [item] = await day(db);
  const tomorrow = addDays(today, 1);
  const moved = await rescheduleItem(db, item.id, { date: tomorrow, time: '19:00', reason: 'plantão no trabalho', today, now: t(7) });
  assert.equal(moved.dueDate, tomorrow);
  assert.equal(moved.startsAt, '19:00');
  assert.equal(moved.changeReason, 'Reagendada por você de 08/10 para 09/10 às 19:00: plantão no trabalho');
  await syncAgenda(db, { today, now: t(8) });
  assert.equal((await day(db)).length, 0, 'o estudo reagendado não é recriado hoje');
  await assert.rejects(
    rescheduleItem(db, item.id, { date: addDays(today, -2), today }),
    (error: unknown) => error instanceof AgendaError && error.status === 400,
  );
  await assert.rejects(rescheduleItem(db, item.id, { date: tomorrow, time: '25:00', today }), /Horário inválido/);
});

void test('concluir à mão e ajustar duração e prioridade', async () => {
  const db = setup();
  await syncAgenda(db, { today, now: t(6) });
  const [item] = await day(db);
  const adjusted = await adjustItem(db, item.id, { durationMinutes: 25, priority: 'alta', now: t(7) });
  assert.deepEqual([adjusted.durationMinutes, adjusted.priority], [25, 'alta']);
  await assert.rejects(adjustItem(db, item.id, { durationMinutes: 1 }), /5 a 240/);
  await assert.rejects(adjustItem(db, item.id, { priority: 'maxima' }), /Prioridade inválida/);
  const done = await completeItem(db, item.id, { now: t(8) });
  assert.equal(done.status, 'concluido');
  assert.equal(done.completion, 'manual');
  await assert.rejects(completeItem(db, item.id), (error: unknown) => error instanceof AgendaError && error.status === 409);
  await syncAgenda(db, { today, now: t(9) });
  assert.equal(pending(await day(db)).length, 0, 'concluído à mão não volta no mesmo dia');
  await syncAgenda(db, { today: addDays(today, 1), now: t(23) });
  assert.equal(pending(await day(db, addDays(today, 1))).length, 1, 'no dia seguinte o passo volta');
});

void test('item que perdeu sentido é cancelado com o motivo', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, 'CG-001', { now: t(7), id: 's1' });
  await concludeSession(db, 's1', { now: t(8) });
  await syncAgenda(db, { today, now: t(9) });
  raw.prepare("UPDATE atlas_content_states SET state = 'concluido' WHERE content_id = 'CG-001'").run();
  await syncAgenda(db, { today, now: t(10) });
  const quiz = (await day(db)).find((item) => item.kind === 'quiz');
  assert.equal(quiz?.status, 'cancelado');
  assert.match(quiz?.changeReason ?? '', /não é mais necessário/);
});
