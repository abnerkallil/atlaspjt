// APA-05 (Gate APA-01, DEC-019): aula base do Apache em R2 (gzip, nunca
// brotli — sem suporte no workerd), status/versão/modelo em D1
// (atlas_apache_lessons). Aula regerada sobrescreve o objeto R2 anterior,
// sem histórico de versão. Mesmo princípio de lib/apolo/sources.ts: aqui só
// regras puras e D1 (D1Like, testável com SQLite em memória); os bytes
// passam por um `bucket` mínimo (R2Like), injetado pela rota com o binding
// real (`ATTACHMENTS`).
import type { D1Like } from '../pedagogy/transitions.js';
import { ApacheError } from './errors.js';
import { validateLesson, type ApacheLesson } from './schema.js';

export type R2Like = {
  put(key: string, bytes: Uint8Array, options?: { httpMetadata?: { contentType?: string; contentEncoding?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream<Uint8Array> } | null>;
  delete(key: string): Promise<void>;
};

type LessonRow = {
  model: string | null;
  object_key: string | null;
  status: string;
  version: number;
  reported_count: number;
};

export function lessonObjectKey(contentId: string, version: number) {
  return `apache/aulas/${contentId}/v${version}.json.gz`;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.slice().buffer]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.slice().buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function getLessonRow(db: D1Like, contentId: string): Promise<LessonRow | null> {
  return db
    .prepare(
      `SELECT model, object_key, status, version, reported_count
       FROM atlas_apache_lessons WHERE content_id = ?1`,
    )
    .bind(contentId)
    .first<LessonRow>();
}

export type LessonStatusRow = { status: string; error_message: string | null };

// Leitura mínima de status (PK, sem tocar R2) — usada pelo polling de
// GET /api/apache/aulas/:contentId (APA-07) para decidir o que responder
// sem gastar uma leitura do R2 enquanto a aula não está pronta (gerada/reportada).
export async function getLessonStatus(db: D1Like, contentId: string): Promise<LessonStatusRow | null> {
  return db
    .prepare(`SELECT status, error_message FROM atlas_apache_lessons WHERE content_id = ?1`)
    .bind(contentId)
    .first<LessonStatusRow>();
}

// Cria a linha 'pendente' na primeira vez que alguém abre a sessão de estudo
// deste conteúdo (APA-07). ON CONFLICT DO NOTHING: idempotente para duas
// requisições concorrentes (poll de duas abas) criando a linha ao mesmo tempo.
export async function ensurePendingLesson(db: D1Like, contentId: string, now: string): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_apache_lessons (id, content_id, status, version, reported_count, updated_at)
         VALUES (?1, ?2, 'pendente', 1, 0, ?3)
         ON CONFLICT(content_id) DO NOTHING`,
      )
      .bind(crypto.randomUUID(), contentId, now),
  ]);
}

// Grava a aula nova no R2 e faz o UPSERT em atlas_apache_lessons. Sobrescreve
// sem histórico: a versão anterior é apagada do bucket depois que a nova já
// está gravada (nunca ao contrário, para não ficar sem nenhuma versão se o
// `put` falhar).
export async function saveLesson(
  db: D1Like,
  bucket: R2Like,
  contentId: string,
  lesson: ApacheLesson,
  model: string,
  now: string,
): Promise<{ version: number; objectKey: string }> {
  validateLesson(lesson);
  const current = await getLessonRow(db, contentId);
  // Uma linha 'pendente' sem object_key (criada pelo APA-07 antes de gerar)
  // não conta como versão anterior: a primeira aula nasce v1, não v2.
  const version = current?.object_key ? current.version + 1 : 1;
  const objectKey = lessonObjectKey(contentId, version);
  const bytes = await gzip(new TextEncoder().encode(JSON.stringify(lesson)));
  await bucket.put(objectKey, bytes, {
    httpMetadata: { contentType: 'application/json', contentEncoding: 'gzip' },
  });

  const id = current ? undefined : crypto.randomUUID();
  await db.batch([
    current
      ? db
          .prepare(
            `UPDATE atlas_apache_lessons
             SET status = 'gerada', version = ?2, model = ?3, object_key = ?4,
                 generated_at = ?5, error_message = NULL, updated_at = ?5
             WHERE content_id = ?1`,
          )
          .bind(contentId, version, model, objectKey, now)
      : db
          .prepare(
            `INSERT INTO atlas_apache_lessons
             (id, content_id, status, version, model, object_key, generated_at, reported_count, error_message, updated_at)
             VALUES (?1, ?2, 'gerada', ?3, ?4, ?5, ?6, 0, NULL, ?6)`,
          )
          .bind(id, contentId, version, model, objectKey, now),
  ]);

  if (current?.object_key && current.object_key !== objectKey) {
    await bucket.delete(current.object_key);
  }
  return { version, objectKey };
}

// null quando a aula não está pronta para exibir (pendente, gerando, erro —
// 'reportada' ainda mostra a última aula boa até a próxima geração).
export async function readLesson(
  db: D1Like,
  bucket: R2Like,
  contentId: string,
): Promise<{ lesson: ApacheLesson; version: number } | null> {
  const row = await getLessonRow(db, contentId);
  if (!row || (row.status !== 'gerada' && row.status !== 'reportada') || !row.object_key) {
    return null;
  }
  const object = await bucket.get(row.object_key);
  if (!object) {
    throw new ApacheError(`Aula do conteúdo "${contentId}" não encontrada no armazenamento.`, 500);
  }
  const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
  try {
    const json = new TextDecoder().decode(await gunzip(bytes));
    return { lesson: validateLesson(JSON.parse(json)), version: row.version };
  } catch {
    // gzip corrompido, JSON inválido ou aula fora do schema: é corrupção do
    // que foi gravado no bucket, não um erro do cliente — nunca vaza o
    // TypeError/SyntaxError/ApacheError(400) original.
    throw new ApacheError('Aula armazenada corrompida.', 500);
  }
}

// "Reportar erro": marca a aula ativa como reportada e enfileira uma nova
// geração — kind 'aula_manual' quando a aula atual foi escrita a mão pelo
// Claude (model === 'claude-manual'), senão 'aula' (regenerada pela IA).
// Idempotente: não duplica a fila se já existe um pedido pendente/em
// andamento do mesmo kind para este conteúdo.
const STALE_PROCESSING_MS = 5 * 60 * 1000;

export type MarkReportedResult = { kind: 'aula' | 'aula_manual'; queued: boolean };

export async function markReported(db: D1Like, contentId: string, now: string): Promise<MarkReportedResult> {
  const row = await getLessonRow(db, contentId);
  if (!row) throw new ApacheError(`Aula do conteúdo "${contentId}" não existe.`, 404);
  // Só uma aula exibível (gerada ou já reportada antes) pode ser reportada de
  // novo; pendente/gerando/erro ainda não tem nada pronto para o usuário ver.
  if (row.status !== 'gerada' && row.status !== 'reportada') {
    throw new ApacheError(`Aula do conteúdo "${contentId}" não está disponível para reportar.`, 409);
  }
  const kind = row.model === 'claude-manual' ? 'aula_manual' : 'aula';

  const candidates = await db
    .prepare(
      `SELECT status, started_at FROM atlas_apache_queue
       WHERE content_id = ?1 AND kind = ?2 AND status IN ('pendente', 'processando')`,
    )
    .bind(contentId, kind)
    .all<{ status: string; started_at: string | null }>();
  // Um item 'processando' preso (consumer da fila interrompido, started_at
  // há mais de 5 min — regra do APA-02/07) não bloqueia um novo pedido.
  const pending = candidates.results.some(
    (item) =>
      item.status === 'pendente' ||
      (item.status === 'processando' &&
        item.started_at !== null &&
        new Date(now).getTime() - new Date(item.started_at).getTime() < STALE_PROCESSING_MS),
  );

  const updateReported = db
    .prepare(
      `UPDATE atlas_apache_lessons
       SET status = 'reportada', reported_count = reported_count + 1, updated_at = ?2
       WHERE content_id = ?1`,
    )
    .bind(contentId, now);

  if (pending) {
    await db.batch([updateReported]);
    // Já havia um item pendente/em andamento saudável — a mensagem dele já
    // foi mandada quando ele foi criado; mandar de novo aqui duplicaria o
    // envio sem nenhum item novo por trás (ex.: reportar duas vezes enquanto
    // a 1ª geração ainda está na fila, ou enquanto está adiada por cota:
    // `deferForQuota` mantém `status = 'pendente'`, então entra em `pending`
    // também, sem precisar checar o sentinela aqui).
    return { kind, queued: false };
  }

  // APA-16: insere atomicamente só se ainda não existir item saudável — fecha
  // a mesma janela de corrida do `enqueueLessonIfNeeded` (APA-07): "reportar
  // erro" e o poll de 5s do cliente (que também pode enfileirar) quase
  // simultâneos podiam ambos ler "nada pendente" na checagem acima e cada um
  // inserir sua própria linha para o mesmo content_id+kind. A condição do
  // `WHERE NOT EXISTS` replica exatamente o `pending` calculado acima
  // (`?5` = `staleBefore`, o mesmo corte de `STALE_PROCESSING_MS`) — sem
  // isso, um `processando` preso (>5min, que `pending` corretamente ignora)
  // bloquearia o INSERT para sempre.
  const staleBefore = new Date(new Date(now).getTime() - STALE_PROCESSING_MS).toISOString();
  const queueId = crypto.randomUUID();
  const [, insert] = await db.batch([
    updateReported,
    db
      .prepare(
        `INSERT INTO atlas_apache_queue (id, content_id, kind, status, attempts, created_at)
         SELECT ?1, ?2, ?3, 'pendente', 0, ?4
         WHERE NOT EXISTS (
           SELECT 1 FROM atlas_apache_queue
           WHERE content_id = ?2 AND kind = ?3
             AND (status = 'pendente' OR (status = 'processando' AND started_at >= ?5))
         )`,
      )
      .bind(queueId, contentId, kind, now, staleBefore),
  ]);
  // Perdeu a corrida: outra chamada concorrente (ex.: o poll de 5s) já criou
  // o item saudável entre a leitura acima e este INSERT. `queued: false` —
  // essa chamada concorrente é responsável pelo próprio item, incluindo
  // mandar a mensagem pra fila; "adotar" o item dela e mandar uma mensagem
  // por conta própria não é seguro (pode já estar adiado por cota, por
  // exemplo).
  return { kind, queued: insert.meta.changes > 0 };
}

const MAX_ERROR_MESSAGE_CHARS = 200;

// error_message é só para o painel interno/log — NUNCA repassado ao cliente
// como está (Gate APA-14/DEC-020 item 8: a API responde uma mensagem
// genérica, nunca este campo). Truncado aqui mesmo assim, para uma causa de
// erro longa (ex.: stack de uma lib externa) nunca inflar a linha sem limite.
export async function markFailed(db: D1Like, contentId: string, message: string, now: string): Promise<void> {
  const row = await getLessonRow(db, contentId);
  if (!row) throw new ApacheError(`Aula do conteúdo "${contentId}" não existe.`, 404);
  await db.batch([
    db
      .prepare(
        `UPDATE atlas_apache_lessons
         SET status = 'erro', error_message = ?2, updated_at = ?3
         WHERE content_id = ?1`,
      )
      .bind(contentId, message.slice(0, MAX_ERROR_MESSAGE_CHARS), now),
  ]);
}
