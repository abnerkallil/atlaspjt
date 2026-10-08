'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, LockKeyhole, Map as MapIcon, Play, RotateCcw, Route } from 'lucide-react';
import { PageHeading } from '@/components/atlas/page-heading';
import { ProgressBar } from '@/components/atlas/progress-bar';
import { CONTENT_STATE_META, LOCKED_META } from '@/lib/pedagogy/state-labels';
import { isPrerequisiteMet } from '@/lib/pedagogy/prerequisites';
import type { AuditEntry } from '@/lib/pedagogy/transitions';
import type { RoadmapContentView, RoadmapView } from '@/lib/roadmap-store';
import type { ContentState } from '@/lib/pedagogy/states';

// Estados em que dá para abrir uma sessão de estudo do conteúdo (MVP-02).
const STUDYABLE = new Set<ContentState>(['nao-iniciado', 'em-estudo', 'bloqueado', 'em-revisao-ativa']);

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; roadmap: RoadmapView; changes: AuditEntry[] };

function stateMeta(content: RoadmapContentView) {
  return content.locked ? LOCKED_META : CONTENT_STATE_META[content.state];
}

function ContentIcon({ content }: { content: RoadmapContentView }) {
  if (content.locked) return <LockKeyhole size={16} />;
  if (isPrerequisiteMet(content.state)) return <Check size={16} />;
  if (content.state === 'bloqueado' || content.state === 'em-revisao-ativa') return <AlertTriangle size={16} />;
  return <MapIcon size={16} />;
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
}

async function fetchRoadmapData(): Promise<LoadState> {
  try {
    const [{ roadmap }, { entries }] = await Promise.all([
      fetch('/api/roadmap').then((response) => readJson<{ roadmap: RoadmapView }>(response)),
      fetch('/api/auditoria?entityType=conteudo&limit=8').then((response) =>
        readJson<{ entries: AuditEntry[] }>(response),
      ),
    ]);
    return { status: 'ready', roadmap, changes: entries };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Falha ao carregar.' };
  }
}

