// APO-14: startQuiz passa a pedir a prova ao seletor do Apolo (APO-12) assim
// que o conteúdo tem banco classificado por tema o bastante para o plano de
// hoje (DEC-10, 10 questões) — ligação por conteúdo, a mitigação que o
// próprio card pede para banco pequeno/sem classificação. Sem isso (o caso de
// todo o resto da suíte, que não classifica tema), nada muda — por isso só
// este arquivo semeia `theme` nas questões de CG-001.
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentState } from '../lib/pedagogy/transitions.js';
import {
  listQuestions,
  shuffleQuestion,
  startQuiz,
  submitQuiz,
  type Answers,
} from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

type Raw = ReturnType<typeof migratedDatabase>;
type Db = ReturnType<typeof d1>;

const t0 = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(t0) + seconds * 1000).toISOString();

// Classifica as 10 questões semeadas de CG-001 (drizzle/0010_question_bank.sql)
// por tema — sem isso elas ficam com theme = NULL, como em todo o resto da
// suíte, e o Apolo não entra.
function classifyBank(raw: Raw) {
  raw.prepare("UPDATE atlas_questions SET theme = 'contabilidade-geral' WHERE content_id = 'CG-001'").run();
}

// Mais 5 cópias de uma questão já classificada, para sobrar banco (como
// `growBank` em tests/recovery.test.ts) e poder aposentar algumas sem cair
// abaixo do tamanho do plano.
function growBank(raw: Raw) {
  const rows = raw
    .prepare("SELECT * FROM atlas_questions WHERE content_id = 'CG-001' AND kind = 'multipla' LIMIT 5")
    .all() as Record<string, unknown>[];
  for (const [index, row] of rows.entries()) {
    const copy = { ...row, id: `CG-001-extra-${index}`, position: 100 + index };
    const keys = Object.keys(copy);
    raw
      .prepare(`INSERT INTO atlas_questions (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
      .run(...(Object.values(copy) as (string | number | null)[]));
  }
}

async function readyForQuiz(raw: Raw, db: Db) {
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });
}

async function answerAll(
  raw: Raw,
  db: Db,
  attemptId: string,
  correctCount: number,
): Promise<{ questionIds: string[]; wrong: string[] }> {
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(attemptId) as { questions_json: string })
      .questions_json,
  ) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  stored.questionIds.forEach((questionId, index) => {
    if (index >= correctCount) return;
    const question = shuffleQuestion(bank.get(questionId)!, stored.optionOrders[questionId]);
    answers[questionId] = { option: question.correctOption! };
  });
  const wrong = stored.questionIds.slice(correctCount);
  return { questionIds: stored.questionIds, wrong };
}

void test('APO-14: conteúdo sem tema classificado continua no sorteio local (nada muda)', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await readyForQuiz(raw, db);
  const attempt = await startQuiz(db, 'CG-001', { now: t0, id: 'q1' });
  assert.equal(attempt.questions.length, 10);
});

void test('APO-14: conteúdo com tema classificado passa a usar o seletor do Apolo (corte 70% preservado)', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  classifyBank(raw);
  await readyForQuiz(raw, db);
  const attempt = await startQuiz(db, 'CG-001', { now: t0, id: 'q1' });
  assert.equal(attempt.questions.length, 10);

  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get('q1') as { questions_json: string })
      .questions_json,
  ) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  stored.questionIds.forEach((id, index) => {
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    // 7 certas, 3 erradas: exatamente no corte de 70% (DEC-10).
    answers[id] = { option: index < 7 ? question.correctOption! : -1 };
  });
  const done = await submitQuiz(db, 'q1', { answers }, { now: at(120) });
  assert.equal(done.score, 70);
  assert.equal(done.passed, true);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido');
});

void test('APO-14: refazer no mesmo dia traz de volta as erradas (quiz dirigido não depende do FSRS vencer)', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  classifyBank(raw);
  await readyForQuiz(raw, db);
  await startQuiz(db, 'CG-001', { now: t0, id: 'q1' });
  const { questionIds, wrong } = await answerAll(raw, db, 'q1', 4);
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get('q1') as { questions_json: string })
      .questions_json,
  ) as { optionOrders: Record<string, number[]> };
  const answers: Answers = {};
  questionIds.forEach((id, index) => {
    if (index >= 4) return;
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    answers[id] = { option: question.correctOption! };
  });
  const first = await submitQuiz(db, 'q1', { answers }, { now: at(60) });
  assert.equal(first.passed, false);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'bloqueado');

  // Sem passar o dia (mesmo `now`): o FSRS do Apolo só vence depois de meio
  // dia de estabilidade mínima (lib/apolo/skill.ts MIN_STABILITY_DAYS=0.5),
  // então sem o reforço do quiz dirigido elas NÃO estariam vencidas ainda.
  await startSession(db, 'CG-001', { now: at(70), id: 's2' });
  await concludeSession(db, 's2', { now: at(130) });
  const second = await startQuiz(db, 'CG-001', { now: at(140), id: 'q2' });
  assert.equal(second.directed, wrong.length);
  for (const id of wrong) assert.ok(second.questions.some((q) => q.id === id), `questão ${id} voltou`);
});

void test('APO-14: nunca seleciona questão aposentada (lifecycle_state), mesmo com active=1', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  classifyBank(raw);
  growBank(raw);
  // Aposenta 2 das 15 (continua >= 10 classificadas e ativas, então o Apolo
  // segue ligado) mas deixa active=1 — só o sorteio local (active=1) ainda
  // as incluiria; o seletor do Apolo (DEC-014) nunca inclui.
  raw
    .prepare("UPDATE atlas_questions SET lifecycle_state = 'curadoria' WHERE id IN ('CG-001-extra-0', 'CG-001-extra-1')")
    .run();
  await readyForQuiz(raw, db);
  const attempt = await startQuiz(db, 'CG-001', { now: t0, id: 'q1' });
  const ids = new Set(attempt.questions.map((q) => q.id));
  assert.ok(!ids.has('CG-001-extra-0'));
  assert.ok(!ids.has('CG-001-extra-1'));
  assert.equal(attempt.questions.length, 10);
});
