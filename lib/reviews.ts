// Revisões 24h/7d/30d (MVP-06, DEC-09 e DEC-03).
//
// O ciclo começa quando o conteúdo é concluído (quiz aprovado ou dispensa por
// proficiência) e os prazos contam desse momento: 1, 7 e 30 dias. Cada revisão
// aprovada (revisao-aprovada no histórico, inclusive pelo quiz corretivo) avança
// uma etapa. Ao chegar o prazo da próxima etapa, o conteúdo vai para
// "aguardando revisão"; falhar o reabre ("em revisão ativa") até o usuário
// passar no quiz corretivo (pode refazer direto ou revisar antes).
import { TransitionError, applyTransition, type D1Like } from './pedagogy/transitions.js';

export const REVIEW_STAGES = [
  { id: '24h', days: 1 },
  { id: '7d', days: 7 },
  { id: '30d', days: 30 },
] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number]['id'];

export type ReviewCycle = {
  // Quando o conteúdo foi concluído (início do ciclo).
  anchor: string;
  // Revisões aprovadas desde então (0 a 3).
  passed: number;
};

export type NextReview = { stage: ReviewStage; dueAt: string } | null;

// Data local (AAAA-MM-DD) de um instante, com o fuso do navegador em minutos
// (Date.getTimezoneOffset: 180 para UTC−3).
export function localDateOf(iso: string, tzOffsetMinutes: number) {
  return new Date(Date.parse(iso) - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export function nextReview(cycle: ReviewCycle | null): NextReview {
  if (!cycle) return null;
  const stage = REVIEW_STAGES[cycle.passed];
  if (!stage) return null;
  return { stage: stage.id, dueAt: new Date(Date.parse(cycle.anchor) + stage.days * 86_400_000).toISOString() };
}

export async function reviewCycle(db: D1Like, contentId: string): Promise<ReviewCycle | null> {
  const anchor = await db
    .prepare(
      `SELECT occurred_at FROM atlas_state_audit
       WHERE entity_type = 'conteudo' AND entity_id = ?1 AND event IN ('quiz-aprovado', 'dispensa-proficiencia')
       ORDER BY occurred_at DESC, rowid DESC LIMIT 1`,
    )
    .bind(contentId)
    .first<{ occurred_at: string }>();
  if (!anchor) return null;
  const passed = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM atlas_state_audit
       WHERE entity_type = 'conteudo' AND entity_id = ?1 AND event = 'revisao-aprovada' AND occurred_at >= ?2`,
    )
    .bind(contentId, anchor.occurred_at)
    .first<{ n: number }>();
  return { anchor: anchor.occurred_at, passed: Math.min(Number(passed?.n ?? 0), REVIEW_STAGES.length) };
}

export type UpcomingReview = { contentId: string; stage: ReviewStage; dueAt: string; dueDate: string; anchor: string };

// Agendamento: conteúdos concluídos/revalidados cujo prazo chegou vão para
// "aguardando revisão" (revisao-vencida, ator sistema). Devolve a próxima
// revisão de cada conteúdo no ciclo, para a agenda.
export async function syncReviews(
  db: D1Like,
  options: { today: string; tzOffsetMinutes: number; now?: string },
): Promise<UpcomingReview[]> {
  const now = options.now ?? new Date().toISOString();
  const { results } = await db
    .prepare(
      `SELECT content_id, state FROM atlas_content_states
       WHERE state IN ('concluido', 'revalidado', 'aguardando-revisao', 'em-revisao-ativa')`,
    )
    .all<{ content_id: string; state: string }>();
  const upcoming: UpcomingReview[] = [];
  for (const row of results) {
    const cycle = await reviewCycle(db, row.content_id);
    const next = nextReview(cycle);
    if (!cycle || !next) continue;
    const dueDate = localDateOf(next.dueAt, options.tzOffsetMinutes);
    upcoming.push({ contentId: row.content_id, stage: next.stage, dueAt: next.dueAt, dueDate, anchor: cycle.anchor });
    if ((row.state === 'concluido' || row.state === 'revalidado') && dueDate <= options.today) {
      try {
        await applyTransition(
          db,
          {
            entityType: 'conteudo',
            entityId: row.content_id,
            event: 'revisao-vencida',
            actor: 'sistema',
            reason: `Chegou a revisão de ${next.stage} (conteúdo concluído em ${dayMonth(localDateOf(cycle.anchor, options.tzOffsetMinutes))}).`,
          },
          { now },
        );
      } catch (error) {
        // Outra leitura simultânea já aplicou a transição.
        if (!(error instanceof TransitionError && error.code === 'conflict')) throw error;
      }
    }
  }
  return upcoming;
}

export type ReviewSummary = {
  stage: ReviewStage;
  passed: boolean;
  // Próxima revisão depois desta (nula ao fechar o ciclo ou ao falhar).
  next: { stage: ReviewStage; dueAt: string } | null;
  cycleDone: boolean;
};

// Resumo depois de uma revisão ou corretivo (lido do ciclo já atualizado).
export async function reviewSummary(db: D1Like, contentId: string, stage: ReviewStage, passed: boolean): Promise<ReviewSummary> {
  const cycle = await reviewCycle(db, contentId);
  const next = passed ? nextReview(cycle) : null;
  return { stage, passed, next, cycleDone: passed && cycle !== null && cycle.passed >= REVIEW_STAGES.length };
}

export async function reviewStageFor(db: D1Like, contentId: string): Promise<ReviewStage | null> {
  return nextReview(await reviewCycle(db, contentId))?.stage ?? null;
}
