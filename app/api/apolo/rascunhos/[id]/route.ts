import { env } from 'cloudflare:workers';
import { draftErrorResponse, getDraft, updateDraft, type DraftEdit } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function db() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) throw new Error('Banco indisponível.');
  return DB;
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const draft = await getDraft(db(), (await params).id);
    if (!draft) return Response.json({ error: 'Rascunho não encontrado.' }, { status: 404 });
    return Response.json({ draft });
  } catch (error) {
    return draftErrorResponse(error);
  }
}

// PATCH: edita um rascunho pendente — conteúdo, subtópico, tema, Bloom,
// explicação e o próprio enunciado/alternativas, se a curadoria corrigir.
export async function PATCH(request: Request, { params }: Context) {
  try {
    let body: DraftEdit;
    try {
      body = (await request.json()) as DraftEdit;
    } catch {
      return Response.json({ error: 'Envio inválido.' }, { status: 400 });
    }
    const draft = await updateDraft(db(), (await params).id, body);
    return Response.json({ draft });
  } catch (error) {
    return draftErrorResponse(error);
  }
}
