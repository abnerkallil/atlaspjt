// Recuperação e bloqueios (MVP-08, DEC-03 e DEC-04).
//
// Depois de uma reprovação (quiz do conteúdo, revisão ou corretivo) o conteúdo
// fica bloqueado ou em revisão ativa até o usuário passar com 70%: refaz o quiz
// direto ou revisa as notas antes, quantas vezes precisar.
// Este módulo lê o histórico de tentativas para dizer o que errou (estudo
// dirigido), quantas reprovações seguidas houve (reincidência) e quais questões
// voltam primeiro no próximo quiz (quiz dirigido). Desbloqueio continua sendo a
// transição do DEC-03 ao passar; nada aqui muda estado.
import type { D1Like } from './pedagogy/transitions.js';

export type MissedQuestion = {
  id: string;
  kind: string;
  prompt: string;
  // Resposta certa em texto: alternativa, gabarito da dissertativa ou valor esperado.
  answer: string;
  explanation: string;
};

export type RecoveryStatus = {
  contentId: string;
  // Reprovações seguidas desde a última aprovação (1 = primeira; 2+ = reincidência).
  failures: number;
  lastFailureAt: string;
  lastPurpose: string;
  lastScore: number;
  // Questões erradas na última reprovação, na ordem do banco.
  missed: MissedQuestion[];
};

type AttemptRow = { id: string; purpose: string; passed: number; score: number; submitted_at: string; result_json: string | null };
type QuestionRow = {
  id: string;
  kind: string;
  prompt: string;
  options_json: string | null;
  correct_option: number | null;
  model_answer: string | null;
  expected_value: number | null;
  explanation: string;
};

// Pura: reprovações seguidas a partir da tentativa mais recente.
export function failureStreak(attempts: { passed: boolean }[]): number {
  let streak = 0;
  for (const attempt of attempts) {
    if (attempt.passed) break;
    streak += 1;
  }
  return streak;
}

// Pura: ids das questões erradas (anuladas não contam) no resultado gravado.
export function wrongQuestionIds(resultJson: string | null): string[] {
  if (!resultJson) return [];
  try {
    const parsed = JSON.parse(resultJson) as { results?: { questionId: string; correct: boolean; voided: boolean }[] };
    return (parsed.results ?? []).filter((item) => !item.correct && !item.voided).map((item) => item.questionId);
  } catch {
    return [];
  }
}

function answerText(row: QuestionRow): string {
  if (row.kind === 'multipla' && row.options_json && row.correct_option !== null) {
    try {
      return (JSON.parse(row.options_json) as string[])[Number(row.correct_option)] ?? '';
    } catch {
      return '';
    }
  }
  if (row.kind === 'calculo' && row.expected_value !== null) return String(row.expected_value).replace('.', ',');
  return row.model_answer ?? '';
}

export async function recoveryStatus(db: D1Like, contentId: string): Promise<RecoveryStatus | null> {
  const { results } = await db
    .prepare(
      `SELECT id, purpose, passed, score, submitted_at, result_json FROM atlas_quiz_attempts
       WHERE content_id = ?1 AND status = 'enviado' AND passed IS NOT NULL
       ORDER BY submitted_at DESC, rowid DESC LIMIT 20`,
    )
    .bind(contentId)
    .all<AttemptRow>();
  const failures = failureStreak(results.map((row) => ({ passed: Number(row.passed) === 1 })));
  if (failures === 0) return null;
  const last = results[0];
  const wrong = wrongQuestionIds(last.result_json);
  let missed: MissedQuestion[] = [];
  if (wrong.length) {
    const { results: questions } = await db
      .prepare(
        `SELECT id, kind, prompt, options_json, correct_option, model_answer, expected_value, explanation
         FROM atlas_questions WHERE content_id = ?1 ORDER BY position, id`,
      )
      .bind(contentId)
      .all<QuestionRow>();
    const wanted = new Set(wrong);
    missed = questions
      .filter((row) => wanted.has(row.id))
      .map((row) => ({ id: row.id, kind: row.kind, prompt: row.prompt, answer: answerText(row), explanation: row.explanation }));
  }
  return {
    contentId,
    failures,
    lastFailureAt: last.submitted_at,
    lastPurpose: last.purpose,
    lastScore: Number(last.score),
    missed,
  };
}

// Quiz dirigido: as questões erradas voltam primeiro (até o tamanho do quiz) e o
// resto vem do sorteio normal, sem repetir.
export function directedSelection<T extends { id: string }>(missedIds: string[], bank: T[], drawn: T[], size: number): T[] {
  const byId = new Map(bank.map((item) => [item.id, item]));
  const first = missedIds.flatMap((id) => byId.get(id) ?? []).slice(0, size);
  const taken = new Set(first.map((item) => item.id));
  const rest = [...drawn, ...bank].filter((item) => {
    if (taken.has(item.id)) return false;
    taken.add(item.id);
    return true;
  });
  return [...first, ...rest].slice(0, size);
}

export function recoveryReason(status: RecoveryStatus | null, base: string): string {
  if (!status) return base;
  const missed = status.missed.length ? ` ${status.missed.length} ${status.missed.length === 1 ? 'questão errada volta' : 'questões erradas voltam'} no quiz.` : '';
  const repeat = status.failures >= 2 ? ` Reincidência: ${status.failures}ª reprovação seguida.` : '';
  return `${base}${missed}${repeat}`;
}
