// Leitura e aplicação da estatística de itens (APO-10) a partir do histórico
// real: explode atlas_quiz_attempts (só enviadas) e junta com atlas_questions
// para ter tema/dificuldade/alternativas de cada resposta, inclusive a
// alternativa escolhida (desembaralhada de volta ao índice original do banco).
import type { D1Like } from '../pedagogy/transitions.js';
import type { DifficultyLevel } from './types.js';
import {
  computeInstrumentStats,
  computeItemStats,
  detectAlerts,
  type AlertThresholds,
  type ItemAlert,
  type ItemAnswerEvent,
  type ItemStat,
  type InstrumentStat,
} from './item-stats.js';

type AttemptRow = {
  id: string;
  content_id: string;
  score: number | null;
  submitted_at: string;
  result_json: string;
  answers_json: string | null;
  questions_json: string;
};
type QuestionRow = {
  id: string;
  content_id: string;
  kind: ItemAnswerEvent['kind'];
  difficulty_nominal: string | null;
  options_json: string | null;
  correct_option: number | null;
  lifecycle_state: string;
};
type StoredResult = { results?: { questionId: string; correct: boolean; voided: boolean }[] };
type StoredQuestions = { optionOrders?: Record<string, number[]> };
type StoredAnswers = Record<string, { option?: number }>;

const CHUNK = 100;

export async function loadItemEvents(db: D1Like): Promise<ItemAnswerEvent[]> {
  const { results: attempts } = await db
    .prepare(
      `SELECT id, content_id, score, submitted_at, result_json, answers_json, questions_json FROM atlas_quiz_attempts
       WHERE status = 'enviado' AND submitted_at IS NOT NULL AND result_json IS NOT NULL
       ORDER BY submitted_at, id`,
    )
    .all<AttemptRow>();
  if (attempts.length === 0) return [];

  const questionIds = new Set<string>();
  for (const row of attempts) {
    const stored = JSON.parse(row.result_json) as StoredResult;
    for (const item of stored.results ?? []) questionIds.add(item.questionId);
  }
  const ids = [...questionIds];
  const meta = new Map<string, QuestionRow>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const placeholders = chunk.map((_, index) => `?${index + 1}`).join(',');
    const { results: rows } = await db
      .prepare(
        `SELECT id, content_id, kind, difficulty_nominal, options_json, correct_option, lifecycle_state FROM atlas_questions WHERE id IN (${placeholders})`,
      )
      .bind(...chunk)
      .all<QuestionRow>();
    for (const row of rows) meta.set(row.id, row);
  }

  const events: ItemAnswerEvent[] = [];
  for (const attempt of attempts) {
    const results = (JSON.parse(attempt.result_json) as StoredResult).results ?? [];
    const storedQuestions = JSON.parse(attempt.questions_json) as StoredQuestions;
    const answers = attempt.answers_json ? (JSON.parse(attempt.answers_json) as StoredAnswers) : {};
    for (const item of results) {
      if (item.voided) continue;
      const info = meta.get(item.questionId);
      if (!info) continue;
      let chosenOption: number | null = null;
      const shown = answers[item.questionId]?.option;
      const order = storedQuestions.optionOrders?.[item.questionId];
      if (typeof shown === 'number' && order) chosenOption = order[shown] ?? null;
      const options = info.options_json ? (JSON.parse(info.options_json) as string[]) : null;
      events.push({
        questionId: item.questionId,
        contentId: info.content_id,
        kind: info.kind,
        difficulty: (info.difficulty_nominal as DifficultyLevel | null) ?? null,
        correct: item.correct,
        chosenOption,
        correctOption: info.correct_option,
        optionsCount: options?.length ?? null,
        at: attempt.submitted_at,
        attemptId: attempt.id,
        attemptScore: attempt.score ?? 0,
      });
    }
  }
  return events;
}

export type ItemAudit = { items: ItemStat[]; instruments: InstrumentStat[]; alerts: ItemAlert[] };

export async function getItemAudit(db: D1Like, thresholds?: AlertThresholds): Promise<ItemAudit> {
  const events = await loadItemEvents(db);
  const items = computeItemStats(events);
  return {
    items,
    instruments: computeInstrumentStats(events),
    alerts: detectAlerts(items, thresholds),
  };
}

// Tira da prova (lifecycle_state → 'curadoria', active → 0) toda questão
// alertada que hoje está 'ativa' — ela some do próximo sorteio (lib/quizzes.ts
// só lê active=1) e cai na fila de curadoria (APO-07) para um humano decidir.
// Nunca mexe em nota já emitida: só afeta sorteios futuros.
export async function applyItemAlerts(db: D1Like, thresholds?: AlertThresholds): Promise<{ retired: string[] }> {
  const { alerts } = await getItemAudit(db, thresholds);
  if (alerts.length === 0) return { retired: [] };
  const ids = alerts.map((alert) => alert.questionId);
  const placeholders = ids.map((_, index) => `?${index + 1}`).join(',');
  const { results: active } = await db
    .prepare(`SELECT id FROM atlas_questions WHERE id IN (${placeholders}) AND lifecycle_state = 'ativa'`)
    .bind(...ids)
    .all<{ id: string }>();
  if (active.length === 0) return { retired: [] };
  await db.batch(
    active.map((row) =>
      db.prepare(`UPDATE atlas_questions SET lifecycle_state = 'curadoria', active = 0 WHERE id = ?1`).bind(row.id),
    ),
  );
  return { retired: active.map((row) => row.id) };
}
