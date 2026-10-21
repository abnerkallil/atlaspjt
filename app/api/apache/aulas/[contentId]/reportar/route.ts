import { env } from 'cloudflare:workers';
import { apacheErrorResponse } from '@/lib/apache/errors';
import { markReported } from '@/lib/apache/lesson-store';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ contentId: string }> };

function bindings() {
  const { DB } = env as unknown as { DB?: D1Like };
  return { db: DB ?? null };
}

// POST /api/apache/aulas/:contentId/reportar → aluno reporta erro na aula
// (APA-08). markReported (APA-05) só marca o status 'reportada' e enfileira
// uma nova geração (atlas-apache-queue, consumida pela fila do APA-07) — a
// aula atual continua visível, nunca é escondida.
export async function POST(_request: Request, { params }: Context) {
  try {
    const { db } = bindings();
    if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const { contentId } = await params;
    await markReported(db, contentId, new Date().toISOString());
    return Response.json({ ok: true });
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
