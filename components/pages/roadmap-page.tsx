'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, LockKeyhole, Map as MapIcon, RotateCcw, Route, Sparkles } from 'lucide-react';
import {
  roadmapChanges,
  roadmapPhaseOrder,
  roadmapPhases,
  STATE_META,
  type PedagogicalState,
  type RoadmapContent,
} from '@/lib/demo/roadmap';

const PHASE_STATUS_LABEL = { concluida: 'Concluída', atual: 'Fase atual', futura: 'Futura' } as const;

const orderedPhases = roadmapPhaseOrder
  .map((id) => roadmapPhases.find((phase) => phase.id === id))
  .filter((phase): phase is (typeof roadmapPhases)[number] => Boolean(phase));

const allContents = roadmapPhases.flatMap((phase) => phase.disciplines.flatMap((d) => d.contents));

export function RoadmapPage() {
  const [phaseId, setPhaseId] = useState('fase-1');
  const [disciplineId, setDisciplineId] = useState('contabilidade-geral');
  const [contentId, setContentId] = useState('c-debito-credito');

  const phase = orderedPhases.find((item) => item.id === phaseId) ?? orderedPhases[0];
  const discipline = phase.disciplines.find((item) => item.id === disciplineId) ?? phase.disciplines[0];
  const content = discipline.contents.find((item) => item.id === contentId) ?? discipline.contents[0];

  const titleById = useMemo(() => new Map(allContents.map((item) => [item.id, item])), []);
  const penaltyTotal = phase.raw - phase.adjusted;

  const selectPhase = (id: string) => {
    const next = orderedPhases.find((item) => item.id === id) ?? orderedPhases[0];
    setPhaseId(next.id);
    setDisciplineId(next.disciplines[0].id);
    setContentId(next.disciplines[0].contents[0].id);
  };
  const selectDiscipline = (id: string) => {
    const next = phase.disciplines.find((item) => item.id === id) ?? phase.disciplines[0];
    setDisciplineId(next.id);
    setContentId(next.contents[0].id);
  };

  const unmet = (item: RoadmapContent) =>
    item.prerequisites
      .map((id) => titleById.get(id))
      .filter((pre): pre is RoadmapContent => Boolean(pre));

  return (
    <section className="rm-view" aria-labelledby="rm-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ROADMAP</p>
          <h1 id="rm-title">Seu caminho até o domínio.</h1>
          <p>Fases, pré-requisitos e o motivo de cada ajuste — tudo o que o Atlas decidiu por você.</p>
        </div>
        <div className="streak-pill"><Route size={17} /> {PHASE_STATUS_LABEL[phase.status]}: {phase.name}</div>
      </div>

      <div className="rm-phases" role="tablist" aria-label="Fases do roadmap">
        {orderedPhases.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === phase.id}
            className={`rm-phase ${item.id === phase.id ? 'active' : ''} ${item.status}`}
            onClick={() => selectPhase(item.id)}
          >
            <span className="rm-phase-index">{item.status === 'concluida' ? <Check size={15} /> : index + 1}</span>
            <span className="rm-phase-copy">
              <small>{PHASE_STATUS_LABEL[item.status]}</small>
              <strong>{item.name}</strong>
              <em>{item.summary}</em>
            </span>
            <span className="rm-phase-pct">{item.adjusted}%</span>
          </button>
        ))}
      </div>

      <div className="rm-progress-grid">
        <article className="rm-progress-card">
          <span>Progresso bruto</span>
          <strong>{phase.raw}%</strong>
          <div className="progress-track"><span style={{ width: `${phase.raw}%` }} /></div>
          <small>Conteúdos concluídos, sem considerar penalidades.</small>
        </article>
        <article className="rm-progress-card adjusted">
          <span>Progresso ajustado</span>
          <strong>{phase.adjusted}%</strong>
          <div className="progress-track"><span style={{ width: `${phase.adjusted}%` }} /></div>
          <small>
            {penaltyTotal > 0
              ? `Bruto menos ${penaltyTotal} pontos de penalidades ainda não recuperadas.`
              : 'Sem penalidades em aberto.'}
          </small>
        </article>
      </div>

      <div className="rm-workspace">
        <div className="rm-main">
          <div className="rm-tabs" role="tablist" aria-label="Disciplinas">
            {phase.disciplines.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={item.id === discipline.id}
                className={item.id === discipline.id ? 'active' : ''}
                onClick={() => selectDiscipline(item.id)}
              >
                {item.name} <span>{item.adjusted}%</span>
              </button>
            ))}
          </div>

          <ol className="rm-content-list">
            {discipline.contents.map((item) => {
              const blocked = item.state === 'bloqueado';
              return (
                <li key={item.id}>
                  <button
                    className={`rm-content ${item.id === content.id ? 'active' : ''} ${item.state}`}
                    aria-pressed={item.id === content.id}
                    onClick={() => setContentId(item.id)}
                  >
                    <span className="rm-content-icon">
                      {blocked ? <LockKeyhole size={16} /> : item.state === 'dominado' ? <Check size={16} /> : item.state === 'em-risco' ? <AlertTriangle size={16} /> : <MapIcon size={16} />}
                    </span>
                    <span className="rm-content-copy">
                      <strong>{item.title}</strong>
                      <small>
                        {item.minutes} min
                        {item.prerequisites.length > 0 && ` · ${item.prerequisites.length} pré-requisito${item.prerequisites.length > 1 ? 's' : ''}`}
                      </small>
                    </span>
                    {item.penalty && <span className="rm-penalty-tag">−{item.penalty.points} pts</span>}
                    <span className={`rm-state ${item.state}`}>{STATE_META[item.state].label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="rm-legend" aria-label="Legenda de estados pedagógicos">
            {(Object.keys(STATE_META) as PedagogicalState[]).map((key) => (
              <span key={key} className={`rm-state ${key}`} title={STATE_META[key].hint}>{STATE_META[key].label}</span>
            ))}
          </div>
        </div>

        <aside className="rm-detail" aria-live="polite">
          <p className="eyebrow">{discipline.name.toUpperCase()}</p>
          <h2>{content.title}</h2>
          <span className={`rm-state ${content.state}`}>{STATE_META[content.state].label}</span>
          <p className="rm-detail-hint">{STATE_META[content.state].hint}</p>

          <h3>Pré-requisitos</h3>
          {unmet(content).length === 0 ? (
            <p className="rm-muted">Nenhum pré-requisito.</p>
          ) : (
            <ul className="rm-prereqs">
              {unmet(content).map((pre) => {
                const met = pre.state === 'dominado' || pre.state === 'praticado';
                return (
                  <li key={pre.id} className={met ? 'met' : 'pending'}>
                    {met ? <Check size={14} /> : <LockKeyhole size={14} />}
                    <span>{pre.title}<small>{met ? 'Cumprido' : STATE_META[pre.state].label}</small></span>
                  </li>
                );
              })}
            </ul>
          )}

          {content.state === 'bloqueado' && (
            <div className="rm-callout blocked">
              <LockKeyhole size={16} />
              <p>Conteúdo bloqueado até que todos os pré-requisitos acima estejam cumpridos.</p>
            </div>
          )}

          {content.penalty && (
            <div className="rm-callout penalty">
              <AlertTriangle size={16} />
              <div>
                <strong>Penalidade de {content.penalty.points} pontos</strong>
                <p>{content.penalty.reason}</p>
                <p className="rm-recovery"><RotateCcw size={13} /> Recuperação: {content.penalty.recovery}</p>
              </div>
            </div>
          )}
          <p className="rm-demo-note">Dados de demonstração. O bloqueio real por pré-requisito ainda não está ativo.</p>
        </aside>
      </div>

      <section className="rm-changes" aria-labelledby="rm-changes-title">
        <div className="section-heading">
          <div><p className="eyebrow">JUSTIFICATIVA DAS ALTERAÇÕES</p><h2 id="rm-changes-title">Por que seu roadmap mudou.</h2></div>
        </div>
        <ul>
          {roadmapChanges.map((item) => (
            <li key={item.id}>
              <span className="rm-change-date">{item.date}</span>
              <div>
                <strong>{item.change}</strong>
                <p><Sparkles size={13} /> {item.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
