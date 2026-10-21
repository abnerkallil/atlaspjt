import { env } from 'cloudflare:workers';
import { getRequestExecutionContext } from 'vinext/shims/request-context';
import { apacheErrorResponse } from '@/lib/apache/errors';
import type { AiLike } from '@/lib/apache/lesson-writer';
import type { R2Like } from '@/lib/apache/lesson-store';
import { handleGetAula } from '@/lib/apache/queue';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ contentId: string }> };

function bindings() {
  const { DB, ATTACHMENTS, AI } = env as unknown as { DB?: D1Like; ATTACHMENTS?: R2Like; AI?: AiLike };
  return { db: DB ?? null, bucket: ATTACHMENTS ?? null, ai: AI ?? null };
}

// Agenda o processamento em segundo plano via ctx.waitUntil (Gate APA-01,
// opção (b): sem Cron Trigger). Sem ExecutionContext (ex.: `pnpm dev` sem
// APACHE_AI_DEV=1), dispara mesmo assim sem bloquear a resposta, só sem a
// garantia de não ser interrompido pelo runtime.
function schedule(promise: Promise<void>) {
  const ctx = getRequestExecutionContext();
  if (ctx) {
    ctx.waitUntil(promise);
  } else {
    promise.catch(() => {});
  }
}

// GET /api/apache/aulas/:contentId → status/aula do Apache (APA-07).
// Chamado a cada 5s pelo polling de ContentLesson (APA-04) enquanto a
// sessão de estudo deste conteúdo estiver aberta: só leituras por PK/índice
// aqui, nunca uma chamada de IA no caminho de leitura — a geração em si
// roda em segundo plano (processQueueItem, agendado via `schedule` acima).
export async function GET(_request: Request, { params }: Context) {
  try {
    const { db, bucket, ai } = bindings();
    if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const { contentId } = await params;
    const now = new Date().toISOString();
    const response = await handleGetAula(db, bucket, ai, contentId, now, schedule);
    return Response.json(response);
  } catch (error) {
    return apacheErrorResponse(error);
  }
}
