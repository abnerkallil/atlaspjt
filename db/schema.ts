import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

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

// DEC-008: only metadata lives in D1; the bytes live in R2 under `objectKey`.
export const atlasNoteAttachments = sqliteTable(
  'atlas_note_attachments',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => atlasNotes.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    objectKey: text('object_key').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_atlas_note_attachments_note_id').on(table.noteId)],
);

// DEC-012 (MVP-03 "Histórico"): guarda só a versão anterior de cada nota; a
// atual é a própria linha de atlas_notes. Snapshot integral do conteúdo (título,
// body e content_json como estava gravado), sem pasta, privacidade, vínculos
// nem anexos. Sai junto com a nota (cascade).
export const atlasNoteVersions = sqliteTable('atlas_note_versions', {
  noteId: text('note_id')
    .primaryKey()
    .references(() => atlasNotes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  contentJson: text('content_json'),
  // updated_at da nota quando esta versão era a atual.
  savedAt: text('saved_at').notNull(),
  // Momento em que deixou de ser a atual (gravação ou restauração).
  replacedAt: text('replaced_at').notNull(),
});

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

// ---------------------------------------------------------------------------
// Sessões de estudo (MVP-02, migradas junto do card como manda o DEC-010).
// Uma sessão é um período de estudo de um conteúdo: começa, pausa, retoma e é
// concluída; guarda o ponto atual (checkpoint) para retomar de onde parou e,
// ao concluir, registra uma evidência (TEC-06) e leva o conteúdo de
// "em estudo" para "aguardando quiz" (DEC-03).
// ---------------------------------------------------------------------------

export const atlasStudySessions = sqliteTable(
  'atlas_study_sessions',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    // "em-andamento", "pausada" ou "concluida" (lib/study-sessions.ts).
    status: text('status').notNull(),
    startedAt: text('started_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    // Início do trecho em andamento; nulo quando pausada ou concluída.
    lastResumedAt: text('last_resumed_at'),
    // Tempo de estudo acumulado até o último pause, em segundos.
    activeSeconds: integer('active_seconds').notNull().default(0),
    // Ponto atual para retomar (etapa, etapas feitas, nota da sessão), em JSON.
    checkpointJson: text('checkpoint_json'),
    finishedAt: text('finished_at'),
    evidenceId: text('evidence_id').references(() => atlasEvidences.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('idx_atlas_study_sessions_content').on(table.contentId, table.startedAt),
    index('idx_atlas_study_sessions_updated').on(table.status, table.updatedAt),
    // No máximo uma sessão aberta (não concluída) por conteúdo.
    uniqueIndex('uq_atlas_study_sessions_open_content')
      .on(table.contentId)
      .where(sql`status <> 'concluida'`),
  ],
);

// Quizzes pré-cadastrados (MVP-04, DEC-10/DEC-04). Questões curadas por
// conteúdo e tentativas com respostas, correção e resultado. Uma tentativa
// aprovada ou reprovada registra evidência "quiz" e move o estado do conteúdo
// (DEC-03) pela trilha de auditoria (TEC-06).
// ---------------------------------------------------------------------------

export const atlasQuestions = sqliteTable(
  'atlas_questions',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    // "multipla", "dissertativa" ou "calculo" (lib/quizzes.ts).
    kind: text('kind').notNull(),
    prompt: text('prompt').notNull(),
    // Enunciado de apoio (caso prático, dados do cálculo).
    context: text('context'),
    // Múltipla escolha: alternativas em JSON e índice da correta.
    optionsJson: text('options_json'),
    correctOption: integer('correct_option'),
    // Dissertativa/cálculo: gabarito comparado pelo próprio usuário (DEC-04, sem IA).
    modelAnswer: text('model_answer'),
    // Cálculo: valor esperado e tolerância absoluta.
    expectedValue: real('expected_value'),
    tolerance: real('tolerance'),
    // Cálculo: 5 perguntas de verificação do raciocínio (DEC-10), em JSON.
    verificationJson: text('verification_json'),
    explanation: text('explanation').notNull(),
    // "curado" (banco inicial) ou "importado" (planilha/CSV).
    source: text('source').notNull().default('curado'),
    active: integer('active').notNull().default(1),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_atlas_questions_content').on(table.contentId, table.position),
  ],
);

export const atlasQuizAttempts = sqliteTable(
  'atlas_quiz_attempts',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => atlasContents.id, { onDelete: 'cascade' }),
    // "quiz" (quiz do conteúdo); as revisões do MVP-06 usam o mesmo registro.
    purpose: text('purpose').notNull().default('quiz'),
    // "em-andamento", "autoavaliacao" (respostas travadas, falta comparar as
    // dissertativas com o gabarito) ou "enviado".
    status: text('status').notNull(),
    startedAt: text('started_at').notNull(),
    // Fim do tempo total (soma dos tempos por questão); nulo sem limite.
    deadlineAt: text('deadline_at'),
    submittedAt: text('submitted_at'),
    // Questões sorteadas, na ordem apresentada, com o tempo de cada uma.
    questionsJson: text('questions_json').notNull(),
    answersJson: text('answers_json'),
    // Correção por questão (acerto, anulada, explicação).
    resultJson: text('result_json'),
    score: real('score'),
    passed: integer('passed'),
    evidenceId: text('evidence_id').references(() => atlasEvidences.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('idx_atlas_quiz_attempts_content').on(
      table.contentId,
      table.startedAt,
    ),
    // No máximo uma tentativa em andamento por conteúdo e finalidade.
    uniqueIndex('uq_atlas_quiz_attempts_open')
      .on(table.contentId, table.purpose)
      .where(sql`status <> 'enviado'`),
  ],
);
