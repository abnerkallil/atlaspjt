import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import {
  concludeSession,
  getSession,
  pauseSession,
  resumeSession,
  saveCheckpoint,
  sessionErrorResponse,
} from '@/lib/study-sessions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

export async function GET(_request: Request, { params }: Context) {
  const db = database();
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  const session = await getSession(db, id);
  if (!session) return Response.json({ error: 'Sessão não encontrada.' }, { status: 404 });
  return Response.json({ session, now: new Date().toISOString() });
}

// PATCH /api/sessoes/:id { action: "pausar" | "retomar" | "salvar-ponto" | "concluir", checkpoint? }
export async function PATCH(request: Request, { params }: Context) {
  const db = database();
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: unknown; checkpoint?: unknown };
    let session;
    if (body.action === 'pausar') session = await pauseSession(db, id, { checkpoint: body.checkpoint });
    else if (body.action === 'retomar') session = await resumeSession(db, id);
    else if (body.action === 'salvar-ponto') session = await saveCheckpoint(db, id, body.checkpoint);
    else if (body.action === 'concluir') session = await concludeSession(db, id, { checkpoint: body.checkpoint });
    else return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    return Response.json({ session, now: new Date().toISOString() });
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
