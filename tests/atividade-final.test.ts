// APO-19: atividade final e recuperação — provas por disciplina na mesma
// tabela do exame de meio (uma linha por instrumento), liberação em 100% de
// cobertura com todas as atividades aprovadas (`conteudo-100`, DEC-018),
// início só com confirmação explícita, cascata do exame de meio na nota da
// atividade final (ajustada = bruta × (1 − erro do exame de meio), sem
// piso), 90 s por questão com rolagem da sobra, recuperação só depois de
// resultado insatisfatório e resgate ADITIVO (modelo "faculdade", confirmado
// pelo Abner): a recuperação não aplica a cascata de novo, só devolve a
// fração do que foi cortado da atividade final — "vale a maior nota".
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FINAL_INSTRUMENT,
  RECOVERY_INSTRUMENT,
  rolloverTiming,
  startExameMeio,
  submitExam,
  syncDisciplineState,
} from '../lib/apolo/exam.js';
import {
  answerFinalQuestion,
  applyMidtermCascade,
  applyRecoveryBuyback,
  getFinalActivityGrade,
  lockFinal,
  resolveFinalScope,
  startAtividadeFinal,
  startRecuperacao,
  submitFinal,
} from '../lib/apolo/final.js';
import { EXAM_QUESTION_SECONDS, resolvePlan } from '../lib/apolo/plans.js';
import { TransitionError, currentState, listAudit } from '../lib/pedagogy/transitions.js';
import { computeProgress, loadProgressInput } from '../lib/progress.js';
import { QuizError, listQuestions, quizErrorResponse, shuffleQuestion, type Answers } from '../lib/quizzes.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const T0 = '2026-10-09T12:00:00.000Z';
const T1 = '2026-10-09T13:00:00.000Z';
// Início da atividade final; `at(s)` = s segundos depois.
const START = '2026-10-10T12:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(START) + seconds * 1000).toISOString();
const DISCIPLINE = 'contabilidade-geral';

type Raw = ReturnType<typeof migratedDatabase>;
type Db = ReturnType<typeof d1>;

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

function contentIds(raw: Raw): string[] {
  return (
    raw.prepare('SELECT id FROM atlas_contents WHERE discipline_id = ? ORDER BY position, id').all(DISCIPLINE) as {
      id: string;
    }[]
  ).map((row) => row.id);
}

function coverFirst(raw: Raw, count: number) {
  const insert = raw.prepare(
    "INSERT INTO atlas_content_states (content_id, state, updated_at) VALUES (?, 'concluido', ?) ON CONFLICT(content_id) DO UPDATE SET state = 'concluido'",
  );
  for (const id of contentIds(raw).slice(0, count)) insert.run(id, T0);
}

// Atalho de teste: evidência `atividade` (só existe quando a atividade foi
// aprovada, APO-17) para os n primeiros conteúdos.
function approveActivities(raw: Raw, count: number) {
  const insert = raw.prepare(
    "INSERT OR IGNORE INTO atlas_evidences (id, content_id, kind, summary, recorded_at) VALUES (?, ?, 'atividade', 'Atividade aprovada: 9/10 (90%).', ?)",
  );
  for (const id of contentIds(raw).slice(0, count)) insert.run(`ev-${id}`, id, T0);
}

async function answerKey(raw: Raw, db: Db, attemptId: string, correctCount = Infinity): Promise<Answers> {
  const row = raw.prepare('SELECT questions_json, scope_json FROM atlas_exam_attempts WHERE id = ?').get(attemptId) as {
    questions_json: string;
    scope_json: string;
  };
  const stored = JSON.parse(row.questions_json) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const scope = JSON.parse(row.scope_json) as { contentIds: string[] };
  const bank = new Map((await listQuestions(db, scope.contentIds)).map((item) => [item.id, item]));
  const answers: Answers = {};
  let remaining = correctCount;
  for (const id of stored.questionIds) {
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    const right = remaining > 0;
    if (right) remaining -= 1;
    answers[id] =
      question.kind === 'dissertativa'
        ? { text: 'resposta', selfAssessment: right ? 'certa' : 'errada' }
        : { option: right ? question.correctOption! : (question.correctOption! + 1) % question.options!.length };
  }
  return answers;
}

