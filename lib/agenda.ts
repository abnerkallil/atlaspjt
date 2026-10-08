// Agenda interna (MVP-05, DEC-09): estudos, quizzes, revisões e recuperação
// urgente, com conclusão por evidência ou manual e reagendamento explicável.
//
// O Atlas não tem tarefa agendada (sem Cron Trigger): a agenda é sincronizada
// quando é lida. syncAgenda conclui o que já tem evidência, cancela o que perdeu
// sentido, passa para hoje o que ficou para trás e cria o que falta, sempre com
// o motivo gravado no item.
import type { D1Like } from './pedagogy/transitions.js';
import { getRoadmap } from './roadmap-store.js';
import { listOpenSessions } from './study-sessions.js';
import { roadmapContents } from './study-plan.js';
import { correctiveReady, syncReviews } from './reviews.js';
import { QUESTION_SECONDS, QUIZ_SIZE, type QuestionKind } from './quizzes.js';

export const AGENDA_KINDS = ['estudo', 'quiz', 'revisao', 'recuperacao'] as const;
export type AgendaKind = (typeof AGENDA_KINDS)[number];
export const AGENDA_PRIORITIES = ['urgente', 'alta', 'normal'] as const;
export type AgendaPriority = (typeof AGENDA_PRIORITIES)[number];
export type AgendaStatus = 'pendente' | 'concluido' | 'cancelado';

// DEC-09: horário padrão das 7h; os itens do dia seguem em sequência.
export const DEFAULT_START = '07:00';
// Duração quando o conteúdo não tem estimativa no catálogo.
export const DEFAULT_STUDY_MINUTES = 45;
export const MIN_DURATION = 5;
export const MAX_DURATION = 240;

const KIND_ORDER: Record<AgendaKind, number> = { recuperacao: 0, quiz: 1, revisao: 2, estudo: 3 };
const PRIORITY_ORDER: Record<AgendaPriority, number> = { urgente: 0, alta: 1, normal: 2 };

export type AgendaItem = {
  id: string;
  kind: AgendaKind;
  contentId: string;
  contentTitle: string;
  disciplineTitle: string;
  sourceRef: string;
  dueDate: string;
  // Horário fixado pelo usuário; startsAt é o horário que a agenda mostra.
  startTime: string | null;
  startsAt: string;
  durationMinutes: number;
  priority: AgendaPriority;
  status: AgendaStatus;
  reason: string;
  changeReason: string | null;
  originalDate: string | null;
  rescheduleCount: number;
  completion: 'evidencia' | 'manual' | null;
  completedAt: string | null;
  evidenceId: string | null;
  createdAt: string;
};

export class AgendaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AgendaError';
  }
}

