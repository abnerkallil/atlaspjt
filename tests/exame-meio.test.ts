// APO-18: exame de meio de curso — prova por disciplina, tentativa única
// (garantida no banco), escopo pelo nível curado (com recaída para a primeira
// metade por posição enquanto nada está nivelado), liberação automática em
// 50% de cobertura (`conteudo-50`, sistema), início só com confirmação
// explícita (`iniciar-exame-meio`), entrega pelo envio (`exame-meio-
// entregue`), 90 s por questão, nota própria (corte 70%) e boletim com KR-20.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXAM_INSTRUMENT,
  allocateContentQuotas,
  examScope,
  examTotalSeconds,
  getExamAttempt,
  listExamQueue,
  lockExam,
  resolveExamScope,
  setContentLevel,
  startExameMeio,
  submitExam,
  syncDisciplineState,
} from '../lib/apolo/exam.js';
import { APOLO_CORRECTOR_VERSION } from '../lib/apolo/corrector.js';
import { computeInstrumentStats, kr20, type ItemAnswerEvent } from '../lib/apolo/item-stats.js';
import { EXAM_QUESTION_SECONDS, resolvePlan } from '../lib/apolo/plans.js';
import { TransitionError, currentState, listAudit } from '../lib/pedagogy/transitions.js';
import { computeProgress, loadProgressInput } from '../lib/progress.js';
import { QuizError, listQuestions, quizErrorResponse, shuffleQuestion, type Answers } from '../lib/quizzes.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-09T12:00:00.000Z';
const later = '2026-10-09T13:00:00.000Z';
const DISCIPLINE = 'contabilidade-geral';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

type Raw = ReturnType<typeof migratedDatabase>;

function contentIds(raw: Raw): string[] {
  return (
    raw.prepare('SELECT id FROM atlas_contents WHERE discipline_id = ? ORDER BY position, id').all(DISCIPLINE) as {
      id: string;
    }[]
  ).map((row) => row.id);
}

// Atalho de teste: marca os n primeiros conteúdos como concluídos.
function coverFirst(raw: Raw, count: number) {
  const insert = raw.prepare(
    "INSERT INTO atlas_content_states (content_id, state, updated_at) VALUES (?, 'concluido', ?) ON CONFLICT(content_id) DO UPDATE SET state = 'concluido'",
  );
  for (const id of contentIds(raw).slice(0, count)) insert.run(id, now);
}

function examCount(raw: Raw): number {
  return (raw.prepare('SELECT COUNT(*) AS n FROM atlas_exam_attempts').get() as { n: number }).n;
}

