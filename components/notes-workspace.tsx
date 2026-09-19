'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookMarked,
  Check,
  ChevronRight,
  Clock3,
  Cloud,
  FilePenLine,
  FolderTree,
  Link2,
  LoaderCircle,
  Lock,
  LockOpen,
  Paperclip,
  Pencil,
  PieChart,
  Plus,
  Search,
  Sparkles,
  Star,
  Unlink,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Attachment,
  AttachmentActions,
  AttachmentAction,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import {
  MARK_COLOR_META,
  NotesEditor,
  type NotesEditorFocusRequest,
  type NotesEditorSnapshot,
} from '@/components/notes-editor';
import {
  extractAtlasNotesFavorites,
  legacyTextToAtlasNotesContent,
  type AtlasNotesEnvelope,
  type AtlasNotesMarkColor,
} from '@/lib/atlas-notes-document';
import {
  CONTENT_CATALOG_SNAPSHOT_DATE,
  contentCatalog,
  ContentReference,
  OFFICIAL_SPREADSHEET_URL,
  searchContentCatalog,
  suggestContentLinks,
} from '@/lib/content-catalog';
import { mergeRecentInteraction } from './notes-recent-list';
import {
  applyNotesPanelFilters,
  NO_FOLDER_FILTER,
  type NotesPanelSort,
} from './notes-panel-filters';
import { computeContentCoverage, computeOverallCoverage } from './notes-coverage';

const LINK_STATUS = 'Anotado — ainda não trabalhado' as const;

type AtlasNote = {
  id: string;
  title: string;
  body: string;
  content: AtlasNotesEnvelope | null;
  createdAt: string;
  updatedAt: string;
  lastInteractedAt: string;
  links: Array<{
    contentId: string;
    contentTitle: string;
    subject: string;
    status: typeof LINK_STATUS;
  }>;
  syncStatus: 'queued' | 'processing' | 'failed' | 'synced';
  folderId: string | null;
  isPrivate: boolean;
};

type NoteFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Demonstrative only — see the "Anexos" block below. No file bytes are ever
// read, uploaded or persisted; only the picked file's name/size are kept in
// memory for the note currently open in the editor (TEC-05, real storage,
// is out of scope for this quest).
type DemoAttachment = { id: string; name: string; size: number };

type SidePanel = 'none' | 'favorites' | 'folders' | 'coverage';

