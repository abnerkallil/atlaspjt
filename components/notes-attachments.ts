// TEC-05 (UI): estado e chamadas de rede dos anexos de uma nota no editor.
// Os bytes vão ao R2 só pelas rotas /api/attachments (DEC-008); aqui fica a
// lógica pura e testável que o NotesWorkspace usa.
import { AttachmentError, validateAttachment } from '../lib/attachments.js';

export const ATTACHMENT_ACCEPT = '.png,.jpg,.jpeg,.pdf,.docx';

export type AttachmentMeta = {
  id: string;
  noteId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

// saved: já está no R2 e no D1. pending: aguarda a nota existir (nota nova
// ainda não salva). uploading: envio em curso. error: recusado ou falhou;
// `file` só fica guardado quando vale tentar de novo.
export type AttachmentItem = {
  key: string;
  id: string | null;
  name: string;
  size: number;
  mimeType: string;
  status: 'saved' | 'pending' | 'uploading' | 'error';
  error?: string;
  file?: File;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function savedAttachmentItem(meta: AttachmentMeta): AttachmentItem {
  return {
    key: meta.id,
    id: meta.id,
    name: meta.fileName,
    size: meta.sizeBytes,
    mimeType: meta.mimeType,
    status: 'saved',
  };
}

// Valida no navegador com as mesmas regras do servidor, para recusar na hora
// um arquivo grande demais ou de formato não aceito.
export function prepareAttachmentItem(file: File, key: string): AttachmentItem {
  const base = {
    key,
    id: null,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };
  try {
    const mimeType = validateAttachment(file);
    return { ...base, mimeType, status: 'pending', file };
  } catch (error) {
    const message =
      error instanceof AttachmentError ? error.message : 'Arquivo inválido.';
    return { ...base, status: 'error', error: message };
  }
}

export function attachmentDownloadUrl(id: string) {
  return `/api/attachments/${encodeURIComponent(id)}`;
}

export function describeAttachment(item: AttachmentItem, sizeLabel: string) {
  if (item.status === 'uploading') return `Enviando… ${sizeLabel}`;
  if (item.status === 'pending') return `${sizeLabel} · envia ao salvar a nota`;
  if (item.status === 'error') return item.error ?? 'Falha no envio.';
  return sizeLabel;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchNoteAttachments(
  noteId: string,
  fetchImpl: FetchLike = fetch,
): Promise<AttachmentMeta[]> {
  const response = await fetchImpl(
    `/api/attachments?noteId=${encodeURIComponent(noteId)}`,
  );
  if (!response.ok) {
    throw new Error(
      await readError(response, 'Não foi possível carregar os anexos.'),
    );
  }
  const data = (await response.json()) as { attachments?: AttachmentMeta[] };
  return data.attachments ?? [];
}

export async function uploadAttachment(
  noteId: string,
  file: File,
  fetchImpl: FetchLike = fetch,
): Promise<AttachmentMeta> {
  const form = new FormData();
  form.set('noteId', noteId);
  form.set('file', file, file.name);
  const response = await fetchImpl('/api/attachments', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Falha no envio do anexo.'));
  }
  const data = (await response.json()) as { attachment?: AttachmentMeta };
  if (!data.attachment) throw new Error('Falha no envio do anexo.');
  return data.attachment;
}

export async function deleteAttachment(
  id: string,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  const response = await fetchImpl(attachmentDownloadUrl(id), {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(
      await readError(response, 'Não foi possível remover o anexo.'),
    );
  }
}
