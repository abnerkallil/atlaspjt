// Cálculo determinístico de progresso (MVP-07, DEC-02). Fórmula versionada:
// cada disciplina soma 100 pontos distribuídos pelos pesos do DEC-02, e cada
// componente diz de onde vieram os pontos (rastreável, sem IA).
//
// v1: pesos padrão fixos. O ajuste adaptativo (±10 pp, soma 100) tem os limites
// validados aqui, mas o gatilho que move os pesos aguarda decisão do Raf
// (ATLAS-RAF-GATE-20261008-001, docs/quests/ARCHITECTURE_GATE.md).
import type { ContentState } from './pedagogy/states.js';
import type { D1Like } from './pedagogy/transitions.js';
import { getRoadmap } from './roadmap-store.js';
import { failureStreak } from './recovery.js';
import { REVIEW_STAGES, localDateOf } from './reviews.js';

export const FORMULA_VERSION = 'v1';

export const COMPONENTS = ['avaliacoes', 'atividades', 'cobertura', 'revisao', 'quiz'] as const;
export type ComponentKey = (typeof COMPONENTS)[number];
export type Weights = Record<ComponentKey, number>;

// DEC-02: pesos padrão ao iniciar o curso.
export const DEFAULT_WEIGHTS: Weights = { avaliacoes: 30, atividades: 20, cobertura: 20, revisao: 15, quiz: 15 };
export const MAX_WEIGHT_SHIFT = 10;

// Conteúdos que contam na cobertura: os já concluídos, inclusive os reabertos
// por revisão. Reprovar em quiz não altera a nota (regra do Abner, 2026-10-08):
// só deixa o conteúdo urgente na agenda. Bloqueado nunca foi concluído.
export const COVERED_STATES: readonly ContentState[] = ['concluido', 'aguardando-revisao', 'revalidado', 'em-revisao-ativa'];

export const COMPONENT_LABEL: Record<ComponentKey, string> = {
  avaliacoes: 'Avaliações',
  atividades: 'Atividades',
  cobertura: 'Cobertura de conteúdo',
  revisao: 'Revisão',
  quiz: 'Quiz',
};

// DEC-02: cada peso varia no máximo ±10 pp do padrão e a soma é sempre 100.
export function validateWeights(weights: Weights): string[] {
  const problems: string[] = [];
  for (const key of COMPONENTS) {
    if (Math.abs(weights[key] - DEFAULT_WEIGHTS[key]) > MAX_WEIGHT_SHIFT) {
      problems.push(`${COMPONENT_LABEL[key]} fora de ${DEFAULT_WEIGHTS[key] - MAX_WEIGHT_SHIFT}–${DEFAULT_WEIGHTS[key] + MAX_WEIGHT_SHIFT}%.`);
    }
  }
  const total = COMPONENTS.reduce((sum, key) => sum + weights[key], 0);
  if (Math.abs(total - 100) > 1e-9) problems.push(`Os pesos somam ${total}%, não 100%.`);
  return problems;
}

export type ProgressComponent = {
  key: ComponentKey;
  label: string;
  weight: number;
  // 0 a 1; pontos = peso × proporção.
  ratio: number;
  points: number;
  // De onde vem o número (ex.: "3 de 12 conteúdos concluídos").
  detail: string;
  // false enquanto o Atlas ainda não registra esse tipo de evidência.
  available: boolean;
};

export type DisciplineProgress = {
  id: string;
  title: string;
  score: number;
  components: ProgressComponent[];
  // Desempenho recente: média das últimas tentativas (quiz, revisão, corretivo).
  proficiency: number;
  // Domínio = pontuação do DEC-02.
  mastery: number;
  // Revisões aprovadas / revisões feitas.
  retention: number;
  reviewsTaken: number;
  history: { proficiency: number[]; retention: number[] };
  // DEC-03: conteúdo bloqueado ou em revisão ativa congela a conclusão da disciplina.
  frozenBy: string[];
};

export type ProgressReport = {
  formulaVersion: string;
  weights: Weights;
  weeks: string[];
  disciplines: DisciplineProgress[];
  overall: { mastery: number; retention: number; retentionChange: number; reviewsTaken: number };
  consistency: { days: number[]; streak: number; studiedDays: number };
  atRisk: AtRiskContent[];
};

