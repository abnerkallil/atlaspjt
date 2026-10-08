// Taxonomia de tema do Apolo (APO-02, DEC-014): aberta, sem enum fixo, com
// hierarquia opcional (tema pai) e área de conhecimento (usada pelo APO-11
// para o perfil padrão da prova). Cadastrar um tema novo é só uma linha nesta
// tabela — não exige migração nem deploy.
import type { D1Like } from '../pedagogy/transitions.js';

export type Theme = {
  id: string;
  title: string;
  parentId: string | null;
  knowledgeArea: string | null;
  createdAt: string;
  updatedAt: string;
};

type ThemeRow = {
  id: string;
  title: string;
  parent_id: string | null;
  knowledge_area: string | null;
  created_at: string;
  updated_at: string;
};

function themeFromRow(row: ThemeRow): Theme {
  return {
    id: row.id,
    title: row.title,
    parentId: row.parent_id,
    knowledgeArea: row.knowledge_area,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listThemes(db: D1Like): Promise<Theme[]> {
  const { results } = await db.prepare(`SELECT * FROM atlas_themes ORDER BY id`).all<ThemeRow>();
  return results.map(themeFromRow);
}

export async function getTheme(db: D1Like, id: string): Promise<Theme | null> {
  const row = await db.prepare(`SELECT * FROM atlas_themes WHERE id = ?1`).bind(id).first<ThemeRow>();
  return row ? themeFromRow(row) : null;
}

export type CreateThemeInput = {
  id: string;
  title: string;
  parentId?: string | null;
  knowledgeArea?: string | null;
};

// Cadastro de tema novo (curadoria humana, APO-07). Um tema sem nenhum
// conteúdo do roadmap vinculado é válido: ele fica pronto à espera de um
// roadmap futuro (DEC-014 Eixo 2).
export async function createTheme(db: D1Like, input: CreateThemeInput, now: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO atlas_themes (id, title, parent_id, knowledge_area, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
    )
    .bind(input.id, input.title, input.parentId ?? null, input.knowledgeArea ?? null, now)
    .all();
}

// Liga (ou desliga, com themeId=null) um conteúdo do roadmap a um tema.
export async function setContentTheme(db: D1Like, contentId: string, themeId: string | null): Promise<void> {
  await db.prepare(`UPDATE atlas_contents SET theme_id = ?2 WHERE id = ?1`).bind(contentId, themeId).all();
}
