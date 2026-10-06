import { env } from 'cloudflare:workers';
import { TransitionError, applyTransition, type D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

const STATUS: Record<TransitionError['code'], number> = {
  invalid: 409,
  conflict: 409,
  prerequisite: 409,
  confirmation: 400,
  evidence: 400,
  'not-found': 404,
};

// Começar a estudar um conteúdo (DEC-03 "abrir material"). Recusa com 409 se
// os pré-requisitos não estiverem cumpridos (MVP-01). Grava auditoria (TEC-06).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const { id } = await params;
  try {
    const entry = await applyTransition(db, {
      entityType: 'conteudo',
      entityId: id,
      event: 'abrir-material',
      actor: 'usuario',
      reason: 'Começou a estudar pelo Roadmap.',
    });
    return Response.json({ entry });
  } catch (error) {
    if (error instanceof TransitionError) {
      return Response.json({ error: error.message, code: error.code }, { status: STATUS[error.code] });
    }
    return Response.json({ error: 'Não foi possível começar este conteúdo.' }, { status: 500 });
  }
}
