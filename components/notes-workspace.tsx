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
  Link2,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  ContentReference,
  OFFICIAL_SPREADSHEET_URL,
  searchContentCatalog,
  suggestContentLinks,
} from '@/lib/content-catalog';
import { mergeRecentInteraction } from './notes-recent-list';
import {
  applyNotesPanelFilters,
  type NotesPanelSort,
} from './notes-panel-filters';

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
};

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
  const [sortOption, setSortOption] = useState<NotesPanelSort>('date-desc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const operationId = useRef(newId());
  const [showFavorites, setShowFavorites] = useState(false);
  const [focusRequest, setFocusRequest] = useState<FavoriteFocusRequest | null>(
    null,
  );
  const [recentNotes, setRecentNotes] = useState<AtlasNote[]>([]);

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
        sort: sortOption,
      }),
    [notes, allNotesQuery, linkedContentFilter, sortOption],
  );

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
    operationId.current = newId();
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
          {showFavorites ? (
            <div className="favorites-panel">
              <button
                type="button"
                className="favorites-back"
                onClick={() => setShowFavorites(false)}
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
          ) : (
            <>
              <button
                type="button"
                className="sync-pill favorites-entry"
                onClick={() => setShowFavorites(true)}
              >
                <Star size={13} />
                Favoritos
                {favorites.length > 0 && (
                  <span className="favorites-count">{favorites.length}</span>
                )}
              </button>
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
                          <strong>{note.title}</strong>
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
                  <strong>{note.title}</strong>
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
                {allNotesQuery || linkedContentFilter
                  ? 'Nenhuma nota encontrada'
                  : 'Seu caderno começa aqui'}
              </strong>
              <p>
                {allNotesQuery || linkedContentFilter
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
