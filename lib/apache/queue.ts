// APA-07: fila, geração lazy e diff na leitura (Gate APA-01, opção (b):
// sem Cron Trigger, roda via ctx.waitUntil na própria requisição + checagem
// de pendências no primeiro acesso depois do reset diário de neurons).
import { getApacheUserId } from '../auth.js';
import type { D1Like } from '../pedagogy/transitions.js';
import { ApacheError } from './errors.js';
import type { AiLike } from './lesson-writer.js';
import { writeLesson } from './lesson-writer.js';
import {
  ensurePendingLesson,
  getLessonStatus,
  gunzip,
  readLesson,
  type R2Like,
} from './lesson-store.js';
import { neuronBudgetRemaining } from './neuron-meter.js';
import {
  diffEnrichmentAgainstLesson,
  renderLesson,
  validateEnrichment,
  type ApacheEnrichment,
} from './schema.js';
import type { LessonResponse } from './lesson-poll.js';

// waitUntil pode ser interrompido pelo runtime antes da geração terminar —
// um item 'processando' com started_at mais velho que isso é tratado como
// preso (card APA-07).
const STALE_PROCESSING_MS = 5 * 60 * 1000;
// Depois de 3 recuperações de item preso, desiste (vira 'erro') em vez de
// tentar pendente->processando->preso para sempre.
const MAX_QUEUE_ATTEMPTS = 3;
const MAX_LAST_ERROR_CHARS = 200;
// Teto por requisição de quantos itens velhos a varredura pós-reset dispara
// via waitUntil — evita uma única requisição acordar centenas de gerações
// de uma vez (não especificado pelo card, só uma salvaguarda de custo).
const PRE_RESET_SWEEP_LIMIT = 5;

type QueueRow = { id: string; status: string; started_at: string | null; attempts: number };

function isStaleProcessing(row: { status: string; started_at: string | null }, now: string): boolean {
  return (
    row.status === 'processando' &&
    row.started_at !== null &&
    new Date(now).getTime() - new Date(row.started_at).getTime() >= STALE_PROCESSING_MS
  );
}

// Volta um item preso para 'pendente' (attempts+1) ou, depois de
// MAX_QUEUE_ATTEMPTS, desiste e marca 'erro'.
async function recoverStaleItem(db: D1Like, row: QueueRow): Promise<'pendente' | 'erro'> {
  const attempts = row.attempts + 1;
  const nextStatus = attempts >= MAX_QUEUE_ATTEMPTS ? 'erro' : 'pendente';
  await db.batch([
    db
      .prepare(`UPDATE atlas_apache_queue SET status = ?2, attempts = ?3, started_at = NULL WHERE id = ?1`)
      .bind(row.id, nextStatus, attempts),
  ]);
  return nextStatus;
}

// Garante no máximo 1 item pendente/processando saudável na fila para este
// content_id+kind (dedupe de fila, índice idx_atlas_apache_queue_content_kind_status
// do APA-02) — um item 'processando' preso é recuperado aqui mesmo e nunca
// bloqueia um pedido novo. Se a recuperação esgota as tentativas (vira
// 'erro'), esse item também não bloqueia: um item novo (attempts=0) é
// criado no lugar, para a próxima tentativa não herdar o contador do
// problema de infraestrutura anterior. Retorna o id do item pendente para
// processar agora, ou null se já existe um 'processando' saudável em
// andamento.
export async function enqueueLessonIfNeeded(
  db: D1Like,
  contentId: string,
  kind: 'aula' | 'aula_manual',
  now: string,
): Promise<string | null> {
  const { results } = await db
    .prepare(
      `SELECT id, status, started_at, attempts FROM atlas_apache_queue
       WHERE content_id = ?1 AND kind = ?2 AND status IN ('pendente', 'processando')`,
    )
    .bind(contentId, kind)
    .all<QueueRow>();

  let pendingId: string | null = null;
  for (const row of results) {
    if (isStaleProcessing(row, now)) {
      const nextStatus = await recoverStaleItem(db, row);
      if (nextStatus === 'pendente') pendingId = row.id;
      continue;
    }
    if (row.status === 'processando') return null; // saudável, já em andamento
    pendingId = row.id; // pendente saudável
  }
  if (pendingId) return pendingId;

  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
         VALUES (?1, ?2, ?3, 'pendente', 0, ?4)`,
      )
      .bind(id, contentId, kind, now),
  ]);
  return id;
}

function mostRecentUtcMidnight(now: string): string {
  const date = new Date(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

// Varredura pós-reset (Gate APA-01, opção (b)): roda em toda chamada da
// rota, para qualquer conteúdo — itens 'pendente' criados antes da meia-noite
// UTC mais recente provavelmente ficaram parados pelo corte de orçamento de
// neurons (APA-15) do dia anterior; agora que a cota resetou, tenta de novo.
// Usa só o índice idx_atlas_apache_queue_status (status, created_at).
export async function findQueueItemsPendingSinceLastReset(
  db: D1Like,
  now: string,
  limit = PRE_RESET_SWEEP_LIMIT,
): Promise<{ id: string; content_id: string }[]> {
  const midnight = mostRecentUtcMidnight(now);
  const { results } = await db
    .prepare(
      `SELECT id, content_id FROM atlas_apache_queue
       WHERE status = 'pendente' AND created_at < ?1
       ORDER BY created_at LIMIT ?2`,
    )
    .bind(midnight, limit)
    .all<{ id: string; content_id: string }>();
  return results;
}

// Processa 1 item da fila: marca 'processando', checa o orçamento de
// neurons (deixa 'pendente' sem tentar se já passou de 90%), chama
// writeLesson (APA-06) e marca 'concluido'/'erro'. Um 429 do writer (cota
// local ou erro 3036 da Cloudflare) deixa o item 'pendente' de novo — nunca
// marca erro por falta de cota, só por falha real de geração.
export async function processQueueItem(
  db: D1Like,
  bucket: R2Like,
  ai: AiLike,
  queueId: string,
  contentId: string,
  now: string,
): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE atlas_apache_queue SET status = 'processando', started_at = ?2 WHERE id = ?1`).bind(queueId, now),
  ]);

  const budget = await neuronBudgetRemaining(db, now);
  if (budget.overLimit) {
    await db.batch([
      db.prepare(`UPDATE atlas_apache_queue SET status = 'pendente', started_at = NULL WHERE id = ?1`).bind(queueId),
    ]);
    return;
  }

  try {
    await writeLesson(db, bucket, ai, contentId, now);
    await db.batch([
      db.prepare(`UPDATE atlas_apache_queue SET status = 'concluido', processed_at = ?2 WHERE id = ?1`).bind(queueId, now),
    ]);
  } catch (error) {
    if (error instanceof ApacheError && error.status === 429) {
      await db.batch([
        db.prepare(`UPDATE atlas_apache_queue SET status = 'pendente', started_at = NULL WHERE id = ?1`).bind(queueId),
      ]);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    await db.batch([
      db
        .prepare(`UPDATE atlas_apache_queue SET status = 'erro', last_error = ?2, processed_at = ?3 WHERE id = ?1`)
        .bind(queueId, message.slice(0, MAX_LAST_ERROR_CHARS), now),
    ]);
  }
}

