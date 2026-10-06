import { AttachmentError, MAX_ATTACHMENT_BYTES, attachmentErrorResponse } from '@/lib/attachments';
import { listAttachments, saveAttachment } from '@/lib/attachments-store';

export const runtime = 'edge';

// Multipart framing overhead allowed on top of the 10MB file limit.
const MAX_BODY_BYTES = MAX_ATTACHMENT_BYTES + 64 * 1024;

export async function GET(request: Request) {
  try {
    const noteId = new URL(request.url).searchParams.get('noteId');
    if (!noteId) throw new AttachmentError('Informe noteId.', 400);
    return Response.json({ attachments: await listAttachments(noteId) });
  } catch (error) {
    return attachmentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new AttachmentError('O arquivo excede o limite de 10MB.', 413);
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AttachmentError('Envio inválido.', 400);
    }
    const noteId = form.get('noteId');
    const file = form.get('file');
    if (typeof noteId !== 'string' || !noteId.trim()) {
      throw new AttachmentError('Informe noteId.', 400);
    }
    if (!(file instanceof File)) throw new AttachmentError('Informe o arquivo.', 400);
    return Response.json({ attachment: await saveAttachment(noteId, file) }, { status: 201 });
  } catch (error) {
    return attachmentErrorResponse(error);
  }
}
