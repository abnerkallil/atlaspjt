import { env } from 'cloudflare:workers';
import { answerProficiencia, getProficiencyAttempt } from '@/lib/apolo/proficiency';
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
  const attempt = await getProficiencyAttempt(db, id);
  if (!attempt)
    return Response.json(
      { error: 'Tentativa não encontrada.' },
      { status: 404 },
    );
  return Response.json({ attempt, now: new Date().toISOString() });
}

// POST /api/proficiencia/:id { questionId, answer } → responde a questão da
// vez (a única sempre pendente, na ordem apresentada). O motor decide, a
// cada resposta, a próxima questão (a mais informativa pela estimativa de
// habilidade) ou a parada (erro-padrão baixo ou tamanho máximo) — por isso
// não há ação "travar"/"enviar" separada: cada resposta já é o envio dela.
export async function POST(request: Request, { params }: Context) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      questionId?: unknown;
      answer?: unknown;
    };
    const attempt = await answerProficiencia(db, id, body.questionId, body.answer);
    return Response.json({ attempt, now: new Date().toISOString() });
  } catch (error) {
    return quizErrorResponse(error);
  }
}
