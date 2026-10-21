// APA-12: recebe o texto já extraído no navegador (Tesseract.js, APA-10, ou
// o fallback de letra de mão, APA-11) para um arquivo que não é digital
// (foto/print/PDF escaneado). `POST /api/apache/enriquecimento` (multipart)
// é a rota irmã para PDF/DOCX/XLSX digitais.
import { env } from 'cloudflare:workers';
import { getApacheUserId } from '@/lib/auth';
import { ApacheError } from '@/lib/apache/errors';
import {
  enrichmentOutcomeBody,
  sha256Hex,
  submitEnrichment,
  MAX_TEXT_CHARS_PER_PAGE,
  APACHE_DEFAULT_ENRICHMENT_MODEL,
  type EnrichmentQueueLike,
} from '@/lib/apache/enrichment';
import type { AiLike } from '@/lib/apache/lesson-writer';
import type { R2Like } from '@/lib/apache/lesson-store';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type ApacheBindings = {
  DB?: D1Like;
  ATTACHMENTS?: R2Like;
  AI?: AiLike;
  APACHE_LESSON_QUEUE?: EnrichmentQueueLike;
  APACHE_RATE_LIMITER?: RateLimit;
  APACHE_ENRICHMENT_MODEL?: string;
};

function bindings() {
  const { DB, ATTACHMENTS, AI, APACHE_LESSON_QUEUE, APACHE_RATE_LIMITER, APACHE_ENRICHMENT_MODEL } =
    env as unknown as ApacheBindings;
  if (!DB || !ATTACHMENTS || !AI) {
    throw new ApacheError('Serviço de enriquecimento indisponível.', 503);
  }
  return {
    db: DB,
    bucket: ATTACHMENTS,
    ai: AI,
    queue: APACHE_LESSON_QUEUE ?? null,
    limiter: APACHE_RATE_LIMITER ?? null,
    model: APACHE_ENRICHMENT_MODEL ?? APACHE_DEFAULT_ENRICHMENT_MODEL,
  };
}

async function assertRateLimit(limiter: RateLimit | null, userId: string): Promise<void> {
  if (!limiter) return;
  const { success } = await limiter.limit({ key: `apache-enriquecimento:${userId}` });
  if (!success) {
    throw new ApacheError('Muitas requisições de enriquecimento em pouco tempo. Tente de novo em instantes.', 429);
  }
}

function apacheErrorResponse(error: unknown): Response {
  if (error instanceof ApacheError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('Apache enriquecimento (texto): erro inesperado', error);
  return Response.json({ error: 'Não foi possível processar o envio agora.' }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const userId = getApacheUserId();
    const { db, bucket, ai, queue, limiter, model } = bindings();
    await assertRateLimit(limiter, userId);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') throw new ApacheError('Envio inválido.', 400);
    const { contentId, text, pages } = body as Record<string, unknown>;

    if (typeof contentId !== 'string' || !contentId.trim()) throw new ApacheError('Informe contentId.', 400);
    if (typeof text !== 'string' || !text.trim()) throw new ApacheError('Informe o texto extraído.', 400);
    if (typeof pages !== 'number' || !Number.isInteger(pages) || pages <= 0) {
      throw new ApacheError('Informe pages (número de páginas do envio).', 400);
    }
    // Gate APA-14: teto de tamanho de texto proporcional ao número de
    // páginas informado -- um `pages` mentiroso não contorna a cota diária
    // (APA-13) nem o corte síncrono/fila.
    if (text.length > pages * MAX_TEXT_CHARS_PER_PAGE) {
      throw new ApacheError('Texto maior que o esperado para o número de páginas informado.', 413);
    }

    const now = new Date().toISOString();
    const sourceHash = await sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);

    const outcome = await submitEnrichment({
      db,
      bucket,
      ai,
      model,
      queue,
      contentId,
      userId,
      text,
      pages,
      sourceHash,
      now,
    });

    return Response.json(enrichmentOutcomeBody(outcome), { status: 202 });
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
