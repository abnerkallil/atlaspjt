import { env } from 'cloudflare:workers';
import { getExamAttempt, lockExam, submitExam } from '@/lib/apolo/exam';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { quizErrorResponse } from '@/lib/quizzes';

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
  const attempt = await getExamAttempt(db, id);
  if (!attempt)
    return Response.json(
      { error: 'Tentativa não encontrada.' },
      { status: 404 },
    );
  return Response.json({ attempt, now: new Date().toISOString() });
}

// POST /api/exames/:id
//   { action: 'travar', answers } → trava as respostas e devolve o gabarito das dissertativas;
//   { action: 'enviar', answers?, selfAssessments? } → corrige, emite o boletim e entrega o exame.
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
        ? await lockExam(db, id, body.answers)
        : await submitExam(db, id, {
            answers: body.answers,
            selfAssessments: body.selfAssessments,
          });
    return Response.json({ attempt, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}
