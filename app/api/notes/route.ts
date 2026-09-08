import { listNotes, saveNote } from '@/lib/notes-store';
import { parseAtlasNotesSaveRequest } from '@/lib/atlas-notes-input';
import { AtlasNotesValidationError } from '@/lib/atlas-notes-document';

export const runtime = 'edge';

function errorResponse(error: unknown, status = 500) {
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível concluir a operação.';
  const validation =
    error instanceof AtlasNotesValidationError ? error : undefined;
  return Response.json(
    {
      error: message,
      ...(validation ? { code: validation.code, path: validation.path } : {}),
    },
    { status: validation?.status ?? status },
  );
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return Response.json({ notes: await listNotes(query) });
  } catch (error) {
    return errorResponse(error);
  }
}

async function readInput(request: Request, mode: 'create' | 'update') {
  const input = parseAtlasNotesSaveRequest(await request.text(), mode);
  return saveNote(input);
}

export async function POST(request: Request) {
  try {
    return Response.json(await readInput(request, 'create'), { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function PUT(request: Request) {
  try {
    return Response.json(await readInput(request, 'update'));
  } catch (error) {
    return errorResponse(error, 400);
  }
}
