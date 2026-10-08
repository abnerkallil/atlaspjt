// Modelo do aluno (APO-09, DEC-017): habilidade Elo por tema × conteúdo ×
// subtópico, e memória por questão (dificuldade/estabilidade/recuperabilidade,
// inspirada no FSRS — versão simplificada, não o algoritmo FSRS oficial).
// Tudo função pura sobre o histórico ordenado de tentativas: dado o mesmo
// histórico, sempre o mesmo resultado, sem nenhum estado incremental que não
// possa ser reconstruído do zero. O Elo só prioriza/seleciona questão
// (DEC-017); nunca afeta a nota do quiz, que continua em lib/quizzes.ts.
import type { DifficultyLevel } from './types.js';

export type SkillEvent = {
  theme: string;
  contentId: string;
  subtopicId: string | null;
  questionId: string;
  difficulty: DifficultyLevel | null;
  correct: boolean;
  at: string;
};

export type SkillState = {
  theme: string;
  contentId: string;
  subtopicId: string | null;
  elo: number;
  answers: number;
  correct: number;
};

export type QuestionMemory = {
  questionId: string;
  // 1 (fácil) a 10 (difícil).
  difficulty: number;
  // Dias até a chance de lembrar cair a ~90% (ver recallProbability).
  stability: number;
  reviewedAt: string;
  dueAt: string;
};

const INITIAL_ELO = 1200;
const DIFFICULTY_ELO: Record<DifficultyLevel, number> = { facil: 1000, media: 1200, dificil: 1400 };
const DEFAULT_DIFFICULTY_ELO = 1200;
// K encolhe com mais respostas (K_MAX no início, estabiliza perto de K_MIN).
const K_MAX = 32;
const K_MIN = 8;

function kFactor(answers: number): number {
  return Math.max(K_MIN, K_MAX / Math.sqrt(answers + 1));
}

function skillKey(theme: string, contentId: string, subtopicId: string | null): string {
  return `${theme}::${contentId}::${subtopicId ?? ''}`;
}

// Ordem de entrada: pelo histórico (mais antigo primeiro). Chamar duas vezes
// com a mesma lista dá sempre o mesmo resultado (sem I/O, sem Date.now()).
export function foldSkills(events: SkillEvent[]): SkillState[] {
  const states = new Map<string, SkillState>();
  for (const event of events) {
    const key = skillKey(event.theme, event.contentId, event.subtopicId);
    const current = states.get(key) ?? {
      theme: event.theme,
      contentId: event.contentId,
      subtopicId: event.subtopicId,
      elo: INITIAL_ELO,
      answers: 0,
      correct: 0,
    };
    const opponent = event.difficulty ? DIFFICULTY_ELO[event.difficulty] : DEFAULT_DIFFICULTY_ELO;
    const expected = 1 / (1 + 10 ** ((opponent - current.elo) / 400));
    const actual = event.correct ? 1 : 0;
    const k = kFactor(current.answers);
    states.set(key, {
      ...current,
      elo: current.elo + k * (actual - expected),
      answers: current.answers + 1,
      correct: current.correct + (event.correct ? 1 : 0),
    });
  }
  return [...states.values()].sort((a, b) =>
    skillKey(a.theme, a.contentId, a.subtopicId).localeCompare(skillKey(b.theme, b.contentId, b.subtopicId)),
  );
}

const DIFFICULTY_BASE: Record<DifficultyLevel, number> = { facil: 2, media: 5, dificil: 8 };
const DEFAULT_DIFFICULTY_BASE = 5;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STABILITY_DAYS = 0.5;
const DAY_MS = 24 * 60 * 60 * 1000;

function clampDifficulty(value: number): number {
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value));
}

// Curva de esquecimento simplificada: R(t) = (1 + t / (9·S))⁻¹, isto é,
// R(S) = 0.9 — a estabilidade S é "quantos dias até 90% de chance de lembrar".
export function recallProbability(stabilityDays: number, elapsedDays: number): number {
  return (1 + elapsedDays / (9 * Math.max(stabilityDays, MIN_STABILITY_DAYS))) ** -1;
}

export function foldMemory(events: SkillEvent[]): QuestionMemory[] {
  const byQuestion = new Map<string, { difficulty: number; stability: number; reviewedAt: string }>();
  for (const event of events) {
    const prior = byQuestion.get(event.questionId);
    const priorDifficulty = prior?.difficulty ?? (event.difficulty ? DIFFICULTY_BASE[event.difficulty] : DEFAULT_DIFFICULTY_BASE);
    const priorStability = prior?.stability ?? Math.max(MIN_STABILITY_DAYS, (11 - priorDifficulty) / 2);
    const elapsedDays = prior ? Math.max(0, (Date.parse(event.at) - Date.parse(prior.reviewedAt)) / DAY_MS) : 0;

    let difficulty: number;
    let stability: number;
    if (event.correct) {
      difficulty = clampDifficulty(priorDifficulty - 0.3);
      const recall = prior ? recallProbability(priorStability, elapsedDays) : 1;
      // Lembrou mesmo com chance baixa de lembrar (gap grande) => estabilidade cresce mais.
      const growth = 1 + ((1 - recall) * (11 - difficulty)) / 5;
      stability = Math.max(MIN_STABILITY_DAYS, priorStability * growth);
    } else {
      difficulty = clampDifficulty(priorDifficulty + 1);
      stability = Math.max(MIN_STABILITY_DAYS, priorStability * 0.3);
    }
    byQuestion.set(event.questionId, { difficulty, stability, reviewedAt: event.at });
  }
  return [...byQuestion.entries()]
    .map(([questionId, state]) => ({
      questionId,
      difficulty: state.difficulty,
      stability: state.stability,
      reviewedAt: state.reviewedAt,
      dueAt: new Date(Date.parse(state.reviewedAt) + state.stability * DAY_MS).toISOString(),
    }))
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}
