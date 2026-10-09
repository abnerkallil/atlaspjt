import { env } from 'cloudflare:workers';
import {
  getExamAttempt,
  hasRollover,
  lockExam,
  submitExam,
} from '@/lib/apolo/exam';
import { answerFinalQuestion, lockFinal, submitFinal } from '@/lib/apolo/final';
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
//   { action: 'responder', questionId, answer } → (só atividade final e
//     recuperação, APO-19) responde a questão da vez, na ordem, com o relógio
//     do servidor — é o que mede o tempo com rolagem;
//   { action: 'travar', answers } → trava as respostas e devolve o gabarito das dissertativas;
//   { action: 'enviar', answers?, selfAssessments? } → corrige, emite o boletim e entrega a prova.
export async function POST(request: Request, { params }: Context) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      questionId?: unknown;
      answer?: unknown;
      answers?: unknown;
      selfAssessments?: unknown;
    };
    const current = await getExamAttempt(db, id);
    if (!current)
      return Response.json(
        { error: 'Tentativa não encontrada.' },
        { status: 404 },
      );
    const payload = {
      answers: body.answers,
      selfAssessments: body.selfAssessments,
    };
    let attempt;
    if (hasRollover(current.instrument)) {
      attempt =
        body.action === 'responder'
          ? await answerFinalQuestion(db, id, body.questionId, body.answer)
          : body.action === 'travar'
            ? await lockFinal(db, id, body.answers)
            : await submitFinal(db, id, payload);
    } else {
      if (body.action === 'responder')
        return Response.json(
          {
            error:
              'O exame de meio de curso não tem resposta questão a questão: envie todas as respostas juntas.',
          },
          { status: 400 },
        );
      attempt =
        body.action === 'travar'
          ? await lockExam(db, id, body.answers)
          : await submitExam(db, id, payload);
    }
    return Response.json({ attempt, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}