async function correctAnswers(raw: Raw, db: ReturnType<typeof d1>, attemptId: string, correctCount = Infinity) {
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

void test('escopo: nível curado (iniciante + intermediário) quando há conteúdo nivelado; senão, primeira metade por posição', () => {
  const contents = [
    { id: 'C3', position: 3, level: null },
    { id: 'C1', position: 1, level: null },
    { id: 'C2', position: 2, level: null },
    { id: 'C4', position: 4, level: null },
    { id: 'C5', position: 5, level: null },
  ];
  assert.deepEqual(resolveExamScope(contents), {
    rule: 'posicao',
    levels: null,
    contentIds: ['C1', 'C2', 'C3'],
    totalContents: 5,
  });
  // Valor fora do conjunto não conta como nivelado (validação em código, DEC-014).
  assert.equal(resolveExamScope(contents.map((c) => ({ ...c, level: 'facil' }))).rule, 'posicao');
  const leveled = resolveExamScope([
    { id: 'C1', position: 1, level: 'iniciante' },
    { id: 'C2', position: 2, level: 'avancado' },
    { id: 'C3', position: 3, level: 'intermediario' },
    { id: 'C4', position: 4, level: null },
  ]);
  assert.deepEqual(leveled, {
    rule: 'nivel',
    levels: ['iniciante', 'intermediario'],
    contentIds: ['C1', 'C3'],
    totalContents: 4,
  });
});

void test('escopo no D1: recai na posição até a curadoria nivelar algo; nível inválido é recusado', async () => {
  const { raw, db } = setup();
  const ids = contentIds(raw);
  const fallback = await examScope(db, DISCIPLINE);
  assert.equal(fallback.rule, 'posicao');
  assert.deepEqual(fallback.contentIds, ids.slice(0, Math.ceil(ids.length / 2)));

  await setContentLevel(db, 'CG-001', 'iniciante');
  await setContentLevel(db, 'CG-002', 'intermediario');
  await setContentLevel(db, 'CG-003', 'avancado');
  const leveled = await examScope(db, DISCIPLINE);
  assert.equal(leveled.rule, 'nivel');
  assert.deepEqual(leveled.contentIds, ['CG-001', 'CG-002']);

  await assert.rejects(
    setContentLevel(db, 'CG-001', 'expert' as never),
    (error: unknown) => error instanceof QuizError && error.status === 400,
  );
});

void test('cotas por conteúdo: divisão igual, sem passar do banco de cada um, sobra para quem tem mais', () => {
  assert.deepEqual(allocateContentQuotas({ a: 2, b: 50, c: 50 }, 60, ['a', 'b', 'c']), { a: 2, b: 29, c: 29 });
  assert.deepEqual(allocateContentQuotas({ a: 10, b: 10, c: 10 }, 60, ['a', 'b', 'c']), { a: 10, b: 10, c: 10 });
  assert.deepEqual(allocateContentQuotas({ a: 5, b: 5 }, 3, ['a', 'b']), { a: 2, b: 1 });
  assert.deepEqual(allocateContentQuotas({ b: 7 }, 60, ['a', 'b']), { a: 0, b: 7 });
});

void test('tempo: 90 s por questão somados, sem rolagem; cálculo/lacuna numérica deixam sem limite', () => {
  assert.equal(EXAM_QUESTION_SECONDS, 90);
  assert.equal(examTotalSeconds([{ kind: 'multipla' }, { kind: 'dissertativa' }, { kind: 'certo_errado' }]), 270);
  assert.equal(examTotalSeconds([{ kind: 'multipla' }, { kind: 'calculo' }]), null);
  assert.equal(examTotalSeconds([{ kind: 'lacuna_numerica' }]), null);
  const plan = resolvePlan('exame_meio');
  assert.equal(plan.size, 60);
  assert.equal(plan.passingScore, 70);
});

void test('conteudo-50 dispara sozinho (sistema) ao chegar em 50% de cobertura, uma vez só, com auditoria', async () => {
  const { raw, db } = setup();
  const total = contentIds(raw).length;
  coverFirst(raw, total / 2 - 1);
  const below = await syncDisciplineState(db, DISCIPLINE, { now });
  assert.equal(below.released, false);
  assert.equal(below.state, 'em-andamento');

  coverFirst(raw, total / 2);
  const released = await syncDisciplineState(db, DISCIPLINE, { now });
  assert.deepEqual(
    { released: released.released, state: released.state, covered: released.covered, total: released.total },
    { released: true, state: 'exame-meio-liberado', covered: total / 2, total },
  );
  const audit = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.equal(audit.length, 1);
  assert.deepEqual(
    { event: audit[0].event, actor: audit[0].actor, from: audit[0].fromState, to: audit[0].toState },
    { event: 'conteudo-50', actor: 'sistema', from: 'em-andamento', to: 'exame-meio-liberado' },
  );
  // Idempotente: sincronizar de novo não gera outra transição.
  assert.equal((await syncDisciplineState(db, DISCIPLINE, { now })).released, false);
  assert.equal((await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE })).length, 1);
  // A fila de exames também sincroniza e mostra a situação.
  const queue = await listExamQueue(db, { now });
  const item = queue.find((entry) => entry.disciplineId === DISCIPLINE)!;
  assert.equal(item.state, 'exame-meio-liberado');
  assert.equal(item.attemptId, null);
});

void test('antes de 50% o exame não começa', async () => {
  const { raw, db } = setup();
  await assert.rejects(
    startExameMeio(db, DISCIPLINE, { confirmed: true, now }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  assert.equal(examCount(raw), 0);
});

void test('sem confirmação explícita: 409 code=confirmation, nada é gravado e o estado não muda', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  await syncDisciplineState(db, DISCIPLINE, { now });
  let caught: unknown;
  try {
    await startExameMeio(db, DISCIPLINE, { now, id: 'ex1' });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof TransitionError && caught.code === 'confirmation');
  const response = quizErrorResponse(caught);
  assert.equal(response.status, 409);
  assert.equal(((await response.json()) as { code: string }).code, 'confirmation');
  assert.equal(examCount(raw), 0);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'exame-meio-liberado');
});

