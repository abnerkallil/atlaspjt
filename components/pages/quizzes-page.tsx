'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, Clock3, Flag, ListChecks, Play, RotateCcw, Send, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoQuiz, REPORT_REASONS, type QuizQuestion } from '@/lib/demo/quizzes';

type Phase = 'preparo' | 'execucao' | 'revisao' | 'resultado';
type Grade = 'acertei' | 'parcial' | 'errei';

const KIND_LABEL = { multipla: 'Múltipla escolha', discursiva: 'Discursiva', caso: 'Caso prático' } as const;

const formatTime = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

function ReportDialog(props: {
  prompt: string;
  reason: string;
  text: string;
  onReason: (value: string) => void;
  onText: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog ref={ref} className="qz-report" aria-labelledby="qz-report-title" onClose={props.onClose}>
      <p className="eyebrow">REPORTE DE QUESTÃO</p>
      <h2 id="qz-report-title">Algo errado nesta questão?</h2>
      <p className="qz-report-target">{props.prompt}</p>
      <label htmlFor="qz-reason">Motivo</label>
      <select id="qz-reason" value={props.reason} onChange={(event) => props.onReason(event.target.value)}>
        {REPORT_REASONS.map((reason) => (<option key={reason}>{reason}</option>))}
      </select>
      <label htmlFor="qz-report-text">Detalhes (opcional)</label>
      <textarea id="qz-report-text" rows={3} value={props.text} onChange={(event) => props.onText(event.target.value)} />
      <div className="modal-actions">
        <Button variant="outline" className="qz-outline" onClick={props.onClose}>Cancelar</Button>
        <Button className="primary-button" onClick={props.onSubmit}><Send size={15} /> Enviar reporte</Button>
      </div>
    </dialog>
  );
}