// Exame de meio entregue com `midtermCorrect`/60 e, depois, a disciplina
// inteira coberta com todas as atividades aprovadas.
async function reachFinal(raw: Raw, db: Db, midtermCorrect = 45) {
  const total = contentIds(raw).length;
  coverFirst(raw, total / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now: T0, id: 'ex1' });
  await submitExam(db, 'ex1', { answers: await answerKey(raw, db, 'ex1', midtermCorrect) }, { now: T1 });
  coverFirst(raw, total);
  approveActivities(raw, total);
  return syncDisciplineState(db, DISCIPLINE, { now: T1 });
}

void test('planos: atividade final com 60 questões e 90 s (confirmado em 2026-10-09); recuperação segue rascunho de 10', () => {
  const final = resolvePlan('atividade_final');
  assert.equal(final.size, 60);
  assert.equal(final.passingScore, 70);
  assert.equal(final.version, 2);
  assert.equal(final.secondsByKind.multipla, EXAM_QUESTION_SECONDS);
  assert.equal(final.secondsByKind.calculo, null);
  const recovery = resolvePlan('recuperacao');
  assert.equal(recovery.size, 10);
  assert.equal(recovery.passingScore, 70);
  assert.equal(recovery.secondsByKind.dissertativa, EXAM_QUESTION_SECONDS);
  // O exame de meio não muda.
  assert.equal(resolvePlan('exame_meio').secondsByKind.multipla, EXAM_QUESTION_SECONDS);
});

void test('escopo da atividade final: a disciplina inteira, na ordem do roadmap', () => {
  assert.deepEqual(
    resolveFinalScope([
      { id: 'C2', position: 2 },
      { id: 'C1', position: 1 },
      { id: 'C3', position: 3 },
    ]),
    { rule: 'disciplina', levels: null, contentIds: ['C1', 'C2', 'C3'], totalContents: 3 },
  );
});

void test('cascata: 33% de erro no exame de meio corta 33% da nota; sem piso nem teto além do natural', () => {
  // Exemplo do Abner: exame de meio 67 (33% de erro) → a atividade final perde 33%.
  assert.deepEqual(applyMidtermCascade(90, { attemptId: 'm', score: 67 }), {
    rawScore: 90,
    midtermAttemptId: 'm',
    midtermScore: 67,
    midtermErrorPercent: 33,
    adjustedScore: 60.3,
  });
  assert.equal(applyMidtermCascade(100, { attemptId: 'm', score: 67 }).adjustedScore, 67);
  // Exame de meio perfeito: nada é cortado; zerado: a nota vai a zero (sem piso).
  assert.equal(applyMidtermCascade(80, { attemptId: 'm', score: 100 }).adjustedScore, 80);
  assert.equal(applyMidtermCascade(100, { attemptId: 'm', score: 0 }).adjustedScore, 0);
  // Quem foi mal no exame de meio não passa na final "com louvor".
  assert.equal(applyMidtermCascade(100, { attemptId: 'm', score: 50 }).adjustedScore, 50);
});

void test('recuperação: resgate aditivo (modelo "faculdade", confirmado pelo Abner) — não cascata de novo', () => {
  // Exemplo exato do Abner: exame de meio corta 50 pontos da atividade final
  // (bruta 100, ajustada 50); recuperação com nota máxima (100) resgata os
  // 50 inteiros — a atividade final chega a 100, a bruta ORIGINAL dela, não
  // à nota do exame de meio (que não é teto da recuperação).
  const full = applyRecoveryBuyback(100, { rawScore: 100, adjustedScore: 50 }, { attemptId: 'm', score: 50 });
  assert.deepEqual(full, {
    rawScore: 100,
    midtermAttemptId: 'm',
    midtermScore: 50,
    midtermErrorPercent: 50,
    adjustedScore: 100,
    removedAmount: 50,
    recoveryContribution: 50,
  });
  // Recuperação zerada: nada é resgatado, fica na nota ajustada da final.
  assert.equal(applyRecoveryBuyback(0, { rawScore: 100, adjustedScore: 50 }, { attemptId: 'm', score: 50 }).adjustedScore, 50);
  // Recuperação parcial (50%): resgata metade do removido.
  assert.equal(applyRecoveryBuyback(50, { rawScore: 100, adjustedScore: 50 }, { attemptId: 'm', score: 50 }).adjustedScore, 75);
  // Não há teto do exame de meio: mesmo com exame de meio baixo, a
  // recuperação cheia devolve a nota bruta ORIGINAL da atividade final.
  const low = applyRecoveryBuyback(100, { rawScore: 90, adjustedScore: 67.5 }, { attemptId: 'm', score: 25 });
  assert.equal(low.adjustedScore, 90);
});

