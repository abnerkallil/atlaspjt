'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, BrainCircuit, Check, ChevronRight, Clock3, Flame, Map as MapIcon, PenLine, Sparkles, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/atlas/metric-card';
import { PageHeading } from '@/components/atlas/page-heading';
import { ProgressBar } from '@/components/atlas/progress-bar';
import { SessionStartModal } from '@/components/atlas/session-start-modal';
import { useAtlasShell } from '@/components/atlas/atlas-shell';
import { dailySummary, todayMetrics, todayTasks } from '@/lib/demo/today';
import { formatMinutes, startStudySession, useStudyOverview } from '@/components/pages/use-study-overview';
import { elapsedSeconds } from '@/lib/study-sessions';
import type { RoadmapView } from '@/lib/roadmap-store';

const taskIcons = { book: BookOpen, brain: BrainCircuit, target: Target, pen: PenLine } as const;
const metricIcons = { target: Target, brain: BrainCircuit, flame: Flame } as const;

// Data e saudação dependem do relógio de quem acessa: calculadas só no navegador (no servidor ficam vazias),
// para o fuso do servidor não aparecer na tela nem causar divergência de hidratação.
const subscribeToClock = () => () => {};
const todayLabel = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
const greetingNow = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
};

// Fase atual vinda do roadmap real (a mesma leitura da página Roadmap): a primeira
// fase com conteúdo por concluir.
function useCurrentPhase() {
  const [phase, setPhase] = useState<{ title: string; percent: number } | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/roadmap')
      .then((response) => (response.ok ? (response.json() as Promise<{ roadmap: RoadmapView }>) : null))
      .then((body) => {
        const phases = body?.roadmap.phases ?? [];
        const current = phases.find((item) => item.progress.completed < item.progress.total) ?? phases.at(-1);
        if (active && current) setPhase({ title: current.title, percent: current.progress.percent });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return phase;
}

export function TodayPage() {
  const { done, toggleTask } = useAtlasShell();
  const currentPhase = useCurrentPhase();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const router = useRouter();
  const { overview } = useStudyOverview();
  const ready = overview.status === 'ready' ? overview : null;
  const nextContent = ready?.nextContent ?? null;
  const openSession = ready?.next?.kind === 'retomar' ? ready.openSessions[0] : undefined;
  const nextDiscipline = ready?.roadmap?.phases
    .flatMap((phase) => phase.disciplines)
    .find((item) => item.id === nextContent?.disciplineId);

  function continueStudy() {
    if (openSession) router.push(`/estudar?sessao=${encodeURIComponent(openSession.id)}`);
    else if (nextContent) setSessionOpen(true);
    else router.push('/roadmap');
  }

  async function beginSession() {
    if (!nextContent) return;
    setStarting(true);
    setStartError('');
    try {
      const session = await startStudySession(nextContent.id);
      router.push(`/estudar?sessao=${encodeURIComponent(session.id)}`);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Não foi possível abrir a sessão.');
      setSessionOpen(false);
    } finally {
      setStarting(false);
    }
  }
  const dateLabel = useSyncExternalStore(subscribeToClock, todayLabel, () => ' ');
  const greeting = useSyncExternalStore(subscribeToClock, greetingNow, () => 'Olá');

  return (
    <>
      <PageHeading eyebrow={dateLabel} title={`${greeting}.`}>
        Seu próximo passo já está preparado. Uma sessão consistente vale mais que uma maratona.
      </PageHeading>

      <div className="hero-grid">
        <article className="continue-card">
          <div className="card-kicker"><BookOpen size={15} /> CONTINUE DE ONDE PAROU</div>
          <div className="continue-content">
            <div>
              <span className="subject-chip">{nextContent?.disciplineTitle ?? 'Roadmap'}</span>
              <h2>{nextContent?.title ?? (ready ? 'Nada pendente agora' : 'Carregando…')}</h2>
              <p>
                {openSession
                  ? `Sessão ${openSession.status === 'pausada' ? 'pausada' : 'em andamento'}: retome de onde parou.`
                  : ready?.next?.kind === 'iniciar'
                    ? ready.next.reason
                    : ready
                      ? 'Os conteúdos liberados já foram estudados.'
                      : ''}
              </p>
            </div>
            <div className="progress-copy"><strong>{nextDiscipline?.progress.percent ?? 0}%</strong><span>da disciplina</span></div>
          </div>
          <ProgressBar value={nextDiscipline?.progress.percent ?? 0} />
          <div className="continue-footer">
            <span>
              <Clock3 size={15} />{' '}
              {openSession && ready
                ? `${formatMinutes(elapsedSeconds(openSession, ready.serverNow))} nesta sessão`
                : 'Nenhuma sessão aberta'}
            </span>
            <Button className="primary-button" onClick={continueStudy} disabled={!ready}>
              {openSession ? 'Retomar sessão' : 'Continuar estudo'} <ArrowRight size={17} />
            </Button>
          </div>
          {startError && <p className="rm-error" role="alert">{startError}</p>}
        </article>

        <aside className="atlas-observed-card">
          <div className="atlas-orbit"><Sparkles size={19} /></div>
          <p className="card-kicker">O ATLAS OBSERVOU</p>
          <h3>Ainda sem histórico.</h3>
          <p>Depois das primeiras sessões, o Atlas mostra aqui o que observou sobre o seu ritmo e a sua retenção.</p>
          <Link href="/progresso">Entender recomendação <ChevronRight size={16} /></Link>
        </aside>
      </div>

      <section className="journey-section" aria-labelledby="today-journey-title">
        <div className="section-heading">
          <div><p className="eyebrow">SUA JORNADA DE HOJE</p><h2 id="today-journey-title">Quatro passos, um objetivo claro.</h2></div>
          <div className="journey-total"><Clock3 size={16} /> {Math.floor(dailySummary.plannedMinutes / 60)}h{String(dailySummary.plannedMinutes % 60).padStart(2, '0')} planejadas</div>
        </div>

        <div className="task-list">
          {todayTasks.map((task, index) => {
            const Icon = taskIcons[task.icon];
            const isDone = done.includes(task.id);
            return (
              <article className={`task-row ${isDone ? 'done' : ''}`} key={task.id}>
                <button
                  className="task-check"
                  onClick={() => toggleTask(task.id)}
                  aria-label={isDone ? `Marcar ${task.title} como pendente` : `Concluir ${task.title}`}
                >
                  {isDone ? <Check size={17} /> : <span>{index + 1}</span>}
                </button>
                <div className={`task-icon ${task.tone}`}><Icon size={19} /></div>
                <div className="task-copy">
                  <div><span className={`task-label ${task.tone}`}>{task.label}</span><span className="task-time"><Clock3 size={13} />{task.minutes} min</span></div>
                  <h3>{task.title}</h3>
                  <p>{isDone ? 'Atividade concluída. Bom trabalho.' : task.description}</p>
                </div>
                <Link className="task-arrow" href={task.href} aria-label={`Abrir ${task.title}`}><ChevronRight size={19} /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="metrics-section today-metrics" aria-labelledby="today-metrics-title">
        <div className="section-heading">
          <div><p className="eyebrow">COMO VOCÊ ESTÁ</p><h2 id="today-metrics-title">Seus indicadores</h2></div>
          <Link className="section-link" href="/progresso">Ver progresso completo <ChevronRight size={16} /></Link>
        </div>
        {todayMetrics.map((metric) => {
          const Icon = metricIcons[metric.icon];
          return <MetricCard key={metric.label} tone={metric.tone} icon={<Icon size={19} />} label={metric.label} value={metric.value} hint={metric.hint} />;
        })}
      </section>

      <section className="roadmap-card">
        <div className="roadmap-title"><div className="map-icon"><MapIcon size={19} /></div><div><span>ROADMAP ATUAL</span><h2>{currentPhase?.title ?? 'Carregando…'}</h2></div></div>
        <div className="roadmap-progress">
          <div><span>Progresso da fase</span><strong>{currentPhase ? `${currentPhase.percent}%` : '—'}</strong></div>
          <ProgressBar value={currentPhase?.percent ?? 0} />
        </div>
        <Link href="/roadmap">Ver roadmap completo <ChevronRight size={17} /></Link>
      </section>

      {sessionOpen && nextContent && (
        <SessionStartModal
          title={nextContent.title}
          description={`${nextContent.disciplineTitle}${nextContent.estimatedMinutes ? ` · ${nextContent.estimatedMinutes} min estimados` : ''}. Material e notas lado a lado; ao concluir, o quiz do conteúdo fica disponível.`}
          starting={starting}
          onClose={() => setSessionOpen(false)}
          onStart={() => void beginSession()}
        />
      )}
    </>
  );
}
