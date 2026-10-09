// Corretor único (APO-13, DEC-016): a correção de `lib/quizzes.ts` mudou de
// casa para cá, regra por regra, sem alterar nenhuma delas — o critério de
// aceite do card é que toda tentativa antiga, recorrigida, dê exatamente a
// mesma nota de antes. `lib/quizzes.ts` reexporta estas funções, então nenhum
// chamador precisou mudar.
import type { Answer, Question, QuestionResult } from '../quizzes.js';

// DEC-10: cálculo só vale com o raciocínio confirmado (≥3 de 5 verificações).
export const VERIFICATION_MINIMUM = 3;
// Nota mínima para aprovar o quiz do conteúdo. O DEC-10 não fixa o número; 70%
// é o valor que a tela de quiz já anunciava (UX-04).
export const PASSING_SCORE = 70;

export function gradeQuestion(
  question: Question,
  answer: Answer | undefined,
): QuestionResult {
  const base = {
    questionId: question.id,
    kind: question.kind,
    explanation: question.explanation,
    modelAnswer: question.modelAnswer,
    correctOption: question.correctOption,
    expectedValue: question.expectedValue,
  };
  if (question.kind === 'multipla' || question.kind === 'certo_errado') {
    return {
      ...base,
      correct: answer?.option === question.correctOption,
      voided: false,
    };
  }
  if (question.kind === 'dissertativa') {
    const wrote =
      typeof answer?.text === 'string' && answer.text.trim().length > 0;
    return {
      ...base,
      correct: wrote && answer?.selfAssessment === 'certa',
      voided: false,
    };
  }
  if (question.kind === 'lacuna_numerica') {
    // Lacuna numérica (APO-03): valor simples contra o gabarito, sem as
    // verificações de raciocínio do cálculo (DEC-10) — nunca anulada.
    const value =
      typeof answer?.value === 'number' && Number.isFinite(answer.value)
        ? answer.value
        : null;
    const expected = question.expectedValue ?? Number.NaN;
    const correct =
      value !== null && Math.abs(value - expected) <= (question.tolerance ?? 0);
    return { ...base, correct, voided: false };
  }
  // Cálculo: a questão só vale se o raciocínio for confirmado (≥3 de 5).
  const verification = question.verification ?? [];
  const verificationCorrect = verification.filter(
    (item, index) => answer?.verification?.[index] === item.correct,
  ).length;
  const value =
    typeof answer?.value === 'number' && Number.isFinite(answer.value)
      ? answer.value
      : null;
  const expected = question.expectedValue ?? Number.NaN;
  const correct =
    value !== null && Math.abs(value - expected) <= (question.tolerance ?? 0);
  return {
    ...base,
    correct,
    voided: verificationCorrect < VERIFICATION_MINIMUM,
    verificationCorrect,
  };
}

// Cada questão vale 100/N, sem contar as anuladas (DEC-10).
export function scoreResults(results: QuestionResult[]) {
  const counted = results.filter((item) => !item.voided);
  const correct = counted.filter((item) => item.correct).length;
  const score = counted.length
    ? Math.round((correct / counted.length) * 1000) / 10
    : 0;
  return {
    correct,
    counted: counted.length,
    score,
    passed: score >= PASSING_SCORE,
  };
}

// Boletim (APO-13, DEC-016): a visão completa e versionada de um resultado já
// calculado. Não é um novo estado gravado — o resultado da tentativa já é
// imutável desde o envio (`atlas_quiz_attempts.result_json` nunca é
// reescrito depois, DEC-04/DEC-10); isto só empacota esse resultado com a
// versão do corretor e do plano que a gerou, para auditoria e exibição.
export const APOLO_CORRECTOR_VERSION = 1;

export type BoletimReason = 'correta' | 'incorreta' | 'anulada';

export type BoletimQuestionEntry = {
  questionId: string;
  correct: boolean;
  voided: boolean;
  reason: BoletimReason;
};

// Confiabilidade do instrumento (APO-18): KR-20 com a mesma aproximação do
// APO-10 (`kr20` em lib/apolo/item-stats.ts). `basis` descreve sobre o que
// foi calculado; `administrations`, quantas aplicações entraram na conta.
export type BoletimReliability = {
  kr20: number | null;
  basis: string;
  administrations: number;
};

export type Boletim = {
  corretorVersion: number;
  planVersion: number | null;
  attemptId: string;
  issuedAt: string;
  questions: BoletimQuestionEntry[];
  correct: number;
  counted: number;
  score: number;
  passed: boolean;
  // Opcional (APO-18): só o exame de meio de curso preenche hoje; quiz e
  // atividade seguem sem o campo.
  reliability?: BoletimReliability;
};

export function buildBoletim(
  attemptId: string,
  results: QuestionResult[],
  issuedAt: string,
  planVersion: number | null = null,
  reliability?: BoletimReliability,
): Boletim {
  const { correct, counted, score, passed } = scoreResults(results);
  const questions: BoletimQuestionEntry[] = results.map((result) => ({
    questionId: result.questionId,
    correct: result.correct,
    voided: result.voided,
    reason: result.voided
      ? 'anulada'
      : result.correct
        ? 'correta'
        : 'incorreta',
  }));
  return {
    corretorVersion: APOLO_CORRECTOR_VERSION,
    planVersion,
    attemptId,
    issuedAt,
    questions,
    correct,
    counted,
    score,
    passed,
    ...(reliability ? { reliability } : {}),
  };
}
