import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';
import { recoveryStatus } from '@/lib/recovery';

export const runtime = 'edge';

// GET /api/recuperacao?conteudo=CG-001 → estudo dirigido (MVP-08): reprovações
// seguidas e questões erradas na última reprovação; null se não há o que recuperar.
export async function GET(request: Request) {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const contentId = new URL(request.url).searchParams.get('conteudo')?.trim();
  if (!contentId) return Response.json({ error: 'Informe o conteúdo.' }, { status: 400 });
  try {
    return Response.json({ recovery: await recoveryStatus(db, contentId) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Não foi possível ler a recuperação.' }, { status: 500 });
  }
}
