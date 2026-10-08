import { env } from 'cloudflare:workers';
import { approveDraft, draftErrorResponse } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

// POST: aprova um rascunho pendente — grava a questão em atlas_questions, já
// ativa (aparece no próximo quiz do conteúdo); exige conteúdo, Bloom e
// explicação já preenchidos.
export async function POST(_request: Request, { params }: Context) {
  try {
    const { DB } = env as unknown as { DB?: D1Like };
    if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const { draft, questionId } = await approveDraft(DB, (await params).id, new Date().toISOString());
    return Response.json({ draft, questionId });
  } catch (error) {
    return draftErrorResponse(error);
  }
}
