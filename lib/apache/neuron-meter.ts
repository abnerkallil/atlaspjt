// APA-15: medidor diário de neurons do Workers AI (plano Free, 10.000/dia,
// reset 00:00 UTC). Checado em todo lugar que chama IA no Apache (APA-06,
// APA-07, APA-12) antes de gastar neurons — ver docs/APACHE.md.
import type { D1Like } from '../pedagogy/transitions.js';

export const DAILY_NEURON_BUDGET = 10_000;
// Corte em 90%, sempre — sem exceção por "fizer sentido" (docs/APACHE.md).
export const NEURON_OVERLIMIT_THRESHOLD = 9_000;

// Estimativas de fallback por geração (~3k tokens de entrada + ~2k de saída),
// levantadas e verificadas no chat do projeto em 2026-10-20. Usar
// response.usage da chamada real quando disponível; estes valores são só a
// estimativa de fallback.
export const FALLBACK_NEURON_ESTIMATE = {
  'llama-3.3-70b': 20,
  'gemma-4-26b': 120,
  'qwen3-30b': 130,
} as const;

function utcDay(now: string): string {
  return now.slice(0, 10);
}

// UPSERT atômico: um único INSERT ... ON CONFLICT soma neurons_used sem
// round-trip de leitura-depois-escrita (evita corrida entre chamadas
// concorrentes no mesmo dia).
export async function recordNeuronUsage(db: D1Like, amount: number, now: string): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const day = utcDay(now);
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_neuron_meter (day, neurons_used, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(day) DO UPDATE SET
           neurons_used = neurons_used + excluded.neurons_used,
           updated_at = excluded.updated_at`,
      )
      .bind(day, Math.round(amount), now),
  ]);
}

export type NeuronBudget = { used: number; remaining: number; overLimit: boolean };

export async function neuronBudgetRemaining(db: D1Like, now: string): Promise<NeuronBudget> {
  const day = utcDay(now);
  const row = await db
    .prepare(`SELECT neurons_used FROM atlas_apache_neuron_meter WHERE day = ?1`)
    .bind(day)
    .first<{ neurons_used: number }>();
  const used = row?.neurons_used ?? 0;
  return {
    used,
    remaining: DAILY_NEURON_BUDGET - used,
    overLimit: used >= NEURON_OVERLIMIT_THRESHOLD,
  };
}
