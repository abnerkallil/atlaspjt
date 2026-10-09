// APO-20: exame de proficiência (DEC-05) — adaptativo de verdade (CAT, Rasch
// de 1 parâmetro na escala Elo): cada resposta atualiza θ/erro-padrão e
// escolhe a próxima questão mais informativa, até parar por erro-padrão
// baixo (com um mínimo de questões) ou tamanho máximo; θ nunca entra na
// nota (DEC-017) — a nota é sempre acerto/total × 100 (corretor único). Nota
// acima de 85% dispensa o conteúdo (nao-iniciado → concluido) com evidência
// "proficiencia"; do contrário nada muda na FSM e o exame pode ser refeito.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MIN_QUESTIONS,
  PROFICIENCY_THRESHOLD,
  answerProficiencia,
  estimateAbility,
  getProficiencyAttempt,
  pickNextItem,
  probability,
  startProficiencia,
} from '../lib/apolo/proficiency.js';
import { INITIAL_ELO } from '../lib/apolo/skill.js';
import { currentState, listAudit } from '../lib/pedagogy/transitions.js';
import { listQuestions, QuizError, shuffleQuestion, quizErrorResponse } from '../lib/quizzes.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const T0 = '2026-10-10T12:00:00.000Z';
const CONTENT = 'CG-001';

type Raw = ReturnType<typeof migratedDatabase>;
type Db = ReturnType<typeof d1>;

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

// Responde a questão da vez certa ou errada (pela alternativa correta já
// embaralhada na tentativa) — mesmo princípio do `answerKey` dos outros
// testes do Apolo, questão a questão em vez de tudo de uma vez.
async function answerCurrent(raw: Raw, db: Db, attemptId: string, questionId: string, right: boolean) {
  const row = raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(attemptId) as {
    questions_json: string;
  };
  const stored = JSON.parse(row.questions_json) as { optionOrders: Record<string, number[]> };
  const bank = await listQuestions(db, CONTENT);
  const question = shuffleQuestion(bank.find((item) => item.id === questionId)!, stored.optionOrders[questionId]);
  const answer = right
    ? { option: question.correctOption! }
    : { option: (question.correctOption! + 1) % question.options!.length };
  return answerProficiencia(db, attemptId, questionId, answer, { now: T0 });
}

async function runToEnd(raw: Raw, db: Db, attemptId: string, right: boolean) {
  let current = await getProficiencyAttempt(db, attemptId);
  while (current && current.status === 'em-andamento') {
    current = await answerCurrent(raw, db, attemptId, current.currentQuestion!.id, right);
  }
  return current!;
}

void test('probability: 0.5 quando item e habilidade são iguais; sobe com habilidade maior', () => {
  assert.equal(probability(1200, 1200), 0.5);
  assert.ok(probability(1400, 1200) > 0.5);
  assert.ok(probability(1000, 1200) < 0.5);
});

void test('estimateAbility: sem respostas fica no ponto de partida, erro-padrão nulo (sem precisão ainda)', () => {
  assert.deepEqual(estimateAbility([]), { theta: INITIAL_ELO, se: null });
  assert.deepEqual(estimateAbility([], 1500), { theta: 1500, se: null });
});

void test('estimateAbility: acertar sobe θ; errar desce θ; erro-padrão sempre finito e positivo com resposta', () => {
  const correctRuns = estimateAbility(Array.from({ length: 6 }, () => ({ itemElo: 1200, correct: true })));
  assert.ok(correctRuns.theta > INITIAL_ELO);
  assert.ok(correctRuns.se !== null && correctRuns.se > 0);

  const wrongRuns = estimateAbility(Array.from({ length: 6 }, () => ({ itemElo: 1200, correct: false })));
  assert.ok(wrongRuns.theta < INITIAL_ELO);

  // Misturado (3 certas, 3 erradas, mesmo item): fica perto do item (1200).
  const mixed = estimateAbility([
    { itemElo: 1200, correct: true },
    { itemElo: 1200, correct: false },
    { itemElo: 1200, correct: true },
    { itemElo: 1200, correct: false },
    { itemElo: 1200, correct: true },
    { itemElo: 1200, correct: false },
  ]);
  assert.ok(Math.abs(mixed.theta - 1200) < 5);
});

void test('estimateAbility: nunca passa de [400, 2400] mesmo com só acertos ou só erros (sem divergir para o infinito)', () => {
  const allRight = estimateAbility(Array.from({ length: 30 }, () => ({ itemElo: 1200, correct: true })));
  assert.ok(allRight.theta <= 2400);
  const allWrong = estimateAbility(Array.from({ length: 30 }, () => ({ itemElo: 1200, correct: false })));
  assert.ok(allWrong.theta >= 400);
});

