import { env } from 'cloudflare:workers';
import { discardDraft, draftErrorResponse } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

// POST: descarta um rascunho pendente — definitivo, não volta para a fila.
export async function POST(_request: Request, { params }: Context) {
  try {
    const { DB } = env as unknown as { DB?: D1Like };
    if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const draft = await discardDraft(DB, (await params).id, new Date().toISOString());
    return Response.json({ draft });
  } catch (error) {
    return draftErrorResponse(error);
  }
}
