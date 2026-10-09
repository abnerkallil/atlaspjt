// APO-17 (DEC-018): Atividade do conteúdo — nota própria, independente do
// state do conteúdo (DEC-03 nunca é tocado), aprovação só com nota > 70%
// (diferente do quiz, que aprova com >= 70%), evidência só gravada quando
// aprovada, e refação direta sem penalidade (mesma mecânica do quiz).
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentState, listAudit } from '../lib/pedagogy/transitions.js';
import {
  listQuestions,
  shuffleQuestion,
  startAtividade,
  startQuiz,
  submitQuiz,
  type Answers,
} from '../lib/quizzes.js';
import { startSession, concludeSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

// Monta respostas para os 10 primeiros n questões corretas, as demais
// erradas (dissertativas sempre contam como corretas via autoavaliação).
async function answersWith(
  raw: ReturnType<typeof migratedDatabase>,
  db: ReturnType<typeof d1>,
  attemptId: string,
  correctCount: number,
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
  let remainingCorrect = correctCount;
  for (const id of stored.questionIds) {
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    if (question.kind === 'dissertativa') {
      const wantCorrect = remainingCorrect > 0;
      if (wantCorrect) remainingCorrect -= 1;
      answers[id] = { text: 'resposta', selfAssessment: wantCorrect ? 'certa' : 'errada' };
      continue;
    }
    const wantCorrect = remainingCorrect > 0;
    if (wantCorrect) remainingCorrect -= 1;
    answers[id] = {
      option: wantCorrect
        ? question.correctOption!
        : (question.correctOption! + 1) % question.options!.length,
    };
  }
  return answers;
}

void test('atividade pode ser feita a qualquer momento, independente do state do conteúdo', async () => {
  const { db } = setup();
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'nao-iniciado');
  const attempt = await startAtividade(db, 'CG-001', { now, id: 'at1' });
  assert.equal(attempt.purpose, 'atividade');
  assert.equal(attempt.status, 'em-andamento');
  // Começar de novo devolve a mesma tentativa em andamento (mesma regra do quiz).
  const again = await startAtividade(db, 'CG-001', { now });
  assert.equal(again.id, 'at1');
});

void test('aprovada (>70%) grava evidência kind=atividade e não toca o state do conteúdo (DEC-018)', async () => {
  const { raw, db } = setup();
  await startAtividade(db, 'CG-001', { now, id: 'at1' });
  const answers = await answersWith(raw, db, 'at1', 8);
  const done = await submitQuiz(db, 'at1', { answers }, { now, evidenceId: 'ev-at1' });
  assert.equal(done.score, 80);
  assert.equal(done.passed, true);
  const evidence = raw
    .prepare('SELECT kind, source_ref, summary FROM atlas_evidences WHERE id = ?')
    .get('ev-at1') as Record<string, string>;
  assert.deepEqual(
    { ...evidence },
    { kind: 'atividade', source_ref: 'at1', summary: 'Atividade aprovada: 8/10 (80%).' },
  );
  // Atividade nunca reabre nem avança o DEC-03 (state fica igual, sem auditoria nova).
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'nao-iniciado');
  assert.deepEqual(await listAudit(db, { entityType: 'conteudo', entityId: 'CG-001' }), []);
});

void test('exatamente 70% é reprovada na atividade (>70% estrito, diferente do quiz que aprova com >=70%)', async () => {
  const { raw, db } = setup();
  await startAtividade(db, 'CG-001', { now, id: 'at1' });
  const answers = await answersWith(raw, db, 'at1', 7);
  const done = await submitQuiz(db, 'at1', { answers }, { now, evidenceId: 'ev-at1' });
  assert.equal(done.score, 70);
  assert.equal(done.passed, false);
  // Reprovada: nenhuma evidência é gravada (a atividade não participa do DEC-03).
  const evidence = raw
    .prepare('SELECT COUNT(*) AS n FROM atlas_evidences WHERE id = ?')
    .get('ev-at1') as { n: number };
  assert.equal(evidence.n, 0);
  assert.equal(done.evidenceId, null);
});

void test('atividade e quiz em andamento no mesmo conteúdo coexistem sem contaminação (índice content_id+purpose)', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now, id: 's1' });
  await concludeSession(db, 's1', { now });
  const quizAttempt = await startQuiz(db, 'CG-001', { now, id: 'q1' });
  assert.equal(quizAttempt.purpose, 'quiz');

  const atividadeAttempt = await startAtividade(db, 'CG-001', { now, id: 'at1' });
  assert.equal(atividadeAttempt.purpose, 'atividade');
  assert.equal(atividadeAttempt.id, 'at1');

  // Pedir de novo cada um devolve a própria tentativa em andamento, não a do outro propósito.
  const quizAgain = await startQuiz(db, 'CG-001', { now });
  assert.equal(quizAgain.id, 'q1');
  const atividadeAgain = await startAtividade(db, 'CG-001', { now });
  assert.equal(atividadeAgain.id, 'at1');
});

void test('reprovada pode ser refeita direto, sem limite nem penalidade (mesma mecânica do quiz, MVP-08)', async () => {
  const { raw, db } = setup();
  await startAtividade(db, 'CG-001', { now, id: 'at1' });
  await submitQuiz(db, 'at1', { answers: await answersWith(raw, db, 'at1', 0) }, { now });
  // A tentativa anterior foi enviada (reprovada); uma nova começa direto, sem cooldown.
  const second = await startAtividade(db, 'CG-001', { now, id: 'at2' });
  assert.equal(second.status, 'em-andamento');
  const approved = await submitQuiz(
    db,
    'at2',
    { answers: await answersWith(raw, db, 'at2', 10) },
    { now },
  );
  assert.equal(approved.score, 100);
  assert.equal(approved.passed, true);
});
