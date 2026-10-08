// APO-11: o plano de 'quiz' sem área de conhecimento é a mesma prova que
// lib/quizzes.ts já dá hoje; humanas e exatas produzem misturas de tipo de
// questão visivelmente diferentes; allocateCounts soma sempre ao tamanho
// pedido; applyDifficultyFallback redistribui para a faixa vizinha e nunca
// inventa questão.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateCounts,
  applyDifficultyFallback,
  resolvePlan,
  type KindMix,
} from '../lib/apolo/plans.js';
import { DIFFICULTY_LEVELS } from '../lib/apolo/types.js';
import { PASSING_SCORE, QUESTION_KINDS, QUESTION_SECONDS, QUIZ_SIZE } from '../lib/quizzes.js';

void test('APO-11: plano de quiz sem área dá a mesma prova de hoje', () => {
  const plan = resolvePlan('quiz');
  assert.equal(plan.size, QUIZ_SIZE);
  assert.deepEqual(plan.secondsByKind, QUESTION_SECONDS);
  assert.equal(plan.passingScore, PASSING_SCORE);
  assert.deepEqual(plan.kindMix, { multipla: 1 });
});

void test('APO-11: perfil de humanas e exatas produzem misturas de tipo bem diferentes', () => {
  const humanas = resolvePlan('quiz', 'humanas');
  const exatas = resolvePlan('quiz', 'exatas');
  const countsHumanas = allocateCounts(humanas.kindMix, QUIZ_SIZE, QUESTION_KINDS);
  const countsExatas = allocateCounts(exatas.kindMix, QUIZ_SIZE, QUESTION_KINDS);
  assert.notDeepEqual(countsHumanas, countsExatas);
  // humanas prioriza dissertativa; exatas prioriza cálculo — nenhuma das duas
  // é só múltipla escolha como o plano neutro.
  assert.ok(countsHumanas.dissertativa > countsExatas.dissertativa);
  assert.ok(countsExatas.calculo > countsHumanas.calculo);
});

void test('APO-11: override por conteúdo vence o perfil da área', () => {
  const customMix: KindMix = { dissertativa: 1 };
  const plan = resolvePlan('quiz', 'exatas', { kindMix: customMix });
  assert.deepEqual(plan.kindMix, customMix);
});

void test('APO-11: allocateCounts sempre soma ao tamanho pedido (maior resto)', () => {
  const mix: KindMix = { multipla: 1, dissertativa: 1, calculo: 1 };
  for (const size of [1, 2, 3, 7, 10, 23]) {
    const counts = allocateCounts(mix, size, QUESTION_KINDS);
    const sum = Object.values(counts).reduce((a, b) => a + (b as number), 0);
    assert.equal(sum, size, `tamanho ${size}`);
  }
});

void test('APO-11: allocateCounts é determinístico (mesma entrada, mesma saída)', () => {
  const mix: KindMix = { multipla: 0.4, dissertativa: 0.25, certo_errado: 0.2, calculo: 0.15 };
  const first = allocateCounts(mix, 10, QUESTION_KINDS);
  const second = allocateCounts(mix, 10, QUESTION_KINDS);
  assert.deepEqual(first, second);
});

void test('APO-11: fallback de dificuldade redistribui para a faixa vizinha e avisa quando não dá', () => {
  const target = { facil: 2, media: 3, dificil: 5 } as Record<(typeof DIFFICULTY_LEVELS)[number], number>;
  const available = { facil: 10, media: 10, dificil: 1 };
  const { counts, warnings } = applyDifficultyFallback(target, available);
  // dificil pediu 5, só tinha 1: os 4 que faltam vão para a vizinha (media).
  assert.equal(counts.dificil, 1);
  assert.equal(counts.media, 3 + 4);
  assert.equal(counts.facil, 2);
  assert.equal(warnings.length, 0);
});

void test('APO-11: fallback avisa quando nem a faixa vizinha dá conta', () => {
  const target = { facil: 0, media: 0, dificil: 5 } as Record<(typeof DIFFICULTY_LEVELS)[number], number>;
  const available = { facil: 0, media: 0, dificil: 1 };
  const { counts, warnings } = applyDifficultyFallback(target, available);
  assert.equal(counts.dificil, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /dificil/);
});