void test('rolagem: a sobra de uma questão vira prazo extra da seguinte; sem limite deixa a sobra passar', () => {
  const questions = [
    { id: 'q1', seconds: 90 },
    { id: 'q2', seconds: 90 },
    { id: 'q3', seconds: 90 },
  ];
  // Sem tolerância, para o efeito ficar nítido: q1 em 60 s (sobra 30), q2 em
  // 115 s (sem rolagem estouraria os 90; com rolagem cabe nos 120).
  const timing = rolloverTiming(questions, START, { q1: at(60), q2: at(175) }, 0);
  assert.deepEqual(
    timing.map((item) => [item.budgetSeconds, item.spentSeconds, item.leftoverSeconds, item.late]),
    [
      [90, 60, 30, false],
      [120, 115, 5, false],
      [95, null, 0, false],
    ],
  );
  // A questão da vez tem o prazo contado da última resposta: 175 + 95 s.
  assert.equal(timing[2].deadlineAt, at(270));
  // Estourar zera a sobra e marca a questão como atrasada (só a marca, como no quiz).
  const late = rolloverTiming(questions, START, { q1: at(60), q2: at(200), q3: at(250) }, 0);
  assert.deepEqual(
    late.map((item) => [item.budgetSeconds, item.spentSeconds, item.leftoverSeconds, item.late]),
    [
      [90, 60, 30, false],
      [120, 140, 0, true],
      [90, 50, 40, false],
    ],
  );
  // Cálculo/lacuna numérica: sem limite, nunca atrasa e não come a sobra herdada.
  const untimed = rolloverTiming(
    [
      { id: 'q1', seconds: 90 },
      { id: 'c', seconds: null },
      { id: 'q3', seconds: 90 },
    ],
    START,
    { q1: at(60), c: at(1000), q3: at(1110) },
    0,
  );
  assert.deepEqual(
    untimed.map((item) => [item.budgetSeconds, item.leftoverSeconds, item.late]),
    [
      [90, 30, false],
      [null, 30, false],
      [120, 10, false],
    ],
  );
});

void test('conteudo-100: só com o exame de meio entregue, 100% de cobertura e todas as atividades aprovadas; auditado', async () => {
  const { raw, db } = setup();
  const total = contentIds(raw).length;
  // Tudo coberto e aprovado desde o início: a sincronização dá um passo só (conteudo-50).
  coverFirst(raw, total);
  approveActivities(raw, total - 1);
  const first = await syncDisciplineState(db, DISCIPLINE, { now: T0 });
  assert.equal(first.state, 'exame-meio-liberado');
  await assert.rejects(
    startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: T0 }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now: T0, id: 'ex1' });
  await submitExam(db, 'ex1', { answers: await answerKey(raw, db, 'ex1', 45) }, { now: T1 });
  // Falta uma atividade aprovada (DEC-018): não libera.
  const pending = await syncDisciplineState(db, DISCIPLINE, { now: T1 });
  assert.deepEqual(
    { released: pending.released, state: pending.state, atividades: pending.atividadesAprovadas },
    { released: false, state: 'exame-meio-concluido', atividades: total - 1 },
  );
  approveActivities(raw, total);
  const released = await syncDisciplineState(db, DISCIPLINE, { now: T1 });
  assert.deepEqual(
    { released: released.released, state: released.state, covered: released.covered, atividades: released.atividadesAprovadas },
    { released: true, state: 'atividade-final-liberada', covered: total, atividades: total },
  );
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual(
    { event: last.event, actor: last.actor, from: last.fromState, to: last.toState },
    { event: 'conteudo-100', actor: 'sistema', from: 'exame-meio-concluido', to: 'atividade-final-liberada' },
  );
  // Idempotente.
  assert.equal((await syncDisciplineState(db, DISCIPLINE, { now: T1 })).released, false);
});

