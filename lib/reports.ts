// Relatórios explicáveis (MVP-09): para cada conteúdo, de onde vem a nota, como
// o estado mudou, o risco, a próxima ação e o histórico. Tudo derivado do D1 por
// regras fixas (sem IA): estados (DEC-03), fórmula do MVP-07, revisões (MVP-06)
// e recuperação (MVP-08).
import { CONTENT_STATE_META } from './pedagogy/state-labels.js';
import type { ContentState } from './pedagogy/states.js';
import { listAudit, type AuditEntry, type D1Like } from './pedagogy/transitions.js';
import { COVERED_STATES, computeProgress, loadProgressInput, reviewTally, type ProgressComponent } from './progress.js';
import { listAttempts, type QuestionResult, type QuizAttempt } from './quizzes.js';
import { failureStreak, recoveryStatus, type RecoveryStatus } from './recovery.js';
import { nextReview, reviewCycle, localDateOf, type NextReview } from './reviews.js';
import { getRoadmap } from './roadmap-store.js';
import { listSessions, type StudySession } from './study-sessions.js';

export type RiskLevel = 'alto' | 'atencao' | 'em-dia' | 'sem-dados';

export const RISK_LABEL: Record<RiskLevel, string> = {
  alto: 'Risco alto',
  atencao: 'Pede atenção',
  'em-dia': 'Em dia',
  'sem-dados': 'Sem dados ainda',
};

export type NextAction = { label: string; detail: string; href: string };

export type HistoryEntry = { at: string; kind: 'sessao' | 'quiz' | 'revisao' | 'corretivo' | 'atividade'; title: string; detail: string };

// APO-21: o caminho até as questões — a tentativa (boletim, DEC-016) que vale
// a nota de quiz/atividade deste conteúdo, questão a questão. Só a melhor
// tentativa aprovada entra (mesma regra de `lib/progress.ts`); nenhuma
// tentativa aprovada ainda para o instrumento e a entrada não aparece.
export type QuestionTrailEntry = {
  attemptId: string;
  purpose: 'quiz' | 'atividade';
  score: number;
  questions: { questionId: string; correct: boolean; voided: boolean }[];
};

// Pura: para cada instrumento do conteúdo (quiz, atividade), a tentativa
// aprovada de maior nota — mesma seleção de `lib/progress.ts` — com a
// correção questão a questão já guardada no boletim da tentativa.
export function questionTrailOf(
  attempts: { id: string; purpose: string; passed: boolean | null; score: number | null; results: QuestionResult[] | null }[],
): QuestionTrailEntry[] {
  const entries: QuestionTrailEntry[] = [];
  for (const purpose of ['quiz', 'atividade'] as const) {
    const candidates = attempts.filter((item) => item.purpose === purpose && item.passed && item.results && item.score !== null);
    if (!candidates.length) continue;
    const best = candidates.reduce((top, item) => (item.score! > top.score! ? item : top));
    entries.push({
      attemptId: best.id,
      purpose,
      score: best.score!,
      questions: best.results!.map((result) => ({ questionId: result.questionId, correct: result.correct, voided: result.voided })),
    });
  }
  return entries;
}

export type ContentReport = {
  content: {
    id: string;
    title: string;
    unit: string | null;
    disciplineTitle: string;
    state: ContentState;
    stateLabel: string;
    locked: boolean;
    pendingPrerequisites: { id: string; title: string }[];
  };
  origin: {
    formulaVersion: string;
    disciplineScore: number;
    components: ProgressComponent[];
    // O que este conteúdo soma em cada componente da disciplina.
    contribution: string[];
    // APO-21: o caminho até as questões (quiz/atividade deste conteúdo).
    questionTrail: QuestionTrailEntry[];
  };
  risk: { level: RiskLevel; label: string; reasons: string[] };
  nextAction: NextAction;
  stateChanges: AuditEntry[];
  history: HistoryEntry[];
};

