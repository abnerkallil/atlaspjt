// Registro de geradores determinísticos de molde (DEC-014 Eixo 3): cada
// `generatorKey` gravado num molde (lib/apolo/types.ts) corresponde a uma
// função pura aqui, que expande parâmetros curados + uma semente em uma
// instância concreta de questão. Nenhuma IA, nenhuma aleatoriedade não
// determinística — mesmo padrão de `seededRandom`/`selectQuestions` de
// lib/quizzes.ts. O registro nasceu no APO-01; os 5 geradores reais (um por
// categoria estrutural) entraram no APO-16, registrados abaixo no carregamento
// do módulo.
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

// APO-16: geradores reais, um por categoria estrutural (separada do tema —
// o mesmo generatorKey serve moldes de temas diferentes, só os `params`
// mudam; é o que "categoria estrutural" significa aqui). Cada gerador é
// construído para nunca produzir versão inválida, qualquer que seja a
// semente: sem laço que possa não terminar, sem divisão por zero, sem valor
// negativo onde não faz sentido — a garantia vem da aritmética do próprio
// gerador, não de sorte com os parâmetros curados.
function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffledIndices(rng: () => number, length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// Categoria estrutural "cálculo percentual": dado uma base e uma parte dela,
// pergunta o percentual. A base é sempre múltiplo de `denominatorStep`
// (curado como 100), então a parte sai de uma divisão exata — nunca precisa
// de arredondamento para bater com o percentual sorteado.
type CalculoPercentualParams = {
  subjectLabel: string;
  numeratorLabel: string;
  denominatorLabel: string;
  resultLabel: string;
  denominatorMin: number;
  denominatorMax: number;
  denominatorStep: number;
  ratioMinPct: number;
  ratioMaxPct: number;
  explanation: string;
};

function calculoPercentualGenerator(
  params: Record<string, unknown>,
  seed: string,
): GeneratedQuestion {
  const p = params as CalculoPercentualParams;
  const rng = seededRandom(seed);
  const steps = Math.floor((p.denominatorMax - p.denominatorMin) / p.denominatorStep);
  const denominador = p.denominatorMin + randInt(rng, 0, steps) * p.denominatorStep;
  const percentualCorreto = randInt(rng, p.ratioMinPct, p.ratioMaxPct);
  const numerador = (denominador * percentualCorreto) / 100;

  // Deslocamentos fixos e distintos entre si: somados ao percentual correto
  // nunca colidem uns com os outros, então bastam os 3 primeiros que
  // resultem positivos (os parâmetros curados mantêm ratioMinPct bem acima
  // do maior deslocamento, então isso nunca falta).
  const offsets = [5, 10, 15, -5, -10, -15, 20, -20, 25, -25];
  const order = shuffledIndices(rng, offsets.length);
  const distractors: number[] = [];
  for (const idx of order) {
    const candidato = percentualCorreto + offsets[idx];
    if (candidato > 0 && candidato !== percentualCorreto) distractors.push(candidato);
    if (distractors.length === 3) break;
  }

  const valores = [percentualCorreto, ...distractors];
  const ordem = shuffledIndices(rng, valores.length);
  const options = ordem.map((i) => `${valores[i]}%`);
  const correctOption = ordem.indexOf(0);

  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const prompt = `${p.subjectLabel} apurou ${p.denominatorLabel} de R$ ${fmt(denominador)} e ${p.numeratorLabel} de R$ ${fmt(numerador)}. Qual foi ${p.resultLabel}, em percentual?`;
  const explanation = `${p.explanation} (${fmt(numerador)} / ${fmt(denominador)} x 100 = ${percentualCorreto}%)`;

  return {
    kind: 'multipla',
    prompt,
    context: null,
    options,
    correctOption,
    modelAnswer: null,
    expectedValue: null,
    tolerance: null,
    explanation,
  };
}

// Categoria estrutural "equação": resolve `ax + b = c` para x inteiro. `a` é
// sempre >= 1 (nunca zero), então a equação é sempre bem-formada.
type EquacaoLinearParams = {
  contexto: string;
  aMin: number;
  aMax: number;
  xMin: number;
  xMax: number;
  bMin: number;
  bMax: number;
};

function equacaoLinearGenerator(
  params: Record<string, unknown>,
  seed: string,
): GeneratedQuestion {
  const p = params as EquacaoLinearParams;
  const rng = seededRandom(seed);
  const a = Math.max(1, randInt(rng, p.aMin, p.aMax));
  const x = randInt(rng, p.xMin, p.xMax);
  const b = randInt(rng, p.bMin, p.bMax);
  const c = a * x + b;
  const sinalB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;

  const offsets = [1, 2, 3, -1, -2, -3, 4, -4, 5, -5];
  const order = shuffledIndices(rng, offsets.length);
  const distractors: number[] = [];
  for (const idx of order) {
    distractors.push(x + offsets[idx]);
    if (distractors.length === 3) break;
  }
  const valores = [x, ...distractors];
  const ordem = shuffledIndices(rng, valores.length);
  const options = ordem.map((i) => String(valores[i]));
  const correctOption = ordem.indexOf(0);

  return {
    kind: 'multipla',
    prompt: `${p.contexto} Resolva para x: ${a}x ${sinalB} = ${c}. Qual o valor de x?`,
    context: null,
    options,
    correctOption,
    modelAnswer: null,
    expectedValue: null,
    tolerance: null,
    explanation: `${a} x ${x} ${sinalB} = ${c}, logo x = ${x}.`,
  };
}

// Categoria estrutural "lacuna numérica": aplica uma fórmula fixa e segura
// (sem eval — cada `formula` é um ramo explícito) a parâmetros sorteados, e
// pede o valor numérico. `caixa_liquido` nunca fica negativo (pagamentos são
// sempre limitados ao disponível); `depreciacao_linear` nunca divide por
// zero (vida útil mínima de 1).
type LacunaNumericaParams = {
  formula: 'caixa_liquido' | 'depreciacao_linear';
  promptTemplate: string;
  explanationTemplate: string;
  aMin: number;
  aMax: number;
  bMin: number;
  bMax: number;
  cMin: number;
  cMax: number;
  decimalPlaces: number;
  tolerance: number;
};

function lacunaNumericaGenerator(
  params: Record<string, unknown>,
  seed: string,
): GeneratedQuestion {
  const p = params as LacunaNumericaParams;
  const rng = seededRandom(seed);
  const factor = 10 ** p.decimalPlaces;
  const round = (value: number) => Math.round(value * factor) / factor;

  const a = randInt(rng, p.aMin, p.aMax);
  const b = randInt(rng, p.bMin, p.bMax);
  let c: number;
  let expectedValue: number;
  if (p.formula === 'caixa_liquido') {
    c = Math.min(randInt(rng, p.cMin, p.cMax), a + b);
    expectedValue = round(a + b - c);
  } else {
    c = 0;
    expectedValue = round(a / Math.max(1, b));
  }

  const values: Record<string, number> = { a, b, c, resultado: expectedValue };
  const fill = (template: string) =>
    template.replace(/\{(a|b|c|resultado)\}/g, (_match, key: string) => String(values[key]));

  return {
    kind: 'lacuna_numerica',
    prompt: fill(p.promptTemplate),
    context: null,
    options: null,
    correctOption: null,
    modelAnswer: null,
    expectedValue,
    tolerance: p.tolerance,
    explanation: fill(p.explanationTemplate),
  };
}

// Categoria estrutural "certo/errado sobre regra": sorteia entre a
// afirmação correta e uma variante incorreta curadas, ambas sobre a mesma
// regra — sempre uma das duas opções fixas ('Certo'/'Errado').
type CertoErradoRegraParams = {
  trueStatement: string;
  falseStatement: string;
  explanationTrue: string;
  explanationFalse: string;
};

function certoErradoRegraGenerator(
  params: Record<string, unknown>,
  seed: string,
): GeneratedQuestion {
  const p = params as CertoErradoRegraParams;
  const rng = seededRandom(seed);
  const isTrue = rng() < 0.5;
  return {
    kind: 'certo_errado',
    prompt: isTrue ? p.trueStatement : p.falseStatement,
    context: null,
    options: ['Certo', 'Errado'],
    correctOption: isTrue ? 0 : 1,
    modelAnswer: null,
    expectedValue: null,
    tolerance: null,
    explanation: isTrue ? p.explanationTrue : p.explanationFalse,
  };
}

// Categoria estrutural "interpretação de texto curado": sorteia entre
// algumas variantes de texto+pergunta já curadas (não gera texto novo —
// seria exigir "compreensão" do gerador, que não existe; o Apolo é
// determinístico, não um leitor). Sempre dissertativa, autoavaliada.
type InterpretacaoTextoParams = {
  texts: { context: string; prompt: string; modelAnswer: string; explanation: string }[];
};

function interpretacaoTextoGenerator(
  params: Record<string, unknown>,
  seed: string,
): GeneratedQuestion {
  const p = params as InterpretacaoTextoParams;
  const rng = seededRandom(seed);
  const idx = Math.min(Math.floor(rng() * p.texts.length), p.texts.length - 1);
  const pick = p.texts[idx];
  return {
    kind: 'dissertativa',
    prompt: pick.prompt,
    context: pick.context,
    options: null,
    correctOption: null,
    modelAnswer: pick.modelAnswer,
    expectedValue: null,
    tolerance: null,
    explanation: pick.explanation,
  };
}

registerGenerator('calculo_percentual', calculoPercentualGenerator);
registerGenerator('equacao_linear', equacaoLinearGenerator);
registerGenerator('lacuna_numerica_formula', lacunaNumericaGenerator);
registerGenerator('certo_errado_regra', certoErradoRegraGenerator);
registerGenerator('interpretacao_texto', interpretacaoTextoGenerator);
