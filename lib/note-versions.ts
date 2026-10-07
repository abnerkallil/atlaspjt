// Histórico de notas (MVP-03, DEC-012): o Atlas guarda duas versões de cada
// nota, a atual (atlas_notes) e a anterior (atlas_note_versions). O usuário
// pode ver a anterior e restaurá-la. Restaurar troca as duas de lugar, então a
// versão que estava atual vira a anterior e a restauração pode ser desfeita.
import {
  legacyTextToAtlasNotesContent,
  prepareAtlasNotesForSave,
} from './atlas-notes-document.js';

// Genérico no tipo do statement para servir tanto ao D1 de verdade quanto ao
// adaptador node:sqlite dos testes, e para o statement de captura entrar no
// mesmo batch de saveNote.
export type NoteVersionsStatement<S> = {
  bind(...values: unknown[]): S;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};
export type NoteVersionsDb<S extends NoteVersionsStatement<S>> = {
  prepare(query: string): S;
  batch(statements: S[]): Promise<unknown[]>;
};

export type NoteVersionContent = {
  title: string;
  body: string;
  contentJson: string | null;
};

export type PreviousNoteVersion = {
  noteId: string;
  title: string;
  body: string;
  savedAt: string;
  replacedAt: string;
};

type VersionRow = {
  note_id: string;
  title: string;
  body: string;
  content_json: string | null;
  saved_at: string;
  replaced_at: string;
};

// Uma gravação só gera versão quando o conteúdo muda; salvar sem mudar nada
// não pode empurrar a versão anterior de verdade para fora do histórico.
export function noteContentChanged(
  current: NoteVersionContent,
  next: NoteVersionContent,
) {
  return (
    current.title !== next.title ||
    current.body !== next.body ||
    current.contentJson !== next.contentJson
  );
}

// Copia o conteúdo atual da nota para a versão anterior, substituindo a que
// existia. Precisa entrar no mesmo batch e antes da escrita que altera a nota.
export function capturePreviousVersion<S extends NoteVersionsStatement<S>>(
  db: NoteVersionsDb<S>,
  noteId: string,
  replacedAt: string,
) {
  return db
    .prepare(
      `INSERT INTO atlas_note_versions (note_id, title, body, content_json, saved_at, replaced_at)
       SELECT id, title, body, content_json, updated_at, ?2 FROM atlas_notes WHERE id = ?1
       ON CONFLICT(note_id) DO UPDATE SET title = excluded.title, body = excluded.body,
         content_json = excluded.content_json, saved_at = excluded.saved_at,
         replaced_at = excluded.replaced_at`,
    )
    .bind(noteId, replacedAt);
}

async function readVersion<S extends NoteVersionsStatement<S>>(
  db: NoteVersionsDb<S>,
  noteId: string,
) {
  return db
    .prepare(
      `SELECT note_id, title, body, content_json, saved_at, replaced_at
       FROM atlas_note_versions WHERE note_id = ?1`,
    )
    .bind(noteId)
    .first<VersionRow>();
}

export async function getPreviousVersion<S extends NoteVersionsStatement<S>>(
  db: NoteVersionsDb<S>,
  noteId: string,
): Promise<PreviousNoteVersion | null> {
  const row = await readVersion(db, noteId);
  if (!row) return null;
  return {
    noteId: row.note_id,
    title: row.title,
    body: row.body,
    savedAt: row.saved_at,
    replacedAt: row.replaced_at,
  };
}

// Restaura a versão anterior. Ela passa pelo mesmo caminho canônico de uma
// gravação estruturada (DEC-001): envelope v1 ou nota legada (content_json
// NULL) é regravado como v2, nunca como texto puro sobre nota formatada.
// Pasta, privacidade, vínculos e anexos ficam como estão. Devolve false se a
// nota não tem versão anterior.
export async function restorePreviousVersion<
  S extends NoteVersionsStatement<S>,
>(db: NoteVersionsDb<S>, noteId: string, now: string) {
  const row = await readVersion(db, noteId);
  if (!row) return false;
  const source =
    row.content_json === null
      ? legacyTextToAtlasNotesContent(row.body)
      : (JSON.parse(row.content_json) as unknown);
  const prepared = prepareAtlasNotesForSave(source);
  await db.batch([
    capturePreviousVersion(db, noteId, now),
    db
      .prepare(
        `UPDATE atlas_notes SET title = ?2, body = ?3, content_json = ?4,
           updated_at = ?5, last_interacted_at = ?5
         WHERE id = ?1`,
      )
      .bind(noteId, row.title, prepared.body, prepared.contentJson, now),
  ]);
  return true;
}
