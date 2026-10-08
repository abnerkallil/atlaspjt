// Curadoria de rascunhos (APO-07): questão extraída (APO-06) ou proposta à
// mão, pendente até um humano aprovar, editar ou descartar — nunca seleção
// automatizada ("precisamos de curadoria se quisermos um desenvolvimento
// sério" — Abner, 2026-10-08). Aprovar grava a linha em atlas_questions, na
// posição seguinte do conteúdo, já ativa (aparece no próximo quiz); descartar
// é definitivo, sem reaparecer na fila.
import { QUESTION_KINDS, type QuestionKind } from '../quizzes.js';
import type { D1Like } from '../pedagogy/transitions.js';
import type { BloomLevel } from './types.js';
import type { KnowledgeType, QuestionOrigin } from './question-bank.js';

export const DRAFT_STATUSES = ['pendente', 'aprovado', 'descartado'] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export type LintWarning = { reason: string };

export type Draft = {
  id: string;
  sourceId: string | null;
  contentId: string | null;
  subtopicId: string | null;
  theme: string | null;
  kind: QuestionKind;
  prompt: string;
  context: string | null;
  options: string[] | null;
  correctOption: number | null;
  modelAnswer: string | null;
  expectedValue: number | null;
  tolerance: number | null;
  verification: unknown;
  bloomLevel: BloomLevel | null;
  knowledgeType: KnowledgeType | null;
  origin: QuestionOrigin;
  examBoard: string | null;
  examOrg: string | null;
  examYear: number | null;
  explanation: string | null;
  optionExplanations: unknown;
  textHash: string | null;
  lintWarnings: string[];
  status: DraftStatus;
  approvedQuestionId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type DraftRow = {
  id: string;
  source_id: string | null;
  content_id: string | null;
  subtopic_id: string | null;
  theme: string | null;
  kind: string;
  prompt: string;
  context: string | null;
  options_json: string | null;
  correct_option: number | null;
  model_answer: string | null;
  expected_value: number | null;
  tolerance: number | null;
  verification_json: string | null;
  bloom_level: string | null;
  knowledge_type: string | null;
  origin: string;
  exam_board: string | null;
  exam_org: string | null;
  exam_year: number | null;
  explanation: string | null;
  option_explanations_json: string | null;
  text_hash: string | null;
  lint_warnings_json: string | null;
  status: string;
  approved_question_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export class DraftError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    sourceId: row.source_id,
    contentId: row.content_id,
    subtopicId: row.subtopic_id,
    theme: row.theme,
    kind: row.kind as QuestionKind,
    prompt: row.prompt,
    context: row.context,
    options: parseJson<string[]>(row.options_json),
    correctOption: row.correct_option === null ? null : Number(row.correct_option),
    modelAnswer: row.model_answer,
    expectedValue: row.expected_value === null ? null : Number(row.expected_value),
    tolerance: row.tolerance === null ? null : Number(row.tolerance),
    verification: parseJson(row.verification_json),
    bloomLevel: row.bloom_level as BloomLevel | null,
    knowledgeType: row.knowledge_type as KnowledgeType | null,
    origin: row.origin as QuestionOrigin,
    examBoard: row.exam_board,
    examOrg: row.exam_org,
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    explanation: row.explanation,
    optionExplanations: parseJson(row.option_explanations_json),
    textHash: row.text_hash,
    lintWarnings: parseJson<string[]>(row.lint_warnings_json) ?? [],
    status: row.status as DraftStatus,
    approvedQuestionId: row.approved_question_id,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

const COLUMNS =
  'id, source_id, content_id, subtopic_id, theme, kind, prompt, context, options_json, correct_option, model_answer, ' +
  'expected_value, tolerance, verification_json, bloom_level, knowledge_type, origin, exam_board, exam_org, exam_year, ' +
  'explanation, option_explanations_json, text_hash, lint_warnings_json, status, approved_question_id, created_at, reviewed_at';

export async function listDrafts(db: D1Like, status?: DraftStatus): Promise<Draft[]> {
  const { results } = status
    ? await db
        .prepare(`SELECT ${COLUMNS} FROM atlas_question_drafts WHERE status = ?1 ORDER BY created_at`)
        .bind(status)
        .all<DraftRow>()
    : await db.prepare(`SELECT ${COLUMNS} FROM atlas_question_drafts ORDER BY created_at`).all<DraftRow>();
  return results.map(toDraft);
}

export async function getDraft(db: D1Like, id: string): Promise<Draft | null> {
  const row = await db.prepare(`SELECT ${COLUMNS} FROM atlas_question_drafts WHERE id = ?1`).bind(id).first<DraftRow>();
  return row ? toDraft(row) : null;
}

export type NewDraftInput = {
  id: string;
  sourceId: string | null;
  theme: string | null;
  kind: string;
  prompt: string;
  context?: string | null;
  options?: string[] | null;
  correctOption?: number | null;
  modelAnswer?: string | null;
  expectedValue?: number | null;
  tolerance?: number | null;
  examBoard?: string | null;
  examOrg?: string | null;
  examYear?: number | null;
  explanation?: string | null;
  textHash?: string | null;
  lintWarnings?: string[];
};

// Grava um lote de rascunhos recém-extraídos (APO-06): sempre "pendente",
// sem conteúdo/subtópico/Bloom ainda — isso só se escolhe na curadoria.
export async function insertDrafts(db: D1Like, items: NewDraftInput[], now: string): Promise<void> {
  if (!items.length) return;
  await db.batch(
    items.map((item) =>
      db
        .prepare(
          `INSERT INTO atlas_question_drafts
           (id, source_id, theme, kind, prompt, context, options_json, correct_option, model_answer,
            expected_value, tolerance, origin, exam_board, exam_org, exam_year, explanation, text_hash,
            lint_warnings_json, status, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'oficial', ?12, ?13, ?14, ?15, ?16, ?17, 'pendente', ?18)`,
        )
        .bind(
          item.id,
          item.sourceId,
          item.theme,
          item.kind,
          item.prompt,
          item.context ?? null,
          item.options ? JSON.stringify(item.options) : null,
          item.correctOption ?? null,
          item.modelAnswer ?? null,
          item.expectedValue ?? null,
          item.tolerance ?? null,
          item.examBoard ?? null,
          item.examOrg ?? null,
          item.examYear ?? null,
          item.explanation ?? null,
          item.textHash ?? null,
          item.lintWarnings?.length ? JSON.stringify(item.lintWarnings) : null,
          now,
        ),
    ),
  );
}

export type DraftEdit = {
  contentId?: string | null;
  subtopicId?: string | null;
  theme?: string | null;
  kind?: string;
  prompt?: string;
  context?: string | null;
  options?: string[] | null;
  correctOption?: number | null;
  modelAnswer?: string | null;
  expectedValue?: number | null;
  tolerance?: number | null;
  bloomLevel?: string | null;
  knowledgeType?: string | null;
  explanation?: string | null;
};

async function assertPendente(db: D1Like, id: string): Promise<Draft> {
  const draft = await getDraft(db, id);
  if (!draft) throw new DraftError('Rascunho não encontrado.', 404);
  if (draft.status !== 'pendente') throw new DraftError(`Este rascunho já foi ${draft.status}.`, 409);
  return draft;
}

// Edita um rascunho pendente — é aqui que a curadoria escolhe conteúdo,
// subtópico, Bloom e escreve a explicação (DEC-04, sem IA).
export async function updateDraft(db: D1Like, id: string, edit: DraftEdit): Promise<Draft> {
  await assertPendente(db, id);
  if (edit.kind && !QUESTION_KINDS.includes(edit.kind as QuestionKind)) {
    throw new DraftError('Tipo de questão inválido.', 400);
  }
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 2;
  const assign = (column: string, value: unknown) => {
    sets.push(`${column} = ?${index}`);
    values.push(value);
    index += 1;
  };
  if ('contentId' in edit) assign('content_id', edit.contentId ?? null);
  if ('subtopicId' in edit) assign('subtopic_id', edit.subtopicId ?? null);
  if ('theme' in edit) assign('theme', edit.theme ?? null);
  if (edit.kind) assign('kind', edit.kind);
  if (edit.prompt !== undefined) assign('prompt', edit.prompt);
  if ('context' in edit) assign('context', edit.context ?? null);
  if ('options' in edit) assign('options_json', edit.options ? JSON.stringify(edit.options) : null);
  if ('correctOption' in edit) assign('correct_option', edit.correctOption ?? null);
  if ('modelAnswer' in edit) assign('model_answer', edit.modelAnswer ?? null);
  if ('expectedValue' in edit) assign('expected_value', edit.expectedValue ?? null);
  if ('tolerance' in edit) assign('tolerance', edit.tolerance ?? null);
  if ('bloomLevel' in edit) assign('bloom_level', edit.bloomLevel ?? null);
  if ('knowledgeType' in edit) assign('knowledge_type', edit.knowledgeType ?? null);
  if ('explanation' in edit) assign('explanation', edit.explanation ?? null);
  if (!sets.length) throw new DraftError('Nada para alterar.', 400);
  await db.prepare(`UPDATE atlas_question_drafts SET ${sets.join(', ')} WHERE id = ?1`).bind(id, ...values).all();
  return (await getDraft(db, id))!;
}

// Aprova: exige conteúdo, Bloom e explicação já preenchidos (DEC-04), grava a
// questão na posição seguinte do conteúdo, já ativa — some da fila de volta.
export async function approveDraft(db: D1Like, id: string, now: string): Promise<{ draft: Draft; questionId: string }> {
  const draft = await assertPendente(db, id);
  if (!draft.contentId) throw new DraftError('Escolha o conteúdo antes de aprovar.', 400);
  if (!draft.bloomLevel) throw new DraftError('Escolha o nível de Bloom antes de aprovar.', 400);
  if (!draft.explanation?.trim()) throw new DraftError('Escreva a explicação antes de aprovar.', 400);

  let sourceObjectKey: string | null = null;
  if (draft.sourceId) {
    const source = await db
      .prepare('SELECT object_key FROM atlas_question_sources WHERE id = ?1')
      .bind(draft.sourceId)
      .first<{ object_key: string }>();
    sourceObjectKey = source?.object_key ?? null;
  }
  const next = await db
    .prepare('SELECT COALESCE(MAX(position) + 1, 0) AS position FROM atlas_questions WHERE content_id = ?1')
    .bind(draft.contentId)
    .first<{ position: number }>();
  const questionId = `${draft.contentId}-rascunho-${id.slice(0, 8)}`;

  await db.batch([
    db
      .prepare(
        `INSERT INTO atlas_questions
         (id, content_id, position, kind, prompt, context, options_json, correct_option, model_answer, expected_value,
          tolerance, verification_json, explanation, source, active, updated_at, theme, bloom_level, lifecycle_state,
          subtopic_id, knowledge_type, origin, exam_board, exam_org, exam_year, source_object_key, text_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'importado', 1, ?14, ?15, ?16, 'ativa', ?17, ?18, ?19,
                 ?20, ?21, ?22, ?23, ?24)`,
      )
      .bind(
        questionId,
        draft.contentId,
        Number(next?.position ?? 0),
        draft.kind,
        draft.prompt,
        draft.context,
        draft.options ? JSON.stringify(draft.options) : null,
        draft.correctOption,
        draft.modelAnswer,
        draft.expectedValue,
        draft.tolerance,
        draft.verification ? JSON.stringify(draft.verification) : null,
        draft.explanation,
        now,
        draft.theme,
        draft.bloomLevel,
        draft.subtopicId,
        draft.knowledgeType,
        draft.origin,
        draft.examBoard,
        draft.examOrg,
        draft.examYear,
        sourceObjectKey,
        draft.textHash,
      ),
    db
      .prepare(`UPDATE atlas_question_drafts SET status = 'aprovado', approved_question_id = ?2, reviewed_at = ?3 WHERE id = ?1`)
      .bind(id, questionId, now),
  ]);
  return { draft: (await getDraft(db, id))!, questionId };
}

// Descarta um rascunho pendente — definitivo, não reaparece na fila.
export async function discardDraft(db: D1Like, id: string, now: string): Promise<Draft> {
  await assertPendente(db, id);
  await db.prepare(`UPDATE atlas_question_drafts SET status = 'descartado', reviewed_at = ?2 WHERE id = ?1`).bind(id, now).all();
  return (await getDraft(db, id))!;
}

export function draftErrorResponse(error: unknown) {
  if (error instanceof DraftError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('apolo/drafts: erro inesperado', error);
  return Response.json({ error: 'Não foi possível concluir a operação com o rascunho.' }, { status: 500 });
}
