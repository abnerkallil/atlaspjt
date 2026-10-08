// Material de estudo por conteúdo (UX-01): texto, link (ex.: vídeo da aula) ou
// arquivo anexado pelo usuário. Arquivo segue o DEC-07/DEC-008 (validado como os
// anexos de notas; bytes no R2, metadados no D1). Aqui ficam as regras puras e o
// acesso ao D1; os bytes são gravados e lidos pelas rotas do Worker.
import { AttachmentError, sanitizeFileName } from './attachments.js';
import type { D1Like } from './pedagogy/transitions.js';

export const MATERIAL_KINDS = ['texto', 'link', 'arquivo'] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const MAX_MATERIAL_TITLE = 160;
export const MAX_MATERIAL_TEXT = 20_000;
export const MAX_MATERIALS_PER_CONTENT = 30;

export type Material = {
  id: string;
  contentId: string;
  kind: MaterialKind;
  title: string;
  body: string | null;
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export class MaterialError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type MaterialRow = {
  id: string;
  content_id: string;
  kind: MaterialKind;
  title: string;
  body: string | null;
  url: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  object_key: string | null;
  created_at: string;
};

export function materialObjectKey(contentId: string, materialId: string) {
  return `materials/${contentId}/${materialId}`;
}

function cleanTitle(value: unknown, fallback = '') {
  const title = (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim() || fallback;
  if (!title) throw new MaterialError('Dê um título ao material.', 400);
  return title.slice(0, MAX_MATERIAL_TITLE);
}

// Pura: valida e normaliza texto ou link enviados pelo usuário.
export function normalizeMaterial(input: { kind?: unknown; title?: unknown; body?: unknown; url?: unknown }) {
  if (input.kind === 'texto') {
    const body = typeof input.body === 'string' ? input.body.trim() : '';
    if (!body) throw new MaterialError('Escreva o texto do material.', 400);
    if (body.length > MAX_MATERIAL_TEXT) throw new MaterialError('O texto passa de 20.000 caracteres; divida em partes.', 413);
    return { kind: 'texto' as const, title: cleanTitle(input.title), body, url: null };
  }
  if (input.kind === 'link') {
    let url: URL;
    try {
      url = new URL(typeof input.url === 'string' ? input.url.trim() : '');
    } catch {
      throw new MaterialError('Informe um endereço completo, começando com https://.', 400);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new MaterialError('Só endereços http ou https.', 400);
    }
    return { kind: 'link' as const, title: cleanTitle(input.title, url.hostname), body: null, url: url.toString() };
  }
  throw new MaterialError('Tipo de material inválido.', 400);
}

export function fileTitle(title: unknown, fileName: string) {
  return cleanTitle(title, sanitizeFileName(fileName).replace(/\.[^.]+$/, ''));
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    contentId: row.content_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    url: row.url,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
    createdAt: row.created_at,
  };
}

const COLUMNS = 'id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, created_at';

export async function listMaterials(db: D1Like, contentId: string): Promise<Material[]> {
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM atlas_content_materials WHERE content_id = ?1 ORDER BY position, created_at, id`)
    .bind(contentId)
    .all<MaterialRow>();
  return results.map(toMaterial);
}

export async function getMaterial(db: D1Like, id: string) {
  const row = await db.prepare(`SELECT ${COLUMNS} FROM atlas_content_materials WHERE id = ?1`).bind(id).first<MaterialRow>();
  return row ? { material: toMaterial(row), objectKey: row.object_key } : null;
}

// Confere o conteúdo e o limite por conteúdo antes de gravar (inclusive bytes no R2).
export async function assertCanAdd(db: D1Like, contentId: string) {
  const content = await db.prepare('SELECT id FROM atlas_contents WHERE id = ?1').bind(contentId).first<{ id: string }>();
  if (!content) throw new MaterialError('Conteúdo não encontrado.', 404);
  const count = await db
    .prepare('SELECT COUNT(*) AS n FROM atlas_content_materials WHERE content_id = ?1')
    .bind(contentId)
    .first<{ n: number }>();
  if (Number(count?.n ?? 0) >= MAX_MATERIALS_PER_CONTENT) {
    throw new MaterialError(`Cada conteúdo aceita até ${MAX_MATERIALS_PER_CONTENT} materiais.`, 409);
  }
}

export async function insertMaterial(
  db: D1Like,
  item: {
    id: string;
    contentId: string;
    kind: MaterialKind;
    title: string;
    body?: string | null;
    url?: string | null;
    file?: { fileName: string; mimeType: string; sizeBytes: number; objectKey: string };
    now: string;
  },
): Promise<Material> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_content_materials (id, content_id, kind, title, body, url, file_name, mime_type, size_bytes, object_key, position, created_at)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                COALESCE((SELECT MAX(position) + 1 FROM atlas_content_materials WHERE content_id = ?2), 0), ?11`,
      )
      .bind(
        item.id,
        item.contentId,
        item.kind,
        item.title,
        item.body ?? null,
        item.url ?? null,
        item.file ? sanitizeFileName(item.file.fileName) : null,
        item.file?.mimeType ?? null,
        item.file?.sizeBytes ?? null,
        item.file?.objectKey ?? null,
        item.now,
      ),
  ]);
  return (await getMaterial(db, item.id))!.material;
}

// Apaga a linha e devolve a chave do R2 (se havia arquivo) para a rota remover os bytes.
export async function deleteMaterial(db: D1Like, id: string) {
  const found = await getMaterial(db, id);
  if (!found) return null;
  await db.batch([db.prepare('DELETE FROM atlas_content_materials WHERE id = ?1').bind(id)]);
  return { objectKey: found.objectKey };
}

export function materialErrorResponse(error: unknown) {
  if (error instanceof MaterialError || error instanceof AttachmentError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: 'Não foi possível concluir a operação com o material.' }, { status: 500 });
}
