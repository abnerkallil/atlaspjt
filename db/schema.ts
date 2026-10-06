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

// ---------------------------------------------------------------------------
// Espinha do modelo de dados (TEC-02 / DEC-010).
// D1 é a fonte da verdade do catálogo curado e de todo estado pedagógico; a
// planilha oficial só alimenta o catálogo. Hierarquia do DEC-05:
// roadmap → fase → disciplina → conteúdo → subtópico → evidência.
// Ids são chaves estáveis em texto (ex.: CG-001 para conteúdos da planilha),
// para que sessão, questão, tentativa, revisão e avaliação possam referenciá-los
// quando seus cards MVP criarem as tabelas.
// ---------------------------------------------------------------------------

export const atlasRoadmaps = sqliteTable('atlas_roadmaps', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  // MVP: só roadmaps curados manualmente (DEC-05). Roadmap gerado por IA é futuro.
  origin: text('origin').notNull().default('curado'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const atlasPhases = sqliteTable(
  'atlas_phases',
  {
    id: text('id').primaryKey(),
    roadmapId: text('roadmap_id')
      .notNull()
      .references(() => atlasRoadmaps.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
  },
  (table) => [index('idx_atlas_phases_roadmap').on(table.roadmapId, table.position)],
);

export const atlasDisciplines = sqliteTable(
  'atlas_disciplines',
  {
    id: text('id').primaryKey(),
    phaseId: text('phase_id')
      .notNull()
      .references(() => atlasPhases.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
  },
  (table) => [index('idx_atlas_disciplines_phase').on(table.phaseId, table.position)],
);

export const atlasContents = sqliteTable(
  'atlas_contents',
  {
    id: text('id').primaryKey(),
    disciplineId: text('discipline_id')
      .notNull()
      .references(() => atlasDisciplines.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    // Agrupamento da planilha (ex.: "Fundamentos"); não é um nível da hierarquia.
    unit: text('unit'),
    title: text('title').notNull(),
    keywords: text('keywords'),
    estimatedMinutes: integer('estimated_minutes'),
  },
  (table) => [index('idx_atlas_contents_discipline').on(table.disciplineId, table.position)],
);

// Dependências entre conteúdos (DEC-05). Fundamentos compartilhados são
// pré-requisitos que cruzam disciplinas; por isso a aresta é conteúdo → conteúdo.
export const atlasContentPrerequisites = sqliteTable(
  'atlas_content_prerequisites',
  {
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    prerequisiteId: text('prerequisite_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.contentId, table.prerequisiteId] }),
    index('idx_atlas_content_prerequisites_prerequisite').on(table.prerequisiteId),
  ],
);

export const atlasSubtopics = sqliteTable(
  'atlas_subtopics',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    // O que comprova o domínio deste subtópico (evidência-chave, DEC-05).
    keyEvidence: text('key_evidence'),
  },
  (table) => [index('idx_atlas_subtopics_content').on(table.contentId, table.position)],
);

// Evidência registrada de aprendizagem (nota, quiz, exercício, avaliação,
// revisão, dispensa). O subtópico é opcional porque conteúdos do catálogo atual
// ainda não têm subtópicos e o quiz aprovado já gera evidência (DEC-03).
export const atlasEvidences = sqliteTable(
  'atlas_evidences',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    subtopicId: text('subtopic_id').references(() => atlasSubtopics.id, {
      onDelete: 'set null',
    }),
    kind: text('kind').notNull(),
    // Referência à origem (ex.: id da nota); sem FK porque a origem varia por tipo.
    sourceRef: text('source_ref'),
    summary: text('summary').notNull(),
    recordedAt: text('recorded_at').notNull(),
  },
  (table) => [
    index('idx_atlas_evidences_content').on(table.contentId, table.recordedAt),
    index('idx_atlas_evidences_subtopic').on(table.subtopicId),
  ],
);

// Estado atual (DEC-03). Ausência de linha equivale ao estado inicial
// ("nao-iniciado" / "em-andamento"); valores válidos em lib/pedagogy/states.ts.
export const atlasContentStates = sqliteTable('atlas_content_states', {
  contentId: text('content_id')
    .primaryKey()
    .references(() => atlasContents.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const atlasDisciplineStates = sqliteTable('atlas_discipline_states', {
  disciplineId: text('discipline_id')
    .primaryKey()
    .references(() => atlasDisciplines.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Trilha de auditoria (TEC-06): toda mudança de estado grava uma linha aqui,
// na mesma transação que altera o estado atual. Só inserção; nunca atualizada.
export const atlasStateAudit = sqliteTable(
  'atlas_state_audit',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    fromState: text('from_state').notNull(),
    toState: text('to_state').notNull(),
    event: text('event').notNull(),
    // "usuario" (confirmação explícita) ou "sistema" (transição automática).
    actor: text('actor').notNull(),
    reason: text('reason').notNull(),
    evidenceId: text('evidence_id').references(() => atlasEvidences.id, {
      onDelete: 'set null',
    }),
    occurredAt: text('occurred_at').notNull(),
  },
  (table) => [
    index('idx_atlas_state_audit_entity').on(table.entityType, table.entityId, table.occurredAt),
    index('idx_atlas_state_audit_occurred').on(table.occurredAt),
  ],
);