void test('pickNextItem: nulo com o banco vazio; sempre a mais informativa (mais perto de θ), sem sorteio', () => {
  assert.equal(pickNextItem([], 1200), null);
  assert.equal(pickNextItem([{ id: 'only', itemElo: 1400 }], 1200), 'only');
  const pool = [
    { id: 'a', itemElo: 1200 },
    { id: 'b', itemElo: 1600 },
    { id: 'c', itemElo: 2000 },
  ];
  // Determinístico: sempre a mesma resposta, a de menor distância (a, distância 0).
  assert.equal(pickNextItem(pool, 1200), 'a');
  assert.equal(pickNextItem(pool, 1200), pickNextItem(pool, 1200));
  // θ mais perto de c: escolhe c.
  assert.equal(pickNextItem(pool, 2000), 'c');
  // Empate exato de distância: desempata pelo id (ordem alfabética).
  assert.equal(pickNextItem([{ id: 'z', itemElo: 1000 }, { id: 'a', itemElo: 1400 }], 1200), 'a');
});

void test('nota acima de 85: dispensa o conteúdo (nao-iniciado → concluido), evidência "proficiencia", nunca mais de 1 questão pendente', async () => {
  const { raw, db } = setup();
  assert.equal(await currentState(db, 'conteudo', CONTENT), 'nao-iniciado');
  const started = await startProficiencia(db, CONTENT, { now: T0, id: 'pf1' });
  assert.equal(started.status, 'em-andamento');
  assert.ok(started.currentQuestion);
  assert.equal(started.administered, 1);

  const done = await runToEnd(raw, db, 'pf1', true);
  assert.equal(done.status, 'enviado');
  assert.ok(done.score! > PROFICIENCY_THRESHOLD);
  assert.equal(done.dispensado, true);
  assert.equal(done.currentQuestion, null);
  assert.ok(done.administered >= MIN_QUESTIONS);
  // Banco de CG-001 (10 questões, 2 dissertativas excluídas) esgota antes do
  // teto de 20 — nenhuma dissertativa entre as administradas.
  assert.ok(done.results!.every((item) => item.kind !== 'dissertativa'));
  assert.ok(done.administered <= 8);
  assert.notEqual(done.stoppedBy, 'tamanho-maximo');

  assert.equal(await currentState(db, 'conteudo', CONTENT), 'concluido');
  const [last] = await listAudit(db, { entityType: 'conteudo', entityId: CONTENT });
  assert.deepEqual([last.event, last.actor], ['dispensa-proficiencia', 'sistema']);
  const evidence = raw.prepare('SELECT kind FROM atlas_evidences WHERE id = ?').get(last.evidenceId) as { kind: string };
  assert.equal(evidence.kind, 'proficiencia');

  // Grava uma vez só: não dá para responder de novo depois do envio.
  await assert.rejects(
    answerProficiencia(db, 'pf1', 'qualquer-questao', {}),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
});

void test('nota insuficiente: não dispensa, FSM não muda, pode refazer', async () => {
  const { raw, db } = setup();
  await startProficiencia(db, CONTENT, { now: T0, id: 'pf2' });
  const done = await runToEnd(raw, db, 'pf2', false);
  assert.equal(done.status, 'enviado');
  assert.equal(done.score, 0);
  assert.equal(done.dispensado, false);
  assert.equal(await currentState(db, 'conteudo', CONTENT), 'nao-iniciado');
  assert.equal((await listAudit(db, { entityType: 'conteudo', entityId: CONTENT })).length, 0);
  assert.equal(
    (raw.prepare("SELECT COUNT(*) AS n FROM atlas_evidences WHERE content_id = ? AND kind = 'proficiencia'").get(CONTENT) as {
      n: number;
    }).n,
    0,
  );

  // Pode refazer: tentativa anterior já está "enviada", então começa outra.
  const again = await startProficiencia(db, CONTENT, { now: T0, id: 'pf2b' });
  assert.equal(again.id, 'pf2b');
  assert.equal(again.status, 'em-andamento');
});

void test('só vale antes de começar o conteúdo (nao-iniciado)', async () => {
  const { raw, db } = setup();
  raw
    .prepare("INSERT INTO atlas_content_states (content_id, state, updated_at) VALUES (?, 'em-estudo', ?)")
    .run(CONTENT, T0);
  await assert.rejects(
    startProficiencia(db, CONTENT, { now: T0 }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
});

void test('responder questão fora de ordem (id diferente da atual) é recusado com 409', async () => {
  const { db } = setup();
  const started = await startProficiencia(db, CONTENT, { now: T0, id: 'pf3' });
  await assert.rejects(
    answerProficiencia(db, 'pf3', `${started.currentQuestion!.id}-nao-existe`, { option: 0 }),
    (error: unknown) => error instanceof QuizError && error.status === 409,
  );
  // quizErrorResponse continua funcionando para este tipo de erro (mesmo padrão do resto do Apolo).
  const response = quizErrorResponse(new QuizError('x', 409));
  assert.equal(response.status, 409);
});
