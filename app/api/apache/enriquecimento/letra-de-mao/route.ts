// APA-12/APA-11: fallback de letra de mão. Recebe 1 imagem já redimensionada
// no navegador (lado maior ~1120px, JPEG -- card APA-11) e devolve o texto
// transcrito, para o formulário de envio (APA-12) juntar com o restante do
// texto extraído por OCR antes de mandar para POST /api/apache/enriquecimento/texto.
// Não persiste nada: nem os bytes da imagem (apagados pelo próprio
// extractHandwriting depois da chamada ao modelo de visão), nem o texto
// devolvido -- quem grava é sempre a rota /texto.
import { env } from 'cloudflare:workers';
import { getApacheUserId } from '@/lib/auth';
import { ApacheError } from '@/lib/apache/errors';
import { extractHandwriting, MAX_HANDWRITING_FILE_BYTES, type VisionAi } from '@/lib/apache/ingest-handwriting';
import { assertQuota, refundQuota } from '@/lib/apache/quota';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

const MAX_BODY_BYTES = MAX_HANDWRITING_FILE_BYTES + 16 * 1024;

type ApacheBindings = {
  DB?: D1Like;
  AI?: VisionAi;
  APACHE_RATE_LIMITER?: RateLimit;
};

function bindings() {
  const { DB, AI, APACHE_RATE_LIMITER } = env as unknown as ApacheBindings;
  if (!DB || !AI) throw new ApacheError('Serviço de enriquecimento indisponível.', 503);
  return { db: DB, ai: AI, limiter: APACHE_RATE_LIMITER ?? null };
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
  console.error('Apache enriquecimento (letra de mão): erro inesperado', error);
  return Response.json({ error: 'Não foi possível ler esta página agora.' }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const userId = getApacheUserId();
    const { db, ai, limiter } = bindings();
    await assertRateLimit(limiter, userId);

    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new ApacheError('Arquivo maior que 1.5 MB. Envie uma foto já reduzida.', 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApacheError('Envio inválido.', 400);
    }
    const file = form.get('file');
    if (!(file instanceof File)) throw new ApacheError('Informe o arquivo.', 400);

    // Debita 1 página pela imagem transcrita (card APA-12/APA-13) -- esta
    // rota não grava nada em atlas_apache_enrichments (quem faz isso é
    // /texto, depois de juntar este texto com o resto do OCR), então o
    // débito/refund aqui não tem windowStart salvo em lugar nenhum: usa o
    // que assertQuota devolveu nesta mesma chamada.
    const now = new Date();
    const windowStart = await assertQuota(db, userId, 1, now);

    const bytes = await file.arrayBuffer();
    try {
      const { text } = await extractHandwriting(ai, db, bytes, file.type);
      return Response.json({ text });
    } catch (error) {
      await refundQuota(db, userId, 1, windowStart, now);
      throw error;
    }
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
