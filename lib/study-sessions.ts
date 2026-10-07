// Sessões de estudo (MVP-02): iniciar, pausar, retomar, salvar o ponto atual e
// concluir registrando evidência. As mudanças de estado do conteúdo (DEC-03)
// passam por applyTransition, que grava a auditoria (TEC-06).
import {
  TransitionError,
  applyTransition,
  currentState,
  type D1Like,
} from './pedagogy/transitions.js';

export const SESSION_STATUSES = ['em-andamento', 'pausada', 'concluida'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

// O ponto atual é pequeno (etapa, etapas feitas, rascunho curto da nota).
export const MAX_CHECKPOINT_BYTES = 16 * 1024;

export type StudySession = {
  id: string;
  contentId: string;
  contentTitle: string;
  disciplineTitle: string;
  status: SessionStatus;
  startedAt: string;
  updatedAt: string;
  lastResumedAt: string | null;
  // Tempo acumulado até o último pause; some o trecho em andamento com elapsedSeconds().
  activeSeconds: number;
  checkpoint: Record<string, unknown> | null;
  finishedAt: string | null;
  evidenceId: string | null;
};

export class SessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

// Estados de conteúdo em que abrir uma sessão dispara "abrir-material" (DEC-03).
const OPENS_MATERIAL = new Set(['nao-iniciado', 'bloqueado']);

type SessionRow = {
  id: string;
  content_id: string;
  content_title: string;
  discipline_title: string;
  status: SessionStatus;
  started_at: string;
  updated_at: string;
  last_resumed_at: string | null;
  active_seconds: number;
  checkpoint_json: string | null;
  finished_at: string | null;
  evidence_id: string | null;
};

const SELECT_SESSION = `SELECT s.*, c.title AS content_title, d.title AS discipline_title
  FROM atlas_study_sessions s
  JOIN atlas_contents c ON c.id = s.content_id
  JOIN atlas_disciplines d ON d.id = c.discipline_id`;

function fromRow(row: SessionRow): StudySession {
  let checkpoint: Record<string, unknown> | null = null;
  if (row.checkpoint_json) {
    try {
      checkpoint = JSON.parse(row.checkpoint_json) as Record<string, unknown>;
    } catch {
      checkpoint = null;
    }
  }
  return {
    id: row.id,
    contentId: row.content_id,
    contentTitle: row.content_title,
    disciplineTitle: row.discipline_title,
    status: row.status,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    lastResumedAt: row.last_resumed_at,
    activeSeconds: Number(row.active_seconds),
    checkpoint,
    finishedAt: row.finished_at,
    evidenceId: row.evidence_id,
  };
}

// Segundos entre dois instantes ISO, nunca negativo (relógio que volta não desconta tempo).
function secondsBetween(from: string, to: string) {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / 1000));
}

// Tempo de estudo da sessão até `now`: acumulado + trecho em andamento.
export function elapsedSeconds(
  session: Pick<StudySession, 'status' | 'activeSeconds' | 'lastResumedAt'>,
  now: string,
) {
  if (session.status !== 'em-andamento' || !session.lastResumedAt) return session.activeSeconds;
  return session.activeSeconds + secondsBetween(session.lastResumedAt, now);
}

export function serializeCheckpoint(checkpoint: unknown): string | null {
  if (checkpoint === undefined || checkpoint === null) return null;
  if (typeof checkpoint !== 'object' || Array.isArray(checkpoint)) {
    throw new SessionError('O ponto atual precisa ser um objeto.', 400);
  }
  const json = JSON.stringify(checkpoint);
  if (new TextEncoder().encode(json).length > MAX_CHECKPOINT_BYTES) {
    throw new SessionError('O ponto atual excede 16KB.', 413);
  }
  return json;
}

export async function getSession(db: D1Like, id: string): Promise<StudySession | null> {
  const row = await db.prepare(`${SELECT_SESSION} WHERE s.id = ?1`).bind(id).first<SessionRow>();
  return row ? fromRow(row) : null;
}

async function requireSession(db: D1Like, id: string) {
  const session = await getSession(db, id);
  if (!session) throw new SessionError('Sessão não encontrada.', 404);
  return session;
}

