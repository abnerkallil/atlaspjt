import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { listAttempts, quizErrorResponse, startAtividade } from '@/lib/quizzes';

export const runtime = 'edge';

function database() {
  return (env as unknown as { DB?: D1Like }).DB;
}

// GET /api/atividades?conteudo=CG-001 → tentativas de atividade daquele conteúdo.
export async function GET(request: Request) {
  const db = database();
  if (!db)
    return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const contentId =
    new URL(request.url).searchParams.get('conteudo') ?? undefined;
  const attempts = (await listAttempts(db, { contentId })).filter(
    (item) => item.purpose === 'atividade',
  );
  return Response.json({ attempts, now: new Date().toISOString() });
}

// POST /api/atividades { contentId } → começa a atividade do conteúdo (ou
// devolve a que está em andamento). APO-17 (DEC-018): independente do
// state do conteúdo — sempre disponível, não só quando o quiz libera.
// Envio e correção reaproveitam a rota já existente (POST /api/quizzes/:id),
// que corrige por id da tentativa sem olhar o purpose.
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
    const attempt = await startAtividade(db, body.contentId.trim());
    return Response.json(
      { attempt, now: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return quizErrorResponse(error);
  }
}