export type AtRiskContent = {
  id: string;
  title: string;
  discipline: string;
  state: ContentState;
  reason: string;
  action: string;
  // Reprovações seguidas desde a última aprovação (MVP-08).
  failures: number;
};

const FREEZING_STATES: readonly ContentState[] = ['bloqueado', 'em-revisao-ativa'];

// Conteúdos que pedem atenção, pelo estado atual (DEC-03).
const RISK: Partial<Record<ContentState, { reason: string; action: string }>> = {
  'em-revisao-ativa': { reason: 'Falhou na revisão: o conteúdo foi reaberto.', action: 'Refaça o quiz corretivo até passar (revise as notas antes, se quiser).' },
  bloqueado: { reason: 'Reprovado no quiz de conteúdo.', action: 'Refaça o quiz até passar com 70% (revise as notas antes, se quiser).' },
  'aguardando-revisao': { reason: 'A revisão espaçada venceu.', action: 'Faça o quiz de revisão em Quizzes.' },
};

// APO-17 (DEC-018): atividade reprovada pede atenção mesmo quando o state
// (DEC-03) por si só não indicaria risco — reaproveita a mesma lista de
// risco, não uma trilha paralela.
const ATIVIDADE_RISK = {
  reason: 'Atividade reprovada: refaça até passar com mais de 70%.',
  action: 'Refaça a atividade (sem limite de tentativas; a reprovação não altera a nota).',
};

// ---------------------------------------------------------------------------
// Entrada e regras puras
// ---------------------------------------------------------------------------

export type ProgressInput = {
  disciplines: { id: string; title: string; contents: { id: string; title: string; state: ContentState }[] }[];
  attempts: { contentId: string; purpose: string; score: number; passed: boolean; submittedAt: string }[];
  // Eventos de estado relevantes: quiz-aprovado, dispensa-proficiencia, revisao-aprovada.
  events: { contentId: string; event: string; occurredAt: string }[];
  sessions: { activeSeconds: number; at: string }[];
  // APO-18/19: tentativas enviadas de avaliação por disciplina
  // (`atlas_exam_attempts`): exame de meio, atividade final e recuperação
  // (as duas últimas com a nota já ajustada pela cascata, emitida pelo
  // Apolo). Opcional para quem monta a entrada à mão (testes, relatórios)
  // sem exame nenhum.
  exams?: { disciplineId: string; instrument: string; score: number; passed: boolean; submittedAt: string }[];
};

