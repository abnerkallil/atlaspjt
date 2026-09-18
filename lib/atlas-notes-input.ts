import {
  ATLAS_NOTES_LIMITS,
  AtlasNotesValidationError,
  assertAtlasNotesRequestSize,
  prepareAtlasNotesForSave,
  type AtlasNotesEnvelope,
} from './atlas-notes-document.js';

export type AtlasNotesSaveInput = {
  id: string;
  operationId: string;
  title: string;
  body: string;
  content: AtlasNotesEnvelope | null;
  contentJson: string | null;
  contentIds: string[];
  folderId: string | null;
  isPrivate: boolean;
  mode: 'create' | 'update';
};

export function assertAtlasNotesOperationTarget(
  existingNoteId: string,
  requestedNoteId: string,
) {
  if (existingNoteId !== requestedNoteId) {
    throw new AtlasNotesValidationError(
      'OPERATION_CONFLICT',
      'Esta operação já foi usada para outra nota.',
    );
  }
}

export function assertAtlasNotesStructuredWrite(
  existingContentJson: string | null,
  nextContentJson: string | null,
) {
  if (existingContentJson !== null && nextContentJson === null) {
    throw new AtlasNotesValidationError(
      'STRUCTURED_DOWNGRADE',
      'Esta nota formatada precisa ser salva com seu conteúdo estruturado.',
    );
  }
}

function invalid(message = 'Dados da nota inválidos.'): never {
  throw new AtlasNotesValidationError('INVALID_REQUEST', message);
}

function parseFolderId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.trim()) invalid('Pasta inválida.');
  return value;
}

function parseIsPrivate(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') invalid('Indicação de nota privada inválida.');
  return value;
}

function parseObject(rawBody: string) {
  assertAtlasNotesRequestSize(rawBody);
  try {
    const value = JSON.parse(rawBody) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AtlasNotesValidationError) throw error;
    return invalid();
  }
}

export function parseAtlasNotesSaveRequest(
  rawBody: string,
  mode: 'create' | 'update',
): AtlasNotesSaveInput {
  const input = parseObject(rawBody);
  if (
    typeof input.id !== 'string' ||
    typeof input.operationId !== 'string' ||
    typeof input.title !== 'string' ||
    typeof input.body !== 'string' ||
    !Array.isArray(input.contentIds)
  ) {
    invalid();
  }
  if (!input.contentIds.every((id) => typeof id === 'string')) {
    invalid('Vínculos inválidos.');
  }

  const title = input.title.trim();
  if (!title) invalid('Dê um título à nota.');
  if (input.title.length > 180) {
    invalid('O título deve ter no máximo 180 caracteres.');
  }

  const folderId = parseFolderId(input.folderId);
  const isPrivate = parseIsPrivate(input.isPrivate);

  const hasStructuredContent =
    input.content !== undefined && input.content !== null;
  if (hasStructuredContent) {
    const prepared = prepareAtlasNotesForSave(input.content);
    if (input.body !== prepared.body) {
      throw new AtlasNotesValidationError(
        'BODY_PROJECTION_MISMATCH',
        'O texto pesquisável não corresponde ao conteúdo estruturado.',
        400,
        'body',
      );
    }
    return {
      id: input.id,
      operationId: input.operationId,
      title,
      body: prepared.body,
      content: prepared.content,
      contentJson: prepared.contentJson,
      contentIds: input.contentIds as string[],
      folderId,
      isPrivate,
      mode,
    };
  }

  const body = input.body.trim();
  if (!body) invalid('Escreva o conteúdo da nota.');
  if (body.length > ATLAS_NOTES_LIMITS.visibleLength) {
    throw new AtlasNotesValidationError(
      'VISIBLE_LIMIT_EXCEEDED',
      'A nota excede o limite de 100 mil caracteres.',
      400,
      'body',
    );
  }
  return {
    id: input.id,
    operationId: input.operationId,
    title,
    body,
    content: null,
    contentJson: null,
    contentIds: input.contentIds as string[],
    folderId,
    isPrivate,
    mode,
  };
}
