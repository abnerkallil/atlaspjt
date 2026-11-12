// Taxonomia "matéria › conteúdo" fora do roadmap (APO-02/DEC-014, Eixo 2):
// rótulo de conteúdo para temas que ainda não têm um roadmap real em
// atlas_contents (direito-*, matemática, português, departamento-*, etc.).
// Mesmo princípio de atlas_themes — aberta, sem enum, cadastro é só uma
// linha. Serve apenas para a curadoria rotular o rascunho (nunca para
// aprová-lo: aprovar continua exigindo um content_id real do roadmap).
import type { D1Like } from '../pedagogy/transitions.js';

export type ContentTaxonomyEntry = {
  id: string;
  themeId: string;
  title: string;
  createdAt: string;
};

type ContentTaxonomyRow = {
  id: string;
  theme_id: string;
  title: string;
  created_at: string;
};

function fromRow(row: ContentTaxonomyRow): ContentTaxonomyEntry {
  return { id: row.id, themeId: row.theme_id, title: row.title, createdAt: row.created_at };
}

export function slugifyContentLabel(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listContentTaxonomy(db: D1Like, themeId: string): Promise<ContentTaxonomyEntry[]> {
  const { results } = await db
    .prepare('SELECT id, theme_id, title, created_at FROM atlas_content_taxonomy WHERE theme_id = ?1 ORDER BY title')
    .bind(themeId)
    .all<ContentTaxonomyRow>();
  return results.map(fromRow);
}

export type CreateContentTaxonomyInput = {
  themeId: string;
  title: string;
};

// Cadastro de conteúdo novo (curadoria humana, APO-07). Reusa a linha se o
// mesmo tema+título já existir (id determinístico), para não duplicar.
export async function createContentTaxonomyEntry(
  db: D1Like,
  input: CreateContentTaxonomyInput,
  now: string,
): Promise<ContentTaxonomyEntry> {
  const id = `${input.themeId}--${slugifyContentLabel(input.title)}`;
  await db
    .prepare(
      `INSERT INTO atlas_content_taxonomy (id, theme_id, title, created_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id, input.themeId, input.title, now)
    .all();
  const row = await db
    .prepare('SELECT id, theme_id, title, created_at FROM atlas_content_taxonomy WHERE id = ?1')
    .bind(id)
    .first<ContentTaxonomyRow>();
  return fromRow(row!);
}
