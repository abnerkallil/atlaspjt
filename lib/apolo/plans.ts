// Planos de prova por instrumento (APO-11). Regra fixa e visível de
// composição — tamanho, mistura de tipo de questão/Bloom/dificuldade,
// intercalação, tempo e corte de aprovação — com um perfil padrão por área de
// conhecimento do tema (APO-02, `atlas_themes.knowledge_area`).
//
// DEC-10 ("Definir a composição das avaliações") segue como item pendente no
// kanban pessoal do Abner — nunca virou um Gate aceito em
// `docs/ATLAS_DECISIONS.md`. O plano de 'quiz' abaixo só espelha, sem mudar
// nada, o comportamento que `lib/quizzes.ts` já tem hoje (QUIZ_SIZE,
// QUESTION_SECONDS, PASSING_SCORE); os perfis por área de conhecimento e os
// planos dos instrumentos ainda sem motor próprio (atividade final,
// recuperação, proficiência — só existem como estado da FSM em
// `lib/pedagogy/states.ts`) são a primeira definição deles: um ponto de
// partida documentado, não uma decisão de produto fechada. Atividade (APO-17)
// e exame de meio de curso (APO-18) já têm motor. Ver `docs/APOLO.md`.
import { PASSING_SCORE } from './corrector.js';
import {
  QUESTION_SECONDS,
  QUIZ_SIZE,
  DIFFICULTY_LEVELS,
  type QuestionKind,
  type BloomLevel,
  type DifficultyLevel,
} from './types.js';

