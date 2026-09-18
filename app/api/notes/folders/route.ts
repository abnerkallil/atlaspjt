import { createFolder, listFolders, renameFolder } from '@/lib/notes-store';
import { AtlasNotesValidationError } from '@/lib/atlas-notes-document';

export const runtime = 'edge';

const MAX_FOLDER_NAME_LENGTH = 80;

function errorResponse(error: unknown, status = 500) {
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível concluir a operação.';
  const validation =
    error instanceof AtlasNotesValidationError ? error : undefined;
  return Response.json(
    { error: message },
    { status: validation?.status ?? status },
  );
}

function parseFolderName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Dê um nome à pasta.');
  }
  const name = value.trim();
  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    throw new Error(
      `O nome da pasta deve ter no máximo ${MAX_FOLDER_NAME_LENGTH} caracteres.`,
    );
  }
  return name;
}

export async function GET() {
  try {
    return Response.json({ folders: await listFolders() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown };
    const name = parseFolderName(body.name);
    return Response.json({ folder: await createFolder(name) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown; name?: unknown };
    if (typeof body.id !== 'string' || !body.id.trim()) {
      return Response.json({ error: 'Identificador da pasta inválido.' }, { status: 400 });
    }
    const name = parseFolderName(body.name);
    return Response.json({ folder: await renameFolder(body.id, name) });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
