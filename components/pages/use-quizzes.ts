'use client';

import type { Answers, QuizAttempt, QuizQueueItem } from '@/lib/quizzes';

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok)
    throw new Error(body.error ?? 'Não foi possível carregar os quizzes.');
  return body;
}

export type QuizOverview = {
  queue: QuizQueueItem[];
  attempts: QuizAttempt[];
  now: string;
};

export async function fetchQuizOverview() {
  return readJson<QuizOverview>(await fetch('/api/quizzes'));
}

export async function startQuizAttempt(contentId: string) {
  return readJson<{ attempt: QuizAttempt; now: string }>(
    await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    }),
  );
}

export async function fetchQuizAttempt(id: string) {
  return readJson<{ attempt: QuizAttempt; now: string }>(
    await fetch(`/api/quizzes/${encodeURIComponent(id)}`),
  );
}

export async function sendQuizAttempt(
  id: string,
  body:
    | { action: 'travar'; answers: Answers }
    | {
        action: 'enviar';
        answers?: Answers;
        selfAssessments?: Record<string, 'certa' | 'errada'>;
      },
) {
  return readJson<{ attempt: QuizAttempt; now: string }>(
    await fetch(`/api/quizzes/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

// Rascunho das respostas no navegador: um recarregamento não perde o que foi
// marcado (o tempo continua correndo no servidor).
const draftKey = (attemptId: string) => `atlas-quiz:${attemptId}`;

export function readAnswerDraft(attemptId: string): Answers {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(draftKey(attemptId)) ?? '{}',
    ) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Answers)
      : {};
  } catch {
    return {};
  }
}

export function writeAnswerDraft(attemptId: string, answers: Answers) {
  try {
    window.localStorage.setItem(draftKey(attemptId), JSON.stringify(answers));
  } catch {
    // Sem armazenamento local, as respostas só ficam na tela.
  }
}

export function clearAnswerDraft(attemptId: string) {
  try {
    window.localStorage.removeItem(draftKey(attemptId));
  } catch {
    // Nada a limpar.
  }
}
