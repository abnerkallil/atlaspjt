'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Plus, Trash2, X } from 'lucide-react';
import { PageHeading } from '@/components/atlas/page-heading';
import { Button } from '@/components/ui/button';
import type { Source, SourceType } from '@/lib/apolo/sources';

// APO-05 (DEC-015): acervo de PDF (prova de concurso, apostila, lista) que
// alimenta o banco de questões do Apolo. Curadoria do Abner; sem acesso
// público (legal ainda não revisou direitos autorais de prova de concurso) —
// o download só funciona autenticado, por esta tela.
const TYPE_LABEL: Record<SourceType, string> = {
  prova_concurso: 'Prova de concurso',
  apostila: 'Apostila',
  lista: 'Lista',
};

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function errorOf(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Não foi possível salvar a fonte.';
}

export function FontesPage() {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [theme, setTheme] = useState('');
  const [adding, setAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('prova_concurso');
  const [examBoard, setExamBoard] = useState('');
  const [examOrg, setExamOrg] = useState('');
  const [examYear, setExamYear] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [version, setVersion] = useState(0);
  const reload = () => setVersion((value) => value + 1);

  useEffect(() => {
    let active = true;
    const query = theme.trim() ? `?tema=${encodeURIComponent(theme.trim())}` : '';
    fetch(`/api/apolo/fontes${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorOf(response));
        return ((await response.json()) as { sources: Source[] }).sources;
      })
      .then((list) => {
        if (!active) return;
        setSources(list);
        setLoadError('');
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o acervo.');
      });
    return () => {
      active = false;
    };
  }, [theme, version]);

  function resetForm() {
    setTitle('');
    setNewTheme('');
    setSourceType('prova_concurso');
    setExamBoard('');
    setExamOrg('');
    setExamYear('');
    setFile(null);
    setFormError('');
  }

  async function submit() {
    if (!file) {
      setFormError('Escolha o arquivo PDF.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const form = new FormData();
      form.set('title', title);
      form.set('theme', newTheme);
      form.set('sourceType', sourceType);
      if (sourceType === 'prova_concurso') {
        form.set('examBoard', examBoard);
        form.set('examOrg', examOrg);
        form.set('examYear', examYear);
      }
      form.set('file', file);
      const response = await fetch('/api/apolo/fontes', { method: 'POST', body: form });
      if (!response.ok) throw new Error(await errorOf(response));
      resetForm();
      setAdding(false);
      reload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível salvar a fonte.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(source: Source) {
    if (!window.confirm(`Remover "${source.title}" do acervo? Esta ação não pode ser desfeita.`)) return;
    const response = await fetch(`/api/apolo/fontes/${encodeURIComponent(source.id)}`, { method: 'DELETE' });
    if (!response.ok) {
      setLoadError(await errorOf(response));
      return;
    }
    reload();
  }

  return (
    <section className="cm" aria-labelledby="fontes-title">
      <PageHeading eyebrow="APOLO" title="Acervo de fontes" titleId="fontes-title">
        PDF de prova de concurso, apostila ou lista que vira questão oficial ou molde (DEC-015). Sem acesso público.
      </PageHeading>

      <div className="cm-head">
        <label className="cm-field" style={{ maxWidth: 260 }}>
          <span>Filtrar por tema</span>
          <input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="direito-constitucional" />
        </label>
        {!adding && (
          <Button variant="outline" className="ss-outline cm-add" onClick={() => setAdding(true)}>
            <Plus size={15} /> Adicionar fonte
          </Button>
        )}
      </div>

      {loadError && <p className="rm-error" role="alert">{loadError}</p>}
      {sources === null && !loadError && <p className="cm-empty">Carregando acervo…</p>}
      {sources?.length === 0 && !adding && <p className="cm-empty">Nenhuma fonte cadastrada ainda.</p>}

      {!!sources?.length && (
        <ul className="cm-list">
          {sources.map((source) => (
            <li key={source.id} className="cm-item">
              <div className="cm-item-head">
                <span className="cm-kind"><FileText size={14} /> {TYPE_LABEL[source.sourceType]}</span>
                <strong>{source.title}</strong>
                <button type="button" className="cm-remove" aria-label={`Remover ${source.title}`} onClick={() => void remove(source)}>
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="cm-text">
                {source.theme ?? 'sem tema'}
                {source.sourceType === 'prova_concurso' && (source.examBoard || source.examOrg || source.examYear) && (
                  <> · {[source.examBoard, source.examOrg, source.examYear].filter(Boolean).join(' · ')}</>
                )}
              </p>
              <a className="cm-link" href={`/api/apolo/fontes/${encodeURIComponent(source.id)}`} target="_blank" rel="noopener noreferrer">
                {source.fileName} <small>{formatSize(source.sizeBytes)}</small> <ExternalLink size={13} />
              </a>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form className="cm-form" onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}>
          <div className="ss-tabs" role="tablist" aria-label="Tipo de fonte">
            {(Object.keys(TYPE_LABEL) as SourceType[]).map((option) => (
              <button key={option} type="button" role="tab" aria-selected={sourceType === option} onClick={() => setSourceType(option)}>
                {TYPE_LABEL[option]}
              </button>
            ))}
          </div>
          <label className="cm-field">
            <span>Título</span>
            <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Prova TJ-SP 2023" />
          </label>
          <label className="cm-field">
            <span>Tema (opcional)</span>
            <input value={newTheme} maxLength={120} onChange={(event) => setNewTheme(event.target.value)} placeholder="direito-constitucional" />
          </label>
          {sourceType === 'prova_concurso' && (
            <>
              <label className="cm-field">
                <span>Banca (opcional)</span>
                <input value={examBoard} onChange={(event) => setExamBoard(event.target.value)} placeholder="FGV" />
              </label>
              <label className="cm-field">
                <span>Órgão (opcional)</span>
                <input value={examOrg} onChange={(event) => setExamOrg(event.target.value)} placeholder="TJ-SP" />
              </label>
              <label className="cm-field">
                <span>Ano (opcional)</span>
                <input type="number" value={examYear} onChange={(event) => setExamYear(event.target.value)} placeholder="2023" />
              </label>
            </>
          )}
          <label className="cm-field">
            <span>Arquivo (PDF, até 30MB)</span>
            <input type="file" accept=".pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          {formError && <p className="rm-error" role="alert">{formError}</p>}
          <div className="cm-form-actions">
            <Button type="button" variant="outline" className="ss-outline" onClick={() => { resetForm(); setAdding(false); }} disabled={saving}>
              <X size={15} /> Cancelar
            </Button>
            <Button type="submit" className="primary-button" disabled={saving}>{saving ? 'Enviando…' : 'Salvar fonte'}</Button>
          </div>
        </form>
      )}
    </section>
  );
}
