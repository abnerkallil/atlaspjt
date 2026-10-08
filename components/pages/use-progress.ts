'use client';

import { useEffect, useState } from 'react';
import { localDate } from '@/components/atlas/use-agenda';
import type { ProgressReport } from '@/lib/progress';

export type ProgressState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; progress: ProgressReport };

async function loadProgress(): Promise<ProgressState> {
  try {
    const response = await fetch(`/api/progresso?hoje=${localDate()}&fuso=${new Date().getTimezoneOffset()}`);
    const body = (await response.json().catch(() => ({}))) as { progress?: ProgressReport; error?: string };
    if (!response.ok || !body.progress) throw new Error(body.error ?? 'Não foi possível calcular o progresso.');
    return { status: 'ready', progress: body.progress };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Não foi possível calcular o progresso.' };
  }
}

// Progresso calculado (MVP-07), usado por Progresso e pelos indicadores de Hoje.
export function useProgress() {
  const [state, setState] = useState<ProgressState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    void loadProgress().then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

// Os três indicadores que Hoje e Progresso mostram iguais.
export function progressMetrics(progress: ProgressReport | null) {
  const change = progress?.overall.retentionChange ?? 0;
  return [
    {
      tone: 'gold',
      icon: 'target',
      label: 'Domínio geral',
      value: progress ? `${progress.overall.mastery.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—',
      hint: 'Média das disciplinas pela fórmula do Atlas',
    },
    {
      tone: 'violet',
      icon: 'brain',
      label: 'Retenção média',
      value: progress ? `${progress.overall.retention}%` : '—',
      hint: progress?.overall.reviewsTaken
        ? `${change >= 0 ? '+' : ''}${change} pontos em 8 semanas`
        : 'Aparece depois da primeira revisão',
    },
    {
      tone: 'green',
      icon: 'flame',
      label: 'Consistência',
      value: progress ? `${progress.consistency.streak} ${progress.consistency.streak === 1 ? 'dia' : 'dias'}` : '—',
      hint: progress ? `${progress.consistency.studiedDays} de 28 dias com estudo` : 'Calculando…',
    },
  ] as const;
}
