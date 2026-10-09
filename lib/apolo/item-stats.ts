// Estatística de itens (APO-10, DEC-017): mede cada questão para tirar as
// ruins das provas — taxa de acerto, dificuldade Elo (mesmo sistema do
// modelo do aluno, lib/apolo/skill.ts, mas por questão em vez de por
// tema/conteúdo/subtópico), correlação item-total, taxa de escolha de cada
// distrator, e KR-20 por conteúdo ("instrumento aplicado"). Tudo recalculado
// do histórico de tentativas a cada chamada, igual à APO-09.
//
// Simplificação assumida (disclosed, ver docs/APOLO.md): KR-20 de livro-texto
// pressupõe várias pessoas respondendo a mesma aplicação ao mesmo tempo; aqui
// há só o Abner, então a variância da nota usada é a variância entre as
// tentativas já enviadas do MESMO conteúdo (o quiz é reaplicado a cada
// reprovação/retomada) — uma adaptação razoável, não o KR-20 de livro-texto.
import type { DifficultyLevel } from './types.js';
import type { QuestionKind } from '../quizzes.js';
import { DEFAULT_DIFFICULTY_ELO, DIFFICULTY_ELO, INITIAL_ELO, kFactor } from './skill.js';

export type ItemAnswerEvent = {
  questionId: string;
  contentId: string;
  kind: QuestionKind;
  difficulty: DifficultyLevel | null;
  correct: boolean;
  // Índice da alternativa escolhida, já desembaralhado (índice original no
  // banco); só para "multipla". Nulo para os demais tipos ou se não respondida.
  chosenOption: number | null;
  correctOption: number | null;
  optionsCount: number | null;
  at: string;
  attemptId: string;
  // Nota (0-100) da tentativa inteira a que esta resposta pertence.
  attemptScore: number;
};

export type DistractorStat = { option: number; count: number; rate: number; correct: boolean };

export type ItemStat = {
  questionId: string;
  contentId: string;
  answers: number;
  correct: number;
  accuracy: number;
  elo: number;
  // Point-biserial entre acertar o item e a nota da tentativa; null sem
  // variância suficiente (poucas tentativas, ou sempre certo/sempre errado).
  itemTotalCorrelation: number | null;
  distractors: DistractorStat[] | null;
};

export type InstrumentStat = {
  contentId: string;
  items: number;
  administrations: number;
  kr20: number | null;
};

export type ItemAlertReason = 'correlacao-baixa' | 'acerto-muito-alto' | 'distrator-fraco';
export type ItemAlert = { questionId: string; reasons: ItemAlertReason[] };

export type AlertThresholds = {
  minSample: number;
  correlationFloor: number;
  accuracyCeiling: number;
  distractorFloor: number;
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  minSample: 30,
  correlationFloor: 0.1,
  accuracyCeiling: 0.95,
  distractorFloor: 0.05,
};

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - m) ** 2)));
}

function populationVariance(values: number[]): number {
  const sd = populationStdDev(values);
  return sd * sd;
}

// Point-biserial: (M1 - M0) / S · sqrt(p·q).
function pointBiserial(correctFlags: boolean[], scores: number[]): number | null {
  const withCorrect = scores.filter((_, index) => correctFlags[index]);
  const withWrong = scores.filter((_, index) => !correctFlags[index]);
  if (withCorrect.length === 0 || withWrong.length === 0) return null;
  const s = populationStdDev(scores);
  if (s === 0) return null;
  const p = withCorrect.length / scores.length;
  const q = 1 - p;
  return ((mean(withCorrect) - mean(withWrong)) / s) * Math.sqrt(p * q);
}

