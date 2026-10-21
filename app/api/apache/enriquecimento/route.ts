// APA-12: upload do material do aluno (PDF/DOCX/XLSX) para enriquecimento --
// rota própria, NÃO é o formulário "Adicionar material" (lib/materials.ts).
import { env } from 'cloudflare:workers';
import { getApacheUserId } from '@/lib/auth';
import { ApacheError } from '@/lib/apache/errors';
import { enrichmentOutcomeBody, sha256Hex, submitEnrichment, APACHE_DEFAULT_ENRICHMENT_MODEL } from '@/lib/apache/enrichment';
import type { AiLike } from '@/lib/apache/lesson-writer';
import type { R2Like } from '@/lib/apache/lesson-store';
import type { EnrichmentQueueLike } from '@/lib/apache/enrichment';
import { extractDigital, type MarkdownConversionAi } from '@/lib/apache/ingest-digital';
import { MAX_APACHE_UPLOAD_BYTES, validateApacheUpload } from '@/lib/apache/upload-validation';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// Margem de framing do multipart em cima do teto do arquivo (mesmo
// princípio de app/api/attachments/route.ts).
const MAX_BODY_BYTES = MAX_APACHE_UPLOAD_BYTES + 64 * 1024;

type ApacheBindings = {
  DB?: D1Like;
  ATTACHMENTS?: R2Like;
  AI?: AiLike & MarkdownConversionAi;
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

// Gate APA-14 item 7: 20 req/min por usuário, checado antes de tudo (nem
// chega a ler o corpo do envio se já estiver no limite).
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
  console.error('Apache enriquecimento (multipart): erro inesperado', error);
  return Response.json({ error: 'Não foi possível processar o envio agora.' }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const userId = getApacheUserId();
    const { db, bucket, ai, queue, limiter, model } = bindings();
    await assertRateLimit(limiter, userId);

    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new ApacheError('Arquivo maior que 10 MB.', 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApacheError('Envio inválido.', 400);
    }
    const contentId = form.get('contentId');
    const file = form.get('file');
    if (typeof contentId !== 'string' || !contentId.trim()) throw new ApacheError('Informe contentId.', 400);
    if (!(file instanceof File)) throw new ApacheError('Informe o arquivo.', 400);

    const bytes = await file.arrayBuffer();
    validateApacheUpload(bytes, file.type);

    // Hash calculado antes de qualquer descarte de bytes (card APA-12) --
    // dedupe aqui evita até o custo de extração num reenvio idêntico.
    const sourceHash = await sha256Hex(bytes);
    const now = new Date().toISOString();

    const extraction = await extractDigital(ai, { bytes, mimeType: file.type, name: file.name });
    // Os bytes originais nunca vão para R2 -- só o texto extraído segue
    // adiante, e esta função não guarda referência a `bytes` depois daqui.

    if (extraction.provavelmenteEscaneado) {
      // PDF escaneado: toMarkdown (sem OCR) voltou vazio/quase vazio -- o
      // cliente deve refazer via Tesseract.js (APA-10) e mandar o texto
      // extraído para POST /api/apache/enriquecimento/texto.
      return Response.json({ scanned: true }, { status: 200 });
    }

    const outcome = await submitEnrichment({
      db,
      bucket,
      ai,
      model,
      queue,
      contentId,
      userId,
      text: extraction.markdown,
      pages: extraction.pages,
      sourceHash,
      now,
    });

    return Response.json(enrichmentOutcomeBody(outcome), { status: 202 });
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
