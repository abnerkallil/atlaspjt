// Relatórios explicáveis (MVP-09): para cada conteúdo, de onde vem a nota, como
// o estado mudou, o risco, a próxima ação e o histórico. Tudo derivado do D1 por
// regras fixas (sem IA): estados (DEC-03), fórmula do MVP-07, revisões (MVP-06)
// e recuperação (MVP-08).
import { CONTENT_STATE_META } from './pedagogy/state-labels.js';
import type { ContentState } from './pedagogy/states.js';
import { listAudit, type AuditEntry, type D1Like } from './pedagogy/transitions.js';
import { computeProgress, loadProgressInput, reviewTally, type ProgressComponent } from './progress.js';
import { listAttempts, type QuizAttempt } from './quizzes.js';
import { recoveryStatus, type RecoveryStatus } from './recovery.js';
import { correctiveReady, nextReview, reviewCycle, localDateOf, type NextReview } from './reviews.js';
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

export type HistoryEntry = { at: string; kind: 'sessao' | 'quiz' | 'revisao' | 'corretivo'; title: string; detail: string };

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
const PURPOSE_TITLE: Record<string, string> = { quiz: 'Quiz do conteúdo', revisao: 'Revisão', corretivo: 'Quiz corretivo' };

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

export type ReportFacts = {
  state: ContentState;
  locked: boolean;
  pendingTitles: string[];
  recovery: RecoveryStatus | null;
  next: NextReview;
  correctiveReady: boolean;
  hasOpenSession: boolean;
  now: string;
  tzOffsetMinutes: number;
};

export function assessRisk(facts: ReportFacts): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  const failures = facts.recovery?.failures ?? 0;
  if (failures >= 2) reasons.push(`${failures} reprovações seguidas (reincidência).`);
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
      return { label: 'Estudar de novo', detail: 'A sessão mostra o estudo dirigido com o que você errou; depois o quiz é liberado.', href: study };
    case 'aguardando-revisao':
      return { label: `Fazer a revisão${facts.next ? ` de ${facts.next.stage}` : ''}`, detail: 'Aprovada, o conteúdo fica revalidado.', href: quiz };
    case 'em-revisao-ativa':
      return facts.correctiveReady
        ? { label: 'Fazer o quiz corretivo', detail: 'Aprovado, o conteúdo volta a revalidado e o ciclo continua.', href: quiz }
        : { label: 'Estudar de novo', detail: 'O quiz corretivo é liberado depois de uma nova sessão de estudo.', href: study };
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
        title: `${PURPOSE_TITLE[item.purpose] ?? 'Quiz'}${item.stage ? ` de ${item.stage}` : ''}: ${item.passed ? 'aprovad' : 'reprovad'}${item.purpose === 'revisao' ? 'a' : 'o'}`,
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

  const [input, changes, attempts, sessions, recovery, cycle, ready] = await Promise.all([
    loadProgressInput(db),
    listAudit(db, { entityType: 'conteudo', entityId: contentId, limit: 100 }),
    listAttempts(db, { contentId, limit: 100 }),
    listSessions(db, { contentId, limit: 100 }),
    recoveryStatus(db, contentId),
    reviewCycle(db, contentId),
    correctiveReady(db, contentId),
  ]);
  const progress = computeProgress(input, { now, today: options.today, tzOffsetMinutes: options.tzOffsetMinutes });
  const disciplineProgress = progress.disciplines.find((item) => item.id === discipline.id);

  const facts: ReportFacts = {
    state: content.state,
    locked: content.locked,
    pendingTitles: content.pendingPrerequisites.map((id) => titleOf.get(id) ?? id),
    recovery,
    next: nextReview(cycle),
    correctiveReady: ready,
    hasOpenSession: sessions.some((item) => item.status !== 'concluida'),
    now,
    tzOffsetMinutes: options.tzOffsetMinutes,
  };

  // Contribuição deste conteúdo para os componentes da disciplina (MVP-07).
  const quizScores = attempts.filter((item) => item.purpose === 'quiz' && item.status === 'enviado' && item.score !== null).map((item) => item.score!);
  const tally = reviewTally(
    input.events.filter((item) => item.contentId === contentId),
    now,
  );
  const covered = ['concluido', 'aguardando-revisao', 'revalidado'].includes(content.state);
  const contribution = [
    covered
      ? `Cobertura: conta como 1 dos ${discipline.contents.length} conteúdos da disciplina.`
      : `Cobertura: ainda não conta (estado ${CONTENT_STATE_META[content.state].label.toLowerCase()}).`,
    quizScores.length
      ? `Quiz: melhor nota ${percent(Math.max(...quizScores))} em ${quizScores.length} ${quizScores.length === 1 ? 'tentativa' : 'tentativas'}; entra na média da disciplina.`
      : 'Quiz: nenhum quiz do conteúdo enviado ainda.',
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
    },
    risk: { ...risk, label: RISK_LABEL[risk.level] },
    nextAction: nextAction(facts, contentId),
    stateChanges: changes,
    history: buildHistory(sessions, attempts),
  };
}