export function QuizzesPage() {
  const [phase, setPhase] = useState<Phase>('preparo');
  const [questions, setQuestions] = useState<QuizQuestion[]>(demoQuiz.questions);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [remaining, setRemaining] = useState(demoQuiz.durationSeconds);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reported, setReported] = useState<string[]>([]);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportText, setReportText] = useState('');
  const [autoSent, setAutoSent] = useState(false);

  const remainingRef = useRef(remaining);
  useEffect(() => {
    if (phase !== 'execucao' && phase !== 'revisao') return;
    const timer = setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - 1);
      setRemaining(remainingRef.current);
      if (remainingRef.current === 0) {
        setAutoSent(true);
        setPhase('resultado');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const question = questions[index];
  const answered = (q: QuizQuestion) => {
    const value = answers[q.id];
    return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0);
  };
  const unanswered = questions.filter((q) => !answered(q));

  const score = useMemo(() => {
    const points = questions.reduce((sum, q) => {
      if (q.kind === 'multipla') return sum + (answers[q.id] === q.correct ? 1 : 0);
      const grade = grades[q.id];
      return sum + (grade === 'acertei' ? 1 : grade === 'parcial' ? 0.5 : 0);
    }, 0);
    return Math.round((points / questions.length) * 100);
  }, [questions, answers, grades]);

  const isCorrect = (q: QuizQuestion) =>
    q.kind === 'multipla' ? answers[q.id] === q.correct : grades[q.id] === 'acertei';
  const missed = questions.filter((q) => !isCorrect(q));
  const gradingPending = questions.some((q) => q.kind !== 'multipla' && !grades[q.id]);

  const start = (list: QuizQuestion[]) => {
    setQuestions(list);
    setAnswers({});
    setGrades({});
    setIndex(0);
    remainingRef.current = demoQuiz.durationSeconds;
    setRemaining(demoQuiz.durationSeconds);
    setAutoSent(false);
    setPhase('execucao');
  };

  const submitReport = () => {
    if (reporting) setReported((current) => [...current, reporting]);
    setReporting(null);
    setReportText('');
    setReportReason(REPORT_REASONS[0]);
  };

  const timer = (
    <div className={`qz-timer ${remaining <= 60 ? 'low' : ''}`} role="timer" aria-label="Tempo restante">
      <Clock3 size={15} /> {formatTime(remaining)}
    </div>
  );

  if (phase === 'preparo') {
    return (
      <section className="qz-view" aria-labelledby="qz-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">QUIZ · {demoQuiz.subject.toUpperCase()}</p>
            <h1 id="qz-title">{demoQuiz.title}</h1>
            <p>Um quiz curto para medir retenção e localizar pontos frágeis.</p>
          </div>
        </div>
        <div className="qz-prep">
          <article className="qz-card">
            <h2>Regras</h2>
            <ul className="qz-rules">
              {demoQuiz.rules.map((rule) => (<li key={rule}><Check size={15} />{rule}</li>))}
            </ul>
          </article>
          <aside className="qz-card qz-prep-side">
            <div className="qz-stat"><span>Questões</span><strong>{demoQuiz.questions.length}</strong></div>
            <div className="qz-stat"><span>Tempo</span><strong>{demoQuiz.durationSeconds / 60} min</strong></div>
            <div className="qz-stat"><span>Aprovação</span><strong>{demoQuiz.passingScore}%</strong></div>
            <Button className="primary-button" onClick={() => start(demoQuiz.questions)}>
              <Play size={17} fill="currentColor" /> Iniciar quiz
            </Button>
            <small>Dados de demonstração. A correção real ainda não está ativa.</small>
          </aside>
        </div>
      </section>
    );
  }

  if (phase === 'resultado') {
    const passed = score >= demoQuiz.passingScore;
    return (
      <section className="qz-view" aria-labelledby="qz-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">RESULTADO</p>
            <h1 id="qz-title">{gradingPending ? 'Falta autoavaliar.' : passed ? 'Bom trabalho.' : 'Vamos reforçar alguns pontos.'}</h1>
            <p>{autoSent ? 'O tempo acabou e o quiz foi enviado automaticamente. ' : ''}Compare suas respostas com o gabarito e autoavalie as questões abertas.</p>
          </div>
          <div className={`qz-score ${passed && !gradingPending ? 'ok' : 'low'}`}>
            <strong>{score}%</strong>
            <span>{gradingPending ? 'parcial' : passed ? 'aprovado' : 'abaixo de 70%'}</span>
          </div>
        </div>

        <ol className="qz-results">
          {questions.map((q, i) => {
            const open = q.kind !== 'multipla';
            const ok = isCorrect(q);
            return (
              <li key={q.id} className={`qz-card qz-result ${open && !grades[q.id] ? 'pending' : ok ? 'ok' : 'wrong'}`}>
                <div className="qz-result-head">
                  <span className="qz-q-num">{i + 1}</span>
                  <span className="qz-kind">{KIND_LABEL[q.kind]} · {q.topic}</span>
                  {!open && (ok ? <span className="qz-verdict ok"><CircleCheck size={14} /> Correta</span> : <span className="qz-verdict wrong"><CircleX size={14} /> Incorreta</span>)}
                </div>
                {q.kind === 'caso' && <p className="qz-context">{q.context}</p>}
                <h3>{q.prompt}</h3>
                {q.kind === 'multipla' ? (
                  <ul className="qz-options static">
                    {q.options.map((option, optionIndex) => (
                      <li key={option} className={optionIndex === q.correct ? 'correct' : answers[q.id] === optionIndex ? 'chosen-wrong' : ''}>
                        {optionIndex === q.correct ? <Check size={14} /> : answers[q.id] === optionIndex ? <X size={14} /> : <span className="qz-dot" />}
                        {option}
                        {answers[q.id] === optionIndex && <em>sua resposta</em>}
                      </li>
                    ))}
                    {answers[q.id] === undefined && <li className="qz-empty">Sem resposta</li>}
                  </ul>
                ) : (
                  <div className="qz-compare">
                    <div><small>Sua resposta</small><p>{String(answers[q.id] ?? '').trim() || 'Sem resposta'}</p></div>
                    <div><small>Gabarito</small><p>{q.modelAnswer}</p></div>
                    <fieldset className="qz-grade">
                      <legend>Como você avalia sua resposta?</legend>
                      {(['acertei', 'parcial', 'errei'] as Grade[]).map((g) => (
                        <label key={g} className={grades[q.id] === g ? 'on' : ''}>
                          <input type="radio" name={`grade-${q.id}`} checked={grades[q.id] === g} onChange={() => setGrades((cur) => ({ ...cur, [q.id]: g }))} />
                          {g === 'acertei' ? 'Acertei' : g === 'parcial' ? 'Acertei em parte' : 'Errei'}
                        </label>
                      ))}
                    </fieldset>
                  </div>
                )}
                <p className="qz-explain"><strong>Explicação:</strong> {q.explanation}</p>
                <button className="qz-report-btn" disabled={reported.includes(q.id)} onClick={() => setReporting(q.id)}>
                  <Flag size={13} /> {reported.includes(q.id) ? 'Questão reportada' : 'Reportar questão'}
                </button>
              </li>
            );
          })}
        </ol>

        <section className="qz-card qz-recovery" aria-labelledby="qz-recovery-title">
          <div className="qz-recovery-head"><RotateCcw size={18} /><div><p className="eyebrow">RECUPERAÇÃO</p><h2 id="qz-recovery-title">Próximo passo</h2></div></div>
          {gradingPending ? (
            <p>Autoavalie as questões abertas para liberar o plano de recuperação.</p>
          ) : missed.length === 0 ? (
            <p>Nenhuma questão para recuperar. Seus conteúdos deste quiz seguem consolidados.</p>
          ) : (
            <>
              <p>Conteúdos a reforçar: <strong>{[...new Set(missed.map((q) => q.topic))].join(', ')}</strong>.</p>
              <div className="qz-recovery-actions">
                <Button className="primary-button" onClick={() => start(missed)}>
                  <RotateCcw size={16} /> Refazer só as {missed.length} questões erradas
                </Button>
                <Button variant="outline" className="qz-outline" onClick={() => setPhase('preparo')}>Voltar ao início</Button>
              </div>
            </>
          )}
          {(gradingPending || missed.length === 0) && <div className="qz-recovery-actions"><Button variant="outline" className="qz-outline" onClick={() => start(demoQuiz.questions)}>Refazer quiz completo</Button></div>}
        </section>

        {reporting && (
          <ReportDialog
            prompt={questions.find((q) => q.id === reporting)?.prompt ?? ''}
            reason={reportReason}
            text={reportText}
            onReason={setReportReason}
            onText={setReportText}
            onClose={() => setReporting(null)}
            onSubmit={submitReport}
          />
        )}
      </section>
    );
  }

  if (phase === 'revisao') {
    return (
      <section className="qz-view" aria-labelledby="qz-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">REVISÃO ANTES DO ENVIO</p>
            <h1 id="qz-title">Confira suas respostas.</h1>
            <p>{unanswered.length > 0 ? `${unanswered.length} questão(ões) sem resposta.` : 'Todas as questões foram respondidas.'}</p>
          </div>
          {timer}
        </div>
        <ol className="qz-review">
          {questions.map((q, i) => (
            <li key={q.id} className="qz-card">
              <span className="qz-q-num">{i + 1}</span>
              <div>
                <strong>{q.topic}</strong>
                <small>{KIND_LABEL[q.kind]}</small>
              </div>
              <span className={`qz-verdict ${answered(q) ? 'ok' : 'wrong'}`}>{answered(q) ? 'Respondida' : 'Em branco'}</span>
              <Button variant="outline" className="qz-outline" size="sm" onClick={() => { setIndex(i); setPhase('execucao'); }}>Editar</Button>
            </li>
          ))}
        </ol>
        {unanswered.length > 0 && <div className="rm-callout penalty"><AlertTriangle size={16} /><p>Questões em branco contam como incorretas.</p></div>}
        <div className="qz-nav">
          <Button variant="outline" className="qz-outline" onClick={() => setPhase('execucao')}><ArrowLeft size={16} /> Voltar às questões</Button>
          <Button className="primary-button" onClick={() => setPhase('resultado')}><Send size={16} /> Enviar quiz</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <div className="qz-topbar">
        <div>
          <p className="eyebrow">{demoQuiz.title.toUpperCase()} · QUESTÃO {index + 1} DE {questions.length}</p>
          <h1 id="qz-title" className="qz-h1">{KIND_LABEL[question.kind]}</h1>
        </div>
        {timer}
      </div>

      <nav className="qz-steps" aria-label="Navegação entre questões">
        {questions.map((q, i) => (
          <button key={q.id} className={`${i === index ? 'current' : ''} ${answered(q) ? 'done' : ''}`} aria-current={i === index ? 'step' : undefined} aria-label={`Questão ${i + 1}${answered(q) ? ', respondida' : ''}`} onClick={() => setIndex(i)}>
            {i + 1}
          </button>
        ))}
      </nav>

      <article className="qz-card qz-question">
        {question.kind === 'caso' && (<div className="qz-case"><small>CASO PRÁTICO</small><p>{question.context}</p></div>)}
        <h2>{question.prompt}</h2>
        {question.kind === 'multipla' ? (
          <fieldset className="qz-options">
            <legend className="sr-only">Alternativas</legend>
            {question.options.map((option, optionIndex) => (
              <label key={option} className={answers[question.id] === optionIndex ? 'on' : ''}>
                <input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((cur) => ({ ...cur, [question.id]: optionIndex }))} />
                <span className="qz-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}
              </label>
            ))}
          </fieldset>
        ) : (
          <>
            <label className="sr-only" htmlFor="qz-answer">Sua resposta</label>
            <textarea id="qz-answer" className="qz-textarea" rows={question.kind === 'caso' ? 8 : 6} placeholder="Escreva sua resposta…" value={String(answers[question.id] ?? '')} onChange={(event) => setAnswers((cur) => ({ ...cur, [question.id]: event.target.value }))} />
          </>
        )}
      </article>

      <div className="qz-nav">
        <Button variant="outline" className="qz-outline" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={16} /> Anterior</Button>
        {index < questions.length - 1 ? (
          <Button className="primary-button" onClick={() => setIndex(index + 1)}>Próxima <ArrowRight size={16} /></Button>
        ) : (
          <Button className="primary-button" onClick={() => setPhase('revisao')}><ListChecks size={16} /> Revisar e enviar</Button>
        )}
      </div>
    </section>
  );
}