// Sessões abertas (em andamento ou pausadas), a mais recente primeiro.
export async function listOpenSessions(db: D1Like): Promise<StudySession[]> {
  const { results } = await db
    .prepare(`${SELECT_SESSION} WHERE s.status <> 'concluida' ORDER BY s.updated_at DESC, s.rowid DESC`)
    .all<SessionRow>();
  return results.map(fromRow);
}

export async function listSessions(
  db: D1Like,
  filter: { contentId?: string; limit?: number } = {},
): Promise<StudySession[]> {
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const { results } = await db
    .prepare(
      `${SELECT_SESSION} WHERE (?1 IS NULL OR s.content_id = ?1)
       ORDER BY s.started_at DESC, s.rowid DESC LIMIT ?2`,
    )
    .bind(filter.contentId ?? null, limit)
    .all<SessionRow>();
  return results.map(fromRow);
}

// Uma sessão em andamento por vez: ao começar ou retomar outra, a que estava em
// andamento é pausada com o tempo acumulado.
function pauseOthers(db: D1Like, exceptId: string, now: string) {
  return db
    .prepare(
      `UPDATE atlas_study_sessions
       SET status = 'pausada',
           active_seconds = active_seconds + MAX(0, CAST(ROUND((julianday(?2) - julianday(last_resumed_at)) * 86400) AS INTEGER)),
           last_resumed_at = NULL, updated_at = ?2
       WHERE status = 'em-andamento' AND id <> ?1`,
    )
    .bind(exceptId, now);
}

// Inicia uma sessão do conteúdo. Se já houver uma aberta, ela é retomada (o
// ponto atual é preservado). Recusa conteúdo com pré-requisito pendente (MVP-01).
export async function startSession(
  db: D1Like,
  contentId: string,
  options: { now?: string; id?: string } = {},
): Promise<StudySession> {
  const now = options.now ?? new Date().toISOString();
  const open = await db
    .prepare(`SELECT id FROM atlas_study_sessions WHERE content_id = ?1 AND status <> 'concluida'`)
    .bind(contentId)
    .first<{ id: string }>();
  if (open) return resumeSession(db, open.id, { now });

  const state = await currentState(db, 'conteudo', contentId);
  if (OPENS_MATERIAL.has(state)) {
    await applyTransition(
      db,
      {
        entityType: 'conteudo',
        entityId: contentId,
        event: 'abrir-material',
        actor: 'usuario',
        reason: 'Começou uma sessão de estudo.',
      },
      { now },
    );
  }

  const id = options.id ?? crypto.randomUUID();
  await db.batch([
    pauseOthers(db, id, now),
    db
      .prepare(
        `INSERT INTO atlas_study_sessions
           (id, content_id, status, started_at, updated_at, last_resumed_at, active_seconds)
         VALUES (?1, ?2, 'em-andamento', ?3, ?3, ?3, 0)`,
      )
      .bind(id, contentId, now),
  ]);
  return requireSession(db, id);
}

export async function pauseSession(
  db: D1Like,
  id: string,
  options: { now?: string; checkpoint?: unknown } = {},
): Promise<StudySession> {
  const now = options.now ?? new Date().toISOString();
  const session = await requireSession(db, id);
  if (session.status === 'concluida') throw new SessionError('A sessão já foi concluída.', 409);
  const checkpoint = options.checkpoint === undefined ? undefined : serializeCheckpoint(options.checkpoint);
  if (session.status === 'pausada') {
    if (checkpoint !== undefined) await saveCheckpoint(db, id, options.checkpoint, { now });
    return requireSession(db, id);
  }
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_study_sessions
         SET status = 'pausada', active_seconds = ?2, last_resumed_at = NULL, updated_at = ?3,
             checkpoint_json = CASE WHEN ?4 = 1 THEN ?5 ELSE checkpoint_json END
         WHERE id = ?1 AND status = 'em-andamento'`,
      )
      .bind(id, elapsedSeconds(session, now), now, checkpoint === undefined ? 0 : 1, checkpoint ?? null),
  ]);
  return requireSession(db, id);
}

export async function resumeSession(
  db: D1Like,
  id: string,
  options: { now?: string } = {},
): Promise<StudySession> {
  const now = options.now ?? new Date().toISOString();
  const session = await requireSession(db, id);
  if (session.status === 'concluida') throw new SessionError('A sessão já foi concluída.', 409);
  await db.batch([
    pauseOthers(db, id, now),
    db
      .prepare(
        `UPDATE atlas_study_sessions
         SET status = 'em-andamento', last_resumed_at = COALESCE(last_resumed_at, ?2), updated_at = ?2
         WHERE id = ?1 AND status <> 'concluida'`,
      )
      .bind(id, now),
  ]);
  return requireSession(db, id);
}

// Salvar ponto atual: não muda o status nem o tempo.
export async function saveCheckpoint(
  db: D1Like,
  id: string,
  checkpoint: unknown,
  options: { now?: string } = {},
): Promise<StudySession> {
  const now = options.now ?? new Date().toISOString();
  const json = serializeCheckpoint(checkpoint);
  const session = await requireSession(db, id);
  if (session.status === 'concluida') throw new SessionError('A sessão já foi concluída.', 409);
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_study_sessions SET checkpoint_json = ?2, updated_at = ?3
         WHERE id = ?1 AND status <> 'concluida'`,
      )
      .bind(id, json, now),
  ]);
  return requireSession(db, id);
}

