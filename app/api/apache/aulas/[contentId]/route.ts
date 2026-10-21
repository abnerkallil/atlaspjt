import { env } from 'cloudflare:workers';
import { apacheErrorResponse } from '@/lib/apache/errors';
import type { R2Like } from '@/lib/apache/lesson-store';
import { handleGetAula, type QueueLike } from '@/lib/apache/queue';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ contentId: string }> };

function bindings() {
  const { DB, ATTACHMENTS, APACHE_LESSON_QUEUE } = env as unknown as {
    DB?: D1Like;
    ATTACHMENTS?: R2Like;
    APACHE_LESSON_QUEUE?: QueueLike;
  };
  return { db: DB ?? null, bucket: ATTACHMENTS ?? null, queue: APACHE_LESSON_QUEUE ?? null };
}

// GET /api/apache/aulas/:contentId → status/aula do Apache (APA-07).
// Chamado a cada 5s pelo polling de ContentLesson (APA-04) enquanto a
// sessão de estudo deste conteúdo estiver aberta: só leituras por PK/índice
// aqui, nunca uma chamada de IA no caminho de leitura — a geração em si
// roda no consumer da fila `atlas-apache-aulas` (worker-entry.ts, DEC-019:
// Cloudflare Queues), nunca nesta rota.
export async function GET(_request: Request, { params }: Context) {
  try {
    const { db, bucket, queue } = bindings();
    if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const { contentId } = await params;
    const now = new Date().toISOString();
    const response = await handleGetAula(db, bucket, queue, contentId, now);
    return Response.json(response);
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