export const INSTRUMENTS = [
  'quiz',
  'revisao_24h',
  'revisao_7d',
  'revisao_30d',
  'corretivo',
  'atividade',
  'exame_meio',
  'atividade_final',
  'recuperacao',
  'proficiencia',
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

// Área de conhecimento do tema (APO-02): coluna de texto livre no banco, sem
// CHECK/enum. Este é o conjunto canônico documentado no comentário de
// `db/schema.ts` (6 áreas — inclui "biologicas", que o card do APO-11 não
// listava). Um tema com área fora deste conjunto, ou sem área, cai no perfil
// neutro (NEUTRAL_KIND_MIX).
export const KNOWLEDGE_AREAS = [
  'exatas',
  'humanas',
  'sociais_aplicadas',
  'juridico',
  'biologicas',
  'linguagens',
] as const;
export type KnowledgeArea = (typeof KNOWLEDGE_AREAS)[number];

export function isKnowledgeArea(value: string): value is KnowledgeArea {
  return (KNOWLEDGE_AREAS as readonly string[]).includes(value);
}

// Peso relativo entre as chaves — não precisa somar 1 (allocateCounts normaliza).
export type Mix<T extends string> = Partial<Record<T, number>>;
export type KindMix = Mix<QuestionKind>;
export type BloomMix = Mix<BloomLevel>;
export type DifficultyMix = Mix<DifficultyLevel>;

export type ExamPlan = {
  instrument: Instrument;
  version: number;
  size: number;
  kindMix: KindMix;
  bloomMix: BloomMix;
  difficultyMix: DifficultyMix;
  interleaving: boolean;
  secondsByKind: Record<QuestionKind, number | null>;
  passingScore: number;
};

const NEUTRAL_KIND_MIX: KindMix = { multipla: 1 };

// Perfil por área de conhecimento (card APO-11): só ajusta a mistura de tipo
// de questão — o plano base de cada instrumento decide tamanho, tempo e
// corte. "biologicas" não estava no card; tratada como mista com algum
// cálculo (ciência aplicada), igual sociais_aplicadas, até o Abner revisar.
const AREA_KIND_MIX: Record<KnowledgeArea, KindMix> = {
  exatas: { calculo: 0.4, lacuna_numerica: 0.2, multipla: 0.3, certo_errado: 0.1 },
  humanas: { dissertativa: 0.4, multipla: 0.5, certo_errado: 0.1 },
  sociais_aplicadas: { multipla: 0.4, dissertativa: 0.25, certo_errado: 0.2, calculo: 0.15 },
  juridico: { certo_errado: 0.5, multipla: 0.35, dissertativa: 0.15 },
  biologicas: { multipla: 0.45, dissertativa: 0.2, certo_errado: 0.2, calculo: 0.15 },
  linguagens: { multipla: 0.4, dissertativa: 0.35, certo_errado: 0.25 },
};

function quizLikePlan(instrument: Instrument): ExamPlan {
  // Quiz e corretivo reaproveitam hoje o mesmo startQuiz/selectQuestions
  // (lib/quizzes.ts) — mesmo tamanho, tempo e corte; só o `purpose` gravado
  // na tentativa muda. Revisão (24h/7d/30d) tem plano próprio, logo abaixo.
  return {
    instrument,
    version: 1,
    size: QUIZ_SIZE,
    kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {},
    difficultyMix: {},
    interleaving: false,
    secondsByKind: QUESTION_SECONDS,
    passingScore: PASSING_SCORE,
  };
}

// APO-15: tamanho confirmado pelo Abner em 2026-10-08 — revisão começa em 10
// questões (igual ao quiz) e sobe para 30 (24h, 7d) ou 60 (30d) "conforme o
// banco permitir": aqui isso é só o alvo do plano — quando o banco de um
// conteúdo tem menos que isso, o seletor (e o sorteio local, de volta em
// lib/quizzes.ts) já devolvem o que der, sem inventar questão nem travar.
// 30d intercala médias e difíceis (revisão de longo prazo cobra mais) — a
// intercalação com CONTEÚDOS VIZINHOS que o card pede fica para um card
// futuro (ver docs/APOLO.md): hoje toda seleção, aqui e em todo o resto do
// Apolo, é escopada a um único conteúdo.
const REVIEW_TARGET_SIZE: Record<'revisao_24h' | 'revisao_7d' | 'revisao_30d', number> = {
  revisao_24h: 30,
  revisao_7d: 30,
  revisao_30d: 60,
};

function reviewPlan(instrument: 'revisao_24h' | 'revisao_7d' | 'revisao_30d'): ExamPlan {
  return {
    ...quizLikePlan(instrument),
    size: REVIEW_TARGET_SIZE[instrument],
    difficultyMix: instrument === 'revisao_30d' ? { media: 0.5, dificil: 0.5 } : {},
    interleaving: instrument === 'revisao_30d',
  };
}

// APO-18: o exame de meio de curso tem tempo próprio — 90 s por questão,
// somados no tempo total, sem "sobra" passando para a questão seguinte (a
// regra de rolagem é só da atividade final, APO-19). Cálculo e lacuna
// numérica continuam sem limite, igual a todo o resto do Atlas (DEC-10).
export const EXAM_QUESTION_SECONDS = 90;
const EXAM_SECONDS_BY_KIND: Record<QuestionKind, number | null> = {
  multipla: EXAM_QUESTION_SECONDS,
  dissertativa: EXAM_QUESTION_SECONDS,
  certo_errado: EXAM_QUESTION_SECONDS,
  calculo: null,
  lacuna_numerica: null,
};

// Planos dos instrumentos. exame_meio deixou de ser rascunho no APO-18 e tem
// motor próprio (`lib/apolo/exam.ts`): 60 questões e corte de 70% (DEC-10
// confirmado pelo Abner em 2026-10-08, ver docs/APOLO.md), nota própria (o
// peso 50/50 que ele confirmou junto é entre exame_meio e atividade_final na
// nota da disciplina — fórmula do APO-19, não deste plano) e 90 s por
// questão (versão 2 do plano: a versão 1 era o rascunho com o tempo do
// quiz). atividade tem motor desde o APO-17. atividade_final, recuperação e
// proficiência seguem sem motor (só existem como estado da FSM,
// `lib/pedagogy/states.ts`) — ponto de partida razoável, não uma decisão
// fechada; cada um ganha motor e revisão própria num card futuro.
const DRAFT_PLANS: Record<
  'atividade' | 'exame_meio' | 'atividade_final' | 'recuperacao' | 'proficiencia',
  ExamPlan
> = {
  atividade: {
    instrument: 'atividade', version: 1, size: QUIZ_SIZE, kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {}, difficultyMix: {}, interleaving: false,
    secondsByKind: QUESTION_SECONDS, passingScore: PASSING_SCORE,
  },
  exame_meio: {
    instrument: 'exame_meio', version: 2, size: 60, kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {}, difficultyMix: { facil: 0.2, media: 0.5, dificil: 0.3 },
    interleaving: true, secondsByKind: EXAM_SECONDS_BY_KIND, passingScore: PASSING_SCORE,
  },
  atividade_final: {
    // Tamanho NÃO confirmado pelo DEC-10: a resposta do Abner ("final 50/50")
    // falava do peso da nota entre exame de meio e atividade final, não da
    // quantidade de questões da atividade final — só exame_meio teve
    // tamanho confirmado (60). Rascunho igual ao de antes, até revisão.
    instrument: 'atividade_final', version: 1, size: 20, kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {}, difficultyMix: { facil: 0.2, media: 0.5, dificil: 0.3 },
    interleaving: true, secondsByKind: QUESTION_SECONDS, passingScore: PASSING_SCORE,
  },
  recuperacao: {
    instrument: 'recuperacao', version: 1, size: 10, kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {}, difficultyMix: {}, interleaving: false,
    secondsByKind: QUESTION_SECONDS, passingScore: PASSING_SCORE,
  },
  proficiencia: {
    instrument: 'proficiencia', version: 1, size: 20, kindMix: NEUTRAL_KIND_MIX,
    bloomMix: {}, difficultyMix: { facil: 0.1, media: 0.4, dificil: 0.5 },
    interleaving: true, secondsByKind: QUESTION_SECONDS, passingScore: PASSING_SCORE,
  },
};

const BASE_PLANS: Record<Instrument, ExamPlan> = {
  quiz: quizLikePlan('quiz'),
  revisao_24h: reviewPlan('revisao_24h'),
  revisao_7d: reviewPlan('revisao_7d'),
  revisao_30d: reviewPlan('revisao_30d'),
  corretivo: quizLikePlan('corretivo'),
  ...DRAFT_PLANS,
};

export type PlanOverrides = Partial<
  Pick<ExamPlan, 'size' | 'kindMix' | 'bloomMix' | 'difficultyMix' | 'interleaving' | 'passingScore'>
>;

// Resolve o plano de um instrumento: parte do plano base, aplica o perfil da
// área de conhecimento do tema (só a mistura de tipo de questão) e, por
// último, qualquer override por conteúdo — essa ordem é o que "sobrescrevível
// por conteúdo" (card APO-11) significa aqui.
export function resolvePlan(
  instrument: Instrument,
  knowledgeArea?: string | null,
  overrides?: PlanOverrides,
): ExamPlan {
  const base = BASE_PLANS[instrument];
  const areaMix = knowledgeArea && isKnowledgeArea(knowledgeArea) ? AREA_KIND_MIX[knowledgeArea] : null;
  return {
    ...base,
    kindMix: overrides?.kindMix ?? areaMix ?? base.kindMix,
    bloomMix: overrides?.bloomMix ?? base.bloomMix,
    difficultyMix: overrides?.difficultyMix ?? base.difficultyMix,
    size: overrides?.size ?? base.size,
    interleaving: overrides?.interleaving ?? base.interleaving,
    passingScore: overrides?.passingScore ?? base.passingScore,
  };
}

// Converte um Mix em contagens inteiras que somam `size` (maior resto, método
// de Hamilton): determinístico, sem favorecer nenhuma chave por ordem de
// inserção além do empate de resto ser resolvido pela ordem de `keys`.
export function allocateCounts<T extends string>(
  mix: Mix<T>,
  size: number,
  keys: readonly T[],
): Record<T, number> {
  const weights = keys.map((key) => Math.max(0, mix[key] ?? 0));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
  if (total <= 0 || size <= 0) return counts;
  const raw = weights.map((w) => (w / total) * size);
  const floors = raw.map(Math.floor);
  let allocated = floors.reduce((sum, n) => sum + n, 0);
  keys.forEach((key, index) => {
    counts[key] = floors[index];
  });
  const remainders = raw
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  let cursor = 0;
  while (allocated < size && cursor < remainders.length) {
    counts[keys[remainders[cursor].index]] += 1;
    allocated += 1;
    cursor += 1;
  }
  return counts;
}

export type FallbackResult = {
  counts: Record<DifficultyLevel, number>;
  warnings: string[];
};

// Mitigação de risco do card APO-11: "o plano pode pedir questões que o banco
// não tem". Quando a contagem-alvo de uma faixa de dificuldade excede o que
// está disponível, o excedente é redistribuído para a faixa vizinha (na
// ordem fácil-média-difícil) com sobra, e o relatório ganha um aviso —
// nenhuma questão é inventada, nenhuma contagem total muda.
export function applyDifficultyFallback(
  target: Record<DifficultyLevel, number>,
  available: Partial<Record<DifficultyLevel, number>>,
): FallbackResult {
  const order = DIFFICULTY_LEVELS;
  const counts = { ...target };
  const remaining = Object.fromEntries(
    order.map((level) => [level, available[level] ?? 0]),
  ) as Record<DifficultyLevel, number>;
  const warnings: string[] = [];

  order.forEach((level, index) => {
    const want = counts[level];
    const have = remaining[level];
    if (want <= have) {
      remaining[level] = have - want;
      return;
    }
    let shortfall = want - have;
    counts[level] = have;
    remaining[level] = 0;
    const neighbors = [index - 1, index + 1].filter((i) => i >= 0 && i < order.length);
    for (const neighborIndex of neighbors) {
      if (shortfall <= 0) break;
      const neighborLevel = order[neighborIndex];
      const spare = remaining[neighborLevel];
      const moved = Math.min(spare, shortfall);
      if (moved > 0) {
        counts[neighborLevel] += moved;
        remaining[neighborLevel] -= moved;
        shortfall -= moved;
      }
    }
    if (shortfall > 0) {
      warnings.push(
        `Faixa "${level}" faltou ${shortfall} questão(ões) mesmo após redistribuir para a faixa vizinha — banco insuficiente para este plano.`,
      );
    }
  });

  return { counts, warnings };
}
