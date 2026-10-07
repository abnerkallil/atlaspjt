'use client';

import { useState } from 'react';
import { AlertTriangle, BrainCircuit, Flame, Lightbulb, RotateCcw, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/atlas/metric-card';
import { PageHeading } from '@/components/atlas/page-heading';
import {
  atRisk, competencies, consistencyDays, progressSummary, recommendations, recoveryPlan, WEEK_LABELS,
} from '@/lib/demo/progress';

type Metric = 'proficiency' | 'retention';

const METRIC_LABEL: Record<Metric, string> = { proficiency: 'Proficiência', retention: 'Retenção' };
const avg = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);

function TrendChart({ values, label }: { values: number[]; label: string }) {
  const w = 480, h = 170, padX = 28, padY = 18;
  const min = 0, max = 100;
  const x = (i: number) => padX + (i * (w - padX * 2)) / (values.length - 1);
  const y = (v: number) => h - padY - ((v - min) / (max - min)) * (h - padY * 2);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <figure className="pg-chart">
      <svg viewBox={`0 0 ${w} ${h}`}>
        <title>{`${label} nas últimas 8 semanas: de ${values[0]}% para ${values[values.length - 1]}%`}</title>
        {[0, 50, 100].map((g) => (
          <g key={g}><line x1={padX} x2={w - padX} y1={y(g)} y2={y(g)} stroke="#e4e1ea" /><text x={0} y={y(g) + 4} fontSize="14" fill="#5f5b6a">{g}</text></g>
        ))}
        <polyline points={points} fill="none" stroke="#2463eb" strokeWidth="2.5" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={WEEK_LABELS[i]}>
            <circle cx={x(i)} cy={y(v)} r="4" fill="#fff" stroke="#2463eb" strokeWidth="2" />
            <text x={x(i)} y={h - 2} fontSize="14" textAnchor="middle" fill="#5f5b6a">{WEEK_LABELS[i]}</text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">{values.map((v, i) => `${WEEK_LABELS[i]}: ${v}%`).join(', ')}</figcaption>
    </figure>
  );
}

