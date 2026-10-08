'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, ChevronRight, FileText, History, Route } from 'lucide-react';
import { PageHeading } from '@/components/atlas/page-heading';
import { localDate } from '@/components/atlas/use-agenda';
import { CONTENT_STATE_META } from '@/lib/pedagogy/state-labels';
import type { ContentState } from '@/lib/pedagogy/states';
import type { ContentReport } from '@/lib/reports';
import type { RoadmapView } from '@/lib/roadmap-store';

type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

const when = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const points = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const ctaLabel = (href: string) =>
  href.startsWith('/quizzes') ? 'Abrir Quizzes' : href === '/estudar' ? 'Voltar à sessão' : href === '/roadmap' ? 'Abrir o Roadmap' : href === '/' ? 'Abrir Hoje' : 'Ver progresso';
const stateLabel = (state: string) => CONTENT_STATE_META[state as ContentState]?.label ?? state;

async function load<T>(url: string, pick: (body: Record<string, unknown>) => T | undefined): Promise<LoadState<T>> {
  try {
    const response = await fetch(url);
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
    const data = pick(body);
    if (!response.ok || data === undefined) throw new Error(body.error ?? 'Não foi possível carregar o relatório.');
    return { status: 'ready', data };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Não foi possível carregar o relatório.' };
  }
}

