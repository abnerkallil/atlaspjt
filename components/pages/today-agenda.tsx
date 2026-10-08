'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BrainCircuit, CalendarClock, Check, ChevronRight, Clock3, LifeBuoy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAtlasShell } from '@/components/atlas/atlas-shell';
import {
  adjustAgendaItem,
  completeAgendaItem,
  daySummary,
  rescheduleAgendaItem,
} from '@/components/atlas/use-agenda';
import { MAX_DURATION, MIN_DURATION, type AgendaItem, type AgendaKind, type AgendaPriority } from '@/lib/agenda';

const KIND_META: Record<AgendaKind, { label: string; tone: string; icon: typeof BookOpen }> = {
  estudo: { label: 'Estudo', tone: 'blue', icon: BookOpen },
  quiz: { label: 'Quiz', tone: 'amber', icon: Target },
  revisao: { label: 'Revisão', tone: 'violet', icon: BrainCircuit },
  recuperacao: { label: 'Recuperação urgente', tone: 'red', icon: LifeBuoy },
};

const PRIORITY_LABEL: Record<AgendaPriority, string> = { urgente: 'Urgente', alta: 'Alta', normal: 'Normal' };

function itemHref(item: AgendaItem) {
  if (item.kind === 'quiz' || item.kind === 'revisao') return `/quizzes?conteudo=${encodeURIComponent(item.contentId)}`;
  return '/estudar';
}

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

function hoursLabel(minutes: number) {
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
}

