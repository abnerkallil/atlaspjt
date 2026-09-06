import { listNotes, saveNote } from '@/lib/notes-store';

export const runtime = 'edge';

function errorResponse(error: unknown, status = 500) {
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível concluir a operação.';
  return Response.json({ error: message }, { status });
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
  const input = (await request.json()) as Record<string, unknown>;
  if (
    typeof input.id !== 'string' ||
    typeof input.operationId !== 'string' ||
    typeof input.title !== 'string' ||
    typeof input.body !== 'string' ||
    !Array.isArray(input.contentIds)
  ) {
    throw new Error('Dados da nota inválidos.');
  }
  if (!input.title.trim()) throw new Error('Dê um título à nota.');
  if (!input.body.trim()) throw new Error('Escreva o conteúdo da nota.');
  if (input.title.length > 180)
    throw new Error('O título deve ter no máximo 180 caracteres.');
  if (input.body.length > 100_000)
    throw new Error('A nota excede o limite de 100 mil caracteres.');
  if (!input.contentIds.every((id) => typeof id === 'string'))
    throw new Error('Vínculos inválidos.');
  return saveNote({
    id: input.id,
    operationId: input.operationId,
    title: input.title,
    body: input.body,
    contentIds: input.contentIds as string[],
    mode,
  });
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