function minutesLabel(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

// Conclui a sessão: congela o tempo, registra a evidência "sessao" e, se o
// conteúdo estava em estudo, passa para "aguardando quiz" (DEC-03: ao sair da
// sessão o quiz do conteúdo é gerado).
export async function concludeSession(
  db: D1Like,
  id: string,
  options: { now?: string; checkpoint?: unknown; evidenceId?: string } = {},
): Promise<StudySession> {
  const now = options.now ?? new Date().toISOString();
  const session = await requireSession(db, id);
  if (session.status === 'concluida') throw new SessionError('A sessão já foi concluída.', 409);
  const checkpoint = options.checkpoint === undefined ? undefined : serializeCheckpoint(options.checkpoint);
  const seconds = elapsedSeconds(session, now);
  const evidenceId = options.evidenceId ?? crypto.randomUUID();
  const noteId =
    session.checkpoint && typeof session.checkpoint.noteId === 'string' ? session.checkpoint.noteId : null;
  const summary = `Sessão de estudo concluída (${minutesLabel(seconds)}${noteId ? ', com nota' : ''}).`;

  const [, closed] = await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_evidences (id, content_id, subtopic_id, kind, source_ref, summary, recorded_at)
         SELECT ?1, ?2, NULL, 'sessao', ?3, ?4, ?5
         WHERE EXISTS (SELECT 1 FROM atlas_study_sessions WHERE id = ?3 AND status <> 'concluida')`,
      )
      .bind(evidenceId, session.contentId, id, summary, now),
    db
      .prepare(
        `UPDATE atlas_study_sessions
         SET status = 'concluida', active_seconds = ?2, last_resumed_at = NULL, finished_at = ?3,
             updated_at = ?3, evidence_id = ?4,
             checkpoint_json = CASE WHEN ?5 = 1 THEN ?6 ELSE checkpoint_json END
         WHERE id = ?1 AND status <> 'concluida'`,
      )
      .bind(id, seconds, now, evidenceId, checkpoint === undefined ? 0 : 1, checkpoint ?? null),
  ]);
  if (!closed || closed.meta.changes !== 1) {
    throw new SessionError('A sessão mudou durante a operação. Tente de novo.', 409);
  }

  const state = await currentState(db, 'conteudo', session.contentId);
  if (state === 'em-estudo') {
    try {
      await applyTransition(
        db,
        {
          entityType: 'conteudo',
          entityId: session.contentId,
          event: 'encerrar-sessao',
          actor: 'sistema',
          reason: 'Sessão de estudo concluída; o quiz do conteúdo fica disponível.',
          evidenceId,
        },
        { now },
      );
    } catch (error) {
      // Outra aba pode ter concluído o mesmo conteúdo ao mesmo tempo; a sessão já está gravada.
      if (!(error instanceof TransitionError && error.code === 'conflict')) throw error;
    }
  }
  return requireSession(db, id);
}

export function sessionErrorResponse(error: unknown) {
  if (error instanceof SessionError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof TransitionError) {
    const status = error.code === 'not-found' ? 404 : error.code === 'prerequisite' || error.code === 'conflict' || error.code === 'invalid' ? 409 : 400;
    return Response.json({ error: error.message, code: error.code }, { status });
  }
  return Response.json({ error: 'Não foi possível atualizar a sessão.' }, { status: 500 });
}
