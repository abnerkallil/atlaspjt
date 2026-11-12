import { env } from 'cloudflare:workers';
import { createContentTaxonomyEntry, listContentTaxonomy } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

function db() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) throw new Error('Banco indisponível.');
  return DB;
}

// GET /api/apolo/conteudo-taxonomia?tema=direito-administrativo → conteúdos
// cadastrados para temas sem roadmap (rótulo de curadoria, APO-02 Eixo 2).
export async function GET(request: Request) {
  const themeId = new URL(request.url).searchParams.get('tema');
  if (!themeId) return Response.json({ error: 'Informe o tema.' }, { status: 400 });
  return Response.json({ contents: await listContentTaxonomy(db(), themeId) });
}

// POST { themeId, title } → cadastra conteúdo novo para um tema sem roadmap.
// Criação só acontece aqui, na curadoria (APO-07), igual a /api/apolo/temas.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Envio inválido.' }, { status: 400 });
  }
  const themeId = typeof body.themeId === 'string' ? body.themeId.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!themeId) return Response.json({ error: 'Informe o tema.' }, { status: 400 });
  if (!title) return Response.json({ error: 'Dê um título ao conteúdo.' }, { status: 400 });
  const conn = db();
  const existingTheme = await conn.prepare('SELECT id FROM atlas_themes WHERE id = ?1').bind(themeId).first();
  if (!existingTheme) return Response.json({ error: `Tema "${themeId}" não existe.` }, { status: 404 });
  const entry = await createContentTaxonomyEntry(conn, { themeId, title }, new Date().toISOString());
  return Response.json({ content: entry }, { status: 201 });
}