// APO-19: nota da atividade final que vale para a disciplina — a maior entre
// a atividade final e a recuperação, as duas já ajustadas pela cascata do
// exame de meio (notas emitidas pelo Apolo, DEC-016; aqui só se escolhe a
// maior, como a melhor nota de quiz). Empate fica com a atividade final.
export function effectiveFinalActivity(
  exams: { instrument: string; score: number }[],
): { score: number; source: 'atividade_final' | 'recuperacao' } | null {
  let best: { score: number; source: 'atividade_final' | 'recuperacao' } | null = null;
  for (const source of ['atividade_final', 'recuperacao'] as const) {
    for (const item of exams.filter((exam) => exam.instrument === source)) {
      if (!best || item.score > best.score) best = { score: item.score, source };
    }
  }
  return best;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const percent = (value: number) => Math.round(value * 100);
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const WEEK_COUNT = 8;
const DAY_MS = 86_400_000;

// Etapas de revisão vencidas e aprovadas de um conteúdo até `now`.
export function reviewTally(events: ProgressInput['events'], now: string) {
  const anchor = events
    .filter((item) => item.event === 'quiz-aprovado' || item.event === 'dispensa-proficiencia')
    .map((item) => item.occurredAt)
    .sort()
    .at(-1);
  if (!anchor) return { due: 0, passed: 0 };
  const due = REVIEW_STAGES.filter((stage) => Date.parse(anchor) + stage.days * DAY_MS <= Date.parse(now)).length;
  const passed = events.filter((item) => item.event === 'revisao-aprovada' && item.occurredAt >= anchor).length;
  return { due, passed: Math.min(passed, due) };
}

function retentionOf(attempts: ProgressInput['attempts']) {
  const reviews = attempts.filter((item) => item.purpose === 'revisao');
  return { taken: reviews.length, rate: reviews.length ? reviews.filter((item) => item.passed).length / reviews.length : 0 };
}

export function computeProgress(
  input: ProgressInput,
  options: { now: string; today: string; tzOffsetMinutes: number; weights?: Weights },
): ProgressReport {
  const weights = options.weights ?? DEFAULT_WEIGHTS;
  const nowMs = Date.parse(options.now);
  // Semanas de 7 dias terminando agora: S1 (mais antiga) … S8 (atual).
  const weekEnd = (index: number) => new Date(nowMs - (WEEK_COUNT - 1 - index) * 7 * DAY_MS).toISOString();
  const weeks = Array.from({ length: WEEK_COUNT }, (_, index) => `S${index + 1}`);

  // APO-17 (DEC-018): conteúdos com atividade reprovada e nenhuma aprovada
  // depois (ordem cronológica) — calculado uma vez, global (contentId é
  // único entre disciplinas), reaproveitado no congelamento e no risco
  // abaixo, sem duplicar a regra.
  const atividadeReprovadaGlobal = new Set<string>();
  for (const item of [...input.attempts].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) {
    if (item.purpose !== 'atividade') continue;
    if (item.passed) atividadeReprovadaGlobal.delete(item.contentId);
    else if (!atividadeReprovadaGlobal.has(item.contentId)) atividadeReprovadaGlobal.add(item.contentId);
  }

  const disciplines = input.disciplines.map((discipline): DisciplineProgress => {
    const ids = new Set(discipline.contents.map((content) => content.id));
    const attempts = input.attempts.filter((item) => ids.has(item.contentId)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const total = discipline.contents.length;
    const covered = discipline.contents.filter((content) => COVERED_STATES.includes(content.state)).length;

    // Só quizzes aprovados entram na nota; reprovação não soma nem desconta.
    const bestQuiz = new Map<string, number>();
    for (const item of attempts.filter((attempt) => attempt.purpose === 'quiz' && attempt.passed)) {
      bestQuiz.set(item.contentId, Math.max(bestQuiz.get(item.contentId) ?? 0, item.score));
    }
    const quizAverage = average([...bestQuiz.values()]);

    // APO-17 (DEC-018): Atividade segue a mesma regra do quiz — só a melhor
    // tentativa aprovada (>70%) entra na nota; reprovação não desconta, só
    // pode ser refeita direto.
    const bestAtividade = new Map<string, number>();
    for (const item of attempts.filter((attempt) => attempt.purpose === 'atividade' && attempt.passed)) {
      bestAtividade.set(item.contentId, Math.max(bestAtividade.get(item.contentId) ?? 0, item.score));
    }
    const atividadeAverage = average([...bestAtividade.values()]);

    let due = 0;
    let passed = 0;
    for (const id of ids) {
      const tally = reviewTally(
        input.events.filter((item) => item.contentId === id),
        options.now,
      );
      due += tally.due;
      passed += tally.passed;
    }

    // APO-18/19: Avaliações = nota do exame de meio de curso (tentativa
    // única, nota própria, aprovado ou não — é a nota emitida no boletim);
    // com a atividade final entregue, média 50/50 entre o exame de meio e a
    // nota da atividade final que vale (a maior entre atividade final e
    // recuperação, as duas já ajustadas pela cascata — DEC-10).
    const disciplineExams = (input.exams ?? [])
      .filter((item) => item.disciplineId === discipline.id)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const exam = disciplineExams.filter((item) => item.instrument === 'exame_meio').at(-1);
    const finalActivity = effectiveFinalActivity(disciplineExams);
    const examDetail = exam ? `Exame de meio de curso: ${round1(exam.score)}% (${exam.passed ? 'aprovado' : 'reprovado'})` : '';

    const ratios: Record<ComponentKey, { ratio: number; detail: string; available: boolean }> = {
      avaliacoes: exam
        ? finalActivity
          ? {
              ratio: (exam.score + finalActivity.score) / 200,
              detail: `${examDetail}; atividade final: ${round1(finalActivity.score)}% (${finalActivity.source === 'recuperacao' ? 'nota da recuperação, maior que a da atividade final, ' : ''}já com o ajuste pelo exame de meio). Média 50/50: ${round1((exam.score + finalActivity.score) / 2)}%.`,
              available: true,
            }
          : {
              ratio: exam.score / 100,
              detail: `${examDetail}. Atividade final ainda não entregue.`,
              available: true,
            }
        : { ratio: 0, detail: 'Exame de meio de curso ainda não entregue.', available: false },
      atividades: {
        ratio: atividadeAverage / 100,
        detail: bestAtividade.size
          ? `Média ${round1(atividadeAverage)}% da melhor nota aprovada ${bestAtividade.size === 1 ? 'na atividade de 1 conteúdo' : `nas atividades de ${bestAtividade.size} conteúdos`}. Reprovações não entram na nota.`
          : 'Nenhuma atividade aprovada ainda. Reprovações não entram na nota (nota mínima: mais de 70%).',
        available: true,
      },
      cobertura: { ratio: total ? covered / total : 0, detail: `${covered} de ${total} conteúdos concluídos.`, available: true },
      revisao: {
        ratio: due ? passed / due : 0,
        detail: due ? `${passed} de ${due} ${due === 1 ? 'revisão vencida aprovada' : 'revisões vencidas aprovadas'}.` : 'Nenhuma revisão vencida ainda.',
        available: true,
      },
      quiz: {
        ratio: quizAverage / 100,
        detail: bestQuiz.size
          ? `Média ${round1(quizAverage)}% da melhor nota aprovada ${bestQuiz.size === 1 ? 'no quiz de 1 conteúdo' : `nos quizzes de ${bestQuiz.size} conteúdos`}. Reprovações não entram na nota.`
          : 'Nenhum quiz de conteúdo aprovado ainda. Reprovações não entram na nota.',
        available: true,
      },
    };
    const components = COMPONENTS.map((key) => ({
      key,
      label: COMPONENT_LABEL[key],
      weight: weights[key],
      ratio: ratios[key].ratio,
      points: round1(weights[key] * ratios[key].ratio),
      detail: ratios[key].detail,
      available: ratios[key].available,
    }));
    const score = round1(components.reduce((sum, item) => sum + item.points, 0));
    const recent = attempts.slice(-5);
    const retention = retentionOf(attempts);

    // Histórico: proficiência média da semana (repete a anterior se não houve
    // tentativa) e retenção acumulada até o fim de cada semana.
    const proficiencyHistory: number[] = [];
    const retentionHistory: number[] = [];
    for (let index = 0; index < WEEK_COUNT; index += 1) {
      const end = weekEnd(index);
      const start = new Date(Date.parse(end) - 7 * DAY_MS).toISOString();
      const inWeek = attempts.filter((item) => item.submittedAt > start && item.submittedAt <= end);
      proficiencyHistory.push(inWeek.length ? Math.round(average(inWeek.map((item) => item.score))) : (proficiencyHistory.at(-1) ?? 0));
      retentionHistory.push(percent(retentionOf(attempts.filter((item) => item.submittedAt <= end)).rate));
    }

    return {
      id: discipline.id,
      title: discipline.title,
      score,
      components,
      proficiency: Math.round(average(recent.map((item) => item.score))),
      mastery: score,
      retention: percent(retention.rate),
      reviewsTaken: retention.taken,
      history: { proficiency: proficiencyHistory, retention: retentionHistory },
      // APO-17 (DEC-018): atividade reprovada (e nunca aprovada depois)
      // congela o mesmo jeito que bloqueado/em-revisao-ativa — mesma lista,
      // sem duplicar conteúdo já congelado pelo state.
      frozenBy: discipline.contents
        .filter((content) => FREEZING_STATES.includes(content.state) || atividadeReprovadaGlobal.has(content.id))
        .map((content) => content.title),
    };
  });

  const overallRetention = retentionOf(input.attempts);
  const firstWeekStart = new Date(Date.parse(weekEnd(0)) - 7 * DAY_MS).toISOString();
  const retentionBefore = percent(retentionOf(input.attempts.filter((item) => item.submittedAt <= firstWeekStart)).rate);

  // Consistência: minutos de sessão por dia local, últimos 28 dias.
  const days = Array.from({ length: 28 }, () => 0);
  const dayIndex = new Map(
    Array.from({ length: 28 }, (_, index) => {
      const date = new Date(Date.parse(`${options.today}T00:00:00Z`) - (27 - index) * DAY_MS).toISOString().slice(0, 10);
      return [date, index] as const;
    }),
  );
  const seconds = Array.from({ length: 28 }, () => 0);
  for (const session of input.sessions) {
    const index = dayIndex.get(localDateOf(session.at, options.tzOffsetMinutes));
    if (index !== undefined) seconds[index] += session.activeSeconds;
  }
  // Minuto começado conta: um dia com estudo nunca aparece como "sem estudo".
  seconds.forEach((value, index) => {
    days[index] = Math.ceil(value / 60);
  });
  // Sequência de dias seguidos com estudo; hoje ainda sem estudo não quebra a de ontem.
  let streak = 0;
  for (let index = days.at(-1) ? days.length - 1 : days.length - 2; index >= 0 && days[index] > 0; index -= 1) streak += 1;

  return {
    formulaVersion: FORMULA_VERSION,
    weights,
    weeks,
    disciplines,
    overall: {
      mastery: round1(average(disciplines.map((item) => item.score))),
      retention: percent(overallRetention.rate),
      retentionChange: percent(overallRetention.rate) - retentionBefore,
      reviewsTaken: overallRetention.taken,
    },
    consistency: { days, streak, studiedDays: days.filter((minutes) => minutes > 0).length },
    atRisk: input.disciplines.flatMap((discipline) =>
      discipline.contents.flatMap((content) => {
        const stateRisk = RISK[content.state];
        const atividadeFlag = atividadeReprovadaGlobal.has(content.id);
        if (!stateRisk && !atividadeFlag) return [];
        const risk = stateRisk ?? ATIVIDADE_RISK;
        const failures = failureStreak(
          input.attempts
            .filter((item) => item.contentId === content.id && (stateRisk ? true : item.purpose === 'atividade'))
            .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
        );
        const reason = failures >= 2 ? `${risk.reason} Reincidência: ${failures} reprovações seguidas.` : risk.reason;
        return [{ id: content.id, title: content.title, discipline: discipline.title, state: content.state, ...risk, reason, failures }];
      }),
    ),
  };
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

export async function loadProgressInput(db: D1Like): Promise<ProgressInput> {
  const roadmap = await getRoadmap(db);
  const disciplines = (roadmap?.phases ?? []).flatMap((phase) =>
    phase.disciplines.map((discipline) => ({
      id: discipline.id,
      title: discipline.title,
      contents: discipline.contents.map((content) => ({ id: content.id, title: content.title, state: content.state })),
    })),
  );
  const [{ results: attempts }, { results: events }, { results: sessions }, { results: exams }] = await Promise.all([
    db
      .prepare(
        `SELECT content_id, purpose, score, passed, submitted_at FROM atlas_quiz_attempts
         WHERE status = 'enviado' AND score IS NOT NULL ORDER BY submitted_at`,
      )
      .all<{ content_id: string; purpose: string; score: number; passed: number; submitted_at: string }>(),
    db
      .prepare(
        `SELECT entity_id, event, occurred_at FROM atlas_state_audit
         WHERE entity_type = 'conteudo' AND event IN ('quiz-aprovado', 'dispensa-proficiencia', 'revisao-aprovada')`,
      )
      .all<{ entity_id: string; event: string; occurred_at: string }>(),
    db
      .prepare(
        `SELECT active_seconds, COALESCE(finished_at, updated_at) AS at FROM atlas_study_sessions WHERE active_seconds > 0`,
      )
      .all<{ active_seconds: number; at: string }>(),
    db
      .prepare(
        `SELECT discipline_id, instrument, score, passed, submitted_at FROM atlas_exam_attempts
         WHERE status = 'enviado' AND score IS NOT NULL ORDER BY submitted_at`,
      )
      .all<{ discipline_id: string; instrument: string; score: number; passed: number; submitted_at: string }>(),
  ]);
  return {
    disciplines,
    attempts: attempts.map((row) => ({
      contentId: row.content_id,
      purpose: row.purpose,
      score: Number(row.score),
      passed: Number(row.passed) === 1,
      submittedAt: row.submitted_at,
    })),
    events: events.map((row) => ({ contentId: row.entity_id, event: row.event, occurredAt: row.occurred_at })),
    sessions: sessions.map((row) => ({ activeSeconds: Number(row.active_seconds), at: row.at })),
    exams: exams.map((row) => ({
      disciplineId: row.discipline_id,
      instrument: row.instrument,
      score: Number(row.score),
      passed: Number(row.passed) === 1,
      submittedAt: row.submitted_at,
    })),
  };
}