void test('com confirmação: exame em curso (auditado), 60 questões espalhadas pelo escopo, 90 s cada; tentativa única', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  const attempt = await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  assert.equal(attempt.status, 'em-andamento');
  assert.equal(attempt.instrument, EXAM_INSTRUMENT);
  assert.equal(attempt.scope.rule, 'posicao');
  assert.equal(attempt.planVersion, resolvePlan('exame_meio').version);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'exame-meio-em-curso');
  const audit = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual(
    audit.map((entry) => [entry.event, entry.actor]),
    [
      ['iniciar-exame-meio', 'usuario'],
      ['conteudo-50', 'sistema'],
    ],
  );

  // Banco semeado: 6 conteúdos com 10 questões cada no escopo → 60, 10 de cada.
  assert.equal(attempt.questions.length, 60);
  assert.ok(attempt.questions.every((question) => question.seconds === 90));
  assert.equal(Date.parse(attempt.deadlineAt!) - Date.parse(now), 60 * 90 * 1000);
  const perContent = raw
    .prepare(
      `SELECT q.content_id, COUNT(*) AS n FROM atlas_questions q
       WHERE q.id IN (SELECT value FROM json_each((SELECT questions_json FROM atlas_exam_attempts WHERE id = 'ex1'), '$.questionIds'))
       GROUP BY q.content_id`,
    )
    .all() as { content_id: string; n: number }[];
  assert.ok(perContent.every((row) => attempt.scope.contentIds.includes(row.content_id)));
  assert.ok(perContent.every((row) => row.n === 10));

  // Segunda chamada devolve a mesma tentativa, sem criar outra nem transicionar.
  const again = await startExameMeio(db, DISCIPLINE, { confirmed: true, now: later });
  assert.equal(again.id, 'ex1');
  assert.equal(examCount(raw), 1);
  assert.equal((await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE })).length, 2);
  // E o banco recusa uma segunda tentativa mesmo por fora da aplicação.
  assert.throws(() =>
    raw.exec(
      `INSERT INTO atlas_exam_attempts (id, discipline_id, instrument, status, started_at, scope_json, questions_json, plan_version)
       VALUES ('ex2', '${DISCIPLINE}', 'exame_meio', 'em-andamento', '${now}', '{}', '{}', 2)`,
    ),
  );
});

void test('envio: nota própria, boletim versionado com KR-20, exame-meio-entregue (sistema) → exame-meio-concluido', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  const answers = await correctAnswers(raw, db, 'ex1', 45);
  const done = await submitExam(db, 'ex1', { answers }, { now: later });
  assert.equal(done.status, 'enviado');
  assert.equal(done.score, 75);
  assert.equal(done.passed, true);
  assert.equal(done.correctorVersion, APOLO_CORRECTOR_VERSION);
  assert.ok(done.boletim);
  assert.equal(done.boletim.corretorVersion, APOLO_CORRECTOR_VERSION);
  assert.equal(done.boletim.planVersion, resolvePlan('exame_meio').version);
  assert.equal(done.boletim.score, 75);
  assert.equal(done.boletim.passed, true);
  assert.equal(done.boletim.questions.length, 60);
  // Uma aplicação só (tentativa única): KR-20 nulo, pela mesma guarda do APO-10.
  assert.deepEqual(
    { kr20: done.boletim.reliability?.kr20, administrations: done.boletim.reliability?.administrations },
    { kr20: null, administrations: 1 },
  );
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'exame-meio-concluido');
  const [last] = await listAudit(db, { entityType: 'disciplina', entityId: DISCIPLINE });
  assert.deepEqual(
    { event: last.event, actor: last.actor },
    { event: 'exame-meio-entregue', actor: 'sistema' },
  );
  assert.match(last.reason, /aprovado: 45\/60 \(75%, mínimo 70%\)/);

  // Grava uma vez só (DEC-016): reenviar é recusado.
  await assert.rejects(
    submitExam(db, 'ex1', { answers }, { now: later }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  // Depois de entregue, iniciar devolve a mesma tentativa (não há segunda).
  assert.equal((await startExameMeio(db, DISCIPLINE, { confirmed: true, now: later })).id, 'ex1');
});

void test('abaixo de 70% reprova o exame, mas ele é entregue do mesmo jeito', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  const answers = await correctAnswers(raw, db, 'ex1', 30);
  const done = await submitExam(db, 'ex1', { answers }, { now: later });
  assert.equal(done.score, 50);
  assert.equal(done.passed, false);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'exame-meio-concluido');
});

void test('travar libera o gabarito das dissertativas; o envio usa as respostas travadas', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  const answers = await correctAnswers(raw, db, 'ex1');
  const locked = await lockExam(db, 'ex1', answers, { now });
  assert.equal(locked.status, 'autoavaliacao');
  assert.ok(locked.modelAnswers && Object.keys(locked.modelAnswers).length > 0);
  const selfAssessments = Object.fromEntries(Object.keys(locked.modelAnswers).map((id) => [id, 'certa']));
  const done = await submitExam(db, 'ex1', { answers: {}, selfAssessments }, { now });
  assert.equal(done.score, 100);
  assert.equal(done.late, false);
});

