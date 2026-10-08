import { env } from 'cloudflare:workers';
import { MAX_ATTACHMENT_BYTES, validateAttachment } from '@/lib/attachments';
import {
  MaterialError,
  assertCanAdd,
  fileTitle,
  insertMaterial,
  listMaterials,
  materialErrorResponse,
  materialObjectKey,
  normalizeMaterial,
} from '@/lib/materials';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

// Margem do multipart sobre o limite de 10MB do arquivo (DEC-07).
const MAX_BODY_BYTES = MAX_ATTACHMENT_BYTES + 64 * 1024;

function bindings() {
  const { DB, ATTACHMENTS } = env as unknown as { DB?: D1Like; ATTACHMENTS?: R2Bucket };
  if (!DB) throw new MaterialError('Banco indisponível.', 503);
  return { db: DB, bucket: ATTACHMENTS };
}

// GET /api/materiais?conteudo=CG-001 → materiais de estudo do conteúdo (UX-01).
export async function GET(request: Request) {
  try {
    const contentId = new URL(request.url).searchParams.get('conteudo');
    if (!contentId) throw new MaterialError('Informe o conteúdo.', 400);
    return Response.json({ materials: await listMaterials(bindings().db, contentId) });
  } catch (error) {
    return materialErrorResponse(error);
  }
}

// POST /api/materiais: JSON { conteudo, kind: "texto" | "link", title, body | url }
// ou multipart (conteudo, title, file) para arquivo. Bytes no R2, metadados no D1 (DEC-008).
export async function POST(request: Request) {
  try {
    const { db, bucket } = bindings();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
      const declared = Number(request.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
        throw new MaterialError('O arquivo excede o limite de 10MB.', 413);
      }
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        throw new MaterialError('Envio inválido.', 400);
      }
      const contentId = form.get('conteudo');
      const file = form.get('file');
      if (typeof contentId !== 'string' || !contentId) throw new MaterialError('Informe o conteúdo.', 400);
      if (!(file instanceof File)) throw new MaterialError('Escolha o arquivo.', 400);
      if (!bucket) throw new MaterialError('O armazenamento de arquivos não está disponível.', 503);
      const mimeType = validateAttachment(file);
      const title = fileTitle(form.get('title'), file.name);
      await assertCanAdd(db, contentId);
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength !== file.size) throw new MaterialError('Arquivo inconsistente.', 400);
      const objectKey = materialObjectKey(contentId, id);
      await bucket.put(objectKey, bytes, { httpMetadata: { contentType: mimeType } });
      try {
        const material = await insertMaterial(db, {
          id,
          contentId,
          kind: 'arquivo',
          title,
          file: { fileName: file.name, mimeType, sizeBytes: bytes.byteLength, objectKey },
          now,
        });
        return Response.json({ material }, { status: 201 });
      } catch (error) {
        await bucket.delete(objectKey);
        throw error;
      }
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      throw new MaterialError('Envio inválido.', 400);
    }
    const contentId = body.conteudo;
    if (typeof contentId !== 'string' || !contentId) throw new MaterialError('Informe o conteúdo.', 400);
    const clean = normalizeMaterial(body);
    await assertCanAdd(db, contentId);
    const material = await insertMaterial(db, { id, contentId, ...clean, now });
    return Response.json({ material }, { status: 201 });
  } catch (error) {
    return materialErrorResponse(error);
  }
}
