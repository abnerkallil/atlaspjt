'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RoadmapView } from '@/lib/roadmap-store';
import { pickNextStudy, roadmapContents, type NextStudy } from '@/lib/study-plan';
import type { StudySession } from '@/lib/study-sessions';

export type StudyContent = ReturnType<typeof roadmapContents>[number];

export type StudyOverview =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      roadmap: RoadmapView | null;
      openSessions: StudySession[];
      next: NextStudy | null;
      nextContent: StudyContent | null;
      serverNow: string;
    };

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Não foi possível carregar seus estudos.');
  return body;
}

async function loadOverview(): Promise<StudyOverview> {
  try {
    const [{ roadmap }, { sessions }] = await Promise.all([
      fetch('/api/roadmap').then((response) => readJson<{ roadmap: RoadmapView | null }>(response)),
      fetch('/api/sessoes?abertas=1').then((response) => readJson<{ sessions: StudySession[] }>(response)),
    ]);
    const next = pickNextStudy(roadmap, sessions);
    const nextContent = next ? (roadmapContents(roadmap).find((item) => item.id === next.contentId) ?? null) : null;
    return { status: 'ready', roadmap, openSessions: sessions, next, nextContent, serverNow: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar seus estudos.' };
  }
}

// Roadmap + sessões abertas, e o próximo passo de estudo (MVP-02).
export function useStudyOverview() {
  const [overview, setOverview] = useState<StudyOverview>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void loadOverview().then((next) => {
      if (active) setOverview(next);
    });
    return () => {
      active = false;
    };
  }, [version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { overview, reload };
}

export async function startStudySession(contentId: string) {
  const { session } = await readJson<{ session: StudySession }>(
    await fetch('/api/sessoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    }),
  );
  return session;
}

export async function fetchStudySession(id: string) {
  return readJson<{ session: StudySession; now: string }>(await fetch(`/api/sessoes/${encodeURIComponent(id)}`));
}

export async function updateStudySession(
  id: string,
  action: 'pausar' | 'retomar' | 'salvar-ponto' | 'concluir',
  checkpoint?: unknown,
  options: { keepalive?: boolean } = {},
) {
  return readJson<{ session: StudySession; now: string }>(
    await fetch(`/api/sessoes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, checkpoint }),
      keepalive: options.keepalive,
    }),
  );
}

export function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
}
