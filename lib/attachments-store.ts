import { env } from 'cloudflare:workers';
import {
  AttachmentError,
  objectKeyFor,
  sanitizeFileName,
  validateAttachment,
} from '@/lib/attachments';

// DEC-008: bytes in R2 (binding `ATTACHMENTS`), metadata in D1. The bucket is
// never public; every read/write goes through the authenticated Worker routes.

export type AttachmentMeta = {
  id: string;
  noteId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type AttachmentRow = {
  id: string;
  note_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  object_key: string;
  created_at: string;
};

function bindings() {
  const { DB, ATTACHMENTS } = env as unknown as {
    DB?: D1Database;
    ATTACHMENTS?: R2Bucket;
  };
  if (!DB || !ATTACHMENTS) {
    throw new AttachmentError('O armazenamento de anexos não está disponível.', 503);
  }
  return { db: DB, bucket: ATTACHMENTS };
}

function toMeta(row: AttachmentRow): AttachmentMeta {
  return {
    id: row.id,
    noteId: row.note_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export async function listAttachments(noteId: string) {
  const { db } = bindings();
  const result = await db
    .prepare(
      `SELECT id, note_id, file_name, mime_type, size_bytes, object_key, created_at
       FROM atlas_note_attachments WHERE note_id = ?1 ORDER BY created_at`,
    )
    .bind(noteId)
    .all<AttachmentRow>();
  return result.results.map(toMeta);
}

export async function saveAttachment(noteId: string, file: File) {
  const mimeType = validateAttachment(file);
  const { db, bucket } = bindings();
  const note = await db
    .prepare('SELECT id FROM atlas_notes WHERE id = ?1')
    .bind(noteId)
    .first();
  if (!note) throw new AttachmentError('Nota não encontrada.', 404);

  const id = crypto.randomUUID();
  const objectKey = objectKeyFor(noteId, id);
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size) {
    throw new AttachmentError('Arquivo inconsistente.', 400);
  }
  await bucket.put(objectKey, bytes, { httpMetadata: { contentType: mimeType } });
  const meta: AttachmentMeta = {
    id,
    noteId,
    fileName: sanitizeFileName(file.name),
    mimeType,
    sizeBytes: bytes.byteLength,
    createdAt: new Date().toISOString(),
  };
  try {
    await db
      .prepare(
        `INSERT INTO atlas_note_attachments
         (id, note_id, file_name, mime_type, size_bytes, object_key, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(id, noteId, meta.fileName, mimeType, meta.sizeBytes, objectKey, meta.createdAt)
      .run();
  } catch (error) {
    await bucket.delete(objectKey);
    throw error;
  }
  return meta;
}

export async function readAttachment(id: string) {
  const { db, bucket } = bindings();
  const row = await db
    .prepare(
      `SELECT id, note_id, file_name, mime_type, size_bytes, object_key, created_at
       FROM atlas_note_attachments WHERE id = ?1`,
    )
    .bind(id)
    .first<AttachmentRow>();
  if (!row) return null;
  const object = await bucket.get(row.object_key);
  if (!object) return null;
  return { meta: toMeta(row), body: object.body };
}

export async function deleteAttachment(id: string) {
  const { db, bucket } = bindings();
  const row = await db
    .prepare('SELECT object_key FROM atlas_note_attachments WHERE id = ?1')
    .bind(id)
    .first<{ object_key: string }>();
  if (!row) return false;
  await bucket.delete(row.object_key);
  await db.prepare('DELETE FROM atlas_note_attachments WHERE id = ?1').bind(id).run();
  return true;
}
