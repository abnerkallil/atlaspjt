'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '@/components/atlas/page-heading';
import { Button } from '@/components/ui/button';
import { BLOOM_LEVELS, type BloomLevel } from '@/lib/apolo/types';
import { KNOWLEDGE_TYPES, type KnowledgeType } from '@/lib/apolo/question-bank';
import type { QuestionKind } from '@/lib/quizzes';
import type { Draft, DraftEdit, DraftStatus } from '@/lib/apolo/drafts';
import type { RoadmapView } from '@/lib/roadmap-store';
import type { Theme } from '@/lib/apolo/themes';

// Curadoria de rascunhos (APO-07): um humano escolhe conteúdo, tema, Bloom e
// escreve a explicação antes de aprovar — nunca seleção automática ("precisamos
// de curadoria se quisermos um desenvolvimento sério", Abner 2026-10-08).
//
// Simplificação de escopo assumida aqui (disclosed): o card pedia o rascunho
// "ao lado da página do PDF" de origem. Rastrear a página exata exigiria
// reabrir o extrator (APO-06, já mergeado) para marcar fronteiras de página
// texto a texto, e teria custo real sem um ganho claro ainda. Por ora a tela
// mostra a fonte inteira ao lado (mesmo endpoint autenticado da APO-05), sem
// pular para a página; dá para pedir o recorte por página como entrega futura.
// Mesma lógica para a fila: sem "menos questões primeiro" (o conteúdo só é
// escolhido durante a própria curadoria), a ordem é rascunho sem conteúdo
// primeiro, depois mais antigo primeiro.

const KIND_LABEL: Record<QuestionKind, string> = {
  multipla: 'Múltipla escolha',
  dissertativa: 'Dissertativa',
  calculo: 'Cálculo',
  certo_errado: 'Certo/Errado',
  lacuna_numerica: 'Lacuna numérica',
};

const STATUS_LABEL: Record<DraftStatus, string> = {
  pendente: 'Pendentes',
  aprovado: 'Aprovados',
  descartado: 'Descartados',
};

type ContentOption = { id: string; title: string; disciplineTitle: string };
type Subtopic = { id: string; title: string };

function flattenContents(roadmap: RoadmapView | null): ContentOption[] {
  if (!roadmap) return [];
  const options: ContentOption[] = [];
  for (const phase of roadmap.phases) {
    for (const discipline of phase.disciplines) {
      for (const content of discipline.contents) {
        options.push({ id: content.id, title: content.title, disciplineTitle: discipline.title });
      }
    }
  }
  return options;
}

function editFromDraft(draft: Draft): DraftEdit {
  return {
    contentId: draft.contentId ?? undefined,
    subtopicId: draft.subtopicId ?? undefined,
    theme: draft.theme ?? undefined,
    kind: draft.kind,
    prompt: draft.prompt,
    context: draft.context ?? undefined,
    options: draft.options ?? undefined,
    correctOption: draft.correctOption ?? undefined,
    bloomLevel: draft.bloomLevel ?? undefined,
    knowledgeType: draft.knowledgeType ?? undefined,
    explanation: draft.explanation ?? undefined,
  };
}

async function errorOf(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Não foi possível salvar.';
}

