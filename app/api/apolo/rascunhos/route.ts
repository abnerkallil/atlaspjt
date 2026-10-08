import { env } from 'cloudflare:workers';
import { type DraftStatus, draftErrorResponse, listDrafts } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

function db() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) throw new Error('Banco indisponível.');
  return DB;
}

// GET /api/apolo/rascunhos?status=pendente → fila de curadoria (APO-07).
export async function GET(request: Request) {
  try {
    const status = new URL(request.url).searchParams.get('status') as DraftStatus | null;
    return Response.json({ drafts: await listDrafts(db(), status ?? undefined) });
  } catch (error) {
    return draftErrorResponse(error);
  }
}
