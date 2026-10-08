import { env } from 'cloudflare:workers';
import { createTheme, listThemes, themeSlug } from '@/lib/apolo/index';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

function db() {
  const { DB } = env as unknown as { DB?: D1Like };
  if (!DB) throw new Error('Banco indisponível.');
  return DB;
}

export async function GET() {
  return Response.json({ themes: await listThemes(db()) });
}

// POST { title, knowledgeArea?, parentId? } → cadastra tema novo (DEC-014).
// Criação de tema só acontece aqui, na curadoria (APO-07).
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Envio inválido.' }, { status: 400 });
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return Response.json({ error: 'Dê um título ao tema.' }, { status: 400 });
  const conn = db();
  const id = themeSlug(title);
  const existing = await conn.prepare('SELECT id FROM atlas_themes WHERE id = ?1').bind(id).first();
  if (existing) return Response.json({ error: `Já existe um tema "${id}".` }, { status: 409 });
  const knowledgeArea = typeof body.knowledgeArea === 'string' && body.knowledgeArea.trim() ? body.knowledgeArea.trim() : null;
  const parentId = typeof body.parentId === 'string' && body.parentId.trim() ? body.parentId.trim() : null;
  await createTheme(conn, { id, title, parentId, knowledgeArea }, new Date().toISOString());
  return Response.json({ theme: await conn.prepare('SELECT * FROM atlas_themes WHERE id = ?1').bind(id).first() }, { status: 201 });
}