const dayMonth = (iso: string, tz: number) => {
  const date = localDateOf(iso, tz);
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
};
const percent = (value: number) => `${String(value).replace('.', ',')}%`;
const PURPOSE_TITLE: Record<string, string> = { quiz: 'Quiz do conteúdo', revisao: 'Revisão', corretivo: 'Quiz corretivo', atividade: 'Atividade' };

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

// APO-17 (DEC-018): status da Atividade, independente do state do conteúdo
// (nunca reabre nem trava o DEC-03) — null quando nunca foi feita.
export type AtividadeStatus = { status: 'aprovada' | 'reprovada' | null; failures: number };

export type ReportFacts = {
  state: ContentState;
  locked: boolean;
  pendingTitles: string[];
  recovery: RecoveryStatus | null;
  next: NextReview;
  hasOpenSession: boolean;
  now: string;
  tzOffsetMinutes: number;
  atividade: AtividadeStatus;
};

// Pura: aprovada se alguma tentativa já passou (>70%, DEC-018); reprovada se
// só tem tentativas reprovadas; null se nunca foi feita.
export function atividadeStatusOf(attempts: { purpose: string; passed: boolean | null; submittedAt: string | null }[]): AtividadeStatus {
  const relevant = attempts
    .filter((item) => item.purpose === 'atividade' && item.submittedAt)
    .map((item) => ({ passed: item.passed === true, submittedAt: item.submittedAt }))
    .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  if (relevant.length === 0) return { status: null, failures: 0 };
  if (relevant.some((item) => item.passed)) return { status: 'aprovada', failures: 0 };
  return { status: 'reprovada', failures: failureStreak(relevant) };
}

const RISK_RANK: Record<RiskLevel, number> = { 'sem-dados': 0, 'em-dia': 1, atencao: 2, alto: 3 };

export function assessRisk(facts: ReportFacts): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  const failures = facts.recovery?.failures ?? 0;
  if (failures >= 2) reasons.push(`${failures} reprovações seguidas (reincidência).`);
  const base: { level: RiskLevel; reasons: string[] } = (() => {
    switch (facts.state) {
      case 'bloqueado':
        return { level: 'alto', reasons: ['Reprovado no quiz: a conclusão da disciplina está congelada.', ...reasons] };
      case 'em-revisao-ativa':
        return { level: 'alto', reasons: ['Falhou na revisão: o conteúdo foi reaberto e quem depende dele volta a esperar.', ...reasons] };
      case 'aguardando-revisao':
        return { level: 'atencao', reasons: ['A revisão espaçada venceu e ainda não foi feita.', ...reasons] };
      case 'aguardando-quiz':
        return { level: 'atencao', reasons: ['A sessão terminou; falta o quiz para confirmar o conteúdo.', ...reasons] };
      case 'concluido':
      case 'revalidado':
        return {
          level: 'em-dia',
          reasons: [
            facts.next
              ? `Próxima revisão (${facts.next.stage}) em ${dayMonth(facts.next.dueAt, facts.tzOffsetMinutes)}.`
              : 'Ciclo de revisões 24h/7d/30d concluído.',
          ],
        };
      case 'em-estudo':
        return { level: 'em-dia', reasons: ['Estudo em andamento.'] };
      default:
        return { level: 'sem-dados', reasons: [facts.locked ? 'Aguardando pré-requisitos.' : 'Ainda não estudado.'] };
    }
  })();
  // APO-17 (DEC-018): Atividade reprovada pede atenção mesmo quando o
  // state do conteúdo (DEC-03) por si só não indicaria risco — reaproveita
  // esta mesma seção (nível + motivos), não uma trilha de risco paralela.
  if (facts.atividade.status === 'reprovada') {
    const reincidencia = facts.atividade.failures >= 2 ? ` (${facts.atividade.failures} seguidas)` : '';
    const atividadeReason = `Atividade reprovada${reincidencia}: refaça até passar com mais de 70%.`;
    if (RISK_RANK[base.level] < RISK_RANK.atencao) {
      return { level: 'atencao', reasons: [atividadeReason, ...base.reasons] };
    }
    return { level: base.level, reasons: [atividadeReason, ...base.reasons] };
  }
  return base;
}

