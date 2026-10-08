import { env } from 'cloudflare:workers';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// GET /api/apolo/subtopicos?conteudo=CG-001 → subtópicos do conteúdo (DEC-05),
// para o seletor da curadoria de rascunhos (APO-07).
export async function GET(request: Request) {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
  const contentId = new URL(request.url).searchParams.get('conteudo');
  if (!contentId) return Response.json({ error: 'Informe o conteúdo.' }, { status: 400 });
  const { results } = await DB.prepare(
    'SELECT id, title FROM atlas_subtopics WHERE content_id = ?1 ORDER BY position',
  )
    .bind(contentId)
    .all<{ id: string; title: string }>();
  return Response.json({ subtopics: results });
}