export function computeItemStats(events: ItemAnswerEvent[]): ItemStat[] {
  type Acc = {
    contentId: string;
    kind: QuestionKind;
    elo: number;
    answers: number;
    correct: number;
    correctFlags: boolean[];
    scores: number[];
    correctOption: number | null;
    distractors: Map<number, number>;
  };
  const byItem = new Map<string, Acc>();
  for (const event of events) {
    const acc = byItem.get(event.questionId) ?? {
      contentId: event.contentId,
      kind: event.kind,
      elo: INITIAL_ELO,
      answers: 0,
      correct: 0,
      correctFlags: [],
      scores: [],
      correctOption: event.correctOption,
      distractors: new Map<number, number>(),
    };
    const opponent = event.difficulty ? DIFFICULTY_ELO[event.difficulty] : DEFAULT_DIFFICULTY_ELO;
    const expected = 1 / (1 + 10 ** ((opponent - acc.elo) / 400));
    const actual = event.correct ? 1 : 0;
    const k = kFactor(acc.answers);
    acc.elo += k * (actual - expected);
    acc.answers += 1;
    acc.correct += event.correct ? 1 : 0;
    acc.correctFlags.push(event.correct);
    acc.scores.push(event.attemptScore);
    if (event.kind === 'multipla' && event.chosenOption !== null) {
      acc.distractors.set(event.chosenOption, (acc.distractors.get(event.chosenOption) ?? 0) + 1);
    }
    byItem.set(event.questionId, acc);
  }
  return [...byItem.entries()]
    .map(([questionId, acc]) => {
      const distractorTotal = [...acc.distractors.values()].reduce((sum, count) => sum + count, 0);
      return {
        questionId,
        contentId: acc.contentId,
        answers: acc.answers,
        correct: acc.correct,
        accuracy: acc.correct / acc.answers,
        elo: acc.elo,
        itemTotalCorrelation: pointBiserial(acc.correctFlags, acc.scores),
        distractors:
          distractorTotal > 0
            ? [...acc.distractors.entries()]
                .map(([option, count]) => ({ option, count, rate: count / distractorTotal, correct: option === acc.correctOption }))
                .sort((a, b) => a.option - b.option)
            : null,
      };
    })
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}

export function computeInstrumentStats(events: ItemAnswerEvent[]): InstrumentStat[] {
  const byContent = new Map<string, { items: Map<string, { correct: number; answers: number }>; attempts: Map<string, number> }>();
  for (const event of events) {
    const content = byContent.get(event.contentId) ?? { items: new Map(), attempts: new Map() };
    const item = content.items.get(event.questionId) ?? { correct: 0, answers: 0 };
    item.answers += 1;
    item.correct += event.correct ? 1 : 0;
    content.items.set(event.questionId, item);
    content.attempts.set(event.attemptId, event.attemptScore);
    byContent.set(event.contentId, content);
  }
  return [...byContent.entries()]
    .map(([contentId, content]) => {
      const scores = [...content.attempts.values()];
      return {
        contentId,
        items: content.items.size,
        administrations: scores.length,
        kr20: kr20([...content.items.values()], scores),
      };
    })
    .sort((a, b) => a.contentId.localeCompare(b.contentId));
}

// KR-20 (Kuder-Richardson 20), conta pura extraída de computeInstrumentStats
// no APO-18 para ser reaproveitada pelo boletim do exame de meio de curso —
// mesma matemática de antes, linha por linha. `items`: acertos/respostas de
// cada item do instrumento; `scores`: a nota de cada aplicação (tentativa).
// Mesma aproximação do APO-10 (aplicações repetidas no tempo fazem o papel
// de "várias pessoas"); nulo com menos de 2 itens, menos de 2 aplicações ou
// variância zero.
export function kr20(items: { correct: number; answers: number }[], scores: number[]): number | null {
  const k = items.length;
  const variance = populationVariance(scores);
  if (k < 2 || scores.length < 2 || variance <= 0) return null;
  const sumPQ = items.reduce((sum, item) => {
    const p = item.correct / item.answers;
    return sum + p * (1 - p);
  }, 0);
  return (k / (k - 1)) * (1 - sumPQ / variance);
}

export function detectAlerts(stats: ItemStat[], thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS): ItemAlert[] {
  const alerts: ItemAlert[] = [];
  for (const stat of stats) {
    const reasons: ItemAlertReason[] = [];
    if (stat.answers >= thresholds.minSample) {
      if (stat.itemTotalCorrelation !== null && stat.itemTotalCorrelation < thresholds.correlationFloor) {
        reasons.push('correlacao-baixa');
      }
      if (stat.accuracy > thresholds.accuracyCeiling) {
        reasons.push('acerto-muito-alto');
      }
      if (stat.distractors?.some((d) => !d.correct && d.rate < thresholds.distractorFloor)) {
        reasons.push('distrator-fraco');
      }
    }
    if (reasons.length > 0) alerts.push({ questionId: stat.questionId, reasons });
  }
  return alerts.sort((a, b) => a.questionId.localeCompare(b.questionId));
}