export function nextAction(facts: ReportFacts, contentId: string): NextAction {
  const quiz = `/quizzes?conteudo=${encodeURIComponent(contentId)}`;
  // Sessão aberta continua em Estudar; sem ela, começa pelo Roadmap.
  const study = facts.hasOpenSession ? '/estudar' : '/roadmap';
  if (facts.locked && facts.state === 'nao-iniciado') {
    return { label: 'Concluir os pré-requisitos', detail: `Antes deste conteúdo: ${facts.pendingTitles.join(', ')}.`, href: '/roadmap' };
  }
  switch (facts.state) {
    case 'nao-iniciado':
      return { label: 'Começar a estudar', detail: 'Abra uma sessão de estudo pelo Roadmap ou por Hoje.', href: '/roadmap' };
    case 'em-estudo':
      return {
        label: facts.hasOpenSession ? 'Continuar a sessão de estudo' : 'Estudar',
        detail: 'Ao concluir a sessão, o quiz do conteúdo é liberado.',
        href: study,
      };
    case 'aguardando-quiz':
      return {
        label: facts.recovery ? 'Fazer o quiz dirigido' : 'Fazer o quiz',
        detail: facts.recovery ? 'As questões que você errou voltam; passe com 70% para desbloquear.' : 'Passe com 70% para concluir o conteúdo.',
        href: quiz,
      };
    case 'bloqueado':
      return {
        label: 'Refazer o quiz',
        detail: 'As questões que você errou voltam; passe com 70% para concluir e liberar o próximo conteúdo. Se quiser, revise as notas antes.',
        href: quiz,
      };
    case 'aguardando-revisao':
      return { label: `Fazer a revisão${facts.next ? ` de ${facts.next.stage}` : ''}`, detail: 'Aprovada, o conteúdo fica revalidado.', href: quiz };
    case 'em-revisao-ativa':
      return { label: 'Fazer o quiz corretivo', detail: 'Aprovado, o conteúdo volta a revalidado e o ciclo continua. Se quiser, revise as notas antes.', href: quiz };
    default:
      return facts.next
        ? { label: `Revisão de ${facts.next.stage} em ${dayMonth(facts.next.dueAt, facts.tzOffsetMinutes)}`, detail: 'Nada a fazer até lá; ela aparece em Hoje no dia.', href: '/' }
        : { label: 'Nada pendente', detail: 'Ciclo de revisões concluído.', href: '/progresso' };
  }
}

// Evidências do conteúdo (sessões e tentativas), da mais recente à mais antiga.
export function buildHistory(sessions: StudySession[], attempts: QuizAttempt[]): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    ...sessions
      .filter((item) => item.status === 'concluida' && item.finishedAt)
      .map((item) => ({
        at: item.finishedAt!,
        kind: 'sessao' as const,
        title: 'Sessão de estudo concluída',
        detail: `${Math.max(1, Math.ceil(item.activeSeconds / 60))} min ativos.`,
      })),
    ...attempts
      .filter((item) => item.status === 'enviado' && item.submittedAt && item.score !== null)
      .map((item) => ({
        at: item.submittedAt!,
        kind: item.purpose,
        title: `${PURPOSE_TITLE[item.purpose] ?? 'Quiz'}${item.stage ? ` de ${item.stage}` : ''}: ${item.passed ? 'aprovad' : 'reprovad'}${item.purpose === 'revisao' || item.purpose === 'atividade' ? 'a' : 'o'}`,
        detail: `Nota ${percent(item.score!)}${item.directed ? ` · dirigido (${item.directed} questões refeitas)` : ''}${item.late ? ' · enviado após o tempo' : ''}.`,
      })),
  ];
  return entries.sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