// Sem conteúdo escolhido: lista os conteúdos que já têm algum registro.
function ReportIndex() {
  const [state, setState] = useState<LoadState<RoadmapView>>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    void load('/api/roadmap', (body) => body.roadmap as RoadmapView | undefined).then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  const studied =
    state.status === 'ready'
      ? state.data.phases.flatMap((phase) =>
          phase.disciplines.flatMap((discipline) =>
            discipline.contents.filter((content) => content.state !== 'nao-iniciado').map((content) => ({ ...content, discipline: discipline.title })),
          ),
        )
      : [];
  return (
    <section className="pg-view" aria-labelledby="rp-title">
      <PageHeading eyebrow="RELATÓRIOS" title="Por que cada conteúdo está onde está." titleId="rp-title">
        Escolha um conteúdo para ver a origem da nota, as mudanças de estado, o risco, a próxima ação e o histórico.
      </PageHeading>
      {state.status === 'error' && <p className="rm-error" role="alert">{state.message}</p>}
      {state.status === 'loading' && <p className="rm-muted">Carregando…</p>}
      {state.status === 'ready' && studied.length === 0 && (
        <p className="rm-muted">Nenhum conteúdo estudado ainda. O relatório aparece depois da primeira sessão.</p>
      )}
      <ul className="rp-index">
        {studied.map((content) => (
          <li key={content.id}>
            <Link href={`/relatorio?conteudo=${encodeURIComponent(content.id)}`}>
              <span><strong>{content.title}</strong><small>{content.discipline} · {content.id}</small></span>
              <span className="rp-state">{stateLabel(content.state)}</span>
              <ChevronRight size={16} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Report({ contentId }: { contentId: string }) {
  const [state, setState] = useState<LoadState<ContentReport>>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    const url = `/api/relatorio?conteudo=${encodeURIComponent(contentId)}&hoje=${localDate()}&fuso=${new Date().getTimezoneOffset()}`;
    void load(url, (body) => body.report as ContentReport | undefined).then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, [contentId]);

  if (state.status !== 'ready') {
    return (
      <section className="pg-view">
        {state.status === 'loading' ? <p className="rm-muted">Montando relatório…</p> : <p className="rm-error" role="alert">{state.message}</p>}
        <Link className="section-link" href="/relatorio">Ver todos os relatórios <ChevronRight size={16} /></Link>
      </section>
    );
  }
  const report = state.data;
  const { content, origin, risk, nextAction } = report;
  return (
    <section className="pg-view" aria-labelledby="rp-title">
      <PageHeading
        eyebrow={`RELATÓRIO · ${[content.disciplineTitle, content.unit].filter(Boolean).join(' · ').toUpperCase()}`}
        title={content.title}
        titleId="rp-title"
        aside={<div className="streak-pill"><Route size={17} /> {content.stateLabel}</div>}
      >
        Tudo aqui vem dos seus registros: sessões, quizzes, revisões e mudanças de estado.
      </PageHeading>

      <div className="pg-grid">
        <article className="pg-card rp-next" aria-labelledby="rp-next-title">
          <p className="eyebrow">PRÓXIMA AÇÃO</p>
          <h2 id="rp-next-title">{nextAction.label}</h2>
          <p className="pg-explain">{nextAction.detail}</p>
          <Link className="primary-button rp-action" href={nextAction.href}>{ctaLabel(nextAction.href)} <ArrowRight size={15} /></Link>
        </article>
        <article className={`pg-card rp-risk ${risk.level}`} aria-labelledby="rp-risk-title">
          <p className="eyebrow">RISCO</p>
          <h2 id="rp-risk-title">{risk.level === 'alto' && <AlertTriangle size={17} />} {risk.label}</h2>
          <ul>
            {risk.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
          {content.pendingPrerequisites.length > 0 && (
            <p className="pg-muted">Pré-requisitos pendentes: {content.pendingPrerequisites.map((item) => item.title).join(', ')}.</p>
          )}
        </article>
      </div>

      <div className="pg-grid">
        <article className="pg-card" aria-labelledby="rp-origin-title">
          <p className="eyebrow">ORIGEM DA NOTA</p>
          <h2 id="rp-origin-title">{content.disciplineTitle}: {points(origin.disciplineScore)} de 100</h2>
          <p className="pg-explain">O que este conteúdo soma na nota da disciplina (fórmula {origin.formulaVersion}, pesos do DEC-02):</p>
          <ul className="rp-list">
            {origin.contribution.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <ul className="pg-formula">
            {origin.components.map((item) => (
              <li key={item.key} className={item.available ? '' : 'off'}>
                <div><strong>{item.label}</strong><span>{points(item.points)} de {item.weight} pts</span></div>
                <small>{item.detail}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="pg-card" aria-labelledby="rp-changes-title">
          <p className="eyebrow">MUDANÇAS DE ESTADO</p>
          <h2 id="rp-changes-title"><FileText size={17} /> {report.stateChanges.length} {report.stateChanges.length === 1 ? 'mudança' : 'mudanças'}</h2>
          {report.stateChanges.length === 0 && <p className="pg-muted">Nenhuma mudança registrada ainda.</p>}
          <ol className="rp-timeline">
            {report.stateChanges.map((item) => (
              <li key={item.id}>
                <span className="rp-when">{when(item.occurredAt)}</span>
                <div>
                  <strong>{stateLabel(item.fromState)} → {stateLabel(item.toState)}</strong>
                  <p>{item.reason}</p>
                  <small>{item.actor === 'usuario' ? 'Ação sua' : 'Automática (Atlas)'}</small>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </div>

      <article className="pg-card" aria-labelledby="rp-history-title">
        <p className="eyebrow">HISTÓRICO</p>
        <h2 id="rp-history-title"><History size={17} /> Sessões e quizzes</h2>
        {report.history.length === 0 && <p className="pg-muted">Nenhuma sessão concluída ou quiz enviado ainda.</p>}
        <ol className="rp-timeline">
          {report.history.map((item) => (
            <li key={`${item.kind}-${item.at}`} className={item.kind}>
              <span className="rp-when">{when(item.at)}</span>
              <div><strong>{item.title}</strong><p>{item.detail}</p></div>
            </li>
          ))}
        </ol>
      </article>
      <Link className="section-link" href="/relatorio">Ver todos os relatórios <ChevronRight size={16} /></Link>
    </section>
  );
}

// Relatórios explicáveis (MVP-09).
export function ReportPage() {
  const contentId = useSearchParams().get('conteudo');
  return contentId ? <Report key={contentId} contentId={contentId} /> : <ReportIndex />;
}
