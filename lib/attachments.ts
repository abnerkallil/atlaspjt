// DEC-07 / DEC-008: regras puras de validação de anexos (sem dependência de runtime).

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export class AttachmentError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase();
}

// Returns the canonical mime type for an accepted file, or throws AttachmentError.
// The declared mime type from the client is checked against the extension; the
// stored type always comes from the allowlist, never from the client.
export function validateAttachment(file: { name: string; size: number; type: string }) {
  const allowed = ALLOWED_TYPES[extensionOf(file.name)];
  if (!allowed) {
    throw new AttachmentError('Formato não suportado. Use PNG, JPG, JPEG, PDF ou DOCX.', 415);
  }
  if (file.type && !allowed.includes(file.type) && file.type !== 'application/octet-stream') {
    throw new AttachmentError('O tipo do arquivo não corresponde à extensão.', 415);
  }
  if (file.size <= 0) throw new AttachmentError('Arquivo vazio.', 400);
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentError('O arquivo excede o limite de 10MB.', 413);
  }
  return allowed[0];
}

// Display name only: strips any path and control characters. The R2 key never
// contains the user-supplied name.
export function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f"]/g, '').trim();
  return clean.slice(0, 200) || 'arquivo';
}

export function objectKeyFor(noteId: string, attachmentId: string) {
  return `attachments/${noteId}/${attachmentId}`;
}

export function attachmentErrorResponse(error: unknown) {
  if (error instanceof AttachmentError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('attachments: unexpected error', error);
  return Response.json({ error: 'Não foi possível concluir a operação.' }, { status: 500 });
}