export async function contentReport(
  db: D1Like,
  contentId: string,
  options: { now?: string; today: string; tzOffsetMinutes: number },
): Promise<ContentReport | null> {
  const now = options.now ?? new Date().toISOString();
  const roadmap = await getRoadmap(db);
  const disciplines = (roadmap?.phases ?? []).flatMap((phase) => phase.disciplines);
  const discipline = disciplines.find((item) => item.contents.some((content) => content.id === contentId));
  const content = discipline?.contents.find((item) => item.id === contentId);
  if (!discipline || !content) return null;
  const titleOf = new Map(disciplines.flatMap((item) => item.contents).map((item) => [item.id, item.title]));

  const [input, changes, attempts, sessions, recovery, cycle] = await Promise.all([
    loadProgressInput(db),
    listAudit(db, { entityType: 'conteudo', entityId: contentId, limit: 100 }),
    listAttempts(db, { contentId, limit: 100 }),
    listSessions(db, { contentId, limit: 100 }),
    recoveryStatus(db, contentId),
    reviewCycle(db, contentId),
  ]);
  const progress = computeProgress(input, { now, today: options.today, tzOffsetMinutes: options.tzOffsetMinutes });
  const disciplineProgress = progress.disciplines.find((item) => item.id === discipline.id);

  const facts: ReportFacts = {
    state: content.state,
    locked: content.locked,
    pendingTitles: content.pendingPrerequisites.map((id) => titleOf.get(id) ?? id),
    recovery,
    next: nextReview(cycle),
    hasOpenSession: sessions.some((item) => item.status !== 'concluida'),
    now,
    tzOffsetMinutes: options.tzOffsetMinutes,
    atividade: atividadeStatusOf(attempts),
  };

  // Contribuição deste conteúdo para os componentes da disciplina (MVP-07).
  const quizScores = attempts.filter((item) => item.purpose === 'quiz' && item.status === 'enviado' && item.passed && item.score !== null).map((item) => item.score!);
  const tally = reviewTally(
    input.events.filter((item) => item.contentId === contentId),
    now,
  );
  const covered = COVERED_STATES.includes(content.state);
  const contribution = [
    covered
      ? `Cobertura: conta como 1 dos ${discipline.contents.length} conteúdos da disciplina.`
      : `Cobertura: ainda não conta (estado ${CONTENT_STATE_META[content.state].label.toLowerCase()}).`,
    quizScores.length
      ? `Quiz: melhor nota aprovada ${percent(Math.max(...quizScores))}; entra na média da disciplina.`
      : 'Quiz: nenhum quiz do conteúdo aprovado ainda (reprovação não entra na nota, só deixa o conteúdo urgente).',
    facts.atividade.status === 'aprovada'
      ? 'Atividade: aprovada; entra na média da disciplina.'
      : facts.atividade.status === 'reprovada'
        ? 'Atividade: reprovada (nota > 70% necessária); pode ser refeita direto, sem penalidade.'
        : 'Atividade: ainda não feita.',
    tally.due
      ? `Revisão: ${tally.passed} de ${tally.due} ${tally.due === 1 ? 'revisão vencida aprovada' : 'revisões vencidas aprovadas'} no ciclo atual.`
      : 'Revisão: nenhuma revisão vencida ainda.',
  ];
  const risk = assessRisk(facts);

  return {
    content: {
      id: content.id,
      title: content.title,
      unit: content.unit,
      disciplineTitle: discipline.title,
      state: content.state,
      stateLabel: content.locked && content.state === 'nao-iniciado' ? 'Aguardando pré-requisito' : CONTENT_STATE_META[content.state].label,
      locked: content.locked,
      pendingPrerequisites: content.pendingPrerequisites.map((id) => ({ id, title: titleOf.get(id) ?? id })),
    },
    origin: {
      formulaVersion: progress.formulaVersion,
      disciplineScore: disciplineProgress?.score ?? 0,
      components: disciplineProgress?.components ?? [],
      contribution,
      questionTrail: questionTrailOf(attempts),
    },
    risk: { ...risk, label: RISK_LABEL[risk.level] },
    nextAction: nextAction(facts, contentId),
    stateChanges: changes,
    history: buildHistory(sessions, attempts),
  };
}
