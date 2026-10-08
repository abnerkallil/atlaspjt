// APO-12: o seletor é determinístico (mesma semente, mesma prova), nunca
// deixa passar questão fora de 'ativa', respeita o plano (tamanho e mistura),
// prioriza recuperação vencida e subtópico fraco antes da cobertura normal,
// nunca repete família de molde, e o modo adaptativo escolhe o item mais
// próximo da habilidade do aluno.
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlan } from '../lib/apolo/plans.js';
import type { StudentProfile } from '../lib/apolo/profile.js';
import { selectQuestions, type CandidateQuestion, type SelectInput } from '../lib/apolo/selector.js';

const NOW = '2026-10-08T12:00:00.000Z';

function question(overrides: Partial<CandidateQuestion>): CandidateQuestion {
  return {
    id: 'q1',
    contentId: 'CG-001',
    kind: 'multipla',
    theme: 'tema-x',
    subtopicId: null,
    bloomLevel: null,
    difficultyNominal: 'media',
    lifecycleState: 'ativa',
    itemModelId: null,
    ...overrides,
  };
}

const emptyProfile: StudentProfile = { temas: [], filaRecuperacao: [] };

function bankOf(size: number, overrides: (index: number) => Partial<CandidateQuestion> = () => ({})): CandidateQuestion[] {
  return Array.from({ length: size }, (_, i) => question({ id: `q${i}`, ...overrides(i) }));
}

function baseInput(overrides: Partial<SelectInput> = {}): SelectInput {
  return {
    plan: resolvePlan('quiz'),
    profile: emptyProfile,
    bank: bankOf(20),
    recentlySeen: [],
    seed: 'tentativa-1',
    now: NOW,
    ...overrides,
  };
}

void test('APO-12: mesma semente e mesma entrada dão sempre a mesma prova', () => {
  const input = baseInput();
  const first = selectQuestions(input);
  const second = selectQuestions(input);
  assert.deepEqual(first, second);
});

void test('APO-12: sementes diferentes podem dar provas diferentes', () => {
  const a = selectQuestions(baseInput({ seed: 'a' }));
  const b = selectQuestions(baseInput({ seed: 'zzz-diferente' }));
  assert.notDeepEqual(
    a.map((q) => q.questionId),
    b.map((q) => q.questionId),
  );
});

void test('APO-12: plano é respeitado (tamanho) quando o banco tem questões suficientes', () => {
  const plan = resolvePlan('quiz');
  const result = selectQuestions(baseInput({ plan, bank: bankOf(30) }));
  assert.equal(result.length, plan.size);
});

void test('APO-12: nenhuma questão em rascunho, curadoria ou aposentada sai', () => {
  const bank = [
    ...bankOf(5, (i) => ({ id: `ativa-${i}` })),
    question({ id: 'rascunho-1', lifecycleState: 'rascunho' }),
    question({ id: 'curadoria-1', lifecycleState: 'curadoria' }),
    question({ id: 'aposentada-1', lifecycleState: 'aposentada' }),
  ];
  const result = selectQuestions(baseInput({ plan: { ...resolvePlan('quiz'), size: 5 }, bank }));
  const ids = result.map((q) => q.questionId);
  assert.ok(!ids.includes('rascunho-1'));
  assert.ok(!ids.includes('curadoria-1'));
  assert.ok(!ids.includes('aposentada-1'));
  assert.equal(result.length, 5);
});

void test('APO-12: questão de recuperação vencida é priorizada e ganha o motivo certo', () => {
  const bank = bankOf(10);
  const profile: StudentProfile = {
    temas: [],
    filaRecuperacao: [{ questionId: 'q0', difficulty: 5, stability: 3, reviewedAt: '2026-10-01T00:00:00.000Z', dueAt: '2026-10-05T00:00:00.000Z' }],
  };
  const result = selectQuestions(baseInput({ plan: { ...resolvePlan('quiz'), size: 1 }, bank, profile }));
  assert.equal(result.length, 1);
  assert.equal(result[0].questionId, 'q0');
  assert.equal(result[0].reason, 'recuperacao-vencida');
});

