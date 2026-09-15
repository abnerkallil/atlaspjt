export type NotesPanelLink = { contentId: string; contentTitle: string };

export type NotesPanelNote = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  links: NotesPanelLink[];
};

export type NotesPanelSort = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

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
  options: { search?: string; linkedContentId?: string | null; sort?: NotesPanelSort },
): T[] {
  const { search = '', linkedContentId = null, sort = 'date-desc' } = options;
  const filtered = notes.filter((note) => {
    if (linkedContentId && !note.links.some((link) => link.contentId === linkedContentId)) {
      return false;
    }
    return matchesNotesPanelSearch(note, search);
  });
  return sortNotesPanel(filtered, sort);
}
