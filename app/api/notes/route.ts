import {
  listNotes,
  listRecentNotes,
  recordNoteOpen,
  saveNote,
} from '@/lib/notes-store';
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
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get('recent') === '1') {
      return Response.json({ notes: await listRecentNotes(5) });
    }
    const query = searchParams.get('q') ?? '';
    return Response.json({ notes: await listNotes(query) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id !== 'string' || !body.id.trim()) {
      return Response.json(
        { error: 'Identificador da nota inválido.' },
        { status: 400 },
      );
    }
    await recordNoteOpen(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
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
