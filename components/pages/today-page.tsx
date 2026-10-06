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
import { dailySummary, todayContinue, todayMetrics, todayTasks } from '@/lib/demo/today';
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
  const router = useRouter();
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
              <span className="subject-chip">{todayContinue.subject}</span>
              <h2>{todayContinue.title}</h2>
              <p>{todayContinue.description}</p>
            </div>
            <div className="progress-copy"><strong>{todayContinue.progress}%</strong><span>do conteúdo</span></div>
          </div>
          <ProgressBar value={todayContinue.progress} />
          <div className="continue-footer">
            <span><Clock3 size={15} /> {todayContinue.lastSession}</span>
            <Button className="primary-button" onClick={() => setSessionOpen(true)}>
              Continuar estudo <ArrowRight size={17} />
            </Button>
          </div>
        </article>

        <aside className="atlas-observed-card">
          <div className="atlas-orbit"><Sparkles size={19} /></div>
          <p className="card-kicker">O ATLAS OBSERVOU</p>
          <h3>Seu ritmo está consistente.</h3>
          <p>Você retém melhor quando pratica logo após a teoria. Por isso, incluímos um balancete ao fim da jornada.</p>
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

      {sessionOpen && <SessionStartModal onClose={() => setSessionOpen(false)} onStart={() => router.push('/estudar?sessao=iniciar')} />}
    </>
  );
}
