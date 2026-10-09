import { env } from 'cloudflare:workers';
import { startProficiencia } from '@/lib/apolo/proficiency';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { quizErrorResponse } from '@/lib/quizzes';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// POST /api/proficiencia { contentId } → começa o exame de proficiência do
// conteúdo (APO-20, DEC-05), ou devolve o que já está em andamento. Só vale
// antes de começar o conteúdo (`nao-iniciado`); nota acima de 85% dispensa
// sem precisar estudar, sem afetar nenhuma outra nota.
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
    const attempt = await startProficiencia(db, body.contentId.trim());
    return Response.json(
      { attempt, now: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return quizErrorResponse(error);
  }
}
