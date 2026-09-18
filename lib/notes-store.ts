import { env } from 'cloudflare:workers';
import { contentCatalog } from '@/lib/content-catalog';
import {
  canonicalizeAtlasNotesContent,
  projectAtlasNotesBody,
  type AtlasNotesEnvelope,
} from '@/lib/atlas-notes-document';
import {
  assertAtlasNotesOperationTarget,
  assertAtlasNotesStructuredWrite,
  type AtlasNotesSaveInput,
} from '@/lib/atlas-notes-input';

export const NOTE_LINK_STATUS = 'Anotado — ainda não trabalhado' as const;

export type NoteLink = {
  contentId: string;
  contentTitle: string;
  subject: string;
  status: typeof NOTE_LINK_STATUS;
};

export type AtlasNote = {
  id: string;
  title: string;
  body: string;
  content: AtlasNotesEnvelope | null;
  createdAt: string;
  updatedAt: string;
  // The moment this note was last opened OR saved, whichever is more
  // recent. Never null to callers: rows predating this column fall back
  // to updatedAt via COALESCE in every query below.
  lastInteractedAt: string;
  links: NoteLink[];
  syncStatus: 'queued' | 'processing' | 'failed' | 'synced';
  // Null means "sem pasta" — not an error state, the default.
  folderId: string | null;
  isPrivate: boolean;
};

export type NoteFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  title: string;
  body: string;
  content_json: string | null;
  created_at: string;
  updated_at: string;
  last_interacted_at: string;
  sync_status: AtlasNote['syncStatus'] | null;
  folder_id: string | null;
  is_private: number;
};

type FolderRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type LinkRow = {
  note_id: string;
  content_id: string;
  content_title: string;
  subject: string;
  status: string;
};

const catalogById = new Map(contentCatalog.map((item) => [item.id, item]));

function database() {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding)
    throw new Error('A persistência do Atlas Notes não está disponível.');
  return binding;
}

function mapLink(row: LinkRow): NoteLink {
  return {
    contentId: row.content_id,
    contentTitle: row.content_title,
    subject: row.subject,
    status: NOTE_LINK_STATUS,
  };
}

function parseStoredContent(value: string | null) {
  if (value === null) return null;
  try {
    return canonicalizeAtlasNotesContent(JSON.parse(value) as unknown);
  } catch {
    throw new Error('O conteúdo estruturado armazenado da nota é inválido.');
  }
}

function hydrateContent(row: NoteRow) {
  const content = parseStoredContent(row.content_json);
  if (content && projectAtlasNotesBody(content) !== row.body) {
    throw new Error(
      'A projeção textual armazenada da nota não corresponde ao conteúdo estruturado.',
    );
  }
  return content;
}

async function hydrate(rows: NoteRow[]) {
  if (!rows.length) return [];
  const links = await database()
    .prepare(
      `SELECT note_id, content_id, content_title, subject, status
       FROM atlas_note_links
       ORDER BY content_id`,
    )
    .all<LinkRow>();
  const byNote = new Map<string, NoteLink[]>();
  for (const row of links.results) {
    const current = byNote.get(row.note_id) ?? [];
    current.push(mapLink(row));
    byNote.set(row.note_id, current);
  }
  return rows.map<AtlasNote>((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    content: hydrateContent(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastInteractedAt: row.last_interacted_at,
    links: byNote.get(row.id) ?? [],
    syncStatus: row.sync_status ?? 'synced',
    folderId: row.folder_id,
    isPrivate: Boolean(row.is_private),
  }));
}

const NOTE_COLUMNS = `n.id, n.title, n.body, n.content_json, n.created_at, n.updated_at,
        COALESCE(n.last_interacted_at, n.updated_at) AS last_interacted_at,
        n.folder_id, n.is_private,
        (SELECT s.status FROM atlas_sync_operations s
         WHERE s.note_id = n.id ORDER BY s.created_at DESC LIMIT 1) AS sync_status`;

export async function listNotes(query = '') {
  const search = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`;
  const result = await database()
    .prepare(
      `SELECT ${NOTE_COLUMNS}
       FROM atlas_notes n
       WHERE ?1 = '' OR n.title LIKE ?2 ESCAPE '\\' OR n.body LIKE ?2 ESCAPE '\\'
       ORDER BY n.updated_at DESC`,
    )
    .bind(query.trim(), search)
    .all<NoteRow>();
  return hydrate(result.results);
}

export async function listRecentNotes(limit = 5) {
  const result = await database()
    .prepare(
      `SELECT ${NOTE_COLUMNS}
       FROM atlas_notes n
       ORDER BY COALESCE(n.last_interacted_at, n.updated_at) DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<NoteRow>();
  return hydrate(result.results);
}

export async function getNote(id: string) {
  const result = await database()
    .prepare(`SELECT ${NOTE_COLUMNS} FROM atlas_notes n WHERE n.id = ?1`)
    .bind(id)
    .all<NoteRow>();
  return (await hydrate(result.results))[0] ?? null;
}

