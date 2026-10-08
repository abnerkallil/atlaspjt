// Registro de geradores determinísticos de molde (DEC-014 Eixo 3): cada
// `generatorKey` gravado num molde (lib/apolo/types.ts) corresponde a uma
// função pura aqui, que expande parâmetros curados + uma semente em uma
// instância concreta de questão. Nenhuma IA, nenhuma aleatoriedade não
// determinística — mesmo padrão de `seededRandom`/`selectQuestions` de
// lib/quizzes.ts. Este card (APO-01) só define o registro; os geradores de
// cada tema entram em cards futuros (ex.: APO-16).
import type { QuestionKind } from '../quizzes.js';
import type { ItemModel } from './types.js';

// Mulberry32 a partir de uma semente em texto — mesma função de
// lib/quizzes.ts, duplicada aqui para manter lib/apolo/ independente (DEC-014
// Eixo 1: o Apolo é seu próprio módulo, não uma extensão de lib/quizzes.ts).
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// O que todo gerador produz: o suficiente para virar uma linha de
// `atlas_questions` (os campos que lib/quizzes.ts já conhece), mais o molde de
// origem. A gravação em `atlas_questions` (ou a regeneração sob demanda) é
// decisão de um card futuro (DEC-014 não resolve isso aqui).
export type GeneratedQuestion = {
  kind: QuestionKind;
  prompt: string;
  context: string | null;
  options: string[] | null;
  correctOption: number | null;
  modelAnswer: string | null;
  expectedValue: number | null;
  tolerance: number | null;
  explanation: string;
};

export type ItemGenerator = (params: Record<string, unknown>, seed: string) => GeneratedQuestion;

const registry = new Map<string, ItemGenerator>();

export function registerGenerator(key: string, generator: ItemGenerator): void {
  if (registry.has(key)) {
    throw new Error(`Gerador já registrado para a chave "${key}"`);
  }
  registry.set(key, generator);
}

export class UnknownGeneratorError extends Error {
  constructor(readonly generatorKey: string) {
    super(`Nenhum gerador registrado para "${generatorKey}"`);
    this.name = 'UnknownGeneratorError';
  }
}

// Expande um molde numa instância concreta de questão, de forma determinística:
// a mesma semente produz sempre a mesma questão (reconstituível sem IA e sem
// ambiguidade, DEC-014).
export function expandItemModel(model: ItemModel, seed: string): GeneratedQuestion {
  const generator = registry.get(model.generatorKey);
  if (!generator) throw new UnknownGeneratorError(model.generatorKey);
  return generator(model.params, seed);
}
