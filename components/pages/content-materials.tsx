'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Link2, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Material, MaterialKind } from '@/lib/materials';

// UX-01: material de estudo do conteúdo, anexado pelo usuário (texto, link de
// vídeo/aula ou arquivo PNG/JPG/PDF/DOCX até 10MB). Fica no conteúdo, não na
// sessão: aparece em toda sessão desse conteúdo.
const KIND_LABEL: Record<MaterialKind, string> = { texto: 'Texto', link: 'Link', arquivo: 'Arquivo' };

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function errorOf(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Não foi possível salvar o material.';
}

export function ContentMaterials({ contentId }: { contentId: string }) {
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<MaterialKind>('texto');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [version, setVersion] = useState(0);
  const reload = () => setVersion((value) => value + 1);

  useEffect(() => {
    let active = true;
    fetch(`/api/materiais?conteudo=${encodeURIComponent(contentId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorOf(response));
        return ((await response.json()) as { materials: Material[] }).materials;
      })
      .then((list) => {
        if (!active) return;
        setMaterials(list);
        setLoadError('');
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o material.');
      });
    return () => {
      active = false;
    };
  }, [contentId, version]);

  function resetForm() {
    setTitle('');
    setBody('');
    setUrl('');
    setFile(null);
    setFormError('');
  }

  async function submit() {
    setSaving(true);
    setFormError('');
    try {
      let response: Response;
      if (kind === 'arquivo') {
        if (!file) throw new Error('Escolha o arquivo.');
        const form = new FormData();
        form.set('conteudo', contentId);
        form.set('title', title);
        form.set('file', file);
        response = await fetch('/api/materiais', { method: 'POST', body: form });
      } else {
        response = await fetch('/api/materiais', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conteudo: contentId, kind, title, body, url }),
        });
      }
      if (!response.ok) throw new Error(await errorOf(response));
      resetForm();
      setAdding(false);
      reload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível salvar o material.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(material: Material) {
    if (!window.confirm(`Remover "${material.title}" do material deste conteúdo?`)) return;
    const response = await fetch(`/api/materiais/${encodeURIComponent(material.id)}`, { method: 'DELETE' });
    if (!response.ok) {
      setLoadError(await errorOf(response));
      return;
    }
    reload();
  }

  return (
    <section className="cm" aria-labelledby="cm-title">
      <div className="cm-head">
        <p className="eyebrow" id="cm-title">MATERIAL DO CONTEÚDO</p>
        {!adding && (
          <Button variant="outline" className="ss-outline cm-add" onClick={() => setAdding(true)}>
            <Plus size={15} /> Adicionar material
          </Button>
        )}
      </div>

      {loadError && <p className="rm-error" role="alert">{loadError}</p>}
      {materials === null && !loadError && <p className="cm-empty">Carregando material…</p>}
      {materials?.length === 0 && !adding && (
        <p className="cm-empty">
          Nenhum material anexado ainda. Adicione o texto da apostila, o link da videoaula ou o PDF dos slides: eles ficam neste
          conteúdo e aparecem em toda sessão dele.
        </p>
      )}

      {!!materials?.length && (
        <ul className="cm-list">
          {materials.map((material) => (
            <li key={material.id} className={`cm-item ${material.kind}`}>
              <div className="cm-item-head">
                <span className="cm-kind">
                  {material.kind === 'texto' ? <FileText size={14} /> : material.kind === 'link' ? <Link2 size={14} /> : <Paperclip size={14} />}
                  {KIND_LABEL[material.kind]}
                </span>
                <strong>{material.title}</strong>
                <button type="button" className="cm-remove" aria-label={`Remover ${material.title}`} onClick={() => void remove(material)}>
                  <Trash2 size={15} />
                </button>
              </div>
              {material.kind === 'texto' && <p className="cm-text">{material.body}</p>}
              {material.kind === 'link' && material.url && (
                <a className="cm-link" href={material.url} target="_blank" rel="noopener noreferrer">
                  {material.url} <ExternalLink size={13} />
                </a>
              )}
              {material.kind === 'arquivo' && (
                <>
                  {material.mimeType?.startsWith('image/') && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="cm-image" src={`/api/materiais/${encodeURIComponent(material.id)}`} alt={material.title} />
                  )}
                  <a className="cm-link" href={`/api/materiais/${encodeURIComponent(material.id)}`} target="_blank" rel="noopener noreferrer">
                    {material.fileName} <small>{formatSize(material.sizeBytes)}</small> <ExternalLink size={13} />
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form className="cm-form" onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}>
          <div className="ss-tabs" role="tablist" aria-label="Tipo de material">
            {(Object.keys(KIND_LABEL) as MaterialKind[]).map((option) => (
              <button key={option} type="button" role="tab" aria-selected={kind === option} onClick={() => setKind(option)}>
                {KIND_LABEL[option]}
              </button>
            ))}
          </div>
          <label className="cm-field">
            <span>Título{kind === 'texto' ? '' : ' (opcional)'}</span>
            <input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'link' ? 'Videoaula 1' : kind === 'arquivo' ? 'Slides da aula' : 'Resumo da apostila'} />
          </label>
          {kind === 'texto' && (
            <label className="cm-field">
              <span>Texto</span>
              <textarea value={body} rows={8} maxLength={20000} onChange={(event) => setBody(event.target.value)} placeholder="Cole aqui o trecho da apostila ou da aula." />
            </label>
          )}
          {kind === 'link' && (
            <label className="cm-field">
              <span>Endereço</span>
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
            </label>
          )}
          {kind === 'arquivo' && (
            <label className="cm-field">
              <span>Arquivo (PNG, JPG, PDF ou DOCX, até 10MB)</span>
              <input type="file" accept=".png,.jpg,.jpeg,.pdf,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
          )}
          {formError && <p className="rm-error" role="alert">{formError}</p>}
          <div className="cm-form-actions">
            <Button type="button" variant="outline" className="ss-outline" onClick={() => { resetForm(); setAdding(false); }} disabled={saving}>
              <X size={15} /> Cancelar
            </Button>
            <Button type="submit" className="primary-button" disabled={saving}>{saving ? 'Salvando…' : 'Salvar material'}</Button>
          </div>
        </form>
      )}
    </section>
  );
}