void test('conteudo-100 não dispara com cobertura incompleta', async () => {
  const { raw, db } = setup();
  const total = contentIds(raw).length;
  coverFirst(raw, total / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now: T0, id: 'ex1' });
  await submitExam(db, 'ex1', { answers: await answerKey(raw, db, 'ex1', 45) }, { now: T1 });
  coverFirst(raw, total - 1);
  approveActivities(raw, total);
  const status = await syncDisciplineState(db, DISCIPLINE, { now: T1 });
  assert.equal(status.released, false);
  assert.equal(status.state, 'exame-meio-concluido');
});

void test('sem confirmação explícita: 409 code=confirmation, nada gravado; com confirmação, 60 questões da disciplina inteira', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db);
  let caught: unknown;
  try {
    await startAtividadeFinal(db, DISCIPLINE, { now: START, id: 'af1' });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof TransitionError && caught.code === 'confirmation');
  const response = quizErrorResponse(caught);
  assert.equal(response.status, 409);
  assert.equal(((await response.json()) as { code: string }).code, 'confirmation');
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'atividade-final-liberada');
  assert.equal(
    (raw.prepare("SELECT COUNT(*) AS n FROM atlas_exam_attempts WHERE instrument = 'atividade_final'").get() as { n: number }).n,
    0,
  );

  const attempt = await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  assert.equal(attempt.instrument, FINAL_INSTRUMENT);
  assert.equal(attempt.scope.rule, 'disciplina');
  assert.equal(attempt.scope.contentIds.length, contentIds(raw).length);
  assert.equal(attempt.questions.length, 60);
  assert.ok(attempt.questions.every((question) => question.seconds === 90));
  // Teto da prova inteira: a rolagem só move a sobra, nunca aumenta o total.
  assert.equal(Date.parse(attempt.deadlineAt!) - Date.parse(START), 60 * 90 * 1000);
  assert.deepEqual(attempt.currentQuestion, { questionId: attempt.questions[0].id, index: 0, deadlineAt: at(90) });
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'atividade-final-em-curso');
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual([last.event, last.actor], ['iniciar-atividade-final', 'usuario']);
  // Mesma tabela do exame de meio, uma linha por instrumento; segunda chamada devolve a mesma.
  assert.equal((await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: at(5) })).id, 'af1');
  assert.deepEqual(
    (raw.prepare('SELECT instrument FROM atlas_exam_attempts ORDER BY instrument').all() as { instrument: string }[]).map(
      (row) => row.instrument,
    ),
    ['atividade_final', 'exame_meio'],
  );
  // O fluxo do exame de meio recusa a tentativa da atividade final (e vice-versa).
  await assert.rejects(
    submitExam(db, 'af1', { answers: {} }, { now: at(10) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  await assert.rejects(
    submitFinal(db, 'ex1', { answers: {} }, { now: at(10) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
});

void test('resposta questão a questão: na ordem, relógio do servidor, sobra rolando para a seguinte', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db);
  const attempt = await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  const key = await answerKey(raw, db, 'af1');
  const [q1, q2, q3] = attempt.questions.map((question) => question.id);
  // Fora de ordem: recusado.
  await assert.rejects(
    answerFinalQuestion(db, 'af1', q2, key[q2], { now: at(10) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  // q1 em 60 s: q2 ganha 90 + 30 = 120 s, contados da resposta de q1.
  const afterQ1 = await answerFinalQuestion(db, 'af1', q1, key[q1], { now: at(60) });
  assert.deepEqual(afterQ1.currentQuestion, { questionId: q2, index: 1, deadlineAt: at(180) });
  // q2 em 115 s: cabe (sem rolagem seriam só 90 s + tolerância de 30).
  const afterQ2 = await answerFinalQuestion(db, 'af1', q2, key[q2], { now: at(175) });
  assert.equal(afterQ2.timing![1].late, false);
  assert.equal(afterQ2.timing![1].leftoverSeconds, 5);
  assert.deepEqual(afterQ2.currentQuestion, { questionId: q3, index: 2, deadlineAt: at(270) });
  // Questão já respondida não volta.
  await assert.rejects(
    answerFinalQuestion(db, 'af1', q1, key[q1], { now: at(180) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  // q3 estoura (200 s com 95 de prazo + 30 de tolerância): marca atraso, não recusa.
  const afterQ3 = await answerFinalQuestion(db, 'af1', q3, key[q3], { now: at(375) });
  assert.equal(afterQ3.timing![2].late, true);
  assert.equal(afterQ3.answers![q3].option, key[q3].option);

  // Envio: o que já foi respondido vale como gravado (resposta nova para q1 é
  // ignorada); o resto entra com o relógio do envio, logo depois de q3.
  const tampered = { ...key, [q1]: { option: ((key[q1].option ?? 0) + 1) % 4 } };
  const done = await submitFinal(db, 'af1', { answers: tampered }, { now: at(380) });
  assert.equal(done.status, 'enviado');
  assert.equal(done.late, true);
  assert.deepEqual(done.timing!.map((item) => item.late).filter(Boolean).length, 1);
  assert.equal(done.answers![q1].option, key[q1].option);
  assert.equal(done.boletim!.cascade!.rawScore, 100);
});

void test('atividade final: cascata decide a aprovação — bruta 90 com exame de meio 75 vira 67,5 e é insatisfatória', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db, 45); // exame de meio 75% → 25% de erro
  await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  const done = await submitFinal(db, 'af1', { answers: await answerKey(raw, db, 'af1', 54) }, { now: at(60) });
  assert.equal(done.late, false);
  assert.deepEqual(done.cascade, {
    rawScore: 90,
    midtermAttemptId: 'ex1',
    midtermScore: 75,
    midtermErrorPercent: 25,
    adjustedScore: 67.5,
  });
  // A nota emitida é a ajustada; o boletim guarda a bruta do corretor e a cascata.
  assert.equal(done.score, 67.5);
  assert.equal(done.passed, false);
  assert.equal(done.boletim!.score, 90);
  assert.equal(done.boletim!.passed, false);
  assert.deepEqual(
    { kr20: done.boletim!.reliability?.kr20, administrations: done.boletim!.reliability?.administrations },
    { kr20: null, administrations: 1 },
  );
  assert.match(done.boletim!.reliability!.basis, /atividade final/);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'recuperacao-liberada');
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual([last.event, last.actor], ['atividade-final-insatisfatoria', 'sistema']);
  assert.match(last.reason, /bruta 90% × \(1 − 25% de erro no exame de meio\) = 67.5%, mínimo 70%/);
  // Grava uma vez só (DEC-016).
  await assert.rejects(
    submitFinal(db, 'af1', { answers: {} }, { now: at(70) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
});

void test('caminho direto: ajustada >= 70 aprova e conclui a disciplina; recuperação não abre', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db, 45);
  await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  const done = await submitFinal(db, 'af1', { answers: await answerKey(raw, db, 'af1') }, { now: at(60) });
  assert.equal(done.score, 75);
  assert.equal(done.passed, true);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'concluida');
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual([last.event, last.actor], ['atividade-final-aprovada', 'sistema']);
  await assert.rejects(
    startRecuperacao(db, DISCIPLINE, { confirmed: true, now: at(120) }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  assert.deepEqual((await getFinalActivityGrade(db, DISCIPLINE)).finalActivity, { score: 75, source: FINAL_INSTRUMENT });
});

void test('recuperação: confirmação, resgate aditivo (não cascata de novo), vale a maior nota e a disciplina conclui', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db, 45);
  await assert.rejects(
    startRecuperacao(db, DISCIPLINE, { confirmed: true, now: START }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  // Atividade final: bruta 90, exame de meio 75 (25% de erro) → ajustada 67,5.
  // Removido = 90 − 67,5 = 22,5.
  await submitFinal(db, 'af1', { answers: await answerKey(raw, db, 'af1', 54) }, { now: at(60) });

  await assert.rejects(
    startRecuperacao(db, DISCIPLINE, { now: at(100), id: 'rec1' }),
    (error: unknown) => error instanceof TransitionError && error.code === 'confirmation',
  );
  const recovery = await startRecuperacao(db, DISCIPLINE, { confirmed: true, now: at(100), id: 'rec1' });
  assert.equal(recovery.instrument, RECOVERY_INSTRUMENT);
  assert.equal(recovery.questions.length, 10);
  assert.equal(recovery.scope.rule, 'disciplina');
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'recuperacao-em-curso');

  // Bruta 100 na recuperação: resgata o removido inteiro (22,5) — NÃO uma
  // cascata nova sobre a própria nota bruta. 67,5 + 22,5 = 90, a nota bruta
  // ORIGINAL da atividade final, não a do exame de meio (75).
  const done = await submitFinal(db, 'rec1', { answers: await answerKey(raw, db, 'rec1') }, { now: at(150) });
  assert.equal(done.boletim!.score, 100);
  assert.deepEqual(
    { removedAmount: done.cascade!.removedAmount, recoveryContribution: done.cascade!.recoveryContribution },
    { removedAmount: 22.5, recoveryContribution: 22.5 },
  );
  assert.equal(done.cascade!.adjustedScore, 90);
  assert.equal(done.score, 90);
  assert.equal(done.passed, true);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'concluida');
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual([last.event, last.actor], ['recuperacao-entregue', 'sistema']);
  assert.match(last.reason, /Vale a maior nota: 90% \(recuperação\)/);
  assert.deepEqual(await getFinalActivityGrade(db, DISCIPLINE), {
    disciplineId: DISCIPLINE,
    exameMeio: 75,
    atividadeFinal: 67.5,
    recuperacao: 90,
    finalActivity: { score: 90, source: RECOVERY_INSTRUMENT },
  });
  // Recuperação é única: chamar de novo devolve a mesma.
  assert.equal((await startRecuperacao(db, DISCIPLINE, { confirmed: true, now: at(200) })).id, 'rec1');

  // Progresso: Avaliações = 50/50 entre exame de meio (75) e a nota que vale (90).
  const input = await loadProgressInput(db);
  const report = computeProgress(input, { now: at(200), today: '2026-10-10', tzOffsetMinutes: 180 });
  const avaliacoes = report.disciplines
    .find((item) => item.id === DISCIPLINE)!
    .components.find((item) => item.key === 'avaliacoes')!;
  assert.equal(avaliacoes.ratio, 0.825);
  assert.match(avaliacoes.detail, /nota da recuperação, maior que a da atividade final/);
  assert.match(avaliacoes.detail, /Média 50\/50: 82.5%/);
});

void test('recuperação parcial: resgata só uma fração do removido, ainda insatisfatória, mas a disciplina conclui', async () => {
  const { raw, db } = setup();
  await reachFinal(raw, db, 45);
  await startAtividadeFinal(db, DISCIPLINE, { confirmed: true, now: START, id: 'af1' });
  // Atividade final: bruta 90, ajustada 67,5 (igual ao teste anterior). Removido = 22,5.
  await submitFinal(db, 'af1', { answers: await answerKey(raw, db, 'af1', 54) }, { now: at(60) });
  await startRecuperacao(db, DISCIPLINE, { confirmed: true, now: at(100), id: 'rec1' });
  // Bruta 10 (1/10) na recuperação: resgata só 10% do removido (2,25 → 2,3).
  // 67,5 + 2,3 = 69,8 — ainda abaixo do corte de 70, mas MELHOR que a final
  // sozinha (nunca pior: a recuperação só soma, nunca subtrai).
  const recovery = await lockFinal(db, 'rec1', await answerKey(raw, db, 'rec1', 1), { now: at(130) });
  assert.equal(recovery.status, 'autoavaliacao');
  const done = await submitFinal(db, 'rec1', {}, { now: at(400) });
  // Tempo fechado na trava: a autoavaliação depois não conta como atraso.
  assert.equal(done.late, false);
  assert.equal(done.boletim!.score, 10);
  assert.deepEqual(
    { removedAmount: done.cascade!.removedAmount, recoveryContribution: done.cascade!.recoveryContribution },
    { removedAmount: 22.5, recoveryContribution: 2.3 },
  );
  assert.equal(done.score, 69.8);
  assert.equal(done.passed, false);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'concluida');
  assert.deepEqual((await getFinalActivityGrade(db, DISCIPLINE)).finalActivity, { score: 69.8, source: RECOVERY_INSTRUMENT });
});
