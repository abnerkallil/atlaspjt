'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  Check,
  ChevronRight,
  Cloud,
  FilePenLine,
  Link2,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NotesEditor,
  type NotesEditorSnapshot,
} from '@/components/notes-editor';
import {
  legacyTextToAtlasNotesContent,
  type AtlasNotesEnvelope,
} from '@/lib/atlas-notes-document';
import {
  CONTENT_CATALOG_SNAPSHOT_DATE,
  ContentReference,
  OFFICIAL_SPREADSHEET_URL,
  searchContentCatalog,
  suggestContentLinks,
} from '@/lib/content-catalog';

const LINK_STATUS = 'Anotado — ainda não trabalhado' as const;

type AtlasNote = {
  id: string;
  title: string;
  body: string;
  content: AtlasNotesEnvelope | null;
  createdAt: string;
  updatedAt: string;
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

export function NotesWorkspace() {
  const [notes, setNotes] = useState<AtlasNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(newId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [content, setContent] = useState<AtlasNotesEnvelope>(emptyNoteContent);
  const [editorError, setEditorError] = useState('');
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const operationId = useRef(newId());

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

  const loadNotes = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/notes?q=${encodeURIComponent(query)}`);
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
    const timer = window.setTimeout(() => void loadNotes(search), 220);
    return () => window.clearTimeout(timer);
  }, [loadNotes, search]);

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
          <div className="notes-search">
            <Search size={17} />
            <input
              aria-label="Pesquisar notas"
              placeholder="Pesquisar título ou texto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="notes-list">
            {loading ? (
              <div className="notes-loading">
                <LoaderCircle size={18} className="spin" /> Carregando notas
              </div>
            ) : notes.length ? (
              notes.map((note) => (
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
                  {search
                    ? 'Nenhuma nota encontrada'
                    : 'Seu caderno começa aqui'}
                </strong>
                <p>
                  {search
                    ? 'Tente outra palavra ou limpe a busca.'
                    : 'Crie uma nota sem alterar seu progresso de estudo.'}
                </p>
              </div>
            )}
          </div>

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
    </section>
  );
}
