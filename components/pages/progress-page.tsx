'use client';

import { useState } from 'react';
import { AlertTriangle, BrainCircuit, Flame, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/atlas/metric-card';
import { PageHeading } from '@/components/atlas/page-heading';
import { progressMetrics, useProgress } from '@/components/pages/use-progress';
import type { DisciplineProgress, ProgressReport } from '@/lib/progress';

type Metric = 'proficiency' | 'retention';

const METRIC_LABEL: Record<Metric, string> = { proficiency: 'Proficiência', retention: 'Retenção' };
const metricIcons = { target: Target, brain: BrainCircuit, flame: Flame } as const;
const points = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function TrendChart({ values, weeks, label }: { values: number[]; weeks: string[]; label: string }) {
  const w = 480, h = 170, padX = 28, padY = 18;
  const min = 0, max = 100;
  const x = (i: number) => padX + (i * (w - padX * 2)) / (values.length - 1);
  const y = (v: number) => h - padY - ((v - min) / (max - min)) * (h - padY * 2);
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <figure className="pg-chart">
      <svg viewBox={`0 0 ${w} ${h}`}>
        <title>{`${label} nas últimas 8 semanas: de ${values[0]}% para ${values[values.length - 1]}%`}</title>
        {[0, 50, 100].map((g) => (
          <g key={g}><line x1={padX} x2={w - padX} y1={y(g)} y2={y(g)} stroke="#e4e1ea" /><text x={0} y={y(g) + 4} fontSize="14" fill="#5f5b6a">{g}</text></g>
        ))}
        <polyline points={line} fill="none" stroke="#2463eb" strokeWidth="2.5" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={weeks[i]}>
            <circle cx={x(i)} cy={y(v)} r="4" fill="#fff" stroke="#2463eb" strokeWidth="2" />
            <text x={x(i)} y={h - 2} fontSize="14" textAnchor="middle" fill="#5f5b6a">{weeks[i]}</text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">{values.map((v, i) => `${weeks[i]}: ${v}%`).join(', ')}</figcaption>
    </figure>
  );
}

// Como a nota da disciplina foi formada: peso × proporção de cada componente (DEC-02).
function FormulaCard({ discipline, progress }: { discipline: DisciplineProgress; progress: ProgressReport }) {
  return (
    <article className="pg-card" aria-labelledby="pg-why-title">
      <p className="eyebrow">COMO A NOTA É CALCULADA</p>
      <h2 id="pg-why-title">{discipline.title}: {points(discipline.score)} de 100</h2>
      <ul className="pg-formula">
        {discipline.components.map((item) => (
          <li key={item.key} className={item.available ? '' : 'off'}>
            <div>
              <strong>{item.label}</strong>
              <span>{points(item.points)} de {item.weight} pts</span>
            </div>
            <span className="progress-track"><span style={{ width: `${Math.round(item.ratio * 100)}%` }} /></span>
            <small>{item.detail}</small>
          </li>
        ))}
      </ul>
      <p className="pg-muted">
        Fórmula {progress.formulaVersion}: pesos padrão do curso (DEC-02). Avaliações e atividades ficam em 0 até o Atlas registrar essas
        entregas; o domínio é essa nota.
      </p>
    </article>
  );
}