void test('banco curto no escopo: o exame sai com menos de 60 questões, sem quebrar', async () => {
  const { raw, db } = setup();
  await setContentLevel(db, 'CG-001', 'iniciante');
  await setContentLevel(db, 'CG-002', 'intermediario');
  await setContentLevel(db, 'CG-040', 'avancado');
  coverFirst(raw, contentIds(raw).length / 2);
  const attempt = await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  assert.equal(attempt.scope.rule, 'nivel');
  assert.deepEqual(attempt.scope.contentIds, ['CG-001', 'CG-002']);
  assert.equal(attempt.questions.length, 20);
  const stored = JSON.parse(
    (raw.prepare("SELECT questions_json FROM atlas_exam_attempts WHERE id = 'ex1'").get() as { questions_json: string })
      .questions_json,
  ) as { warnings: string[] };
  assert.match(stored.warnings.join(' '), /só 20 de 60/);
  const done = await submitExam(db, 'ex1', { answers: await correctAnswers(raw, db, 'ex1') }, { now: later });
  assert.equal(done.score, 100);
});

void test('escopo nivelado sem questões cadastradas: 409, sem tentativa e sem iniciar o exame', async () => {
  const { raw, db } = setup();
  await setContentLevel(db, 'CG-030', 'iniciante');
  coverFirst(raw, contentIds(raw).length / 2);
  await assert.rejects(
    startExameMeio(db, DISCIPLINE, { confirmed: true, now }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  assert.equal(examCount(raw), 0);
  assert.equal(await currentState(db, 'disciplina', DISCIPLINE), 'exame-meio-liberado');
});

void test('kr20() extraído dá o mesmo número que computeInstrumentStats', () => {
  const events: ItemAnswerEvent[] = [];
  const pattern = [
    ['a1', [true, true, false], 66.7],
    ['a2', [true, false, false], 33.3],
    ['a3', [true, true, true], 100],
  ] as const;
  for (const [attemptId, flags, attemptScore] of pattern) {
    flags.forEach((correct, index) =>
      events.push({
        questionId: `q${index}`,
        contentId: 'C',
        kind: 'multipla',
        difficulty: null,
        correct,
        chosenOption: null,
        correctOption: null,
        optionsCount: null,
        at: now,
        attemptId,
        attemptScore,
      }),
    );
  }
  const [instrument] = computeInstrumentStats(events);
  const direct = kr20(
    [0, 1, 2].map((index) => ({
      correct: pattern.filter(([, flags]) => flags[index]).length,
      answers: pattern.length,
    })),
    pattern.map(([, , score]) => score),
  );
  assert.equal(direct, instrument.kr20);
  assert.equal(kr20([{ correct: 1, answers: 1 }, { correct: 0, answers: 1 }], [50]), null);
  assert.equal(kr20([{ correct: 1, answers: 2 }, { correct: 1, answers: 2 }], [50, 50]), null);
});

void test('progresso: Avaliações passa a valer a nota do exame entregue', async () => {
  const { raw, db } = setup();
  coverFirst(raw, contentIds(raw).length / 2);
  await startExameMeio(db, DISCIPLINE, { confirmed: true, now, id: 'ex1' });
  await submitExam(db, 'ex1', { answers: await correctAnswers(raw, db, 'ex1', 45) }, { now: later });
  const input = await loadProgressInput(db);
  assert.deepEqual(input.exams, [
    { id: 'ex1', disciplineId: DISCIPLINE, instrument: 'exame_meio', score: 75, passed: true, submittedAt: later },
  ]);
  const report = computeProgress(input, { now: later, today: '2026-10-09', tzOffsetMinutes: 180 });
  const discipline = report.disciplines.find((item) => item.id === DISCIPLINE)!;
  const avaliacoes = discipline.components.find((item) => item.key === 'avaliacoes')!;
  assert.equal(avaliacoes.available, true);
  assert.equal(avaliacoes.ratio, 0.75);
  assert.equal(avaliacoes.points, 22.5);
  assert.match(avaliacoes.detail, /Exame de meio de curso: 75% \(aprovado\)/);
  // A outra disciplina continua sem exame: componente indisponível.
  const other = report.disciplines.find((item) => item.id !== DISCIPLINE)!;
  assert.equal(other.components.find((item) => item.key === 'avaliacoes')!.available, false);
  assert.ok(await getExamAttempt(db, 'ex1'));
});
