// Aplicação de transições de estado com trilha de auditoria (TEC-06).
// Toda mudança de estado pedagógico passa por aqui: o estado atual e a linha de
// auditoria (autor, momento, estado anterior, estado novo, motivo, evidência)
// são gravados no mesmo batch do D1, que é atômico.
import {
  CONTENT_TRANSITIONS,
  DISCIPLINE_TRANSITIONS,
  INITIAL_CONTENT_STATE,
  INITIAL_DISCIPLINE_STATE,
  findTransition,
  type Transition,
} from './states.js';

export type EntityType = 'conteudo' | 'disciplina';
export type Actor = 'usuario' | 'sistema';

export type TransitionRequest = {
  entityType: EntityType;
  entityId: string;
  event: string;
  actor: Actor;
  // Obrigatório quando a transição pede confirmação (DEC-03).
  confirmed?: boolean;
  // Sem motivo explícito, vale a descrição da transição.
  reason?: string;
  evidenceId?: string | null;
};

export type AuditEntry = {
  id: string;
  entityType: EntityType;
  entityId: string;
  fromState: string;
  toState: string;
  event: string;
  actor: Actor;
  reason: string;
  evidenceId: string | null;
  occurredAt: string;
};

export class TransitionError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid' | 'confirmation' | 'evidence' | 'conflict' | 'not-found',
  ) {
    super(message);
    this.name = 'TransitionError';
  }
}

// Subconjunto do D1 usado aqui; os testes usam um adaptador sobre node:sqlite.
export type D1Like = {
  prepare(query: string): D1LikeStatement;
  batch(statements: D1LikeStatement[]): Promise<{ meta: { changes: number } }[]>;
};
export type D1LikeStatement = {
  bind(...values: unknown[]): D1LikeStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
};

const TABLES = {
  conteudo: { states: 'atlas_content_states', key: 'content_id', entity: 'atlas_contents' },
  disciplina: { states: 'atlas_discipline_states', key: 'discipline_id', entity: 'atlas_disciplines' },
} as const;

function machine(entityType: EntityType): { initial: string; transitions: Transition<string>[] } {
  return entityType === 'conteudo'
    ? { initial: INITIAL_CONTENT_STATE, transitions: CONTENT_TRANSITIONS }
    : { initial: INITIAL_DISCIPLINE_STATE, transitions: DISCIPLINE_TRANSITIONS };
}

// Regra pura: decide se a transição é permitida e monta a linha de auditoria.
export function planTransition(
  request: TransitionRequest,
  currentState: string,
  now: string,
  id: string,
): AuditEntry {
  const transition = findTransition(machine(request.entityType).transitions, currentState, request.event);
  if (!transition) {
    throw new TransitionError(`Evento "${request.event}" não é válido a partir de "${currentState}".`, 'invalid');
  }
  if (transition.requiresConfirmation && (request.actor !== 'usuario' || request.confirmed !== true)) {
    throw new TransitionError(`"${request.event}" exige confirmação explícita do usuário.`, 'confirmation');
  }
  if (transition.requiresEvidence && !request.evidenceId) {
    throw new TransitionError(`"${request.event}" exige uma evidência registrada.`, 'evidence');
  }
  return {
    id,
    entityType: request.entityType,
    entityId: request.entityId,
    fromState: transition.from,
    toState: transition.to,
    event: transition.event,
    actor: request.actor,
    reason: request.reason?.trim() || transition.description,
    evidenceId: request.evidenceId ?? null,
    occurredAt: now,
  };
}

export async function currentState(db: D1Like, entityType: EntityType, entityId: string): Promise<string> {
  const table = TABLES[entityType];
  const exists = await db.prepare(`SELECT 1 AS ok FROM ${table.entity} WHERE id = ?1`).bind(entityId).first();
  if (!exists) throw new TransitionError(`${entityType} "${entityId}" não existe.`, 'not-found');
  const row = await db
    .prepare(`SELECT state FROM ${table.states} WHERE ${table.key} = ?1`)
    .bind(entityId)
    .first<{ state: string }>();
  return row?.state ?? machine(entityType).initial;
}

export async function applyTransition(
  db: D1Like,
  request: TransitionRequest,
  options: { now?: string; id?: string } = {},
): Promise<AuditEntry> {
  const table = TABLES[request.entityType];
  const initial = machine(request.entityType).initial;
  const from = await currentState(db, request.entityType, request.entityId);
  const entry = planTransition(request, from, options.now ?? new Date().toISOString(), options.id ?? crypto.randomUUID());

  // A auditoria só entra se o estado ainda for o lido acima; o estado só muda se
  // a auditoria entrou. Assim uma escrita concorrente não gera estado sem
  // registro nem registro sem estado.
  const [audit] = await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_state_audit
           (id, entity_type, entity_id, from_state, to_state, event, actor, reason, evidence_id, occurred_at)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
         WHERE COALESCE((SELECT state FROM ${table.states} WHERE ${table.key} = ?3), ?11) = ?4`,
      )
      .bind(
        entry.id, entry.entityType, entry.entityId, entry.fromState, entry.toState,
        entry.event, entry.actor, entry.reason, entry.evidenceId, entry.occurredAt, initial,
      ),
    db
      .prepare(
        `INSERT INTO ${table.states} (${table.key}, state, updated_at)
         SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM atlas_state_audit WHERE id = ?4)
         ON CONFLICT(${table.key}) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
      )
      .bind(entry.entityId, entry.toState, entry.occurredAt, entry.id),
  ]);
  if (!audit || audit.meta.changes !== 1) {
    throw new TransitionError('O estado mudou durante a operação. Tente de novo.', 'conflict');
  }
  return entry;
}

type AuditRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  from_state: string;
  to_state: string;
  event: string;
  actor: Actor;
  reason: string;
  evidence_id: string | null;
  occurred_at: string;
};

export async function listAudit(
  db: D1Like,
  filter: { entityType?: EntityType; entityId?: string; limit?: number } = {},
): Promise<AuditEntry[]> {
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  const { results } = await db
    .prepare(
      `SELECT * FROM atlas_state_audit
       WHERE (?1 IS NULL OR entity_type = ?1) AND (?2 IS NULL OR entity_id = ?2)
       ORDER BY occurred_at DESC, rowid DESC LIMIT ?3`,
    )
    .bind(filter.entityType ?? null, filter.entityId ?? null, limit)
    .all<AuditRow>();
  return results.map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    fromState: row.from_state,
    toState: row.to_state,
    event: row.event,
    actor: row.actor,
    reason: row.reason,
    evidenceId: row.evidence_id,
    occurredAt: row.occurred_at,
  }));
}
