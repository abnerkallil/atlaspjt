// MVP-03 "Histórico" (DEC-012): chamadas de rede da versão anterior de uma
// nota. O Atlas guarda só a versão atual e a anterior; aqui fica a lógica pura
// e testável que o NotesWorkspace usa para ver e restaurar a anterior.
export type PreviousNoteVersion = {
  noteId: string;
  title: string;
  body: string;
  savedAt: string;
  replacedAt: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function previousVersionUrl(noteId: string) {
  return `/api/notes/${encodeURIComponent(noteId)}/previous-version`;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

// null quando a nota ainda não tem versão anterior (nunca foi alterada).
export async function fetchPreviousVersion(
  noteId: string,
  fetchImpl: FetchLike = fetch,
): Promise<PreviousNoteVersion | null> {
  const response = await fetchImpl(previousVersionUrl(noteId));
  if (!response.ok) {
    throw new Error(
      await readError(response, 'Não foi possível carregar a versão anterior.'),
    );
  }
  const data = (await response.json()) as {
    version?: PreviousNoteVersion | null;
  };
  return data.version ?? null;
}

// Devolve a nota já restaurada, para o editor recarregar a partir dela.
export async function restorePreviousVersion<Note>(
  noteId: string,
  fetchImpl: FetchLike = fetch,
): Promise<Note> {
  const response = await fetchImpl(previousVersionUrl(noteId), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        'Não foi possível restaurar a versão anterior.',
      ),
    );
  }
  const data = (await response.json()) as { note?: Note };
  if (!data.note)
    throw new Error('Não foi possível restaurar a versão anterior.');
  return data.note;
}
