// APA-15: medidor diário de neurons do Workers AI (plano Free, 10.000/dia,
// reset 00:00 UTC). Checado em todo lugar que chama IA no Apache (APA-06,
// APA-07, APA-12) antes de gastar neurons — ver docs/APACHE.md.
import type { D1Like } from '../pedagogy/transitions.js';
import { ApacheError } from './errors.js';

export const DAILY_NEURON_BUDGET = 10_000;
// Corte em 90%, sempre — sem exceção por "fizer sentido" (docs/APACHE.md).
export const NEURON_OVERLIMIT_THRESHOLD = 9_000;

// Preço do Workers AI em neurons por milhão de tokens (entrada/saída),
// verificado em developers.cloudflare.com/workers-ai/platform/pricing/ em
// 2026-10-20. Chave é o ID @cf/... completo do modelo.
export const NEURON_RATE_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': { input: 26_668, output: 204_805 },
  '@cf/google/gemma-4-26b-a4b-it': { input: 9_091, output: 27_273 },
  '@cf/qwen/qwen3-30b-a3b-fp8': { input: 4_625, output: 30_475 },
  '@cf/meta/llama-3.2-11b-vision-instruct': { input: 4_410, output: 61_493 },
};

// Tokens de fallback por geração (~3k de entrada + ~2k de saída) quando
// response.usage não vier da chamada. Com essas taxas: Llama 3.3 70B ~490,
// Gemma 4 26B ~82, Qwen3 30B ~75, Llama 3.2 11B vision ~136 neurons.
// Exportado porque APA-11 (ingest-handwriting.ts) reusa o mesmo número como
// estimativa de pior caso para checar orçamento antes de uma chamada de
// visão, na ausência de uma fórmula oficial de tokens-por-imagem.
export const FALLBACK_PROMPT_TOKENS = 3_000;
const FALLBACK_COMPLETION_TOKENS = 2_000;

// Estima neurons de uma geração: tokens × taxa do modelo. Use
// response.usage da chamada real quando disponível; sem ele, cai nos
// tokens de fallback acima.
export function estimateNeurons(
  model: string,
  usage?: { promptTokens: number; completionTokens: number },
): number {
  const rate = NEURON_RATE_PER_MILLION_TOKENS[model];
  if (!rate) throw new ApacheError(`Modelo sem taxa de neurons cadastrada: "${model}"`, 500);
  const promptTokens = usage?.promptTokens ?? FALLBACK_PROMPT_TOKENS;
  const completionTokens = usage?.completionTokens ?? FALLBACK_COMPLETION_TOKENS;
  return (promptTokens * rate.input) / 1_000_000 + (completionTokens * rate.output) / 1_000_000;
}

function utcDay(now: string): string {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) throw new ApacheError(`Data inválida: "${now}"`, 500);
  return date.toISOString().slice(0, 10);
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
      // Math.ceil, não Math.round: uso fracionário (ex. 0.3 neuron) nunca pode
      // virar 0 e passar batido pelo medidor.
      .bind(day, Math.ceil(amount), now),
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
    remaining: Math.max(0, DAILY_NEURON_BUDGET - used),
    overLimit: used >= NEURON_OVERLIMIT_THRESHOLD,
  };
}
