import { env } from 'cloudflare:workers';
import {
  SourceError,
  findSourceBySha256,
  insertSource,
  listSources,
  normalizeSourceInput,
  sourceErrorResponse,
  sourceObjectKey,
  validateSourceFile,
} from '@/lib/apolo/sources';
import type { D1Like } from '@/lib/pedagogy/transitions';

export const runtime = 'edge';

const MAX_BODY_BYTES = 30 * 1024 * 1024 + 64 * 1024;

function bindings() {
  const { DB, ATTACHMENTS } = env as unknown as { DB?: D1Like; ATTACHMENTS?: R2Bucket };
  if (!DB || !ATTACHMENTS) throw new SourceError('O acervo de fontes não está disponível.', 503);
  return { db: DB, bucket: ATTACHMENTS };
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// GET /api/apolo/fontes?tema=direito-constitucional → acervo (todo, ou por tema).
export async function GET(request: Request) {
  try {
    const { db } = bindings();
    const theme = new URL(request.url).searchParams.get('tema');
    return Response.json({ sources: await listSources(db, theme) });
  } catch (error) {
    return sourceErrorResponse(error);
  }
}

// POST multipart (title, theme?, sourceType, examBoard?/examOrg?/examYear?, file)
// → upload do PDF no R2 e registro no D1 (DEC-015). Mesmo PDF reenviado (sha256
// igual) é rejeitado em vez de duplicar o arquivo no acervo.
export async function POST(request: Request) {
  try {
    const { db, bucket } = bindings();
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new SourceError('O arquivo excede o limite de 30MB.', 413);
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new SourceError('Envio inválido.', 400);
    }
    const file = form.get('file');
    if (!(file instanceof File)) throw new SourceError('Escolha o arquivo PDF.', 400);
    const mimeType = validateSourceFile(file);
    const clean = normalizeSourceInput({
      title: form.get('title'),
      theme: form.get('theme'),
      sourceType: form.get('sourceType'),
      examBoard: form.get('examBoard'),
      examOrg: form.get('examOrg'),
      examYear: form.get('examYear'),
    });
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength !== file.size) throw new SourceError('Arquivo inconsistente.', 400);
    const sha256 = await sha256Hex(bytes);
    const duplicate = await findSourceBySha256(db, sha256);
    if (duplicate) throw new SourceError(`Este arquivo já está no acervo ("${duplicate.title}").`, 409);
    const id = crypto.randomUUID();
    const objectKey = sourceObjectKey(clean.theme, id);
    const now = new Date().toISOString();
    await bucket.put(objectKey, bytes, { httpMetadata: { contentType: mimeType } });
    try {
      const source = await insertSource(db, {
        id,
        ...clean,
        pageCount: null,
        fileName: file.name,
        mimeType,
        sizeBytes: bytes.byteLength,
        sha256,
        objectKey,
        now,
      });
      return Response.json({ source }, { status: 201 });
    } catch (error) {
      await bucket.delete(objectKey);
      throw error;
    }
  } catch (error) {
    return sourceErrorResponse(error);
  }
}
