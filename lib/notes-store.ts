import { env } from 'cloudflare:workers';
import { contentCatalog } from '@/lib/content-catalog';

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
  createdAt: string;
  updatedAt: string;
  links: NoteLink[];
  syncStatus: 'queued' | 'processing' | 'failed' | 'synced';
};

type NoteRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  sync_status: AtlasNote['syncStatus'] | null;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links: byNote.get(row.id) ?? [],
    syncStatus: row.sync_status ?? 'synced',
  }));
}

export async function listNotes(query = '') {
  const search = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`;
  const result = await database()
    .prepare(
      `SELECT n.id, n.title, n.body, n.created_at, n.updated_at,
        (SELECT s.status FROM atlas_sync_operations s
         WHERE s.note_id = n.id ORDER BY s.created_at DESC LIMIT 1) AS sync_status
       FROM atlas_notes n
       WHERE ?1 = '' OR n.title LIKE ?2 ESCAPE '\\' OR n.body LIKE ?2 ESCAPE '\\'
       ORDER BY n.updated_at DESC`,
    )
    .bind(query.trim(), search)
    .all<NoteRow>();
  return hydrate(result.results);
}

export async function getNote(id: string) {
  const result = await database()
    .prepare(
      `SELECT n.id, n.title, n.body, n.created_at, n.updated_at,
        (SELECT s.status FROM atlas_sync_operations s
         WHERE s.note_id = n.id ORDER BY s.created_at DESC LIMIT 1) AS sync_status
       FROM atlas_notes n WHERE n.id = ?1`,
    )
    .bind(id)
    .all<NoteRow>();
  return (await hydrate(result.results))[0] ?? null;
}

export async function saveNote(input: {
  id: string;
  operationId: string;
  title: string;
  body: string;
  contentIds: string[];
  mode: 'create' | 'update';
}) {
  const db = database();
  const idempotencyKey = `atlas-notes:${input.operationId}`;
  const previous = await db
    .prepare('SELECT id FROM atlas_sync_operations WHERE idempotency_key = ?1')
    .bind(idempotencyKey)
    .first<{ id: string }>();
  if (previous) return { note: await getNote(input.id), deduplicated: true };

  const existing = await db
    .prepare('SELECT created_at FROM atlas_notes WHERE id = ?1')
    .bind(input.id)
    .first<{ created_at: string }>();
  if (input.mode === 'update' && !existing)
    throw new Error('Nota não encontrada.');

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

  const statements = [
    db
      .prepare(
        `INSERT INTO atlas_notes (id, title, body, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, updated_at = excluded.updated_at`,
      )
      .bind(input.id, input.title.trim(), input.body.trim(), createdAt, now),
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
          title: input.title.trim(),
          characterCount: input.body.trim().length,
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
