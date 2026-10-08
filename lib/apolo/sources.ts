// Acervo de fontes no R2 (APO-05, DEC-015): PDF de prova de concurso, apostila
// ou lista curado por humano. Bytes no bucket `ATTACHMENTS` sob
// `apolo/fontes/<tema>/<id>`; nunca público (legal ainda não revisou direitos
// autorais de prova de concurso) — todo acesso passa pelas rotas autenticadas
// do Worker, como attachments/materiais. Aqui ficam as regras puras e o acesso
// ao D1; os bytes são gravados e lidos pelas rotas.
import type { D1Like } from '../pedagogy/transitions.js';

export const SOURCE_TYPES = ['prova_concurso', 'apostila', 'lista'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

// Fontes são PDF (prova, apostila, lista), curadas uma a uma — limite mais
// alto que o anexo de nota (DEC-07's 10MB) porque prova escaneada é comum.
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

// Pura: confere extensão e tamanho. O tipo gravado é sempre application/pdf,
// nunca o que o cliente declarou.
export function validateSourceFile(file: { name: string; size: number }) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new SourceError('Só arquivos PDF.', 415);
  }
  if (file.size <= 0) throw new SourceError('Arquivo vazio.', 400);
  if (file.size > MAX_SOURCE_BYTES) {
    throw new SourceError(`O arquivo excede o limite de ${MAX_SOURCE_BYTES / 1024 / 1024}MB.`, 413);
  }
  return 'application/pdf';
}

export type Source = {
  id: string;
  title: string;
  theme: string | null;
  sourceType: SourceType;
  examBoard: string | null;
  examOrg: string | null;
  examYear: number | null;
  pageCount: number | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
};

type SourceRow = {
  id: string;
  title: string;
  theme: string | null;
  source_type: SourceType;
  exam_board: string | null;
  exam_org: string | null;
  exam_year: number | null;
  page_count: number | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  object_key: string;
  created_at: string;
};

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Mesmo princípio de tema em atlas_questions/atlas_themes (DEC-014): texto
// livre, sem enum. Aqui vira segmento de caminho no R2, então é normalizado.
export function themeSlug(theme: string | null) {
  const clean = (theme ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'sem-tema';
}

export function sourceObjectKey(theme: string | null, id: string) {
  return `apolo/fontes/${themeSlug(theme)}/${id}`;
}

function cleanTitle(value: unknown) {
  const title = (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim();
  if (!title) throw new SourceError('Dê um título à fonte.', 400);
  return title.slice(0, 200);
}

function cleanTheme(value: unknown) {
  const theme = typeof value === 'string' ? value.trim() : '';
  return theme ? theme.slice(0, 120) : null;
}

function cleanYear(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new SourceError('Ano da prova inválido.', 400);
  }
  return year;
}

// Pura: valida e normaliza os metadados da fonte enviados pelo usuário.
export function normalizeSourceInput(input: {
  title?: unknown;
  theme?: unknown;
  sourceType?: unknown;
  examBoard?: unknown;
  examOrg?: unknown;
  examYear?: unknown;
}) {
  if (!SOURCE_TYPES.includes(input.sourceType as SourceType)) {
    throw new SourceError('Tipo de fonte inválido. Use prova_concurso, apostila ou lista.', 400);
  }
  const sourceType = input.sourceType as SourceType;
  const title = cleanTitle(input.title);
  const theme = cleanTheme(input.theme);
  if (sourceType !== 'prova_concurso') {
    return { title, theme, sourceType, examBoard: null, examOrg: null, examYear: null };
  }
  const examBoard = typeof input.examBoard === 'string' && input.examBoard.trim() ? input.examBoard.trim().slice(0, 120) : null;
  const examOrg = typeof input.examOrg === 'string' && input.examOrg.trim() ? input.examOrg.trim().slice(0, 120) : null;
  const examYear = cleanYear(input.examYear);
  return { title, theme, sourceType, examBoard, examOrg, examYear };
}

function toSource(row: SourceRow): Source {
  return {
    id: row.id,
    title: row.title,
    theme: row.theme,
    sourceType: row.source_type,
    examBoard: row.exam_board,
    examOrg: row.exam_org,
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    pageCount: row.page_count === null ? null : Number(row.page_count),
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    createdAt: row.created_at,
  };
}

const COLUMNS =
  'id, title, theme, source_type, exam_board, exam_org, exam_year, page_count, file_name, mime_type, size_bytes, sha256, object_key, created_at';

export async function listSources(db: D1Like, theme?: string | null): Promise<Source[]> {
  const { results } = theme
    ? await db
        .prepare(`SELECT ${COLUMNS} FROM atlas_question_sources WHERE theme = ?1 ORDER BY created_at DESC`)
        .bind(theme)
        .all<SourceRow>()
    : await db.prepare(`SELECT ${COLUMNS} FROM atlas_question_sources ORDER BY created_at DESC`).all<SourceRow>();
  return results.map(toSource);
}

export async function getSource(db: D1Like, id: string) {
  const row = await db
    .prepare(`SELECT ${COLUMNS} FROM atlas_question_sources WHERE id = ?1`)
    .bind(id)
    .first<SourceRow>();
  return row ? { source: toSource(row), objectKey: row.object_key } : null;
}

export async function findSourceBySha256(db: D1Like, sha256: string) {
  const row = await db
    .prepare(`SELECT ${COLUMNS} FROM atlas_question_sources WHERE sha256 = ?1`)
    .bind(sha256)
    .first<SourceRow>();
  return row ? toSource(row) : null;
}

export async function insertSource(
  db: D1Like,
  item: {
    id: string;
    title: string;
    theme: string | null;
    sourceType: SourceType;
    examBoard: string | null;
    examOrg: string | null;
    examYear: number | null;
    pageCount: number | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    objectKey: string;
    now: string;
  },
): Promise<Source> {
  const existing = await findSourceBySha256(db, item.sha256);
  if (existing) {
    throw new SourceError(`Este arquivo já está no acervo ("${existing.title}").`, 409);
  }
  await db
    .prepare(
      `INSERT INTO atlas_question_sources
       (id, title, theme, source_type, exam_board, exam_org, exam_year, page_count, file_name, mime_type, size_bytes, sha256, object_key, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    )
    .bind(
      item.id,
      item.title,
      item.theme,
      item.sourceType,
      item.examBoard,
      item.examOrg,
      item.examYear,
      item.pageCount,
      item.fileName,
      item.mimeType,
      item.sizeBytes,
      item.sha256,
      item.objectKey,
      item.now,
    )
    .all();
  return (await getSource(db, item.id))!.source;
}

// Apaga a linha e devolve a chave do R2 para a rota remover os bytes (DEC-08:
// exclusão de fonte é real e imediata, nunca soft-delete).
export async function deleteSource(db: D1Like, id: string) {
  const found = await getSource(db, id);
  if (!found) return null;
  await db.prepare('DELETE FROM atlas_question_sources WHERE id = ?1').bind(id).all();
  return { objectKey: found.objectKey };
}

export function sourceErrorResponse(error: unknown) {
  if (error instanceof SourceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('apolo/sources: erro inesperado', error);
  return Response.json({ error: 'Não foi possível concluir a operação com a fonte.' }, { status: 500 });
}
