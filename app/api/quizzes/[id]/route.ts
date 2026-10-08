import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import {
  getAttempt,
  lockQuiz,
  quizErrorResponse,
  submitQuiz,
} from '@/lib/quizzes';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

export async function GET(_request: Request, { params }: Context) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  const attempt = await getAttempt(db, id);
  if (!attempt)
    return Response.json(
      { error: 'Tentativa não encontrada.' },
      { status: 404 },
    );
  return Response.json({ attempt, now: new Date().toISOString() });
}

// POST /api/quizzes/:id
//   { action: 'travar', answers } → trava as respostas e devolve o gabarito das dissertativas;
//   { action: 'enviar', answers?, selfAssessments? } → corrige e registra o resultado.
export async function POST(request: Request, { params }: Context) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      answers?: unknown;
      selfAssessments?: unknown;
    };
    const attempt =
      body.action === 'travar'
        ? await lockQuiz(db, id, body.answers)
        : await submitQuiz(db, id, {
            answers: body.answers,
            selfAssessments: body.selfAssessments,
          });
    return Response.json({ attempt, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}
