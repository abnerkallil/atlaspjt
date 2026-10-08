import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import {
  listAttempts,
  listQuizQueue,
  quizErrorResponse,
  startQuiz,
} from '@/lib/quizzes';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// GET /api/quizzes → quizzes liberados (conteúdos aguardando quiz) e tentativas recentes.
// GET /api/quizzes?conteudo=CG-001 → tentativas daquele conteúdo.
export async function GET(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const contentId =
      new URL(request.url).searchParams.get('conteudo') ?? undefined;
    const [queue, attempts] = await Promise.all([
      contentId ? Promise.resolve([]) : listQuizQueue(db),
      listAttempts(db, { contentId }),
    ]);
    return Response.json({ queue, attempts, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}

// POST /api/quizzes { contentId } → começa o quiz do conteúdo (ou devolve o que está em andamento).
export async function POST(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const body = (await request.json().catch(() => ({}))) as {
      contentId?: unknown;
    };
    if (typeof body.contentId !== 'string' || !body.contentId.trim()) {
      return Response.json({ error: 'Informe o conteúdo.' }, { status: 400 });
    }
    const attempt = await startQuiz(db, body.contentId.trim());
    return Response.json(
      { attempt, now: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return quizErrorResponse(error);
  }
}
