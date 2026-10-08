import { env } from 'cloudflare:workers';
import { deleteMaterial, getMaterial, materialErrorResponse } from '@/lib/materials';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function bindings() {
  return env as unknown as { DB?: D1Like; ATTACHMENTS?: R2Bucket };
}

// GET /api/materiais/:id → bytes do arquivo do material (só pela rota autenticada,
// DEC-008). PDF e imagem abrem no navegador; DOCX baixa.
export async function GET(_request: Request, { params }: Context) {
  try {
    const { DB, ATTACHMENTS } = bindings();
    if (!DB || !ATTACHMENTS) return Response.json({ error: 'Armazenamento indisponível.' }, { status: 503 });
    const found = await getMaterial(DB, (await params).id);
    if (!found?.objectKey || !found.material.mimeType) {
      return Response.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }
    const object = await ATTACHMENTS.get(found.objectKey);
    if (!object) return Response.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    const { mimeType, fileName, sizeBytes } = found.material;
    const inline = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    return new Response(object.body, {
      headers: {
        'content-type': mimeType,
        'content-length': String(sizeBytes ?? object.size),
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(fileName ?? 'arquivo')}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return materialErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { DB, ATTACHMENTS } = bindings();
    if (!DB) return Response.json({ error: 'Banco indisponível.' }, { status: 503 });
    const removed = await deleteMaterial(DB, (await params).id);
    if (!removed) return Response.json({ error: 'Material não encontrado.' }, { status: 404 });
    if (removed.objectKey) await ATTACHMENTS?.delete(removed.objectKey);
    return Response.json({ ok: true });
  } catch (error) {
    return materialErrorResponse(error);
  }
}
