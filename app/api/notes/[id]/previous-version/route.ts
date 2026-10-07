import {
  getNotePreviousVersion,
  restoreNotePreviousVersion,
} from '@/lib/notes-store';
import { AtlasNotesValidationError } from '@/lib/atlas-notes-document';

export const runtime = 'edge';

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const validation =
    error instanceof AtlasNotesValidationError ? error : undefined;
  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.',
      ...(validation ? { code: validation.code } : {}),
    },
    { status: validation?.status ?? 500 },
  );
}

// DEC-012: a versão anterior da nota (a atual é a própria nota).
export async function GET(_request: Request, { params }: Context) {
  try {
    const version = await getNotePreviousVersion((await params).id);
    return Response.json({ version });
  } catch (error) {
    return errorResponse(error);
  }
}

// Restaura a versão anterior; a que estava atual passa a ser a anterior.
export async function POST(_request: Request, { params }: Context) {
  try {
    const note = await restoreNotePreviousVersion((await params).id);
    if (!note) {
      return Response.json(
        { error: 'Esta nota não tem versão anterior.' },
        { status: 404 },
      );
    }
    return Response.json({ note });
  } catch (error) {
    return errorResponse(error);
  }
}
