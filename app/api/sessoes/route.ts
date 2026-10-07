import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import {
  listOpenSessions,
  listSessions,
  sessionErrorResponse,
  startSession,
} from '@/lib/study-sessions';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// GET /api/sessoes?abertas=1 → sessões em andamento ou pausadas (a mais recente primeiro).
// GET /api/sessoes?conteudo=CG-001 → histórico de sessões do conteúdo.
export async function GET(request: Request) {
  const db = database();
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  try {
    if (params.get('abertas')) return Response.json({ sessions: await listOpenSessions(db) });
    const contentId = params.get('conteudo') ?? undefined;
    return Response.json({ sessions: await listSessions(db, { contentId }), now: new Date().toISOString() });
  } catch (error) {
    return sessionErrorResponse(error);
  }
}

// POST /api/sessoes { contentId } → inicia (ou retoma a sessão aberta do conteúdo).
export async function POST(request: Request) {
  const db = database();
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const body = (await request.json().catch(() => ({}))) as { contentId?: unknown };
    if (typeof body.contentId !== 'string' || !body.contentId.trim()) {
      return Response.json({ error: 'Informe o conteúdo.' }, { status: 400 });
    }
    const session = await startSession(db, body.contentId.trim());
    return Response.json({ session, now: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