// ---------------------------------------------------------------------------
// Regras puras
// ---------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME.test(value);
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDay(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes: number) => {
  const clamped = Math.min(minutes, 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

// Ordem do dia: prioridade, depois recuperação → quiz → revisão → estudo.
export function compareItems(
  a: Pick<AgendaItem, 'priority' | 'kind' | 'createdAt' | 'id'>,
  b: Pick<AgendaItem, 'priority' | 'kind' | 'createdAt' | 'id'>,
) {
  return (
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

// Horários de um dia: quem tem hora fixada fica nela; os demais seguem em
// sequência a partir das 7h, na ordem de prioridade.
export function layoutDay<T extends Pick<AgendaItem, 'priority' | 'kind' | 'createdAt' | 'id' | 'startTime' | 'durationMinutes'>>(
  items: T[],
): (T & { startsAt: string })[] {
  let cursor = toMinutes(DEFAULT_START);
  return [...items].sort(compareItems).map((item) => {
    if (item.startTime) return { ...item, startsAt: item.startTime };
    const startsAt = toTime(cursor);
    cursor += item.durationMinutes;
    return { ...item, startsAt };
  });
}

// Duração estimada do quiz: tempo das primeiras questões do banco (DEC-10).
export function quizMinutes(kinds: QuestionKind[]) {
  const seconds = kinds.slice(0, QUIZ_SIZE).reduce((sum, kind) => sum + (QUESTION_SECONDS[kind] ?? 300), 0);
  return Math.max(MIN_DURATION, Math.ceil(seconds / 60));
}

// ---------------------------------------------------------------------------
// D1
// ---------------------------------------------------------------------------

type ItemRow = {
  id: string;
  kind: AgendaKind;
  content_id: string;
  content_title: string;
  discipline_title: string;
  source_ref: string;
  due_date: string;
  start_time: string | null;
  duration_minutes: number;
  priority: AgendaPriority;
  status: AgendaStatus;
  reason: string;
  change_reason: string | null;
  original_date: string | null;
  reschedule_count: number;
  completion: 'evidencia' | 'manual' | null;
  completed_at: string | null;
  evidence_id: string | null;
  created_at: string;
};

const SELECT_ITEMS = `SELECT i.*, c.title AS content_title, d.title AS discipline_title
  FROM atlas_agenda_items i
  JOIN atlas_contents c ON c.id = i.content_id
  JOIN atlas_disciplines d ON d.id = c.discipline_id`;

function itemFromRow(row: ItemRow): Omit<AgendaItem, 'startsAt'> {
  return {
    id: row.id,
    kind: row.kind,
    contentId: row.content_id,
    contentTitle: row.content_title,
    disciplineTitle: row.discipline_title,
    sourceRef: row.source_ref,
    dueDate: row.due_date,
    startTime: row.start_time,
    durationMinutes: Number(row.duration_minutes),
    priority: row.priority,
    status: row.status,
    reason: row.reason,
    changeReason: row.change_reason,
    originalDate: row.original_date,
    rescheduleCount: Number(row.reschedule_count),
    completion: row.completion,
    completedAt: row.completed_at,
    evidenceId: row.evidence_id,
    createdAt: row.created_at,
  };
}

// Itens de um intervalo de dias, com o horário de cada um calculado.
export async function listAgenda(db: D1Like, range: { from: string; to: string }): Promise<AgendaItem[]> {
  const { results } = await db
    .prepare(`${SELECT_ITEMS} WHERE i.due_date BETWEEN ?1 AND ?2 ORDER BY i.due_date`)
    .bind(range.from, range.to)
    .all<ItemRow>();
  const byDay = new Map<string, Omit<AgendaItem, 'startsAt'>[]>();
  for (const row of results) {
    const item = itemFromRow(row);
    byDay.set(item.dueDate, [...(byDay.get(item.dueDate) ?? []), item]);
  }
  return [...byDay.keys()].sort().flatMap((day) => layoutDay(byDay.get(day)!));
}

export async function getAgendaItem(db: D1Like, id: string): Promise<AgendaItem | null> {
  const row = await db.prepare(`${SELECT_ITEMS} WHERE i.id = ?1`).bind(id).first<ItemRow>();
  if (!row) return null;
  return (await listAgenda(db, { from: row.due_date, to: row.due_date })).find((item) => item.id === id) ?? null;
}

type NewItem = {
  kind: AgendaKind;
  contentId: string;
  sourceRef?: string;
  // Padrão: hoje.
  dueDate?: string;
  durationMinutes: number;
  priority: AgendaPriority;
  reason: string;
};

// Concluir à mão vale pelo dia: o mesmo passo não é recriado até amanhã.
function insertItem(db: D1Like, item: NewItem, today: string, now: string) {
  return db
    .prepare(
      `INSERT INTO atlas_agenda_items (id, kind, content_id, source_ref, due_date, duration_minutes, priority, status, reason, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?9, ?4, ?5, ?6, 'pendente', ?7, ?8, ?8
       WHERE NOT EXISTS (
         SELECT 1 FROM atlas_agenda_items
         WHERE kind = ?2 AND content_id = ?3 AND source_ref = ?9 AND due_date = ?4 AND status = 'concluido' AND completion = 'manual'
       )
       ON CONFLICT DO NOTHING`,
    )
    .bind(
      crypto.randomUUID(),
      item.kind,
      item.contentId,
      item.dueDate ?? today,
      item.durationMinutes,
      item.priority,
      item.reason,
      now,
      item.sourceRef ?? '',
    );
}

// Evidência que conclui cada tipo de item (registrada depois de o item existir).
const EVIDENCE_FOR_KIND = `CASE atlas_agenda_items.kind WHEN 'quiz' THEN 'quiz' WHEN 'revisao' THEN 'revisao' ELSE 'sessao' END`;
const MATCHING_EVIDENCE = `FROM atlas_evidences e
  WHERE e.content_id = atlas_agenda_items.content_id
    AND e.kind = ${EVIDENCE_FOR_KIND}
    AND e.recorded_at >= atlas_agenda_items.created_at
  ORDER BY e.recorded_at LIMIT 1`;

// Estados em que cada tipo de item ainda faz sentido.
const STILL_VALID: Record<AgendaKind, string[]> = {
  estudo: ['nao-iniciado', 'em-estudo'],
  quiz: ['aguardando-quiz', 'em-revisao-ativa'],
  recuperacao: ['bloqueado', 'em-estudo', 'em-revisao-ativa'],
  revisao: ['concluido', 'revalidado', 'aguardando-revisao'],
};

async function questionKinds(db: D1Like, contentId: string) {
  const { results } = await db
    .prepare('SELECT kind FROM atlas_questions WHERE content_id = ?1 AND active = 1 ORDER BY position, id')
    .bind(contentId)
    .all<{ kind: QuestionKind }>();
  return results.map((row) => row.kind);
}

export async function syncAgenda(db: D1Like, options: { today: string; tzOffsetMinutes?: number; now?: string }) {
  const { today } = options;
  const now = options.now ?? new Date().toISOString();
  // 0. Revisões 24h/7d/30d (MVP-06): prazos vencidos viram "aguardando revisão".
  const reviews = await syncReviews(db, { today, tzOffsetMinutes: options.tzOffsetMinutes ?? 0, now });

  // 1. Conclusão por evidência (DEC-09): sessão para estudo e recuperação, quiz para quiz.
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_agenda_items
         SET status = 'concluido', completion = 'evidencia',
             evidence_id = (SELECT e.id ${MATCHING_EVIDENCE}),
             completed_at = (SELECT e.recorded_at ${MATCHING_EVIDENCE}),
             change_reason = 'Concluída pela evidência registrada.', updated_at = ?1
         WHERE status = 'pendente' AND EXISTS (SELECT 1 ${MATCHING_EVIDENCE})`,
      )
      .bind(now),
  ]);

  // 2. Cancela o que perdeu sentido (ex.: quiz que deixou de estar liberado).
  const cancels = Object.entries(STILL_VALID).map(([kind, states]) =>
    db
      .prepare(
        `UPDATE atlas_agenda_items
         SET status = 'cancelado', change_reason = 'O conteúdo mudou de estado; este passo não é mais necessário.', updated_at = ?1
         WHERE status = 'pendente' AND kind = ?2
           AND COALESCE((SELECT s.state FROM atlas_content_states s WHERE s.content_id = atlas_agenda_items.content_id), 'nao-iniciado')
               NOT IN (${states.map((state) => `'${state}'`).join(', ')})`,
      )
      .bind(now, kind),
  );
  await db.batch(cancels);

  // 3. O que ficou para trás passa para hoje, com o motivo.
  const { results: overdue } = await db
    .prepare(`SELECT id, due_date FROM atlas_agenda_items WHERE status = 'pendente' AND due_date < ?1`)
    .bind(today)
    .all<{ id: string; due_date: string }>();
  if (overdue.length) {
    await db.batch(
      overdue.map((row) =>
        db
          .prepare(
            `UPDATE atlas_agenda_items
             SET due_date = ?2, start_time = NULL, original_date = COALESCE(original_date, due_date),
                 reschedule_count = reschedule_count + 1, change_reason = ?3, updated_at = ?4
             WHERE id = ?1`,
          )
          .bind(row.id, today, `Não foi feita em ${formatDay(row.due_date)}; o Atlas passou para hoje.`, now),
      ),
    );
  }

  // 4. Cria o que falta: recuperação urgente, quiz liberado (ou corretivo),
  //    revisões e o próximo estudo.
  const { results: states } = await db
    .prepare(
      `SELECT s.content_id, s.state, c.estimated_minutes
       FROM atlas_content_states s JOIN atlas_contents c ON c.id = s.content_id
       WHERE s.state IN ('bloqueado', 'aguardando-quiz', 'em-revisao-ativa')`,
    )
    .all<{ content_id: string; state: string; estimated_minutes: number | null }>();
  const inserts: ReturnType<typeof insertItem>[] = [];
  for (const row of states) {
    const studyMinutes = Number(row.estimated_minutes ?? DEFAULT_STUDY_MINUTES);
    const corrective = row.state === 'em-revisao-ativa';
    if (row.state === 'bloqueado' || (corrective && !(await correctiveReady(db, row.content_id)))) {
      inserts.push(
        insertItem(
          db,
          {
            kind: 'recuperacao',
            contentId: row.content_id,
            durationMinutes: studyMinutes,
            priority: 'urgente',
            reason: corrective
              ? 'Falhou na revisão: estude de novo para liberar o quiz corretivo (DEC-03).'
              : 'Reprovado no quiz: estude de novo para liberar outra tentativa (DEC-04).',
          },
          today,
          now,
        ),
      );
      continue;
    }
    inserts.push(
      insertItem(
        db,
        {
          kind: 'quiz',
          contentId: row.content_id,
          durationMinutes: quizMinutes(await questionKinds(db, row.content_id)),
          priority: corrective ? 'urgente' : 'alta',
          reason: corrective
            ? 'Quiz corretivo: passe para revalidar o conteúdo depois da revisão que falhou.'
            : 'Sessão concluída: o quiz confirma o conteúdo e o leva a concluído.',
        },
        today,
        now,
      ),
    );
  }
  const { results: reviewStates } = await db
    .prepare(`SELECT content_id, state FROM atlas_content_states WHERE state IN ('concluido', 'revalidado', 'aguardando-revisao')`)
    .all<{ content_id: string; state: string }>();
  const reviewable = new Set(reviewStates.map((row) => row.content_id));
  for (const review of reviews) {
    if (!reviewable.has(review.contentId)) continue;
    inserts.push(
      insertItem(
        db,
        {
          kind: 'revisao',
          contentId: review.contentId,
          sourceRef: review.stage,
          dueDate: review.dueDate < today ? today : review.dueDate,
          durationMinutes: quizMinutes(await questionKinds(db, review.contentId)),
          priority: 'alta',
          reason: `Revisão de ${review.stage}: contada a partir da conclusão do conteúdo em ${formatDay(review.anchor.slice(0, 10))} (DEC-09).`,
        },
        today,
        now,
      ),
    );
  }

  const pendingStudy = await db
    .prepare(`SELECT 1 AS found FROM atlas_agenda_items WHERE status = 'pendente' AND kind IN ('estudo', 'recuperacao') LIMIT 1`)
    .first<{ found: number }>();
  if (!pendingStudy) {
    // Próximo estudo: sessão aberta, conteúdo em estudo ou o primeiro liberado do
    // roadmap. Recuperação e corretivo já têm seus próprios itens.
    const contents = roadmapContents(await getRoadmap(db));
    const [open] = (await listOpenSessions(db)).filter((session) =>
      STILL_VALID.estudo.includes(contents.find((item) => item.id === session.contentId)?.state ?? ''),
    );
    const content = open
      ? contents.find((item) => item.id === open.contentId)
      : (contents.find((item) => item.state === 'em-estudo') ??
        contents.find((item) => item.state === 'nao-iniciado' && !item.locked));
    if (content) {
      inserts.push(
        insertItem(
          db,
          {
            kind: 'estudo',
            contentId: content.id,
            durationMinutes: content.estimatedMinutes ?? DEFAULT_STUDY_MINUTES,
            priority: 'normal',
            reason: open
              ? 'Você tem uma sessão aberta deste conteúdo: retome de onde parou.'
              : content.state === 'em-estudo'
                ? 'Você começou este conteúdo e ainda não encerrou.'
                : 'Próximo conteúdo liberado do roadmap.',
          },
          today,
          now,
        ),
      );
    }
  }
  if (inserts.length) await db.batch(inserts);
}

async function requirePending(db: D1Like, id: string) {
  const item = await db.prepare('SELECT id, status, due_date FROM atlas_agenda_items WHERE id = ?1').bind(id).first<{
    id: string;
    status: AgendaStatus;
    due_date: string;
  }>();
  if (!item) throw new AgendaError('Item da agenda não encontrado.', 404);
  if (item.status !== 'pendente') throw new AgendaError('Este item já foi concluído ou cancelado.', 409);
  return item;
}

// Conclusão manual (DEC-09): não muda o estado pedagógico do conteúdo.
export async function completeItem(db: D1Like, id: string, options: { now?: string } = {}) {
  const now = options.now ?? new Date().toISOString();
  await requirePending(db, id);
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_agenda_items SET status = 'concluido', completion = 'manual', completed_at = ?2,
           change_reason = 'Concluída por você.', updated_at = ?2
         WHERE id = ?1 AND status = 'pendente'`,
      )
      .bind(id, now),
  ]);
  return (await getAgendaItem(db, id))!;
}

export async function rescheduleItem(
  db: D1Like,
  id: string,
  input: { date: unknown; time?: unknown; reason?: unknown; today: string; now?: string },
) {
  const now = input.now ?? new Date().toISOString();
  const item = await requirePending(db, id);
  if (!isDate(input.date)) throw new AgendaError('Informe a nova data (AAAA-MM-DD).', 400);
  if (input.date < input.today) throw new AgendaError('Escolha hoje ou um dia depois.', 400);
  if (input.time !== undefined && input.time !== null && input.time !== '' && !isTime(input.time)) {
    throw new AgendaError('Horário inválido (HH:MM).', 400);
  }
  const time = isTime(input.time) ? input.time : null;
  const note = typeof input.reason === 'string' && input.reason.trim() ? input.reason.trim().slice(0, 300) : null;
  const reason = `Reagendada por você de ${formatDay(item.due_date)} para ${formatDay(input.date)}${time ? ` às ${time}` : ''}${note ? `: ${note}` : '.'}`;
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_agenda_items
         SET due_date = ?2, start_time = ?3, original_date = COALESCE(original_date, due_date),
             reschedule_count = reschedule_count + 1, change_reason = ?4, updated_at = ?5
         WHERE id = ?1 AND status = 'pendente'`,
      )
      .bind(id, input.date, time, reason, now),
  ]);
  return (await getAgendaItem(db, id))!;
}

// Duração e prioridade (DEC-09).
export async function adjustItem(
  db: D1Like,
  id: string,
  input: { durationMinutes?: unknown; priority?: unknown; now?: string },
) {
  const now = input.now ?? new Date().toISOString();
  await requirePending(db, id);
  const duration = input.durationMinutes;
  if (duration !== undefined && (!Number.isInteger(duration) || (duration as number) < MIN_DURATION || (duration as number) > MAX_DURATION)) {
    throw new AgendaError(`A duração vai de ${MIN_DURATION} a ${MAX_DURATION} minutos.`, 400);
  }
  const priority = input.priority;
  if (priority !== undefined && !AGENDA_PRIORITIES.includes(priority as AgendaPriority)) {
    throw new AgendaError('Prioridade inválida.', 400);
  }
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_agenda_items
         SET duration_minutes = COALESCE(?2, duration_minutes), priority = COALESCE(?3, priority), updated_at = ?4
         WHERE id = ?1 AND status = 'pendente'`,
      )
      .bind(id, duration ?? null, priority ?? null, now),
  ]);
  return (await getAgendaItem(db, id))!;
}

export function agendaErrorResponse(error: unknown) {
  if (error instanceof AgendaError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: 'Não foi possível atualizar a agenda.' }, { status: 500 });
}
