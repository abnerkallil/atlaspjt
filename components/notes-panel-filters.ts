export type NotesPanelLink = { contentId: string; contentTitle: string };

export type NotesPanelNote = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  links: NotesPanelLink[];
  // Optional so existing call sites/tests that don't track folders keep
  // working unchanged; a missing value means "sem pasta", same as null.
  folderId?: string | null;
};

export type NotesPanelSort = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

// Sentinel for the "Sem pasta" filter option — distinct from '' ("Todas as
// pastas", no filtering) and from any real folder id.
export const NO_FOLDER_FILTER = '__sem_pasta__';

function normalize(value: string) {
  return value.toLowerCase();
}

export function matchesNotesPanelSearch<T extends NotesPanelNote>(
  note: T,
  query: string,
): boolean {
  const needle = normalize(query.trim());
  if (!needle) return true;
  if (normalize(note.title).includes(needle)) return true;
  if (normalize(note.body).includes(needle)) return true;
  return note.links.some(
    (link) =>
      normalize(link.contentTitle).includes(needle) ||
      normalize(link.contentId).includes(needle),
  );
}

export function sortNotesPanel<T extends NotesPanelNote>(
  notes: T[],
  sort: NotesPanelSort,
): T[] {
  const sorted = [...notes];
  switch (sort) {
    case 'date-asc':
      sorted.sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0));
      break;
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
      break;
    case 'title-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title, 'pt-BR'));
      break;
    case 'date-desc':
    default:
      sorted.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
      break;
  }
  return sorted;
}

export function applyNotesPanelFilters<T extends NotesPanelNote>(
  notes: T[],
  options: {
    search?: string;
    linkedContentId?: string | null;
    folderId?: string | null;
    sort?: NotesPanelSort;
  },
): T[] {
  const {
    search = '',
    linkedContentId = null,
    folderId = null,
    sort = 'date-desc',
  } = options;
  const filtered = notes.filter((note) => {
    if (linkedContentId && !note.links.some((link) => link.contentId === linkedContentId)) {
      return false;
    }
    if (folderId === NO_FOLDER_FILTER) {
      if ((note.folderId ?? null) !== null) return false;
    } else if (folderId && (note.folderId ?? null) !== folderId) {
      return false;
    }
    return matchesNotesPanelSearch(note, search);
  });
  return sortNotesPanel(filtered, sort);
}
