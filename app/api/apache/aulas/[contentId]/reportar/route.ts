import { env } from 'cloudflare:workers';
import { apacheErrorResponse } from '@/lib/apache/errors';
import { handleReportAula, type QueueLike } from '@/lib/apache/queue';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ contentId: string }> };

function bindings() {
  const { DB, APACHE_LESSON_QUEUE } = env as unknown as {
    DB?: D1Like;
    APACHE_LESSON_QUEUE?: QueueLike;
  };
  return { db: DB ?? null, queue: APACHE_LESSON_QUEUE ?? null };
}

// POST /api/apache/aulas/:contentId/reportar → aluno reporta erro na aula
// (APA-08). handleReportAula (lib/apache/queue.ts) marca o status
// 'reportada' (markReported, APA-05) e manda a aula pra fila
// `atlas-apache-aulas` (Cloudflare Queues, consumida pelo APA-07) — a aula
// atual continua visível, nunca é escondida.
export async function POST(_request: Request, { params }: Context) {
  try {
    const { db, queue } = bindings();
    if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const { contentId } = await params;
    await handleReportAula(db, queue, contentId, new Date().toISOString());
    return Response.json({ ok: true });
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