export function RoadmapPage() {
  const [data, setData] = useState<LoadState>({ status: 'loading' });
  const [phaseId, setPhaseId] = useState<string | null>(null);
  const [disciplineId, setDisciplineId] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    void fetchRoadmapData().then((next) => {
      if (active) setData(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const roadmap = data.status === 'ready' ? data.roadmap : null;
  const allContents = useMemo(
    () => roadmap?.phases.flatMap((phase) => phase.disciplines.flatMap((item) => item.contents)) ?? [],
    [roadmap],
  );
  const titleById = useMemo(() => new Map(allContents.map((item) => [item.id, item])), [allContents]);

  if (data.status === 'loading') {
    return <section className="rm-view"><p className="rm-muted">Carregando roadmap…</p></section>;
  }
  if (data.status === 'error' || !roadmap || roadmap.phases.length === 0) {
    return (
      <section className="rm-view">
        <div className="rm-callout blocked" role="alert">
          <AlertTriangle size={16} />
          <p>{data.status === 'error' ? data.message : 'O roadmap ainda não tem conteúdos.'}</p>
        </div>
      </section>
    );
  }

  // Padrão: a primeira fase com algo por fazer, e nela o primeiro conteúdo liberado.
  const firstOpenPhase = roadmap.phases.find((item) => item.progress.completed < item.progress.total) ?? roadmap.phases[0];
  const phase = roadmap.phases.find((item) => item.id === phaseId) ?? firstOpenPhase;
  const discipline = phase.disciplines.find((item) => item.id === disciplineId) ?? phase.disciplines[0];
  const nextUp = discipline.contents.find((item) => !item.locked && !isPrerequisiteMet(item.state));
  const content = discipline.contents.find((item) => item.id === contentId) ?? nextUp ?? discipline.contents[0];
  // Reprovou no quiz (ou na revisão): o quiz se refaz direto até passar.
  const retake = content.state === 'bloqueado' || content.state === 'em-revisao-ativa';
  const available = phase.disciplines
    .flatMap((item) => item.contents)
    .filter((item) => !item.locked && !isPrerequisiteMet(item.state)).length;
  const meta = stateMeta(content);

  const selectPhase = (id: string) => {
    setPhaseId(id);
    setDisciplineId(null);
    setContentId(null);
    setActionError(null);
  };
  // No celular o detalhe fica abaixo da lista inteira: leva a pessoa até ele.
  const selectContent = (id: string) => {
    setContentId(id);
    setActionError(null);
    if (window.matchMedia('(max-width: 900px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const start = async () => {
    setStarting(true);
    setActionError(null);
    try {
      // MVP-02: começar a estudar abre uma sessão (ou retoma a aberta) e leva para ela.
      const { session } = await readJson<{ session: { id: string } }>(
        await fetch('/api/sessoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId: content.id }),
        }),
      );
      router.push(`/estudar?sessao=${encodeURIComponent(session.id)}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível começar.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="rm-view" aria-labelledby="rm-title">
      <PageHeading
        eyebrow="ROADMAP"
        title="Seu caminho até o domínio."
        titleId="rm-title"
        aside={<div className="streak-pill"><Route size={17} /> {roadmap.title}</div>}
      >
        Fases, pré-requisitos e o registro de cada mudança — tudo vem do seu progresso real.
      </PageHeading>

      <div className="rm-phases" role="tablist" aria-label="Fases do roadmap">
        {roadmap.phases.map((item, index) => {
          const done = item.progress.total > 0 && item.progress.completed === item.progress.total;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === phase.id}
              className={`rm-phase ${item.id === phase.id ? 'active' : ''} ${done ? 'concluida' : ''}`}
              onClick={() => selectPhase(item.id)}
            >
              <span className="rm-phase-index">{done ? <Check size={15} /> : index + 1}</span>
              <span className="rm-phase-copy">
                <small>Fase {index + 1}</small>
                <strong>{item.title}</strong>
                <em>{item.summary}</em>
              </span>
              <span className="rm-phase-pct">{item.progress.percent}%</span>
            </button>
          );
        })}
      </div>

      <div className="rm-progress-grid">
        <article className="rm-progress-card">
          <span>Conteúdos concluídos</span>
          <strong>{phase.progress.completed} de {phase.progress.total}</strong>
          <ProgressBar value={phase.progress.percent} />
          <small>Concluído, aguardando revisão ou revalidado. A nota com pesos fica em Progresso.</small>
        </article>
        <article className="rm-progress-card">
          <span>Liberados para estudar</span>
          <strong>{available}</strong>
          <small>Conteúdos ainda não concluídos cujos pré-requisitos já foram cumpridos.</small>
        </article>
      </div>

      <div className="rm-workspace">
        <div className="rm-main">
          {phase.disciplines.length > 1 && (
            <div className="rm-tabs" role="tablist" aria-label="Disciplinas">
              {phase.disciplines.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={item.id === discipline.id}
                  className={item.id === discipline.id ? 'active' : ''}
                  onClick={() => { setDisciplineId(item.id); setContentId(null); }}
                >
                  {item.title} <span>{item.progress.percent}%</span>
                </button>
              ))}
            </div>
          )}

          <ol className="rm-content-list">
            {discipline.contents.map((item, index) => {
              const itemMeta = stateMeta(item);
              const heading = item.unit && item.unit !== discipline.contents[index - 1]?.unit ? item.unit : null;
              return (
                <li key={item.id}>
                  {heading && <p className="rm-unit">{heading}</p>}
                  <button
                    className={`rm-content tone-${itemMeta.tone} ${item.locked ? 'locked' : ''} ${item.id === content.id ? 'active' : ''}`}
                    aria-pressed={item.id === content.id}
                    onClick={() => selectContent(item.id)}
                  >
                    <span className="rm-content-icon"><ContentIcon content={item} /></span>
                    <span className="rm-content-copy">
                      <strong>{item.title}</strong>
                      <small>
                        {item.id}
                        {item.prerequisites.length > 0 && ` · ${item.prerequisites.length} pré-requisito${item.prerequisites.length > 1 ? 's' : ''}`}
                      </small>
                    </span>
                    <span className={`rm-state tone-${itemMeta.tone}`}>{itemMeta.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="rm-detail" aria-live="polite" ref={detailRef}>
          <p className="eyebrow">{[discipline.title, content.unit].filter(Boolean).join(' · ').toUpperCase()}</p>
          <h2>{content.title}</h2>
          <span className={`rm-state tone-${meta.tone}`}>{meta.label}</span>
          <p className="rm-detail-hint">{meta.hint}</p>
          {content.keywords && <p className="rm-muted">{content.keywords}</p>}

          <h3>Pré-requisitos</h3>
          {content.prerequisites.length === 0 ? (
            <p className="rm-muted">Nenhum pré-requisito.</p>
          ) : (
            <ul className="rm-prereqs">
              {content.prerequisites.map((id) => {
                const pre = titleById.get(id);
                const met = !content.pendingPrerequisites.includes(id);
                return (
                  <li key={id} className={met ? 'met' : 'pending'}>
                    {met ? <Check size={14} /> : <LockKeyhole size={14} />}
                    <span>
                      {pre?.title ?? id}
                      <small>{met ? 'Cumprido' : pre ? CONTENT_STATE_META[pre.state].label : 'Pendente'}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {content.locked && (
            <div className="rm-callout blocked">
              <LockKeyhole size={16} />
              <p>Este conteúdo começa depois que os pré-requisitos acima forem concluídos.</p>
            </div>
          )}

          {retake && (
            <Link className="primary-button rm-start" href={`/quizzes?conteudo=${encodeURIComponent(content.id)}`}>
              <RotateCcw size={15} /> {content.state === 'bloqueado' ? 'Refazer o quiz' : 'Fazer o quiz corretivo'}
            </Link>
          )}
          {!content.locked && STUDYABLE.has(content.state) && (
            <button className={retake ? 'qz-outline rm-start rm-start-alt' : 'primary-button rm-start'} onClick={() => void start()} disabled={starting}>
              <Play size={15} />{' '}
              {starting ? 'Abrindo sessão…' : content.state === 'nao-iniciado' ? 'Começar a estudar' : retake ? 'Revisar as notas antes' : 'Estudar'}
            </button>
          )}
          {actionError && <p className="rm-error" role="alert">{actionError}</p>}
          {content.state !== 'nao-iniciado' && (
            <Link className="rm-report-link" href={`/relatorio?conteudo=${encodeURIComponent(content.id)}`}>
              Ver relatório do conteúdo
            </Link>
          )}
        </aside>
      </div>

      <section className="rm-changes" aria-labelledby="rm-changes-title">
        <div className="section-heading">
          <div><p className="eyebrow">REGISTRO DE MUDANÇAS</p><h2 id="rm-changes-title">O que mudou no seu roadmap.</h2></div>
        </div>
        {data.changes.length === 0 ? (
          <p className="rm-muted">Nenhuma mudança registrada ainda. Cada início, quiz e revisão aparece aqui com o motivo.</p>
        ) : (
          <ul>
            {data.changes.map((item) => (
              <li key={item.id}>
                <span className="rm-change-date">{dateLabel(item.occurredAt)}</span>
                <div>
                  <strong>
                    {titleById.get(item.entityId)?.title ?? item.entityId}:{' '}
                    {CONTENT_STATE_META[item.fromState as keyof typeof CONTENT_STATE_META]?.label ?? item.fromState} →{' '}
                    {CONTENT_STATE_META[item.toState as keyof typeof CONTENT_STATE_META]?.label ?? item.toState}
                  </strong>
                  <p>{item.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
