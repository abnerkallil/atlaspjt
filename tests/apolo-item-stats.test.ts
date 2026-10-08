// APO-10: estatística de itens reproduz os valores de referência (KR-20,
// correlação item-total), as regras de alerta disparam com amostra mínima, e
// uma questão alertada de verdade sai da prova (vira 'curadoria') ao enviar o
// quiz que a derrubou.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeInstrumentStats,
  computeItemStats,
  detectAlerts,
  type ItemAnswerEvent,
  type ItemStat,
} from '../lib/apolo/item-stats.js';
import { applyItemAlerts, getItemAudit } from '../lib/apolo/index.js';
import { listQuestions, shuffleQuestion, startQuiz, submitQuiz, type Answers } from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const t0 = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(t0) + seconds * 1000).toISOString();

function event(overrides: Partial<ItemAnswerEvent>): ItemAnswerEvent {
  return {
    questionId: 'Q1',
    contentId: 'CG-001',
    kind: 'multipla',
    difficulty: 'media',
    correct: true,
    chosenOption: 0,
    correctOption: 0,
    optionsCount: 4,
    at: t0,
    attemptId: 'a1',
    attemptScore: 100,
    ...overrides,
  };
}

void test('APO-10: correlação item-total bate com o point-biserial calculado à mão', () => {
  const events: ItemAnswerEvent[] = [
    event({ attemptId: 'a1', correct: true, attemptScore: 90 }),
    event({ attemptId: 'a2', correct: true, attemptScore: 80 }),
    event({ attemptId: 'a3', correct: false, attemptScore: 40 }),
    event({ attemptId: 'a4', correct: false, attemptScore: 30 }),
  ];
  const [stat] = computeItemStats(events);
  assert.ok(stat);
  assert.ok(Math.abs(stat.itemTotalCorrelation! - 0.98058) < 0.001);
});

void test('APO-10: KR-20 bate com a fórmula de livro-texto para os dados de referência', () => {
  // 2 itens, 4 aplicações do mesmo conteúdo: AB, A-, -B, -- (acerto/erro).
  const events: ItemAnswerEvent[] = [
    event({ questionId: 'A', attemptId: 'a1', correct: true, attemptScore: 100 }),
    event({ questionId: 'B', attemptId: 'a1', correct: true, attemptScore: 100 }),
    event({ questionId: 'A', attemptId: 'a2', correct: true, attemptScore: 50 }),
    event({ questionId: 'B', attemptId: 'a2', correct: false, attemptScore: 50 }),
    event({ questionId: 'A', attemptId: 'a3', correct: false, attemptScore: 50 }),
    event({ questionId: 'B', attemptId: 'a3', correct: true, attemptScore: 50 }),
    event({ questionId: 'A', attemptId: 'a4', correct: false, attemptScore: 0 }),
    event({ questionId: 'B', attemptId: 'a4', correct: false, attemptScore: 0 }),
  ];
  const [instrument] = computeInstrumentStats(events);
  assert.equal(instrument!.items, 2);
  assert.equal(instrument!.administrations, 4);
  // k/(k-1) · (1 − Σpq/variância) = 2 · (1 − 0.5/1250) = 1.9992
  assert.ok(Math.abs(instrument!.kr20! - 1.9992) < 0.0001);
});

void test('APO-10: acerto sobe o Elo do item, erro desce', () => {
  const [afterCorrect] = computeItemStats([event({ correct: true })]);
  assert.ok(afterCorrect!.elo > 1200);
  const [afterWrong] = computeItemStats([event({ correct: false })]);
  assert.ok(afterWrong!.elo < 1200);
});

void test('APO-10: distrator identifica a alternativa correta e não a conta como "fraca"', () => {
  const events: ItemAnswerEvent[] = Array.from({ length: 10 }, (_, index) =>
    event({ attemptId: `a${index}`, correct: index < 9, chosenOption: index < 9 ? 0 : 1, correctOption: 0 }),
  );
  const [stat] = computeItemStats(events);
  const distractor = stat!.distractors!.find((d) => d.option === 1);
  assert.equal(distractor!.correct, false);
  assert.ok(distractor!.rate < 0.5);
});

