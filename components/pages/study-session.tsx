'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarClock, Check, CircleCheck, CircleX, Clock3, FileText, Library, PenLine,
  PlayCircle, Search, Target, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAtlasShell } from '@/components/atlas/atlas-shell';
import {
  reviewIntervals, sessionContentId, sessionFixation, sessionMedia, sessionPlan, sessionPractice, sessionReading,
  studyLesson, type SessionStepId,
} from '@/lib/demo/study';

type Stage = 'sessao' | 'encerramento' | 'fixacao' | 'concluida';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type LibraryNote = { id: string; title: string; body: string; updatedAt: string };

const LETTERS = ['A', 'B', 'C', 'D'];

const formatElapsed = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

function newId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `atlas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function excerpt(body: string, query: string) {
  const text = body.replace(/\s+/g, ' ').trim();
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  const start = Math.max(0, at - 40);
  const slice = text.slice(start, start + 140);
  return `${start > 0 ? '…' : ''}${slice}${start + 140 < text.length ? '…' : ''}`;
}

// Biblioteca da sessão (DEC-01): painel recolhível por cima das notas, que pesquisa as notas do próprio usuário.
function SessionLibrary({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibraryNote[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [openId, setOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setStatus('loading');
      fetch(`/api/notes?q=${encodeURIComponent(query.trim())}`)
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const data = (await response.json()) as { notes: LibraryNote[] };
          if (cancelled) return;
          setResults(data.notes.slice(0, 20));
          setStatus('ready');
        })
        .catch(() => {
          if (!cancelled) setStatus('error');
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <aside className="ss-library" id="ss-library" aria-labelledby="ss-library-title">
      <div className="ss-library-head">
        <div><p className="eyebrow">BIBLIOTECA</p><h2 id="ss-library-title">Suas notas e anexos</h2></div>
        <button className="ss-icon-button" onClick={onClose} aria-label="Fechar biblioteca"><X size={18} /></button>
      </div>
      <label className="ss-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Pesquisar na biblioteca</span>
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar notas antigas..." />
      </label>
      <section aria-label="Notas" className="ss-library-section">
        <h3>Notas</h3>
        <p className="sr-only" aria-live="polite">
          {status === 'loading' ? 'Pesquisando…' : status === 'error' ? 'Erro ao pesquisar.' : `${results.length} notas encontradas.`}
        </p>
        {status === 'error' && <p className="ss-muted">Não foi possível carregar suas notas agora.</p>}
        {status !== 'error' && results.length === 0 && status === 'ready' && (
          <p className="ss-muted">{query ? 'Nenhuma nota encontrada.' : 'Você ainda não tem notas.'}</p>
        )}
        <ul className="ss-library-list">
          {results.map((note) => (
            <li key={note.id}>
              <button aria-expanded={openId === note.id} onClick={() => setOpenId(openId === note.id ? null : note.id)}>
                <FileText size={15} aria-hidden="true" />
                <span><strong>{note.title}</strong><small>{excerpt(note.body, query)}</small></span>
              </button>
              {openId === note.id && <div className="ss-library-preview">{note.body}</div>}
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Anexos" className="ss-library-section">
        <h3>Anexos</h3>
        <p className="ss-muted">Seus PDFs e imagens ficam nos anexos de cada nota. Abra a nota em Notas para consultá-los.</p>
      </section>
    </aside>
  );
}

// Sessão ativa (UX-01): só material + notas na tela (DEC-01); a navegação do site volta ao concluir.
export function StudySession({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('sessao');
  const [activeStep, setActiveStep] = useState<SessionStepId>('midia');
  const [completed, setCompleted] = useState<SessionStepId[]>(['leitura']);
  const [mediaTab, setMediaTab] = useState<'video' | 'pdf'>('video');
  const [elapsed, setElapsed] = useState(0);
  const [practice, setPractice] = useState<Record<string, number>>({});
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState(`Sessão · ${studyLesson.title}`);
  const [noteBody, setNoteBody] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [fixation, setFixation] = useState<Record<string, number>>({});
  const [fixationChecked, setFixationChecked] = useState(false);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const libraryButtonRef = useRef<HTMLButtonElement>(null);
  const { setFocusMode } = useAtlasShell();
  const focus = stage !== 'concluida';

  // Durante a sessão o cabeçalho do site fica em modo de foco (sem menu, perfil e assistente: DEC-01, DEC-12).
  useEffect(() => {
    setFocusMode(focus);
    return () => setFocusMode(false);
  }, [focus, setFocusMode]);

  useEffect(() => {
    if (stage !== 'sessao') return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // Leva o foco ao título de cada etapa, para teclado e leitor de tela acompanharem a mudança.
  useEffect(() => {
    headingRef.current?.focus();
  }, [stage]);

  const stepIndex = sessionPlan.findIndex((step) => step.id === activeStep);
  const notesDirty = `${noteTitle}\n${noteBody}` !== savedSnapshot && noteBody.trim() !== '';
  const practiceScore = sessionPractice.items.filter((item) => practice[item.id] === item.answer).length;
  const fixationScore = sessionFixation.filter((item) => fixation[item.id] === item.answer).length;

  function completeStep(id: SessionStepId) {
    setCompleted((current) => (current.includes(id) ? current : [...current, id]));
    const next = sessionPlan[sessionPlan.findIndex((step) => step.id === id) + 1];
    if (next) setActiveStep(next.id);
  }

  async function saveNote() {
    if (!noteBody.trim() || !noteTitle.trim()) {
      setSaveState('error');
      setSaveError(!noteTitle.trim() ? 'Dê um título à nota.' : 'Escreva algo antes de salvar.');
      return;
    }
    const id = noteId ?? newId();
    setSaveState('saving');
    setSaveError('');
    try {
      const response = await fetch('/api/notes', {
        method: noteId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          operationId: newId(),
          title: noteTitle,
          body: noteBody,
          contentIds: [sessionContentId],
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Não foi possível salvar a nota.');
      }
      setNoteId(id);
      setSavedSnapshot(`${noteTitle}\n${noteBody}`);
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a nota.');
    }
  }

  function finishSession() {
    setFinishedAt(new Date());
    setStage('concluida');
  }

  const closeLibrary = useCallback(() => {
    setLibraryOpen(false);
    libraryButtonRef.current?.focus();
  }, []);

  if (stage === 'encerramento') {
    return (
      <section className="study-view ss-close" aria-labelledby="ss-stage-title">
        <p className="eyebrow">ENCERRAMENTO DA SESSÃO</p>
        <h1 id="ss-stage-title" ref={headingRef} tabIndex={-1}>Encerrar {studyLesson.title.toLowerCase()}?</h1>
        <p className="ss-lead">Ao encerrar, o Atlas gera a fixação deste conteúdo. Você pode voltar e continuar se ainda não terminou.</p>
        <ul className="ss-summary">
          <li><Clock3 size={17} aria-hidden="true" /><span><strong>{formatElapsed(elapsed)}</strong><small>tempo de sessão</small></span></li>
          <li><Check size={17} aria-hidden="true" /><span><strong>{completed.length} de {sessionPlan.length}</strong><small>etapas concluídas</small></span></li>
          <li><PenLine size={17} aria-hidden="true" /><span><strong>{noteId ? 'Salva em Notas' : 'Sem nota salva'}</strong><small>nota da sessão</small></span></li>
        </ul>
        {completed.length < sessionPlan.length && (
          <p className="ss-warning" role="note">
            Faltam: {sessionPlan.filter((step) => !completed.includes(step.id)).map((step) => step.title).join(', ')}.
          </p>
        )}
        {notesDirty && (
          <div className="ss-warning" role="note">
            <span>Você tem anotações que ainda não foram salvas.</span>
            <Button variant="outline" className="ss-outline" onClick={saveNote} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? 'Salvando…' : 'Salvar nota agora'}
            </Button>
          </div>
        )}
        {saveState === 'error' && <p className="ss-error" role="alert">{saveError}</p>}
        <div className="ss-actions">
          <Button variant="outline" className="ss-outline" onClick={() => setStage('sessao')}><ArrowLeft size={16} /> Voltar à sessão</Button>
          <Button className="primary-button" onClick={() => setStage('fixacao')}>Encerrar e gerar fixação <ArrowRight size={16} /></Button>
        </div>
      </section>
    );
  }

  if (stage === 'fixacao') {
    return (
      <section className="study-view ss-close" aria-labelledby="ss-stage-title">
        <p className="eyebrow">FIXAÇÃO GERADA · {sessionFixation.length} QUESTÕES</p>
        <h1 id="ss-stage-title" ref={headingRef} tabIndex={-1}>Fixe o que acabou de estudar</h1>
        <p className="ss-lead">Questões curtas sobre {studyLesson.title.toLowerCase()}, respondidas logo após a sessão.</p>
        <div className="ss-questions">
          {sessionFixation.map((item, number) => {
            const chosen = fixation[item.id];
            const right = chosen === item.answer;
            return (
              <fieldset key={item.id} className="ss-question">
                <legend><span className="ss-q-num">{number + 1}</span>{item.prompt}</legend>
                <div className="qz-options">
                  {item.options.map((option, index) => (
                    <label key={option} className={chosen === index ? 'on' : ''}>
                      <input
                        type="radio"
                        name={item.id}
                        checked={chosen === index}
                        disabled={fixationChecked}
                        onChange={() => setFixation((current) => ({ ...current, [item.id]: index }))}
                      />
                      <span className="qz-letter">{LETTERS[index]}</span>{option}
                    </label>
                  ))}
                </div>
                {fixationChecked && (
                  <p className={right ? 'ss-feedback ok' : 'ss-feedback no'}>
                    {right ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                    <span><strong>{right ? 'Correta.' : `Resposta certa: ${LETTERS[item.answer]}.`}</strong> {item.explanation}</span>
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {fixationChecked ? `Você acertou ${fixationScore} de ${sessionFixation.length}.` : ''}
        </p>
        <div className="ss-actions">
          {fixationChecked ? (
            <>
              <strong className="ss-score">{fixationScore} de {sessionFixation.length} corretas</strong>
              <Button className="primary-button" onClick={finishSession}>Concluir sessão <ArrowRight size={16} /></Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="ss-outline" onClick={finishSession}>Responder depois</Button>
              <Button
                className="primary-button"
                disabled={Object.keys(fixation).length < sessionFixation.length}
                onClick={() => setFixationChecked(true)}
              >
                Corrigir respostas <Check size={16} />
              </Button>
            </>
          )}
        </div>
      </section>
    );
  }

  if (stage === 'concluida') {
    const base = finishedAt ?? new Date();
    return (
      <section className="study-view ss-close" aria-labelledby="ss-stage-title">
        <div className="modal-symbol"><CircleCheck size={24} /></div>
        <p className="eyebrow">SESSÃO CONCLUÍDA</p>
        <h1 id="ss-stage-title" ref={headingRef} tabIndex={-1}>Bom trabalho. {studyLesson.title} foi registrado.</h1>
        <ul className="ss-summary">
          <li><Clock3 size={17} aria-hidden="true" /><span><strong>{formatElapsed(elapsed)}</strong><small>tempo de sessão</small></span></li>
          <li><Target size={17} aria-hidden="true" /><span><strong>{fixationChecked ? `${fixationScore}/${sessionFixation.length}` : 'Pendente'}</strong><small>fixação</small></span></li>
          <li><PenLine size={17} aria-hidden="true" /><span><strong>{noteId ? 'Salva em Notas' : 'Sem nota'}</strong><small>nota da sessão</small></span></li>
        </ul>
        <div className="ss-reviews">
          <h2><CalendarClock size={17} aria-hidden="true" /> Revisões programadas</h2>
          <ul>
            {reviewIntervals.map((interval) => (
              <li key={interval.label}>
                <strong>{interval.label}</strong>
                <span>{formatDate(new Date(base.getTime() + interval.days * 86_400_000))}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="ss-actions">
          {noteId && <Link className="ss-link" href="/notas">Abrir minhas notas</Link>}
          <Button variant="outline" className="ss-outline" onClick={onBack}>Voltar ao Estudar</Button>
          <Link className="ss-link" href="/">Ir para Hoje</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ss-session" aria-labelledby="ss-stage-title">
      <div className="ss-toolbar">
        <div>
          <p className="eyebrow">{studyLesson.eyebrow}</p>
          <h1 id="ss-stage-title" ref={headingRef} tabIndex={-1}>{studyLesson.title}</h1>
        </div>
        <div className="ss-toolbar-actions">
          <span className="ss-clock" role="timer" aria-label={`Tempo de sessão ${formatElapsed(elapsed)}`}>
            <Clock3 size={15} aria-hidden="true" /> {formatElapsed(elapsed)}
          </span>
          <Button
            ref={libraryButtonRef}
            variant="outline"
            className="ss-outline"
            aria-expanded={libraryOpen}
            aria-controls="ss-library"
            onClick={() => (libraryOpen ? closeLibrary() : setLibraryOpen(true))}
          >
            <Library size={16} /> Biblioteca
          </Button>
          <Button className="primary-button" onClick={() => setStage('encerramento')}>Encerrar sessão</Button>
        </div>
      </div>

      <div className="ss-layout">
        <article className="ss-material">
          <nav className="ss-steps" aria-label="Etapas da sessão">
            <ol>
              {sessionPlan.map((step, index) => {
                const done = completed.includes(step.id);
                const current = step.id === activeStep;
                return (
                  <li key={step.id}>
                    <button
                      className={current ? 'current' : done ? 'done' : ''}
                      aria-current={current ? 'step' : undefined}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <span aria-hidden="true">{done ? <Check size={14} /> : index + 1}</span>
                      <span><strong>{step.title}</strong><small>{done ? 'Concluída' : step.hint}</small></span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {activeStep === 'leitura' && (
            <div className="ss-step">
              <h2><BookOpen size={18} aria-hidden="true" /> {sessionReading.title}</h2>
              {sessionReading.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p className="ss-key">{sessionReading.keyIdea}</p>
            </div>
          )}

          {activeStep === 'midia' && (
            <div className="ss-step">
              <div className="ss-tabs" role="tablist" aria-label="Formato do material">
                <button role="tab" id="ss-tab-video" aria-selected={mediaTab === 'video'} aria-controls="ss-panel-media" onClick={() => setMediaTab('video')}>
                  <PlayCircle size={16} aria-hidden="true" /> Vídeo
                </button>
                <button role="tab" id="ss-tab-pdf" aria-selected={mediaTab === 'pdf'} aria-controls="ss-panel-media" onClick={() => setMediaTab('pdf')}>
                  <FileText size={16} aria-hidden="true" /> PDF
                </button>
              </div>
              <div id="ss-panel-media" role="tabpanel" aria-labelledby={mediaTab === 'video' ? 'ss-tab-video' : 'ss-tab-pdf'}>
                {mediaTab === 'video' ? (
                  <>
                    <div className="ss-media-frame video">
                      <PlayCircle size={46} aria-hidden="true" />
                      <strong>{sessionMedia.video.title}</strong>
                      <small>{sessionMedia.video.minutes} min · legendas em português</small>
                    </div>
                    <details className="ss-transcript">
                      <summary>Transcrição da aula</summary>
                      {sessionMedia.video.transcript.map((line) => <p key={line}>{line}</p>)}
                    </details>
                  </>
                ) : (
                  <div className="ss-media-frame pdf">
                    <FileText size={42} aria-hidden="true" />
                    <strong>{sessionMedia.pdf.title}</strong>
                    <small>{sessionMedia.pdf.pages} páginas · {sessionMedia.pdf.summary}</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 'pratica' && (
            <div className="ss-step">
              <h2><Target size={18} aria-hidden="true" /> {sessionPractice.prompt}</h2>
              <div className="ss-questions">
                {sessionPractice.items.map((item) => {
                  const chosen = practice[item.id];
                  const right = chosen === item.answer;
                  return (
                    <fieldset key={item.id} className="ss-question compact">
                      <legend>{item.text}</legend>
                      <div className="ss-choice">
                        {item.options.map((option, index) => (
                          <label key={option} className={chosen === index ? 'on' : ''}>
                            <input
                              type="radio"
                              name={item.id}
                              checked={chosen === index}
                              onChange={() => {
                                setPractice((current) => ({ ...current, [item.id]: index }));
                                setPracticeChecked(false);
                              }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {practiceChecked && (
                        <p className={right ? 'ss-feedback ok' : 'ss-feedback no'}>
                          {right ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                          <span>{item.explanation}</span>
                        </p>
                      )}
                    </fieldset>
                  );
                })}
              </div>
              <p className="sr-only" aria-live="polite">
                {practiceChecked ? `${practiceScore} de ${sessionPractice.items.length} corretos.` : ''}
              </p>
              {practiceChecked && <p className="ss-score">{practiceScore} de {sessionPractice.items.length} corretos</p>}
            </div>
          )}

          <div className="ss-step-nav">
            <Button
              variant="outline"
              className="ss-outline"
              disabled={stepIndex === 0}
              onClick={() => setActiveStep(sessionPlan[stepIndex - 1].id)}
            >
              <ArrowLeft size={16} /> Anterior
            </Button>
            {activeStep === 'pratica' && !practiceChecked ? (
              <Button
                className="primary-button"
                disabled={Object.keys(practice).length < sessionPractice.items.length}
                onClick={() => {
                  setPracticeChecked(true);
                  setCompleted((current) => (current.includes('pratica') ? current : [...current, 'pratica']));
                }}
              >
                Conferir respostas <Check size={16} />
              </Button>
            ) : activeStep === 'pratica' ? (
              <Button className="primary-button" onClick={() => setStage('encerramento')}>Ir para o encerramento <ArrowRight size={16} /></Button>
            ) : (
              <Button className="primary-button" onClick={() => completeStep(activeStep)}>
                Concluir etapa <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </article>

        <div className="ss-side">
          <section className="ss-notes" aria-labelledby="ss-notes-title">
            <p className="eyebrow" id="ss-notes-title">NOTAS DA SESSÃO</p>
            <label className="sr-only" htmlFor="ss-note-title">Título da nota</label>
            <input id="ss-note-title" className="ss-note-title" value={noteTitle} maxLength={180} onChange={(event) => setNoteTitle(event.target.value)} />
            <label className="sr-only" htmlFor="ss-note-body">Anotações</label>
            <textarea
              id="ss-note-body"
              className="ss-note-body"
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Anote os conceitos com suas palavras enquanto estuda..."
            />
            <div className="ss-note-footer">
              <span aria-live="polite" className={saveState === 'error' ? 'ss-error' : 'ss-muted'}>
                {saveState === 'saving'
                  ? 'Salvando…'
                  : saveState === 'error'
                    ? saveError
                    : noteId && !notesDirty
                      ? 'Salva em Notas, vinculada a este conteúdo.'
                      : noteId
                        ? 'Alterações não salvas.'
                        : 'A nota fica em Notas, vinculada a este conteúdo.'}
              </span>
              <Button className="primary-button" onClick={saveNote} disabled={saveState === 'saving' || !notesDirty}>
                Salvar nota
              </Button>
            </div>
          </section>
          {libraryOpen && <SessionLibrary onClose={closeLibrary} />}
        </div>
      </div>
    </section>
  );
}