void test('APO-12: recuperação não vencida (dueAt no futuro) não é priorizada', () => {
  const bank = bankOf(10);
  const profile: StudentProfile = {
    temas: [],
    filaRecuperacao: [{ questionId: 'q0', difficulty: 5, stability: 3, reviewedAt: '2026-10-01T00:00:00.000Z', dueAt: '2027-01-01T00:00:00.000Z' }],
  };
  const result = selectQuestions(baseInput({ plan: { ...resolvePlan('quiz'), size: 3 }, bank, profile }));
  assert.ok(!result.some((q) => q.reason === 'recuperacao-vencida'));
});

void test('APO-12: subtópico fraco é priorizado quando não há recuperação vencida', () => {
  const bank = [
    question({ id: 'fraco-1', theme: 'tema-y', contentId: 'CG-002' }),
    ...bankOf(10),
  ];
  const profile: StudentProfile = {
    temas: [{ theme: 'tema-y', contentId: 'CG-002', subtopicId: null, elo: 900, answers: 5, correct: 1 }],
    filaRecuperacao: [],
  };
  const result = selectQuestions(baseInput({ plan: { ...resolvePlan('quiz'), size: 1 }, bank, profile }));
  assert.equal(result.length, 1);
  assert.equal(result[0].questionId, 'fraco-1');
  assert.equal(result[0].reason, 'subtopico-fraco');
});

void test('APO-12: nunca seleciona duas questões da mesma família de molde', () => {
  const bank = [
    question({ id: 'molde-a1', itemModelId: 'molde-a' }),
    question({ id: 'molde-a2', itemModelId: 'molde-a' }),
    question({ id: 'molde-b1', itemModelId: 'molde-b' }),
    ...bankOf(10, (i) => ({ id: `avulsa-${i}` })),
  ];
  const result = selectQuestions(baseInput({ plan: { ...resolvePlan('quiz'), size: 14 }, bank }));
  const seenModels = result
    .map((r) => bank.find((q) => q.id === r.questionId)?.itemModelId)
    .filter((id): id is string => id !== null && id !== undefined);
  assert.equal(seenModels.length, new Set(seenModels).size);
});

void test('APO-12: evita repetir "últimas vistas", mas completa o plano se precisar', () => {
  const bank = bankOf(5);
  const result = selectQuestions(
    baseInput({ plan: { ...resolvePlan('quiz'), size: 5 }, bank, recentlySeen: ['q0', 'q1', 'q2', 'q3'] }),
  );
  // só 1 questão não vista (q4): o plano (5) só fecha reusando as vistas.
  assert.equal(result.length, 5);
});

void test('APO-12: cobertura do plano respeita a mistura de tipo de questão', () => {
  const bank = [
    ...bankOf(20, (i) => ({ id: `multipla-${i}`, kind: 'multipla' as const })),
    ...bankOf(20, (i) => ({ id: `dissertativa-${i}`, kind: 'dissertativa' as const })),
  ];
  const plan = { ...resolvePlan('quiz'), size: 10, kindMix: { multipla: 0.5, dissertativa: 0.5 } };
  const result = selectQuestions(baseInput({ plan, bank }));
  const kinds = result.map((r) => bank.find((q) => q.id === r.questionId)!.kind);
  assert.equal(kinds.filter((k) => k === 'multipla').length, 5);
  assert.equal(kinds.filter((k) => k === 'dissertativa').length, 5);
});

void test('APO-12: modo adaptativo escolhe o item mais próximo da habilidade do aluno', () => {
  const bank = [
    question({ id: 'longe', theme: 'tema-z', contentId: 'CG-003' }),
    question({ id: 'perto', theme: 'tema-z', contentId: 'CG-003' }),
  ];
  const profile: StudentProfile = {
    temas: [{ theme: 'tema-z', contentId: 'CG-003', subtopicId: null, elo: 1200, answers: 10, correct: 5 }],
    filaRecuperacao: [],
  };
  const result = selectQuestions(
    baseInput({
      plan: { ...resolvePlan('quiz'), size: 1 },
      bank,
      profile,
      adaptive: true,
      itemElo: { longe: 1800, perto: 1210 },
    }),
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].questionId, 'perto');
});
