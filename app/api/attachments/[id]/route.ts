import { deleteAttachment, readAttachment } from '@/lib/attachments-store';
import { attachmentErrorResponse } from '@/lib/attachments';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const found = await readAttachment((await params).id);
    if (!found) return Response.json({ error: 'Anexo não encontrado.' }, { status: 404 });
    const { meta, body } = found;
    const inline = meta.mimeType.startsWith('image/');
    return new Response(body, {
      headers: {
        'content-type': meta.mimeType,
        'content-length': String(meta.sizeBytes),
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.fileName)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return attachmentErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const removed = await deleteAttachment((await params).id);
    if (!removed) return Response.json({ error: 'Anexo não encontrado.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return attachmentErrorResponse(error);
  }
}