export async function recordNoteOpen(id: string) {
  await database()
    .prepare('UPDATE atlas_notes SET last_interacted_at = ?1 WHERE id = ?2')
    .bind(new Date().toISOString(), id)
    .run();
}

export async function saveNote(input: AtlasNotesSaveInput) {
  const db = database();
  const idempotencyKey = `atlas-notes:${input.operationId}`;
  const previous = await db
    .prepare(
      'SELECT note_id FROM atlas_sync_operations WHERE idempotency_key = ?1',
    )
    .bind(idempotencyKey)
    .first<{ note_id: string }>();
  if (previous) {
    assertAtlasNotesOperationTarget(previous.note_id, input.id);
    return { note: await getNote(previous.note_id), deduplicated: true };
  }

  const existing = await db
    .prepare('SELECT created_at, content_json FROM atlas_notes WHERE id = ?1')
    .bind(input.id)
    .first<{ created_at: string; content_json: string | null }>();
  if (input.mode === 'update' && !existing)
    throw new Error('Nota não encontrada.');
  if (existing)
    assertAtlasNotesStructuredWrite(existing.content_json, input.contentJson);

  const now = new Date().toISOString();
  const createdAt = existing?.created_at ?? now;
  const uniqueIds = [...new Set(input.contentIds)];
  const references = uniqueIds
    .map((id) => catalogById.get(id))
    .filter((item) => item !== undefined);
  if (references.length !== uniqueIds.length)
    throw new Error(
      'Um dos conteúdos selecionados não pertence ao catálogo oficial.',
    );

  if (input.folderId !== null) {
    const folder = await db
      .prepare('SELECT id FROM atlas_note_folders WHERE id = ?1')
      .bind(input.folderId)
      .first<{ id: string }>();
    if (!folder) throw new Error('Pasta não encontrada.');
  }

  const statements = [
    db
      .prepare(
        `INSERT INTO atlas_notes (id, title, body, content_json, created_at, updated_at, last_interacted_at, folder_id, is_private)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body,
         content_json = excluded.content_json, updated_at = excluded.updated_at,
         last_interacted_at = excluded.last_interacted_at, folder_id = excluded.folder_id,
         is_private = excluded.is_private`,
      )
      .bind(
        input.id,
        input.title,
        input.body,
        input.contentJson,
        createdAt,
        now,
        now,
        input.folderId,
        input.isPrivate ? 1 : 0,
      ),
    db
      .prepare('DELETE FROM atlas_note_links WHERE note_id = ?1')
      .bind(input.id),
    ...references.map((reference) =>
      db
        .prepare(
          `INSERT INTO atlas_note_links
         (note_id, content_id, content_title, subject, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(
          input.id,
          reference.id,
          reference.title,
          reference.subject,
          NOTE_LINK_STATUS,
          now,
        ),
    ),
    db
      .prepare(
        `INSERT INTO atlas_sync_operations
       (id, idempotency_key, note_id, operation_type, payload_json, status, attempts, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'queued', 0, ?6, ?6)`,
      )
      .bind(
        input.operationId,
        idempotencyKey,
        input.id,
        input.mode === 'create' ? 'NOTE_CREATED' : 'NOTE_UPDATED',
        JSON.stringify({
          noteId: input.id,
          title: input.title,
          characterCount: input.body.length,
          links: references.map((reference) => ({
            contentId: reference.id,
            status: NOTE_LINK_STATUS,
          })),
          atlasUpdatedAt: now,
        }),
        now,
      ),
  ];

  await db.batch(statements);
  return { note: await getNote(input.id), deduplicated: false };
}

function mapFolder(row: FolderRow): NoteFolder {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFolders(): Promise<NoteFolder[]> {
  const result = await database()
    .prepare(
      'SELECT id, name, created_at, updated_at FROM atlas_note_folders ORDER BY name COLLATE NOCASE',
    )
    .all<FolderRow>();
  return result.results.map(mapFolder);
}

export async function createFolder(name: string): Promise<NoteFolder> {
  const db = database();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db
    .prepare(
      'INSERT INTO atlas_note_folders (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)',
    )
    .bind(id, name, now)
    .run();
  return { id, name, createdAt: now, updatedAt: now };
}

export async function renameFolder(
  id: string,
  name: string,
): Promise<NoteFolder> {
  const db = database();
  const now = new Date().toISOString();
  const existing = await db
    .prepare('SELECT id FROM atlas_note_folders WHERE id = ?1')
    .bind(id)
    .first<{ id: string }>();
  if (!existing) throw new Error('Pasta não encontrada.');
  await db
    .prepare(
      'UPDATE atlas_note_folders SET name = ?1, updated_at = ?2 WHERE id = ?3',
    )
    .bind(name, now, id)
    .run();
  const folder = await db
    .prepare('SELECT id, name, created_at, updated_at FROM atlas_note_folders WHERE id = ?1')
    .bind(id)
    .first<FolderRow>();
  return mapFolder(folder!);
}