function DraftEditor({
  draft,
  status,
  contents,
  themes,
  onThemeCreated,
  onSaved,
}: {
  draft: Draft;
  status: DraftStatus;
  contents: ContentOption[];
  themes: Theme[];
  onThemeCreated: (theme: Theme) => void;
  onSaved: () => void;
}) {
  const [edit, setEdit] = useState<DraftEdit>(() => editFromDraft(draft));
  const [subtopicsByContent, setSubtopicsByContent] = useState<{ contentId: string; list: Subtopic[] } | null>(null);
  const [newTheme, setNewTheme] = useState('');
  const [creatingTheme, setCreatingTheme] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const readOnly = status !== 'pendente';
  const subtopics = subtopicsByContent && subtopicsByContent.contentId === edit.contentId ? subtopicsByContent.list : [];

  useEffect(() => {
    const contentId = edit.contentId;
    if (!contentId) return;
    let active = true;
    fetch(`/api/apolo/subtopicos?conteudo=${encodeURIComponent(contentId)}`)
      .then(async (response) => (response.ok ? ((await response.json()) as { subtopics: Subtopic[] }).subtopics : []))
      .then((list) => {
        if (active) setSubtopicsByContent({ contentId, list });
      })
      .catch(() => {
        if (active) setSubtopicsByContent({ contentId, list: [] });
      });
    return () => {
      active = false;
    };
  }, [edit.contentId]);

  function setField<K extends keyof DraftEdit>(key: K, value: DraftEdit[K]) {
    setEdit((current) => ({ ...current, [key]: value }));
  }

  function selectContent(contentId: string) {
    setEdit((current) => ({ ...current, contentId: contentId || undefined, subtopicId: undefined }));
  }

  async function save(partial: DraftEdit) {
    setSaving(true);
    setActionError('');
    try {
      const response = await fetch(`/api/apolo/rascunhos/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!response.ok) throw new Error(await errorOf(response));
      onSaved();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function createTheme() {
    if (!newTheme.trim()) return;
    setCreatingTheme(true);
    try {
      const response = await fetch('/api/apolo/temas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: newTheme.trim() }),
      });
      if (!response.ok) throw new Error(await errorOf(response));
      const { theme } = (await response.json()) as { theme: Theme };
      onThemeCreated(theme);
      setField('theme', theme.id);
      setNewTheme('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível criar o tema.');
    } finally {
      setCreatingTheme(false);
    }
  }

  async function approve() {
    setSaving(true);
    setActionError('');
    try {
      const patchResponse = await fetch(`/api/apolo/rascunhos/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(edit),
      });
      if (!patchResponse.ok) throw new Error(await errorOf(patchResponse));
      const response = await fetch(`/api/apolo/rascunhos/${encodeURIComponent(draft.id)}/aprovar`, { method: 'POST' });
      if (!response.ok) throw new Error(await errorOf(response));
      onSaved();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível aprovar.');
    } finally {
      setSaving(false);
    }
  }

  async function discard() {
    if (!window.confirm('Descartar este rascunho? Não volta para a fila.')) return;
    setSaving(true);
    setActionError('');
    try {
      const response = await fetch(`/api/apolo/rascunhos/${encodeURIComponent(draft.id)}/descartar`, { method: 'POST' });
      if (!response.ok) throw new Error(await errorOf(response));
      onSaved();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível descartar.');
    } finally {
      setSaving(false);
    }
  }

  const canApprove = !!edit.contentId && !!edit.bloomLevel && !!edit.explanation?.trim();

  return (
    <div className="rc-detail">
      <div className="rc-editor cm-form">
        {readOnly && (
          <p className="cm-text">
            Rascunho {status === 'aprovado' ? 'aprovado' : 'descartado'}
            {draft.reviewedAt && ` em ${new Date(draft.reviewedAt).toLocaleString('pt-BR')}`}. Somente leitura.
          </p>
        )}

        {draft.lintWarnings.length > 0 && (
          <ul className="rc-warnings">
            {draft.lintWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        )}

        <label className="cm-field">
          <span>Enunciado</span>
          <textarea rows={4} value={edit.prompt ?? ''} disabled={readOnly} onChange={(event) => setField('prompt', event.target.value)} />
        </label>

        {(draft.kind === 'multipla' || (edit.options?.length ?? 0) > 0) && (
          <label className="cm-field">
            <span>Alternativas (uma por linha)</span>
            <textarea
              rows={4}
              value={(edit.options ?? []).join('\n')}
              disabled={readOnly}
              onChange={(event) =>
                setField(
                  'options',
                  event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                )
              }
            />
          </label>
        )}

        {edit.options && edit.options.length > 0 && (
          <label className="cm-field">
            <span>Alternativa correta</span>
            <select
              value={edit.correctOption ?? ''}
              disabled={readOnly}
              onChange={(event) => setField('correctOption', event.target.value === '' ? undefined : Number(event.target.value))}
            >
              <option value="">Escolha</option>
              {edit.options.map((option, index) => (
                <option key={index} value={index}>
                  {String.fromCharCode(65 + index)}. {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="cm-field">
          <span>Conteúdo</span>
          <select value={edit.contentId ?? ''} disabled={readOnly} onChange={(event) => selectContent(event.target.value)}>
            <option value="">Escolha o conteúdo</option>
            {contents.map((content) => (
              <option key={content.id} value={content.id}>
                {content.disciplineTitle} · {content.title}
              </option>
            ))}
          </select>
        </label>

        {subtopics.length > 0 && (
          <label className="cm-field">
            <span>Subtópico (opcional)</span>
            <select value={edit.subtopicId ?? ''} disabled={readOnly} onChange={(event) => setField('subtopicId', event.target.value || undefined)}>
              <option value="">Sem subtópico</option>
              {subtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.title}</option>
              ))}
            </select>
          </label>
        )}

        <label className="cm-field">
          <span>Tema</span>
          <select value={edit.theme ?? ''} disabled={readOnly} onChange={(event) => setField('theme', event.target.value || undefined)}>
            <option value="">Sem tema</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.title}</option>
            ))}
          </select>
        </label>
        {!readOnly && (
          <div className="rc-new-theme">
            <input value={newTheme} placeholder="+ novo tema" onChange={(event) => setNewTheme(event.target.value)} />
            <Button type="button" variant="outline" className="ss-outline" disabled={creatingTheme || !newTheme.trim()} onClick={() => void createTheme()}>
              <Plus size={14} /> Criar
            </Button>
          </div>
        )}

        <label className="cm-field">
          <span>Nível de Bloom</span>
          <select value={edit.bloomLevel ?? ''} disabled={readOnly} onChange={(event) => setField('bloomLevel', (event.target.value || undefined) as BloomLevel | undefined)}>
            <option value="">Escolha</option>
            {BLOOM_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="cm-field">
          <span>Tipo de conhecimento (opcional)</span>
          <select value={edit.knowledgeType ?? ''} disabled={readOnly} onChange={(event) => setField('knowledgeType', (event.target.value || undefined) as KnowledgeType | undefined)}>
            <option value="">Não informado</option>
            {KNOWLEDGE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="cm-field">
          <span>Explicação</span>
          <textarea
            rows={4}
            value={edit.explanation ?? ''}
            disabled={readOnly}
            onChange={(event) => setField('explanation', event.target.value)}
            placeholder="Por que esta é a resposta certa — mostrado ao aluno depois do quiz."
          />
        </label>

        {actionError && <p className="rm-error" role="alert">{actionError}</p>}

        {!readOnly && (
          <div className="cm-form-actions">
            <Button type="button" variant="outline" className="ss-outline" disabled={saving} onClick={() => void save(edit)}>
              Salvar edição
            </Button>
            <Button type="button" variant="outline" className="ss-outline" disabled={saving} onClick={() => void discard()}>
              <Trash2 size={15} /> Descartar
            </Button>
            <Button type="button" className="primary-button" disabled={saving || !canApprove} onClick={() => void approve()}>
              <Check size={15} /> Aprovar
            </Button>
          </div>
        )}
        {status === 'aprovado' && draft.approvedQuestionId && (
          <p className="cm-text">Virou a questão <code>{draft.approvedQuestionId}</code>, já ativa no quiz do conteúdo.</p>
        )}
      </div>

      {draft.sourceId && (
        <div className="rc-source">
          <a className="cm-link" href={`/api/apolo/fontes/${encodeURIComponent(draft.sourceId)}`} target="_blank" rel="noopener noreferrer">
            Abrir fonte em outra aba <ExternalLink size={13} />
          </a>
          <iframe title="Fonte em PDF" src={`/api/apolo/fontes/${encodeURIComponent(draft.sourceId)}`} className="rc-source-frame" />
        </div>
      )}
    </div>
  );
}

export function RascunhosPage() {
  const [status, setStatus] = useState<DraftStatus>('pendente');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((value) => value + 1);

  const [contents, setContents] = useState<ContentOption[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    fetch('/api/roadmap')
      .then(async (response) => (response.ok ? ((await response.json()) as { roadmap: RoadmapView }).roadmap : null))
      .then((roadmap) => setContents(flattenContents(roadmap)))
      .catch(() => setContents([]));
    fetch('/api/apolo/temas')
      .then(async (response) => (response.ok ? ((await response.json()) as { themes: Theme[] }).themes : []))
      .then(setThemes)
      .catch(() => setThemes([]));
  }, [version]);

  useEffect(() => {
    let active = true;
    fetch(`/api/apolo/rascunhos?status=${status}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorOf(response));
        return ((await response.json()) as { drafts: Draft[] }).drafts;
      })
      .then((list) => {
        if (!active) return;
        const ordered = [...list].sort((a, b) => {
          if (!a.contentId !== !b.contentId) return a.contentId ? 1 : -1;
          return a.createdAt.localeCompare(b.createdAt);
        });
        setDrafts(ordered);
        setLoadError('');
        setSelectedId((current) => (current && ordered.some((d) => d.id === current) ? current : (ordered[0]?.id ?? null)));
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a fila.');
      });
    return () => {
      active = false;
    };
  }, [status, version]);

  const selected = useMemo(() => drafts?.find((d) => d.id === selectedId) ?? null, [drafts, selectedId]);

  return (
    <section className="cm rc" aria-labelledby="rascunhos-title">
      <PageHeading eyebrow="APOLO" title="Curadoria de rascunhos" titleId="rascunhos-title">
        Rascunhos extraídos (APO-06) ou propostos à mão, pendentes até um humano escolher conteúdo, nível de Bloom,
        escrever a explicação e aprovar — ou descartar em definitivo.
      </PageHeading>

      <div className="cm-head">
        <div className="ss-tabs" role="tablist" aria-label="Status da fila">
          {(Object.keys(STATUS_LABEL) as DraftStatus[]).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={status === option} onClick={() => setStatus(option)}>
              {STATUS_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      {loadError && <p className="rm-error" role="alert">{loadError}</p>}
      {drafts === null && !loadError && <p className="cm-empty">Carregando fila…</p>}
      {drafts?.length === 0 && <p className="cm-empty">Nenhum rascunho {STATUS_LABEL[status].toLowerCase()}.</p>}

      {!!drafts?.length && (
        <div className="rc-layout">
          <ul className="cm-list rc-queue">
            {drafts.map((draft) => (
              <li key={draft.id} className="cm-item rc-queue-item">
                <button type="button" className="rc-queue-button" aria-pressed={draft.id === selectedId} onClick={() => setSelectedId(draft.id)}>
                  <span className="cm-kind">{KIND_LABEL[draft.kind]}</span>
                  <strong className="rc-queue-prompt">{draft.prompt}</strong>
                  <span className="cm-text rc-queue-meta">
                    {draft.contentId ? contents.find((c) => c.id === draft.contentId)?.title ?? draft.contentId : 'sem conteúdo'}
                    {draft.lintWarnings.length > 0 && ` · ${draft.lintWarnings.length} aviso(s)`}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <DraftEditor
              key={selected.id}
              draft={selected}
              status={status}
              contents={contents}
              themes={themes}
              onThemeCreated={(theme) => setThemes((current) => [...current, theme])}
              onSaved={reload}
            />
          )}
        </div>
      )}
    </section>
  );
}