export function ProgressPage() {
  const state = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('proficiency');
  const progress = state.status === 'ready' ? state.progress : null;
  const disciplines = progress?.disciplines ?? [];
  const selected = disciplines.find((item) => item.id === selectedId) ?? disciplines[0] ?? null;
  const series = selected?.history[metric] ?? [];
  const delta = series.length ? series[series.length - 1] - series[0] : 0;
  const consistency = progress?.consistency;

  return (
    <section className="pg-view" aria-labelledby="pg-title">
      <PageHeading
        eyebrow="PROGRESSO"
        title="O que você já domina — e o que precisa de atenção."
        titleId="pg-title"
        aside={<div className="streak-pill"><Flame size={17} /> {consistency?.studiedDays ?? 0} de 28 dias estudados</div>}
      >
        Competências, tendência, retenção e a origem de cada número.
      </PageHeading>

      {state.status === 'error' && <p className="rm-error" role="alert">{state.message}</p>}

      <section className="metrics-section" aria-label="Resumo">
        {progressMetrics(progress).map((item) => {
          const Icon = metricIcons[item.icon];
          return <MetricCard key={item.label} tone={item.tone} icon={<Icon size={19} />} label={item.label} value={item.value} hint={item.hint} />;
        })}
      </section>

      {state.status === 'loading' && <p className="rm-muted">Calculando progresso…</p>}

      {progress && selected && (
        <div className="pg-grid">
          <article className="pg-card" aria-labelledby="pg-comp-title">
            <p className="eyebrow">VISÃO POR DISCIPLINA</p>
            <h2 id="pg-comp-title">Proficiência versus domínio</h2>
            <p className="pg-explain">
              <strong>Proficiência</strong> é a média das suas últimas 5 tentativas de quiz, revisão e corretivo.
              <strong> Domínio</strong> é a nota da disciplina pela fórmula do Atlas: cobertura, quizzes e revisões em dia.
              Uma lacuna grande entre os dois indica algo que você acerta hoje, mas ainda não consolidou.
            </p>
            <ul className="pg-competencies">
              {disciplines.map((item) => (
                <li key={item.id}>
                  <button className={item.id === selected.id ? 'active' : ''} aria-pressed={item.id === selected.id} onClick={() => setSelectedId(item.id)}>
                    <span className="pg-comp-name">{item.title}{item.proficiency - item.mastery >= 15 && <em>lacuna de {Math.round(item.proficiency - item.mastery)} pts</em>}</span>
                    <span className="pg-bars">
                      <span className="pg-bar"><small>Proficiência {item.proficiency}%</small><span className="progress-track"><span style={{ width: `${item.proficiency}%` }} /></span></span>
                      <span className="pg-bar mastery"><small>Domínio {points(item.mastery)}%</small><span className="progress-track"><span style={{ width: `${item.mastery}%` }} /></span></span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </article>

          <article className="pg-card" aria-labelledby="pg-trend-title">
            <p className="eyebrow">HISTÓRICO E TENDÊNCIA</p>
            <h2 id="pg-trend-title">{selected.title}</h2>
            {selected.frozenBy.length > 0 && (
              <p className="pg-frozen" role="note">
                Conclusão da disciplina congelada até você passar de novo em: {selected.frozenBy.join(', ')}.
              </p>
            )}
            <fieldset className="pg-segmented">
              <legend className="sr-only">Métrica do gráfico</legend>
              {(Object.keys(METRIC_LABEL) as Metric[]).map((key) => (
                <button key={key} aria-pressed={metric === key} className={metric === key ? 'on' : ''} onClick={() => setMetric(key)}>{METRIC_LABEL[key]}</button>
              ))}
            </fieldset>
            <TrendChart values={series} weeks={progress.weeks} label={`${METRIC_LABEL[metric]} de ${selected.title}`} />
            <p className={`pg-trend ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {delta >= 0 ? '+' : ''}{delta} pontos em 8 semanas
            </p>
            <div className="pg-retention">
              <span>Retenção atual</span>
              <strong>{selected.reviewsTaken ? `${selected.retention}%` : '—'}</strong>
              <span className="progress-track"><span style={{ width: `${selected.retention}%` }} /></span>
              <small>
                {selected.reviewsTaken === 0
                  ? 'Sem revisões feitas ainda: a retenção é a parte das revisões aprovadas.'
                  : `${selected.reviewsTaken} ${selected.reviewsTaken === 1 ? 'revisão feita' : 'revisões feitas'}. ${selected.retention >= 75 ? 'Boa: revisões em dia mantêm o conteúdo firme.' : 'Abaixo de 75%: refaça as revisões que falharam.'}`}
              </small>
            </div>
          </article>
        </div>
      )}

      {progress && (
        <div className="pg-grid">
          <article className="pg-card" aria-labelledby="pg-cons-title">
            <p className="eyebrow">CONSISTÊNCIA</p>
            <h2 id="pg-cons-title">Últimos 28 dias</h2>
            <ol className="pg-days" aria-label="Dias de estudo, do mais antigo ao mais recente">
              {progress.consistency.days.map((m, i) => (
                <li key={i} className={m === 0 ? 'none' : m < 30 ? 'low' : m < 40 ? 'mid' : 'high'} aria-label={`Dia ${i + 1}: ${m === 0 ? 'sem estudo' : `${m} minutos`}`} title={m === 0 ? 'Sem estudo' : `${m} min`} />
              ))}
            </ol>
            <p className="pg-legend"><span className="none" /> Sem estudo <span className="low" /> até 29 min <span className="mid" /> 30–39 min <span className="high" /> 40+ min</p>
            <p className="pg-muted">Minutos ativos das sessões de estudo, pelo dia em que terminaram.</p>
          </article>

          <article className="pg-card" aria-labelledby="pg-risk-title">
            <p className="eyebrow">CONTEÚDOS EM RISCO</p>
            <h2 id="pg-risk-title">Precisam de atenção</h2>
            {progress.atRisk.length === 0 && <p className="pg-muted">Nenhum conteúdo em risco por enquanto.</p>}
            <ul className="pg-risk">
              {progress.atRisk.map((item) => (
                <li key={item.id}>
                  <AlertTriangle size={16} />
                  <div><strong>{item.title}</strong><p>{item.discipline} · {item.reason}</p><small>Próximo passo: {item.action}</small></div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      )}

      {progress && selected && (
        <div className="pg-grid">
          <FormulaCard discipline={selected} progress={progress} />
          <article className="pg-card" aria-labelledby="pg-weights-title">
            <p className="eyebrow">PESOS DO CURSO</p>
            <h2 id="pg-weights-title">Distribuição dos 100 pontos</h2>
            <ul className="pg-weights">
              {selected.components.map((item) => (
                <li key={item.key}><span>{item.label}</span><strong>{item.weight}%</strong></li>
              ))}
            </ul>
            <p className="pg-muted">
              Cada disciplina soma 100 pontos com estes pesos. O ajuste automático dos pesos (até 10 pontos para cima ou para baixo) ainda não está ativo.
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
