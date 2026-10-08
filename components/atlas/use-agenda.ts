'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgendaItem, AgendaPriority } from '@/lib/agenda';

export type AgendaState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; today: string; items: AgendaItem[] };

// Data local do navegador (AAAA-MM-DD): a agenda segue o dia de quem estuda.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Não foi possível carregar a agenda.');
  return body;
}

async function loadAgenda(): Promise<AgendaState> {
  try {
    const body = await readJson<{ today: string; items: AgendaItem[] }>(
      await fetch(`/api/agenda?hoje=${localDate()}&dias=7`),
    );
    return { status: 'ready', today: body.today, items: body.items };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar a agenda.' };
  }
}

// Agenda de hoje e dos próximos 7 dias (MVP-05). `key` recarrega ao mudar
// (ex.: a rota), para refletir sessões e quizzes concluídos em outra página.
export function useAgendaData(key: string) {
  const [agenda, setAgenda] = useState<AgendaState>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    void loadAgenda().then((next) => {
      if (alive) setAgenda(next);
    });
    return () => {
      alive = false;
    };
  }, [key, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { agenda, reload };
}

async function patch(id: string, body: Record<string, unknown>) {
  return readJson<{ item: AgendaItem }>(
    await fetch(`/api/agenda/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

export function completeAgendaItem(id: string) {
  return patch(id, { action: 'concluir' });
}

export function rescheduleAgendaItem(id: string, input: { date: string; time?: string; reason?: string }) {
  return patch(id, { action: 'reagendar', hoje: localDate(), ...input });
}

export function adjustAgendaItem(id: string, input: { durationMinutes?: number; priority?: AgendaPriority }) {
  return patch(id, { action: 'ajustar', ...input });
}

// Resumo do dia para o cabeçalho e para Hoje.
export function daySummary(items: AgendaItem[], today: string) {
  const open = items.filter((item) => item.dueDate === today && item.status === 'pendente');
  return {
    pending: open.length,
    minutes: open.reduce((sum, item) => sum + item.durationMinutes, 0),
    reviews: open.filter((item) => item.kind === 'revisao').length,
  };
}