async function assertContentExists(db: D1Like, contentId: string): Promise<void> {
  const row = await db.prepare('SELECT id FROM atlas_contents WHERE id = ?1').bind(contentId).first<{ id: string }>();
  if (!row) throw new ApacheError(`Conteúdo "${contentId}" não encontrado.`, 404);
}

type EnrichmentRow = { status: string; object_key: string | null };

async function getConcludedEnrichment(db: D1Like, contentId: string, userId: string): Promise<EnrichmentRow | null> {
  const row = await db
    .prepare(`SELECT status, object_key FROM atlas_apache_enrichments WHERE content_id = ?1 AND user_id = ?2`)
    .bind(contentId, userId)
    .first<EnrichmentRow>();
  return row && row.status === 'concluido' && row.object_key ? row : null;
}

async function readEnrichmentFicha(bucket: R2Like, objectKey: string): Promise<ApacheEnrichment> {
  const object = await bucket.get(objectKey);
  if (!object) throw new ApacheError('Ficha de enriquecimento não encontrada no armazenamento.', 500);
  const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
  try {
    const json = new TextDecoder().decode(await gunzip(bytes));
    return validateEnrichment(JSON.parse(json));
  } catch {
    throw new ApacheError('Ficha de enriquecimento armazenada corrompida.', 500);
  }
}

export type Scheduler = (promise: Promise<void>) => void;

// Orquestra o GET /api/apache/aulas/:contentId inteiro (card APA-07): a rota
// em app/api/apache/aulas/[contentId]/route.ts só injeta os bindings
// (D1/R2/AI) e o `schedule` (ctx.waitUntil real ou um fallback de dev). Sem
// `ai`/`bucket` (binding ausente em dev sem APACHE_AI_DEV=1), a leitura de
// status ainda funciona, só não dispara processamento nem lê aula já gerada
// sem R2.
export async function handleGetAula(
  db: D1Like,
  bucket: R2Like | null,
  ai: AiLike | null,
  contentId: string,
  now: string,
  schedule: Scheduler,
): Promise<LessonResponse> {
  if (ai && bucket) {
    const stale = await findQueueItemsPendingSinceLastReset(db, now);
    for (const item of stale) {
      schedule(processQueueItem(db, bucket, ai, item.id, item.content_id, now));
    }
  }

  await assertContentExists(db, contentId);

  let statusRow = await getLessonStatus(db, contentId);
  if (!statusRow) {
    await ensurePendingLesson(db, contentId, now);
    statusRow = { status: 'pendente', error_message: null };
  }

  if (statusRow.status === 'pendente') {
    if (ai && bucket) {
      const queueId = await enqueueLessonIfNeeded(db, contentId, 'aula', now);
      if (queueId) schedule(processQueueItem(db, bucket, ai, queueId, contentId, now));
    }
    return { status: 'pendente' };
  }

  if (statusRow.status === 'erro') {
    return { status: 'erro', errorMessage: statusRow.error_message ?? 'Não foi possível gerar esta aula agora.' };
  }

  if (!bucket) throw new ApacheError('Armazenamento indisponível.', 503);
  const loaded = await readLesson(db, bucket, contentId);
  if (!loaded) throw new ApacheError('Aula não encontrada.', 500);

  const enrichmentRow = await getConcludedEnrichment(db, contentId, getApacheUserId());
  let enrichment: LessonResponse['enrichment'];
  if (enrichmentRow?.object_key) {
    const ficha = await readEnrichmentFicha(bucket, enrichmentRow.object_key);
    const diff = diffEnrichmentAgainstLesson(loaded.lesson, ficha);
    enrichment = { status: 'concluido', novos: diff.novos, reforcos: diff.reforcos };
  }

  return {
    status: statusRow.status as 'gerada' | 'reportada',
    lesson: renderLesson(loaded.lesson),
    enrichment,
  };
}
