import { env } from 'cloudflare:workers';
import { deleteSource, getSource, sourceErrorResponse } from '@/lib/apolo/sources';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function bindings() {
  return env as unknown as { DB?: D1Like; ATTACHMENTS?: R2Bucket };
}

// GET /api/apolo/fontes/:id → bytes do PDF, só pela rota autenticada (DEC-015:
// o acervo não tem acesso público até a revisão jurídica de direitos autorais).
export async function GET(_request: Request, { params }: Context) {
  try {
    const { DB, ATTACHMENTS } = bindings();
    if (!DB || !ATTACHMENTS) return Response.json({ error: 'Acervo indisponível.' }, { status: 503 });
    const found = await getSource(DB, (await params).id);
    if (!found) return Response.json({ error: 'Fonte não encontrada.' }, { status: 404 });
    const object = await ATTACHMENTS.get(found.objectKey);
    if (!object) return Response.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    const { fileName, sizeBytes } = found.source;
    return new Response(object.body, {
      headers: {
        'content-type': 'application/pdf',
        'content-length': String(sizeBytes),
        'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return sourceErrorResponse(error);
  }
}

// DELETE: remove o PDF do R2 e a linha do D1 (DEC-08: exclusão real e imediata).
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { DB, ATTACHMENTS } = bindings();
    if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const removed = await deleteSource(DB, (await params).id);
    if (!removed) return Response.json({ error: 'Fonte não encontrada.' }, { status: 404 });
    await ATTACHMENTS?.delete(removed.objectKey);
    return Response.json({ ok: true });
  } catch (error) {
    return sourceErrorResponse(error);
  }
}