export function ProgressPage() {
  const [selectedId, setSelectedId] = useState(competencies[0].id);
  const [metric, setMetric] = useState<Metric>('proficiency');
  const [done, setDone] = useState<string[]>([]);

  const selected = competencies.find((c) => c.id === selectedId) ?? competencies[0];
  const series = selected.history[metric];
  const delta = series[series.length - 1] - series[0];
  const studiedDays = consistencyDays.filter((m) => m > 0).length;
  const toggle = (id: string) => setDone((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]));

  return (
    <section className="pg-view" aria-labelledby="pg-title">
      <PageHeading
        eyebrow="PROGRESSO"
        title="O que você já domina — e o que precisa de atenção."
        titleId="pg-title"
        aside={<div className="streak-pill"><Flame size={17} /> {studiedDays} de 28 dias estudados</div>}
      >
        Competências, tendência, retenção e recomendações explicadas.
      </PageHeading>

      <section className="metrics-section" aria-label="Resumo">
        <MetricCard tone="gold" icon={<Target size={19} />} label="Domínio geral" value={`${avg(competencies.map((c) => c.mastery))}%`} hint="Conhecimento consolidado" />
        <MetricCard tone="violet" icon={<BrainCircuit size={19} />} label="Retenção média" value={`${avg(competencies.map((c) => c.retention))}%`} hint="Estimada por revisão espaçada" />
        <MetricCard tone="green" icon={<Flame size={19} />} label="Consistência" value={`${progressSummary.currentStreak} dias`} hint={`${studiedDays} de 28 dias com estudo`} />
      </section>

      <div className="pg-grid">
        <article className="pg-card" aria-labelledby="pg-comp-title">
          <p className="eyebrow">VISÃO POR COMPETÊNCIA</p>
          <h2 id="pg-comp-title">Proficiência versus domínio</h2>
          <p className="pg-explain">
            <strong>Proficiência</strong> mede seu desempenho recente em quizzes e práticas.
            <strong> Domínio</strong> só sobe quando esse desempenho se mantém ao longo do tempo (retenção e constância).
            Uma lacuna grande entre os dois indica algo que você acerta hoje, mas pode esquecer.
          </p>
          <ul className="pg-competencies">
            {competencies.map((c) => (
              <li key={c.id}>
                <button className={c.id === selected.id ? 'active' : ''} aria-pressed={c.id === selected.id} onClick={() => setSelectedId(c.id)}>
                  <span className="pg-comp-name">{c.name}{c.proficiency - c.mastery >= 15 && <em>lacuna de {c.proficiency - c.mastery} pts</em>}</span>
                  <span className="pg-bars">
                    <span className="pg-bar"><small>Proficiência {c.proficiency}%</small><span className="progress-track"><span style={{ width: `${c.proficiency}%` }} /></span></span>
                    <span className="pg-bar mastery"><small>Domínio {c.mastery}%</small><span className="progress-track"><span style={{ width: `${c.mastery}%` }} /></span></span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="pg-card" aria-labelledby="pg-trend-title">
          <p className="eyebrow">HISTÓRICO E TENDÊNCIA</p>
          <h2 id="pg-trend-title">{selected.name}</h2>
          <fieldset className="pg-segmented">
            <legend className="sr-only">Métrica do gráfico</legend>
            {(Object.keys(METRIC_LABEL) as Metric[]).map((key) => (
              <button key={key} aria-pressed={metric === key} className={metric === key ? 'on' : ''} onClick={() => setMetric(key)}>{METRIC_LABEL[key]}</button>
            ))}
          </fieldset>
          <TrendChart values={series} label={`${METRIC_LABEL[metric]} de ${selected.name}`} />
          <p className={`pg-trend ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {delta >= 0 ? '+' : ''}{delta} pontos em 8 semanas
          </p>
          <div className="pg-retention">
            <span>Retenção atual</span>
            <strong>{selected.retention}%</strong>
            <span className="progress-track"><span style={{ width: `${selected.retention}%` }} /></span>
            <small>{selected.retention >= 75 ? 'Boa: revisões em dia mantêm o conteúdo firme.' : 'Abaixo de 75%: uma revisão em breve evita o esquecimento.'}</small>
          </div>
        </article>
      </div>

      <div className="pg-grid">
        <article className="pg-card" aria-labelledby="pg-cons-title">
          <p className="eyebrow">CONSISTÊNCIA</p>
          <h2 id="pg-cons-title">Últimos 28 dias</h2>
          <ol className="pg-days" aria-label="Dias de estudo, do mais antigo ao mais recente">
            {consistencyDays.map((m, i) => (
              <li key={i} className={m === 0 ? 'none' : m < 30 ? 'low' : m < 40 ? 'mid' : 'high'} aria-label={`Dia ${i + 1}: ${m === 0 ? 'sem estudo' : `${m} minutos`}`} title={m === 0 ? 'Sem estudo' : `${m} min`} />
            ))}
          </ol>
          <p className="pg-legend"><span className="none" /> Sem estudo <span className="low" /> até 29 min <span className="mid" /> 30–39 min <span className="high" /> 40+ min</p>
        </article>

        <article className="pg-card" aria-labelledby="pg-risk-title">
          <p className="eyebrow">CONTEÚDOS EM RISCO</p>
          <h2 id="pg-risk-title">Precisam de atenção</h2>
          {atRisk.length === 0 && <p className="pg-muted">Nenhum conteúdo em risco por enquanto.</p>}
          <ul className="pg-risk">
            {atRisk.map((item) => (
              <li key={item.id}>
                <AlertTriangle size={16} />
                <div><strong>{item.title}</strong><p>{item.reason}</p><small>Sugestão: {item.recovery}</small></div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="pg-grid">
        <article className="pg-card" aria-labelledby="pg-rec-title">
          <p className="eyebrow">RECUPERAÇÃO</p>
          <h2 id="pg-rec-title">Plano da semana</h2>
          <ul className="pg-plan">
            {recoveryPlan.map((step) => (
              <li key={step.id}>
                <label className={done.includes(step.id) ? 'on' : ''}>
                  <input type="checkbox" checked={done.includes(step.id)} onChange={() => toggle(step.id)} />
                  <RotateCcw size={14} /> {step.text}
                </label>
              </li>
            ))}
          </ul>
          <p className="pg-muted">
            {recoveryPlan.length === 0 ? 'Sem plano de recuperação: ainda não há nada para recuperar.' : `${done.length} de ${recoveryPlan.length} passos concluídos.`}
          </p>
        </article>

        <article className="pg-card" aria-labelledby="pg-why-title">
          <p className="eyebrow">EXPLICAÇÃO DAS RECOMENDAÇÕES</p>
          <h2 id="pg-why-title">Por que o Atlas sugere isso</h2>
          {recommendations.length === 0 && <p className="pg-muted">As recomendações aparecem depois das primeiras sessões de estudo.</p>}
          <ul className="pg-recs">
            {recommendations.map((rec) => (
              <li key={rec.id}>
                <details>
                  <summary><Lightbulb size={15} /> {rec.title}</summary>
                  <p>{rec.why}</p>
                  <small>Dados usados: {rec.data}</small>
                </details>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="rm-demo-note">Dados de demonstração. O cálculo real de progresso ainda não está ativo.</p>
    </section>
  );
}