function AdjustDialog({ item, today, onClose, onSaved }: { item: AgendaItem; today: string; onClose: () => void; onSaved: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState(item.dueDate);
  const [time, setTime] = useState(item.startTime ?? '');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(String(item.durationMinutes));
  const [priority, setPriority] = useState<AgendaPriority>(item.priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const minutes = Number(duration);
      if (minutes !== item.durationMinutes || priority !== item.priority) {
        await adjustAgendaItem(item.id, { durationMinutes: minutes, priority });
      }
      if (date !== item.dueDate || time !== (item.startTime ?? '')) {
        await rescheduleAgendaItem(item.id, { date, time, reason });
      }
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  }

  return (
    <dialog ref={ref} className="qz-report agenda-dialog" aria-labelledby="agenda-dialog-title" onClose={onClose}>
      <p className="eyebrow">{KIND_META[item.kind].label.toUpperCase()}</p>
      <h2 id="agenda-dialog-title">{item.contentTitle}</h2>
      <p className="qz-report-target">{item.reason}</p>
      <div className="agenda-dialog-grid">
        <label>
          Dia
          <input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Horário (opcional)
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label>
          Duração (min)
          <input type="number" min={MIN_DURATION} max={MAX_DURATION} value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
        <label>
          Prioridade
          <select value={priority} onChange={(event) => setPriority(event.target.value as AgendaPriority)}>
            {(Object.keys(PRIORITY_LABEL) as AgendaPriority[]).map((value) => (
              <option key={value} value={value}>{PRIORITY_LABEL[value]}</option>
            ))}
          </select>
        </label>
      </div>
      <label htmlFor="agenda-reason">Motivo do reagendamento (opcional)</label>
      <textarea id="agenda-reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
      <small className="agenda-hint">Sem horário, o item entra em sequência a partir das 7h, na ordem de prioridade.</small>
      {error && <p className="rm-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <Button variant="outline" className="qz-outline" onClick={onClose}>Cancelar</Button>
        <Button className="primary-button" disabled={saving} onClick={() => void save()}>
          <CalendarClock size={15} /> Salvar
        </Button>
      </div>
    </dialog>
  );
}

function AgendaRow({ item, index, onComplete, onAdjust }: { item: AgendaItem; index: number; onComplete: () => void; onAdjust: () => void }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const done = item.status === 'concluido';
  const cancelled = item.status === 'cancelado';
  return (
    <article className={`task-row ${done || cancelled ? 'done' : ''}`}>
      <button
        className="task-check"
        onClick={onComplete}
        disabled={item.status !== 'pendente'}
        aria-label={item.status === 'pendente' ? `Concluir ${item.contentTitle}` : `${item.contentTitle} ${done ? 'concluída' : 'cancelada'}`}
      >
        {done ? <Check size={17} /> : <span>{index + 1}</span>}
      </button>
      <div className={`task-icon ${meta.tone}`}><Icon size={19} /></div>
      <div className="task-copy">
        <div>
          <span className={`task-label ${meta.tone}`}>{meta.label}</span>
          <span className="task-time"><Clock3 size={13} />{item.startsAt} · {item.durationMinutes} min</span>
          {item.priority !== 'normal' && item.status === 'pendente' && <span className="task-time">Prioridade {PRIORITY_LABEL[item.priority].toLowerCase()}</span>}
        </div>
        <h3>{item.contentTitle}</h3>
        <p>
          {done
            ? item.completion === 'manual'
              ? 'Concluída por você.'
              : 'Concluída: a evidência foi registrada.'
            : cancelled
              ? item.changeReason
              : item.reason}
        </p>
        {item.status === 'pendente' && item.changeReason && <p className="agenda-change">{item.changeReason}</p>}
        {item.status === 'pendente' && (
          <button className="agenda-adjust" onClick={onAdjust}><CalendarClock size={13} /> Reagendar ou ajustar</button>
        )}
      </div>
      <Link className="task-arrow" href={itemHref(item)} aria-label={`Abrir ${item.contentTitle}`}><ChevronRight size={19} /></Link>
    </article>
  );
}

// Jornada de hoje e próximos dias a partir da agenda real (MVP-05, DEC-09).
export function TodayAgenda() {
  const { agenda, reloadAgenda } = useAtlasShell();
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [error, setError] = useState('');

  async function complete(item: AgendaItem) {
    setError('');
    try {
      await completeAgendaItem(item.id);
      reloadAgenda();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.');
    }
  }

  const ready = agenda.status === 'ready' ? agenda : null;
  const todayItems = ready ? ready.items.filter((item) => item.dueDate === ready.today && item.status !== 'cancelado') : [];
  const upcoming = ready ? ready.items.filter((item) => item.dueDate > ready.today && item.status === 'pendente') : [];
  const summary = ready ? daySummary(ready.items, ready.today) : null;
  const plannedMinutes = todayItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  const ordered = [...todayItems].sort(
    (a, b) => Number(a.status !== 'pendente') - Number(b.status !== 'pendente') || a.startsAt.localeCompare(b.startsAt),
  );

  return (
    <section className="journey-section" aria-labelledby="today-journey-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SUA JORNADA DE HOJE</p>
          <h2 id="today-journey-title">
            {!ready
              ? agenda.status === 'error' ? 'Agenda indisponível.' : 'Carregando agenda…'
              : summary && summary.pending > 0
                ? `${summary.pending} ${summary.pending === 1 ? 'passo' : 'passos'} para hoje.`
                : 'Nada pendente para hoje.'}
          </h2>
        </div>
        <div className="journey-total"><Clock3 size={16} /> {hoursLabel(plannedMinutes)} planejadas</div>
      </div>

      {agenda.status === 'error' && <p className="rm-error" role="alert">{agenda.message}</p>}
      {error && <p className="rm-error" role="alert">{error}</p>}
      {ready && todayItems.length === 0 && (
        <p className="rm-muted">O Atlas monta a agenda a partir do roadmap e das evidências. Itens que você reagendou aparecem em Próximos dias.</p>
      )}
      <div className="task-list">
        {ordered.map((item, index) => (
          <AgendaRow key={item.id} item={item} index={index} onComplete={() => void complete(item)} onAdjust={() => setEditing(item)} />
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="agenda-upcoming">
          <h3>Próximos dias</h3>
          <ul>
            {upcoming.map((item) => (
              <li key={item.id}>
                <span>{dayLabel(item.dueDate)} · {item.startsAt}</span>
                <strong>{KIND_META[item.kind].label}: {item.contentTitle}</strong>
                {item.changeReason && <small>{item.changeReason}</small>}
                <button className="agenda-adjust" onClick={() => setEditing(item)}><CalendarClock size={13} /> Ajustar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && ready && (
        <AdjustDialog
          key={editing.id}
          item={editing}
          today={ready.today}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reloadAgenda();
          }}
        />
      )}
    </section>
  );
}