void test('APO-10: regras de alerta só agem com amostra mínima, e ignoram distrator da alternativa correta', () => {
  const thresholds = { minSample: 5, correlationFloor: 0.1, accuracyCeiling: 0.95, distractorFloor: 0.05 };
  const lowSample: ItemStat = {
    questionId: 'Q-poucos',
    contentId: 'CG-001',
    answers: 3,
    correct: 3,
    accuracy: 1,
    elo: 1400,
    itemTotalCorrelation: null,
    distractors: null,
  };
  const tooEasy: ItemStat = { ...lowSample, questionId: 'Q-facil-demais', answers: 10 };
  const lowCorrelation: ItemStat = {
    questionId: 'Q-correlacao-ruim',
    contentId: 'CG-001',
    answers: 10,
    correct: 5,
    accuracy: 0.5,
    elo: 1200,
    itemTotalCorrelation: 0.02,
    distractors: [
      { option: 0, count: 5, rate: 0.5, correct: true },
      { option: 1, count: 5, rate: 0.5, correct: false },
    ],
  };
  const alerts = detectAlerts([lowSample, tooEasy, lowCorrelation], thresholds);
  assert.deepEqual(
    alerts.map((a) => a.questionId),
    ['Q-correlacao-ruim', 'Q-facil-demais'],
  );
  const easy = alerts.find((a) => a.questionId === 'Q-facil-demais')!;
  assert.deepEqual(easy.reasons, ['acerto-muito-alto']);
});

void test('APO-10: uma questão sempre certa com amostra suficiente vira "curadoria" de verdade ao enviar o quiz', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });

  const ALWAYS_RIGHT = 'CG-001-Q01';
  for (let i = 0; i < 30; i += 1) {
    const attemptId = `audit-${i}`;
    await startQuiz(db, 'CG-001', { now: at(100 + i * 1000), id: attemptId });
    const row = raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(attemptId) as { questions_json: string };
    const stored = JSON.parse(row.questions_json) as { questionIds: string[]; optionOrders: Record<string, number[]> };
    const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
    const answers: Answers = {};
    stored.questionIds.forEach((id, index) => {
      // shuffleQuestion remapeia correctOption para o índice EXIBIDO (o que a
      // tela manda), já que o sorteio embaralha as alternativas por tentativa.
      const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
      // Q01 sempre certa; o resto alterna, mantendo a nota abaixo de 70%
      // para o conteúdo continuar liberado para repetir o quiz direto.
      const right = id === ALWAYS_RIGHT || index % 3 === 0;
      answers[id] = { option: right ? question.correctOption! : (question.correctOption! + 1) % (question.options?.length ?? 2) };
    });
    const result = await submitQuiz(db, attemptId, { answers }, { now: at(100 + i * 1000 + 200) });
    assert.equal(result.passed, false, `tentativa ${i} deveria reprovar para poder repetir`);
  }

  const audit = await getItemAudit(db);
  const stat = audit.items.find((item) => item.questionId === ALWAYS_RIGHT);
  assert.ok(stat, 'estatística do item deveria existir');
  assert.equal(stat!.answers, 30);
  assert.equal(stat!.accuracy, 1);
  assert.ok(audit.alerts.some((alert) => alert.questionId === ALWAYS_RIGHT));

  // O envio do quiz (app/api/quizzes/[id]) já chama applyItemAlerts; aqui
  // confirmamos diretamente que a função de corte faz o que promete.
  const { retired } = await applyItemAlerts(db);
  assert.ok(retired.includes(ALWAYS_RIGHT));
  const row = raw.prepare('SELECT lifecycle_state, active FROM atlas_questions WHERE id = ?').get(ALWAYS_RIGHT) as {
    lifecycle_state: string;
    active: number;
  };
  assert.equal(row.lifecycle_state, 'curadoria');
  assert.equal(row.active, 0);
  assert.ok(!(await listQuestions(db, 'CG-001')).some((question) => question.id === ALWAYS_RIGHT));
});
