// Acesso a dados do Apolo (DEC-014): moldes e os campos que o Apolo acrescenta
// a `atlas_questions`. Apolo só lê itens/moldes em estado 'ativa' — nenhuma
// seleção automática de item que não passou por curadoria humana explícita.
import type { D1Like } from '../pedagogy/transitions.js';
import { itemModelFromRow, type ItemModel, type ItemModelRow } from './types.js';

// Moldes ativos de um tema, ordenados por id para leitura determinística
// (mesmo princípio de `selectQuestions` em lib/quizzes.ts: a ordem de entrada
// de um sorteio por semente não deve depender da ordem de retorno do D1).
export async function listActiveItemModels(db: D1Like, theme: string): Promise<ItemModel[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM atlas_item_models WHERE theme = ?1 AND lifecycle_state = 'ativa' ORDER BY id`,
    )
    .bind(theme)
    .all<ItemModelRow>();
  return results.map(itemModelFromRow);
}

export async function getItemModel(db: D1Like, id: string): Promise<ItemModel | null> {
  const row = await db
    .prepare(`SELECT * FROM atlas_item_models WHERE id = ?1`)
    .bind(id)
    .first<ItemModelRow>();
  return row ? itemModelFromRow(row) : null;
}

export type CreateItemModelInput = {
  id: string;
  theme: string;
  title: string;
  kind: string;
  generatorKey: string;
  params: Record<string, unknown>;
  bloomLevel?: string | null;
  difficultyNominal?: string | null;
  curatedBy: string;
};

// Todo molde nasce 'rascunho' (DEC-014): precisa de uma ativação explícita e
// separada (ver `setItemModelLifecycle`) antes que o Apolo possa expandi-lo —
// nenhuma seleção/ativação automática sem curadoria humana prévia.
export async function createItemModel(
  db: D1Like,
  input: CreateItemModelInput,
  now: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO atlas_item_models
         (id, theme, title, kind, generator_key, params_json, bloom_level,
          difficulty_nominal, lifecycle_state, curated_by, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'rascunho', ?9, ?10, ?10)`,
    )
    .bind(
      input.id,
      input.theme,
      input.title,
      input.kind,
      input.generatorKey,
      JSON.stringify(input.params),
      input.bloomLevel ?? null,
      input.difficultyNominal ?? null,
      input.curatedBy,
      now,
    )
    .all();
}

// Transição de ciclo de vida do molde, sempre disparada por ação humana
// (curadoria obrigatória, DEC-014) — nunca automática a partir do Apolo.
export async function setItemModelLifecycle(
  db: D1Like,
  id: string,
  lifecycleState: string,
  now: string,
): Promise<void> {
  await db
    .prepare(`UPDATE atlas_item_models SET lifecycle_state = ?2, updated_at = ?3 WHERE id = ?1`)
    .bind(id, lifecycleState, now)
    .all();
}

// Questões ativas (lifecycle 'ativa') de um tema — independente de conteúdo,
// já que tema não é nível da hierarquia DEC-05 (DEC-014 Eixo 2).
export async function listActiveQuestionsByTheme(
  db: D1Like,
  theme: string,
): Promise<{ id: string; contentId: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT id, content_id as contentId FROM atlas_questions
       WHERE theme = ?1 AND lifecycle_state = 'ativa' ORDER BY id`,
    )
    .bind(theme)
    .all<{ id: string; contentId: string }>();
  return results;
}