function newId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `atlas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function emptyNoteContent() {
  return legacyTextToAtlasNotesContent('');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

type FavoriteEntry = {
  id: string;
  color: AtlasNotesMarkColor;
  createdAt: string;
  text: string;
  noteId: string;
  noteTitle: string;
};

type FavoriteFocusRequest = {
  noteId: string;
  favoriteId: string;
  nonce: number;
};

export function NotesWorkspace() {
  const [notes, setNotes] = useState<AtlasNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(newId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [content, setContent] = useState<AtlasNotesEnvelope>(emptyNoteContent);
  const [editorError, setEditorError] = useState('');
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [allNotesQuery, setAllNotesQuery] = useState('');
  const [linkedContentFilter, setLinkedContentFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [sortOption, setSortOption] = useState<NotesPanelSort>('date-desc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const operationId = useRef(newId());
  const [activePanel, setActivePanel] = useState<SidePanel>('none');
  const [focusRequest, setFocusRequest] = useState<FavoriteFocusRequest | null>(
    null,
  );
  const [recentNotes, setRecentNotes] = useState<AtlasNote[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderActionError, setFolderActionError] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(
    null,
  );
  const [renameDraft, setRenameDraft] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachments, setAttachments] = useState<DemoAttachment[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const favorites = useMemo<FavoriteEntry[]>(() => {
    const result: FavoriteEntry[] = [];
    for (const note of notes) {
      const liveContent = note.id === selectedId ? content : note.content;
      if (!liveContent) continue;
      for (const entry of extractAtlasNotesFavorites(liveContent.doc)) {
        result.push({ ...entry, noteId: note.id, noteTitle: note.title });
      }
    }
    return result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [notes, selectedId, content]);

  function openFavorite(entry: FavoriteEntry) {
    if (entry.noteId !== selectedId) {
      const note = notes.find((candidate) => candidate.id === entry.noteId);
      if (!note) return;
      openNote(note);
    }
    setFocusRequest({ noteId: entry.noteId, favoriteId: entry.id, nonce: Date.now() });
  }

  const editorFocusRequest: NotesEditorFocusRequest | null =
    focusRequest && focusRequest.noteId === draftId
      ? { favoriteId: focusRequest.favoriteId, nonce: focusRequest.nonce }
      : null;

  const suggestions = useMemo(
    () =>
      suggestContentLinks(title, body).filter(
        (item) => !confirmedIds.includes(item.id),
      ),
    [body, confirmedIds, title],
  );
  const catalogResults = useMemo(
    () => searchContentCatalog(catalogSearch),
    [catalogSearch],
  );
  const ambiguous =
    suggestions.length > 1 && suggestions[0].score - suggestions[1].score < 4;
  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/notes');
      const data = (await response.json()) as {
        notes?: AtlasNote[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? 'Não foi possível carregar as notas.');
      setNotes(data.notes ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar as notas.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotes(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  const linkedContentOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const note of notes) {
      for (const link of note.links) {
        if (!byId.has(link.contentId)) byId.set(link.contentId, link.contentTitle);
      }
    }
    return [...byId.entries()]
      .map(([contentId, contentTitle]) => ({ contentId, contentTitle }))
      .sort((a, b) => a.contentTitle.localeCompare(b.contentTitle, 'pt-BR'));
  }, [notes]);

  const filteredAllNotes = useMemo(
    () =>
      applyNotesPanelFilters(notes, {
        search: allNotesQuery,
        linkedContentId: linkedContentFilter || null,
        folderId: folderFilter || null,
        sort: sortOption,
      }),
    [notes, allNotesQuery, linkedContentFilter, folderFilter, sortOption],
  );

  const coverageBySubject = useMemo(
    () => computeContentCoverage(notes, contentCatalog),
    [notes],
  );
  const overallCoverage = useMemo(
    () => computeOverallCoverage(coverageBySubject),
    [coverageBySubject],
  );

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/notes/folders');
      const data = (await response.json()) as { folders?: NoteFolder[] };
      if (response.ok) setFolders(data.folders ?? []);
    } catch {
      // Non-critical, best-effort block: leave the previous state as-is.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFolders(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFolders]);

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderActionError('');
    try {
      const response = await fetch('/api/notes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        folder?: NoteFolder;
        error?: string;
      };
      if (!response.ok || !data.folder)
        throw new Error(data.error ?? 'Não foi possível criar a pasta.');
      setFolders((current) =>
        [...current, data.folder!].sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR'),
        ),
      );
      setNewFolderName('');
    } catch (cause) {
      setFolderActionError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar a pasta.',
      );
    }
  }

  function startRenameFolder(folder: NoteFolder) {
    setRenamingFolderId(folder.id);
    setRenameDraft(folder.name);
    setFolderActionError('');
  }

  async function submitRenameFolder(id: string) {
    const name = renameDraft.trim();
    if (!name) return;
    try {
      const response = await fetch('/api/notes/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      const data = (await response.json()) as {
        folder?: NoteFolder;
        error?: string;
      };
      if (!response.ok || !data.folder)
        throw new Error(data.error ?? 'Não foi possível renomear a pasta.');
      setFolders((current) =>
        current
          .map((folder) => (folder.id === id ? data.folder! : folder))
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      );
      setRenamingFolderId(null);
    } catch (cause) {
      setFolderActionError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível renomear a pasta.',
      );
    }
  }

  function browseFolder(value: string) {
    setFolderFilter(value);
    setActivePanel('none');
  }

  const loadRecentNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes?recent=1');
      const data = (await response.json()) as { notes?: AtlasNote[] };
      if (response.ok) setRecentNotes(data.notes ?? []);
    } catch {
      // Non-critical, best-effort block: leave the previous state as-is.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecentNotes(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRecentNotes]);

  // Moves (or inserts) `note` to the front of the recent-notes block with a
  // fresh interaction timestamp, so it reflects an open/save immediately —
  // without waiting for a round trip back to the server.
  function bumpRecentNote(note: AtlasNote, lastInteractedAt: string) {
    setRecentNotes((current) =>
      mergeRecentInteraction(current, { ...note, lastInteractedAt }, 5),
    );
  }

  function openNote(note: AtlasNote) {
    setSelectedId(note.id);
    setDraftId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setContent(note.content ?? legacyTextToAtlasNotesContent(note.body));
    setEditorError('');
    setConfirmedIds(note.links.map((link) => link.contentId));
    setCatalogSearch('');
    setError('');
    setSavedMessage('');
    setFolderId(note.folderId);
    setIsPrivate(note.isPrivate);
    setAttachments([]);
    operationId.current = newId();
    bumpRecentNote(note, new Date().toISOString());
    void fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id }),
    });
  }

  function startNewNote() {
    setSelectedId(null);
    setDraftId(newId());
    setTitle('');
    setBody('');
    setContent(emptyNoteContent());
    setEditorError('');
    setConfirmedIds([]);
    setCatalogSearch('');
    setError('');
    setSavedMessage('');
    setFolderId(null);
    setIsPrivate(false);
    setAttachments([]);
    operationId.current = newId();
  }

  function addAttachment(file: File) {
    setAttachments((current) => [
      ...current,
      { id: newId(), name: file.name, size: file.size },
    ]);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  function confirmLink(reference: ContentReference) {
    setConfirmedIds((current) => [...new Set([...current, reference.id])]);
    setCatalogSearch('');
    setSavedMessage('');
  }

  const updateEditor = useCallback((snapshot: NotesEditorSnapshot) => {
    setContent(snapshot.content);
    setBody(snapshot.body);
    setSavedMessage('');
  }, []);

  const updateEditorValidation = useCallback((message: string) => {
    setEditorError(message);
    if (message) setSavedMessage('');
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const response = await fetch('/api/notes', {
        method: selectedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          operationId: operationId.current,
          title,
          body,
          content,
          contentIds: confirmedIds,
          folderId,
          isPrivate,
        }),
      });
      const data = (await response.json()) as {
        note?: AtlasNote;
        error?: string;
      };
      if (!response.ok || !data.note)
        throw new Error(data.error ?? 'Não foi possível salvar a nota.');
      setSelectedId(data.note.id);
      setBody(data.note.body);
      setContent(
        data.note.content ?? legacyTextToAtlasNotesContent(data.note.body),
      );
      setEditorError('');
      setFolderId(data.note.folderId);
      setIsPrivate(data.note.isPrivate);
      setNotes((current) => [
        data.note!,
        ...current.filter((note) => note.id !== data.note!.id),
      ]);
      bumpRecentNote(data.note, data.note.lastInteractedAt);
      setSavedMessage(
        'Nota salva. Os vínculos aguardam sincronização de metadados.',
      );
      operationId.current = newId();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar a nota.',
      );
    } finally {
      setSaving(false);
    }
  }

  const confirmedReferences = confirmedIds
    .map((id) =>
      searchContentCatalog(id).find((reference) => reference.id === id),
    )
    .filter((reference): reference is ContentReference => Boolean(reference));

  return (
    <section className="notes-view">
      <div className="notes-heading">
        <div>
          <p className="eyebrow">ATLAS NOTES</p>
          <h1>Capture agora. Classifique com cuidado.</h1>
          <p>
            O texto fica no Atlas; a planilha recebe apenas os metadados e
            vínculos confirmados.
          </p>
        </div>
        <Button className="primary-button" onClick={startNewNote}>
          <Plus size={17} /> Nova nota
        </Button>
      </div>

      <div className="notes-workspace">
        <aside className="notes-index" aria-label="Lista de notas">
          {activePanel === 'favorites' ? (
            <div className="favorites-panel">
              <button
                type="button"
                className="favorites-back"
                onClick={() => setActivePanel('none')}
              >
                <ArrowLeft size={15} /> Voltar às notas
              </button>
              <div className="favorites-heading">
                <Star size={15} />
                <strong>Favoritos</strong>
              </div>
              <div className="notes-list favorites-list">
                {favorites.length ? (
                  favorites.map((entry) => (
                    <button
                      key={entry.id}
                      className="note-list-item"
                      onClick={() => openFavorite(entry)}
                    >
                      <span className="note-list-icon favorite-color-icon">
                        <span
                          className="favorite-color-dot"
                          style={{ background: MARK_COLOR_META[entry.color].hex }}
                        />
                      </span>
                      <span>
                        <strong>{entry.text || '(trecho vazio)'}</strong>
                        <small>{entry.noteTitle}</small>
                        <em>{formatDate(entry.createdAt)}</em>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))
                ) : (
                  <div className="notes-empty">
                    <Star size={22} />
                    <strong>Nenhum favorito ainda</strong>
                    <p>
                      Selecione um trecho e escolha &quot;Favoritar
                      texto&quot; no menu Formatar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activePanel === 'folders' ? (
            <div className="favorites-panel">
              <button
                type="button"
                className="favorites-back"
                onClick={() => setActivePanel('none')}
              >
                <ArrowLeft size={15} /> Voltar às notas
              </button>
              <div className="favorites-heading">
                <FolderTree size={15} />
                <strong>Pastas</strong>
              </div>
              <form
                className="folder-create"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createFolder();
                }}
              >
                <input
                  aria-label="Nome da nova pasta"
                  placeholder="Nova pasta"
                  maxLength={80}
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                />
                <button type="submit" aria-label="Criar pasta">
                  <Plus size={15} />
                </button>
              </form>
              {folderActionError && (
                <p className="folder-action-error">{folderActionError}</p>
              )}
              <div className="notes-list folder-list">
                <button
                  type="button"
                  className="note-list-item"
                  onClick={() => browseFolder('')}
                >
                  <span className="note-list-icon">
                    <FolderTree size={16} />
                  </span>
                  <span>
                    <strong>Todas as pastas</strong>
                    <small>{notes.length} nota{notes.length === 1 ? '' : 's'}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  className="note-list-item"
                  onClick={() => browseFolder(NO_FOLDER_FILTER)}
                >
                  <span className="note-list-icon">
                    <FolderTree size={16} />
                  </span>
                  <span>
                    <strong>Sem pasta</strong>
                    <small>
                      {notes.filter((note) => !note.folderId).length} nota
                      {notes.filter((note) => !note.folderId).length === 1
                        ? ''
                        : 's'}
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
                {folders.map((folder) => (
                  <div key={folder.id} className="note-list-item folder-item">
                    {renamingFolderId === folder.id ? (
                      <form
                        className="folder-rename"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void submitRenameFolder(folder.id);
                        }}
                      >
                        <input
                          aria-label={`Renomear pasta ${folder.name}`}
                          maxLength={80}
                          value={renameDraft}
                          onChange={(event) => setRenameDraft(event.target.value)}
                        />
                        <button type="submit" aria-label="Salvar novo nome">
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancelar renomeação"
                          onClick={() => setRenamingFolderId(null)}
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="folder-open"
                          onClick={() => browseFolder(folder.id)}
                        >
                          <span className="note-list-icon">
                            <FolderTree size={16} />
                          </span>
                          <span>
                            <strong>{folder.name}</strong>
                            <small>
                              {
                                notes.filter((note) => note.folderId === folder.id)
                                  .length
                              }{' '}
                              nota
                              {notes.filter((note) => note.folderId === folder.id)
                                .length === 1
                                ? ''
                                : 's'}
                            </small>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="folder-rename-trigger"
                          aria-label={`Renomear pasta ${folder.name}`}
                          onClick={() => startRenameFolder(folder)}
                        >
                          <Pencil size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {folders.length === 0 && (
                  <div className="notes-empty">
                    <FolderTree size={22} />
                    <strong>Nenhuma pasta ainda</strong>
                    <p>Crie uma pasta acima para organizar suas notas.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activePanel === 'coverage' ? (
            <div className="favorites-panel">
              <button
                type="button"
                className="favorites-back"
                onClick={() => setActivePanel('none')}
              >
                <ArrowLeft size={15} /> Voltar às notas
              </button>
              <div className="favorites-heading">
                <PieChart size={15} />
                <strong>Mapa de cobertura</strong>
              </div>
              <div className="coverage-panel">
                <p className="coverage-disclaimer">
                  Proporção simples de conteúdos do catálogo com ao menos uma
                  nota vinculada — não é o cálculo pedagógico real (fora do
                  escopo desta tela).
                </p>
                <div className="coverage-overall">
                  <strong>
                    {overallCoverage.covered}/{overallCoverage.total}
                  </strong>
                  <span>
                    conteúdos com nota (
                    {Math.round(overallCoverage.ratio * 100)}%)
                  </span>
                </div>
                <div className="coverage-list">
                  {coverageBySubject.map((entry) => (
                    <div className="coverage-item" key={entry.subject}>
                      <div className="coverage-item-heading">
                        <span>{entry.subject}</span>
                        <em>
                          {entry.covered}/{entry.total}
                        </em>
                      </div>
                      <div className="coverage-bar">
                        <div
                          className="coverage-bar-fill"
                          style={{ width: `${Math.round(entry.ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="notes-index-actions">
                <button
                  type="button"
                  className="sync-pill favorites-entry"
                  onClick={() => setActivePanel('favorites')}
                >
                  <Star size={13} />
                  Favoritos
                  {favorites.length > 0 && (
                    <span className="favorites-count">{favorites.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="sync-pill favorites-entry"
                  onClick={() => setActivePanel('folders')}
                >
                  <FolderTree size={13} />
                  Pastas
                </button>
                <button
                  type="button"
                  className="sync-pill favorites-entry"
                  onClick={() => setActivePanel('coverage')}
                >
                  <PieChart size={13} />
                  Cobertura
                </button>
              </div>
              {recentNotes.length > 0 && (
                <div className="notes-recent">
                  <div className="notes-recent-heading">
                    <Clock3 size={13} />
                    <strong>Notas recentes</strong>
                  </div>
                  <div>
                    {recentNotes.map((note) => (
                      <button
                        key={note.id}
                        className={
                          note.id === selectedId
                            ? 'note-list-item active'
                            : 'note-list-item'
                        }
                        onClick={() => openNote(note)}
                      >
                        <span className="note-list-icon">
                          <FilePenLine size={16} />
                        </span>
                        <span>
                          <strong>
                            {note.isPrivate && (
                              <Lock
                                size={11}
                                className="private-note-icon"
                                aria-label="Nota privada"
                              />
                            )}
                            {note.title}
                          </strong>
                          <small>{note.body.replace(/\s+/g, ' ').slice(0, 86)}</small>
                          <em>{formatDate(note.lastInteractedAt)}</em>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="notes-source">
                <span>
                  <Cloud size={14} /> Catálogo oficial
                </span>
                <a href={OFFICIAL_SPREADSHEET_URL} target="_blank" rel="noreferrer">
                  Planilha Atlas
                </a>
                <small>
                  Leitura de{' '}
                  {new Date(
                    `${CONTENT_CATALOG_SNAPSHOT_DATE}T12:00:00`,
                  ).toLocaleDateString('pt-BR')}
                </small>
              </div>
            </>
          )}
        </aside>

        <article className="note-editor-card">
          <div className="note-editor-topline">
            <span>{selectedId ? 'EDITANDO NOTA' : 'NOVA NOTA'}</span>
            <div className="note-editor-tools">
              <label className="note-folder-select">
                <FolderTree size={13} />
                <select
                  aria-label="Pasta da nota"
                  value={folderId ?? ''}
                  onChange={(event) => {
                    setFolderId(event.target.value || null);
                    setSavedMessage('');
                  }}
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={isPrivate ? 'sync-pill privacy-toggle active' : 'sync-pill privacy-toggle'}
                aria-pressed={isPrivate}
                onClick={() => {
                  setIsPrivate((current) => !current);
                  setSavedMessage('');
                }}
              >
                {isPrivate ? <Lock size={13} /> : <LockOpen size={13} />}
                {isPrivate ? 'Nota privada' : 'Marcar como privada'}
              </button>
              {selectedNote && (
                <span className={`sync-pill ${selectedNote.syncStatus}`}>
                  <Cloud size={13} />
                  {selectedNote.syncStatus === 'failed'
                    ? 'Sincronização pendente'
                    : selectedNote.syncStatus === 'queued'
                      ? 'Na fila de sincronização'
                      : selectedNote.syncStatus === 'processing'
                        ? 'Sincronizando metadados'
                        : 'Metadados sincronizados'}
                </span>
              )}
            </div>
          </div>
          <input
            className="note-title-input"
            aria-label="Título da nota"
            placeholder="Título da nota"
            maxLength={180}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSavedMessage('');
            }}
          />
          <NotesEditor
            key={draftId}
            initialContent={content}
            noteTitle={title}
            onChange={updateEditor}
            onValidationChange={updateEditorValidation}
            focusRequest={editorFocusRequest}
            onFocusRequestHandled={() => setFocusRequest(null)}
          />
          <div className="note-attachments">
            <div className="note-attachments-heading">
              <Paperclip size={14} />
              <strong>Anexos</strong>
              <span className="attachments-demo-badge">
                Demonstrativo — sem upload real
              </span>
            </div>
            <AttachmentGroup>
              {attachments.map((item) => (
                <Attachment key={item.id} size="sm">
                  <AttachmentMedia>
                    <Paperclip size={14} />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{item.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {formatFileSize(item.size)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label={`Remover anexo ${item.name}`}
                      onClick={() => removeAttachment(item.id)}
                    >
                      <X size={13} />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
              <button
                type="button"
                className="attachment-add"
                onClick={() => attachmentInputRef.current?.click()}
              >
                <Plus size={14} /> Anexar referência
              </button>
            </AttachmentGroup>
            <input
              ref={attachmentInputRef}
              type="file"
              className="attachment-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) addAttachment(file);
                event.target.value = '';
              }}
            />
            <p className="attachments-disclaimer">
              O arquivo não é enviado nem salvo — apenas o nome e o tamanho
              ficam visíveis enquanto você edita esta nota nesta sessão
              (armazenamento real de anexos: TEC-05, ainda fora do escopo).
            </p>
          </div>
          <div className="note-editor-footer">
            <div>
              <span>{body.length.toLocaleString('pt-BR')} caracteres</span>
              <span className="progress-safety">
                <Check size={13} /> Salvar não altera progresso
              </span>
            </div>
            <Button
              className="primary-button"
              onClick={() => void save()}
              disabled={
                saving || !title.trim() || !body.trim() || Boolean(editorError)
              }
            >
              {saving ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}
              {saving ? 'Salvando…' : 'Salvar nota'}
            </Button>
          </div>
          {(error || savedMessage) && (
            <output
              className={
                error ? 'note-feedback error' : 'note-feedback success'
              }
            >
              {error ? <AlertTriangle size={15} /> : <Check size={15} />}
              {error || savedMessage}
            </output>
          )}
        </article>

        <aside className="note-links-card" aria-label="Vínculos com conteúdos">
          <div className="links-heading">
            <span className="links-symbol">
              <Link2 size={17} />
            </span>
            <div>
              <p className="eyebrow">VÍNCULOS</p>
              <h2>Conteúdos relacionados</h2>
            </div>
          </div>

          {confirmedReferences.length > 0 && (
            <div className="confirmed-links">
              {confirmedReferences.map((reference) => (
                <div className="confirmed-link" key={reference.id}>
                  <div>
                    <strong>{reference.id}</strong>
                    <span>{reference.title}</span>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmedIds((current) =>
                        current.filter((id) => id !== reference.id),
                      )
                    }
                    aria-label={`Remover vínculo ${reference.id}`}
                  >
                    <Unlink size={15} />
                  </button>
                  <small>
                    <Check size={12} /> {LINK_STATUS}
                  </small>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="suggestion-panel">
              <div className="suggestion-title">
                <Sparkles size={15} />
                <strong>Sugestões do texto</strong>
              </div>
              {ambiguous && (
                <p className="ambiguity-note">
                  <AlertTriangle size={14} /> Há mais de uma classificação
                  plausível. Confirme cada vínculo.
                </p>
              )}
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => confirmLink(suggestion)}
                >
                  <span>
                    <strong>{suggestion.id}</strong>
                    <small>{suggestion.reason}</small>
                  </span>
                  <span>{suggestion.title}</span>
                  <em>Confirmar</em>
                </button>
              ))}
              <p className="suggestion-disclaimer">
                Nenhuma sugestão é aplicada automaticamente.
              </p>
            </div>
          )}

          <div className="catalog-picker">
            <label htmlFor="catalog-search">Adicionar pelo catálogo</label>
            <div>
              <Search size={15} />
              <input
                id="catalog-search"
                placeholder="ID ou conteúdo"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
              />
            </div>
            {catalogResults.length > 0 && (
              <div className="catalog-results">
                {catalogResults
                  .filter((item) => !confirmedIds.includes(item.id))
                  .map((reference) => (
                    <button
                      key={reference.id}
                      onClick={() => confirmLink(reference)}
                    >
                      <strong>{reference.id}</strong>
                      <span>{reference.title}</span>
                      <Plus size={14} />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="link-policy">
            <strong>Estado do vínculo</strong>
            <span>{LINK_STATUS}</span>
            <p>
              A nota é evidência contextual. Estudo, revisão, proficiência e
              conclusão continuam sob controle da planilha.
            </p>
          </div>
        </aside>
      </div>

      <section className="notes-all-panel" aria-label="Todas as notas">
        <div className="notes-all-heading">
          <p className="eyebrow">TODAS AS NOTAS</p>
          <h2>Busque, filtre e reabra qualquer nota</h2>
        </div>

        <div className="notes-all-controls">
          <div className="notes-search">
            <Search size={17} />
            <input
              aria-label="Pesquisar em todas as notas"
              placeholder="Buscar por título, texto ou conteúdo vinculado"
              value={allNotesQuery}
              onChange={(event) => setAllNotesQuery(event.target.value)}
            />
          </div>
          <label className="notes-all-filter">
            <span>Conteúdo vinculado</span>
            <select
              aria-label="Filtrar por conteúdo vinculado"
              value={linkedContentFilter}
              onChange={(event) => setLinkedContentFilter(event.target.value)}
            >
              <option value="">Todos</option>
              {linkedContentOptions.map((option) => (
                <option key={option.contentId} value={option.contentId}>
                  {option.contentId} · {option.contentTitle}
                </option>
              ))}
            </select>
          </label>
          <label className="notes-all-filter">
            <span>Pasta</span>
            <select
              aria-label="Filtrar por pasta"
              value={folderFilter}
              onChange={(event) => setFolderFilter(event.target.value)}
            >
              <option value="">Todas as pastas</option>
              <option value={NO_FOLDER_FILTER}>Sem pasta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <label className="notes-all-filter">
            <span>Ordenar por</span>
            <select
              aria-label="Ordenar notas"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as NotesPanelSort)
              }
            >
              <option value="date-desc">Mais recente primeiro</option>
              <option value="date-asc">Mais antiga primeiro</option>
              <option value="title-asc">Título (A–Z)</option>
              <option value="title-desc">Título (Z–A)</option>
            </select>
          </label>
        </div>

        <div className="notes-all-list">
          {loading ? (
            <div className="notes-loading">
              <LoaderCircle size={18} className="spin" /> Carregando notas
            </div>
          ) : filteredAllNotes.length ? (
            filteredAllNotes.map((note) => (
              <button
                key={note.id}
                className={
                  note.id === selectedId
                    ? 'note-list-item active'
                    : 'note-list-item'
                }
                onClick={() => openNote(note)}
              >
                <span className="note-list-icon">
                  <FilePenLine size={16} />
                </span>
                <span>
                  <strong>
                    {note.isPrivate && (
                      <Lock
                        size={11}
                        className="private-note-icon"
                        aria-label="Nota privada"
                      />
                    )}
                    {note.title}
                  </strong>
                  <small>{note.body.replace(/\s+/g, ' ').slice(0, 86)}</small>
                  <em>
                    {formatDate(note.updatedAt)} · {note.links.length} vínculo
                    {note.links.length === 1 ? '' : 's'}
                  </em>
                </span>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <div className="notes-empty">
              <BookMarked size={22} />
              <strong>
                {allNotesQuery || linkedContentFilter || folderFilter
                  ? 'Nenhuma nota encontrada'
                  : 'Seu caderno começa aqui'}
              </strong>
              <p>
                {allNotesQuery || linkedContentFilter || folderFilter
                  ? 'Tente outra palavra ou ajuste os filtros.'
                  : 'Crie uma nota sem alterar seu progresso de estudo.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
