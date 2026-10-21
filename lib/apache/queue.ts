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
  markFailed,
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
// Depois de 3 recuperações de item preso, desiste de verdade (vira 'erro' e
// marca a aula como erro) em vez de tentar pendente->processando->preso para
// sempre.
const MAX_QUEUE_ATTEMPTS = 3;
const MAX_LAST_ERROR_CHARS = 200;
// Teto por requisição de quantos itens a varredura processa de uma vez via
// waitUntil — evita uma única requisição acordar centenas de gerações de
// uma vez (não especificado pelo card, só uma salvaguarda de custo).
const SWEEP_LIMIT = 5;

// Sentinela em `last_error` (não é uma mensagem de erro real) pra marcar um
// item que foi adiado por falta de cota de neurons — precisa ficar
// distinguível de um item "pendente normal" (recém-criado ou recuperado de
// um travamento), senão cada poll de 5s do cliente chamaria a IA de novo
// enquanto a cota não reseta (o 3036 da Cloudflare é uma chamada real).
const QUOTA_DEFERRED_MARKER = 'cota_diaria_esgotada';

const STUCK_ERROR_MESSAGE =
  'Não foi possível gerar a aula depois de várias tentativas (o processamento foi interrompido repetidamente).';

type QueueRow = {
  id: string;
  content_id: string;
  status: string;
  started_at: string | null;
  attempts: number;
  last_error: string | null;
};

function isStaleProcessing(row: { status: string; started_at: string | null }, now: string): boolean {
  return (
    row.status === 'processando' &&
    row.started_at !== null &&
    new Date(now).getTime() - new Date(row.started_at).getTime() >= STALE_PROCESSING_MS
  );
}

// Volta um item preso para 'pendente' (attempts+1) ou, depois de
// MAX_QUEUE_ATTEMPTS, desiste de verdade: marca o item 'erro' E a aula como
// erro (markFailed) — sem isso a aula ficava 'pendente' para sempre (o
// cliente nunca vê um erro, só o spinner indefinidamente).
async function recoverStaleItem(db: D1Like, row: QueueRow, now: string): Promise<'pendente' | 'erro'> {
  const attempts = row.attempts + 1;
  if (attempts >= MAX_QUEUE_ATTEMPTS) {
    await db.batch([
      db
        .prepare(`UPDATE atlas_apache_queue SET status = 'erro', attempts = ?2, started_at = NULL, last_error = ?3 WHERE id = ?1`)
        .bind(row.id, attempts, STUCK_ERROR_MESSAGE),
    ]);
    try {
      await markFailed(db, row.content_id, STUCK_ERROR_MESSAGE, now);
    } catch {
      // Não deveria faltar a linha em atlas_apache_lessons aqui (ela existe
      // desde que o item foi enfileirado) — mas não deixa isso derrubar a
      // recuperação da fila em si.
    }
    return 'erro';
  }
  await db.batch([
    db
      .prepare(`UPDATE atlas_apache_queue SET status = 'pendente', attempts = ?2, started_at = NULL, last_error = NULL WHERE id = ?1`)
      .bind(row.id, attempts),
  ]);
  return 'pendente';
}

