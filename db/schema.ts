import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const atlasNoteFolders = sqliteTable('atlas_note_folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const atlasNotes = sqliteTable(
  'atlas_notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    contentJson: text('content_json'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    // Set whenever the note is opened OR saved, whichever is more recent.
    // Nullable: existing rows predate this column and fall back to
    // updatedAt (see lib/notes-store.ts) rather than being backfilled.
    lastInteractedAt: text('last_interacted_at'),
    // Nullable: a note with no folder is "sem pasta", not an error state.
    folderId: text('folder_id').references(() => atlasNoteFolders.id, {
      onDelete: 'set null',
    }),
    isPrivate: integer('is_private', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [
    index('idx_atlas_notes_updated_at').on(table.updatedAt),
    index('idx_atlas_notes_last_interacted_at').on(table.lastInteractedAt),
    index('idx_atlas_notes_folder_id').on(table.folderId),
  ],
);

export const atlasNoteLinks = sqliteTable(
  'atlas_note_links',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => atlasNotes.id, { onDelete: 'cascade' }),
    contentId: text('content_id').notNull(),
    contentTitle: text('content_title').notNull(),
    subject: text('subject').notNull(),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.contentId] }),
    index('idx_atlas_note_links_content_id').on(table.contentId),
  ],
);

export const atlasSyncOperations = sqliteTable(
  'atlas_sync_operations',
  {
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    noteId: text('note_id').notNull(),
    operationType: text('operation_type').notNull(),
    payloadJson: text('payload_json').notNull(),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_atlas_sync_operations_idempotency').on(
      table.idempotencyKey,
    ),
    index('idx_atlas_sync_operations_status_updated').on(
      table.status,
      table.updatedAt,
    ),
    index('idx_atlas_sync_operations_note_id').on(table.noteId),
  ],
);