// Garante no máximo 1 item pendente/processando saudável na fila para este
// content_id+kind (dedupe de fila, índice idx_atlas_apache_queue_content_kind_status
// do APA-02). Um item 'processando' preso é recuperado aqui mesmo; se a
// recuperação esgota as tentativas (vira 'erro'), ou se o único pendente
// existente foi adiado por cota (QUOTA_DEFERRED_MARKER), NENHUM item novo é
// criado nem devolvido: um item 'erro' é terminal (a aula já virou erro) e
// um item adiado por cota só pode ser retomado pela varredura pós-reset —
// nunca a cada poll de 5s do cliente, senão isso chamaria a IA de novo a
// cada poll enquanto a cota não reseta. Retorna o id do item pendente para
// processar agora, ou null se não há nada saudável para processar.
export async function enqueueLessonIfNeeded(
  db: D1Like,
  contentId: string,
  kind: 'aula' | 'aula_manual',
  now: string,
): Promise<string | null> {
  const { results } = await db
    .prepare(
      `SELECT id, content_id, status, started_at, attempts, last_error FROM atlas_apache_queue
       WHERE content_id = ?1 AND kind = ?2 AND status IN ('pendente', 'processando')`,
    )
    .bind(contentId, kind)
    .all<QueueRow>();

  let pendingId: string | null = null;
  let blocked = false;
  for (const row of results) {
    if (isStaleProcessing(row, now)) {
      const nextStatus = await recoverStaleItem(db, row, now);
      if (nextStatus === 'pendente') pendingId = row.id;
      else blocked = true; // virou erro: markFailed já cuidou da aula, não reenfileira
      continue;
    }
    if (row.status === 'processando') return null; // saudável, já em andamento
    if (row.last_error === QUOTA_DEFERRED_MARKER) {
      blocked = true; // só a varredura pós-reset reprocessa, nunca o poll
      continue;
    }
    pendingId = row.id; // pendente saudável, nunca tentado por esta chamada ainda
  }
  if (pendingId) return pendingId;
  if (blocked) return null;

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

export type Scheduler = (promise: Promise<void>) => void;

// Varredura (Gate APA-01, opção (b)): roda em toda chamada da rota, pra
// qualquer conteúdo — nunca kind='aula_manual'/'enriquecimento' (fora do
// escopo deste card). Dois papéis: (1) destrava 'processando' preso há mais
// de 5 min (mesma regra do dedupe acima); (2) retoma 'pendente' criado antes
// da meia-noite UTC mais recente — cobre tanto um item parado por um
// travamento de infraestrutura quanto um adiado por cota (QUOTA_DEFERRED_MARKER),
// já que depois do reset a cota de ontem não importa mais. Usa só os
// índices idx_atlas_apache_queue_status/idx_atlas_apache_queue_content_kind_status.
export async function sweepQueue(
  db: D1Like,
  bucket: R2Like,
  ai: AiLike,
  now: string,
  schedule: Scheduler,
  limit = SWEEP_LIMIT,
): Promise<void> {
  const midnight = mostRecentUtcMidnight(now);
  const staleBefore = new Date(new Date(now).getTime() - STALE_PROCESSING_MS).toISOString();
  const { results } = await db
    .prepare(
      `SELECT id, content_id, status, started_at, attempts, last_error FROM atlas_apache_queue
       WHERE kind = 'aula' AND (
         (status = 'pendente' AND created_at < ?1)
         OR (status = 'processando' AND started_at < ?2)
       )
       ORDER BY created_at LIMIT ?3`,
    )
    .bind(midnight, staleBefore, limit)
    .all<QueueRow>();

  for (const row of results) {
    if (row.status === 'processando') {
      const nextStatus = await recoverStaleItem(db, row, now);
      if (nextStatus === 'pendente') schedule(processQueueItem(db, bucket, ai, row.id, row.content_id, now));
      continue;
    }
    schedule(processQueueItem(db, bucket, ai, row.id, row.content_id, now));
  }
}

async function deferForQuota(db: D1Like, queueId: string, contentId: string, now: string): Promise<void> {
  await db.batch([
    db
      .prepare(`UPDATE atlas_apache_queue SET status = 'pendente', started_at = NULL, last_error = ?2 WHERE id = ?1`)
      .bind(queueId, QUOTA_DEFERRED_MARKER),
    db
      .prepare(`UPDATE atlas_apache_lessons SET status = 'pendente', updated_at = ?2 WHERE content_id = ?1 AND status = 'gerando'`)
      .bind(contentId, now),
  ]);
}

// Processa 1 item da fila: reivindica o item com um UPDATE condicional
// (WHERE status='pendente') pra nunca processar o mesmo item 2x em
// paralelo (2 abas pollando ao mesmo tempo, por exemplo — o dedupe acima
// reduz a chance, mas não cobre a corrida entre a leitura e esta escrita).
// Depois checa o orçamento de neurons (adia sem chamar a IA se já passou de
// 90%), chama writeLesson (APA-06) e marca 'concluido'/'erro'. Um 429 do
// writer (cota local ou erro 3036 da Cloudflare) adia pra depois do reset —
// nunca marca erro por falta de cota. Qualquer outra falha (ex.: writeLesson
// esgotou os retries dele, ou uma falha de R2/D1 fora do controle dele)
// marca a aula como erro também — sem isso ela ficava 'pendente' para
// sempre, sem o cliente nunca ver um erro.
export async function processQueueItem(
  db: D1Like,
  bucket: R2Like,
  ai: AiLike,
  queueId: string,
  contentId: string,
  now: string,
): Promise<void> {
  const [claim] = await db.batch([
    db
      .prepare(`UPDATE atlas_apache_queue SET status = 'processando', started_at = ?2, last_error = NULL WHERE id = ?1 AND status = 'pendente'`)
      .bind(queueId, now),
  ]);
  if (claim.meta.changes === 0) return; // outra chamada já reivindicou este item

  const budget = await neuronBudgetRemaining(db, now);
  if (budget.overLimit) {
    await deferForQuota(db, queueId, contentId, now);
    return;
  }

  await db.batch([
    db
      .prepare(`UPDATE atlas_apache_lessons SET status = 'gerando', updated_at = ?2 WHERE content_id = ?1 AND status = 'pendente'`)
      .bind(contentId, now),
  ]);

  try {
    await writeLesson(db, bucket, ai, contentId, now);
    await db.batch([
      db.prepare(`UPDATE atlas_apache_queue SET status = 'concluido', processed_at = ?2 WHERE id = ?1`).bind(queueId, now),
    ]);
  } catch (error) {
    if (error instanceof ApacheError && error.status === 429) {
      await deferForQuota(db, queueId, contentId, now);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    await db.batch([
      db
        .prepare(`UPDATE atlas_apache_queue SET status = 'erro', last_error = ?2, processed_at = ?3 WHERE id = ?1`)
        .bind(queueId, message.slice(0, MAX_LAST_ERROR_CHARS), now),
    ]);
    try {
      await markFailed(db, contentId, message, now);
    } catch {
      // writeLesson já marca a aula como erro quando a falha é dele (ex.: 2
      // respostas inválidas); isto cobre qualquer outra falha que escape
      // dos retries dele (ex.: R2/D1), que senão deixaria a aula pendente
      // para sempre.
    }
  }
}

const CONTENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

async function assertContentExists(db: D1Like, contentId: string): Promise<void> {
  if (!CONTENT_ID_PATTERN.test(contentId)) {
    throw new ApacheError('Conteúdo não encontrado.', 404);
  }
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
  const json = new TextDecoder().decode(await gunzip(bytes));
  return validateEnrichment(JSON.parse(json));
}

// Mensagem genérica (Gate APA-14/DEC-020 item 8): a aula nunca repassa
// error_message (interno, de log) ao cliente.
const GENERIC_LESSON_ERROR_MESSAGE = 'Não foi possível gerar esta aula agora. Tente de novo mais tarde.';

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
    await sweepQueue(db, bucket, ai, now, schedule);
  }

  await assertContentExists(db, contentId);

  let statusRow = await getLessonStatus(db, contentId);
  if (!statusRow) {
    await ensurePendingLesson(db, contentId, now);
    statusRow = { status: 'pendente', error_message: null };
  }

  if (statusRow.status === 'pendente' || statusRow.status === 'gerando') {
    if (ai && bucket) {
      const queueId = await enqueueLessonIfNeeded(db, contentId, 'aula', now);
      if (queueId) schedule(processQueueItem(db, bucket, ai, queueId, contentId, now));
    }
    return { status: 'pendente' };
  }

  if (statusRow.status === 'erro') {
    return { status: 'erro', errorMessage: GENERIC_LESSON_ERROR_MESSAGE };
  }

  if (!bucket) throw new ApacheError('Armazenamento indisponível.', 503);
  const loaded = await readLesson(db, bucket, contentId);
  if (!loaded) throw new ApacheError('Aula não encontrada.', 500);

  let enrichment: LessonResponse['enrichment'];
  try {
    const enrichmentRow = await getConcludedEnrichment(db, contentId, getApacheUserId());
    if (enrichmentRow?.object_key) {
      const ficha = await readEnrichmentFicha(bucket, enrichmentRow.object_key);
      const diff = diffEnrichmentAgainstLesson(loaded.lesson, ficha);
      enrichment = { status: 'concluido', novos: diff.novos, reforcos: diff.reforcos };
    }
  } catch {
    // Ficha corrompida/inconsistente no R2 não derruba a aula em si (que já
    // está pronta e validada) — só omite o bloco de enriquecimento desta
    // resposta.
    enrichment = undefined;
  }

  return {
    status: statusRow.status as 'gerada' | 'reportada',
    lesson: renderLesson(loaded.lesson),
    enrichment,
  };
}
