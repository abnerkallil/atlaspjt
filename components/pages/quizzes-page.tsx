'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  ListChecks,
  Lock,
  Play,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/atlas/page-heading';
import { startStudySession } from '@/components/pages/use-study-overview';
import {
  clearAnswerDraft,
  fetchQuizAttempt,
  fetchQuizOverview,
  readAnswerDraft,
  sendQuizAttempt,
  startQuizAttempt,
  writeAnswerDraft,
  type QuizOverview,
} from '@/components/pages/use-quizzes';
import {
  PASSING_SCORE,
  QUIZ_SIZE,
  VERIFICATION_MINIMUM,
  VERIFICATION_SIZE,
  type Answer,
  type Answers,
  type PublicQuestion,
  type QuizAttempt,
  type QuizQueueItem,
} from '@/lib/quizzes';

const KIND_LABEL = {
  multipla: 'Múltipla escolha',
  dissertativa: 'Dissertativa',
  calculo: 'Cálculo',
} as const;

const RULES = [
  `Até ${QUIZ_SIZE} questões sorteadas do banco deste conteúdo, cada uma valendo o mesmo peso.`,
  'Tempo: 1 min por múltipla escolha e até 5 min por dissertativa; o tempo total é a soma. Ao zerar, as respostas são travadas automaticamente.',
  `Cálculo não tem limite de tempo, mas só vale se você acertar ao menos ${VERIFICATION_MINIMUM} das ${VERIFICATION_SIZE} perguntas de verificação; senão é anulada.`,
  'Dissertativas: depois de travar as respostas, você compara cada uma com o gabarito e diz se acertou. A correção é determinística, sem IA.',
  `Nota mínima: ${PASSING_SCORE}%. Abaixo disso o conteúdo fica bloqueado, e o próximo conteúdo também, até você passar: refaça o quiz quantas vezes precisar, revisando suas notas antes se quiser. A reprovação não baixa a nota.`,
  'Suas respostas ficam salvas neste navegador se a página recarregar; o tempo continua correndo.',
];

const formatTime = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

// Rótulo do quiz pela finalidade (MVP-06).
function purposeLabel(item: { purpose: QuizAttempt['purpose']; stage: QuizAttempt['stage'] }) {
  if (item.purpose === 'revisao') return `Revisão de ${item.stage ?? ''}`.trim();
  if (item.purpose === 'corretivo') return `Quiz corretivo${item.stage ? ` (${item.stage})` : ''}`;
  return 'Quiz do conteúdo';
}

const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

function isAnswered(question: PublicQuestion, answer: Answer | undefined) {
  if (!answer) return false;
  if (question.kind === 'multipla') return typeof answer.option === 'number';
  if (question.kind === 'dissertativa')
    return typeof answer.text === 'string' && answer.text.trim().length > 0;
  return typeof answer.value === 'number';
}

const hasEssay = (attempt: QuizAttempt) =>
  attempt.questions.some((question) => question.kind === 'dissertativa');

type Active = { attempt: QuizAttempt; offsetMs: number };

function toActive({
  attempt,
  now,
}: {
  attempt: QuizAttempt;
  now: string;
}): Active {
  return { attempt, offsetMs: Date.parse(now) - Date.now() };
}

export function QuizzesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAttempt = searchParams.get('tentativa');
  const requestedContent = searchParams.get('conteudo');
  const [overview, setOverview] = useState<QuizOverview | null>(null);
  const [version, setVersion] = useState(0);
  const [active, setActive] = useState<Active | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchQuizOverview()
      .then((next) => {
        if (alive) setOverview(next);
      })
      .catch((cause: unknown) => {
        if (alive)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os quizzes.',
          );
      });
    return () => {
      alive = false;
    };
  }, [version]);

  // /quizzes?tentativa=<id> abre a tentativa (em andamento, autoavaliação ou resultado).
  useEffect(() => {
    if (!requestedAttempt) return;
    let alive = true;
    fetchQuizAttempt(requestedAttempt)
      .then((loaded) => {
        if (alive) setActive(toActive(loaded));
      })
      .catch((cause: unknown) => {
        if (alive)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Tentativa não encontrada.',
          );
      });
    return () => {
      alive = false;
    };
  }, [requestedAttempt]);

  function backToList() {
    setActive(null);
    setError('');
    setVersion((value) => value + 1);
    router.replace('/quizzes');
  }

  async function begin(contentId: string) {
    setBusy(true);
    setError('');
    try {
      const started = await startQuizAttempt(contentId);
      setActive(toActive(started));
      router.replace(
        `/quizzes?tentativa=${encodeURIComponent(started.attempt.id)}`,
      );
      window.scrollTo(0, 0);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível começar o quiz.',
      );
    } finally {
      setBusy(false);
    }
  }

  // Reprovou: volta à preparação do mesmo quiz (as questões erradas voltam).
  function retry(contentId: string) {
    setActive(null);
    setError('');
    setVersion((value) => value + 1);
    router.replace(`/quizzes?conteudo=${encodeURIComponent(contentId)}`);
    window.scrollTo(0, 0);
  }

  async function studyAgain(contentId: string) {
    setBusy(true);
    try {
      const session = await startStudySession(contentId);
      router.push(`/estudar?sessao=${encodeURIComponent(session.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível abrir a sessão.',
      );
      setBusy(false);
    }
  }

  const shown =
    active && active.attempt.id === requestedAttempt ? active : null;
  if (shown) {
    const { attempt } = shown;
    const update = (next: QuizAttempt) =>
      setActive({ attempt: next, offsetMs: shown.offsetMs });
    if (attempt.status === 'em-andamento') {
      return (
        <QuizRunner
          key={attempt.id}
          attempt={attempt}
          offsetMs={shown.offsetMs}
          onChange={update}
        />
      );
    }
    if (attempt.status === 'autoavaliacao') {
      return (
        <QuizSelfAssessment
          key={attempt.id}
          attempt={attempt}
          onChange={update}
        />
      );
    }
    return (
      <QuizResult
        attempt={attempt}
        busy={busy}
        error={error}
        onBack={backToList}
        onStudyAgain={studyAgain}
        onRetry={retry}
      />
    );
  }

  if (requestedAttempt) {
    return (
      <section className="qz-view" aria-labelledby="qz-title">
        <PageHeading
          eyebrow="QUIZ"
          title={error ? 'Não encontramos este quiz.' : 'Carregando o quiz…'}
          titleId="qz-title"
        >
          {error}
        </PageHeading>
        {error && (
          <Button variant="outline" className="qz-outline" onClick={backToList}>
            <ArrowLeft size={16} /> Voltar aos quizzes
          </Button>
        )}
      </section>
    );
  }

  const prep = requestedContent
    ? overview?.queue.find((item) => item.contentId === requestedContent)
    : undefined;
  if (prep) {
    return (
      <QuizPrep
        item={prep}
        busy={busy}
        error={error}
        onStart={() => void begin(prep.contentId)}
        onBack={backToList}
      />
    );
  }

  return (
    <QuizList
      overview={overview}
      error={error}
      notReleased={requestedContent && overview ? requestedContent : null}
      onPick={(item) =>
        item.openAttemptId
          ? router.replace(
              `/quizzes?tentativa=${encodeURIComponent(item.openAttemptId)}`,
            )
          : router.replace(
              `/quizzes?conteudo=${encodeURIComponent(item.contentId)}`,
            )
      }
      onOpenAttempt={(id) =>
        router.replace(`/quizzes?tentativa=${encodeURIComponent(id)}`)
      }
    />
  );
}

function QuizList(props: {
  overview: QuizOverview | null;
  error: string;
  notReleased: string | null;
  onPick: (item: QuizQueueItem) => void;
  onOpenAttempt: (id: string) => void;
}) {
  const { overview } = props;
  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <PageHeading
        eyebrow="QUIZZES"
        title="Quizzes dos conteúdos"
        titleId="qz-title"
      >
        O quiz de um conteúdo é liberado quando você conclui uma sessão de
        estudo dele. Aprovado, o conteúdo fica concluído no roadmap.
      </PageHeading>
      {props.error && (
        <div className="rm-callout qz-alert">
          <AlertTriangle size={16} />
          <p>{props.error}</p>
        </div>
      )}
      {props.notReleased && (
        <div className="rm-callout qz-alert">
          <AlertTriangle size={16} />
          <p>
            O quiz de {props.notReleased} não está liberado agora. Conclua uma
            sessão de estudo dele primeiro.
          </p>
        </div>
      )}
      {!overview ? (
        !props.error && <p className="rm-muted">Carregando…</p>
      ) : (
        <>
          <section
            className="qz-card qz-block"
            aria-labelledby="qz-queue-title"
          >
            <h2 id="qz-queue-title">Liberados para fazer</h2>
            {overview.queue.length === 0 ? (
              <p className="rm-muted">
                Nenhum quiz liberado.{' '}
                <Link href="/estudar">Conclua uma sessão de estudo</Link> para
                liberar o quiz do conteúdo.
              </p>
            ) : (
              <ul className="qz-list">
                {overview.queue.map((item) => (
                  <li key={item.contentId}>
                    <div>
                      <small>
                        {purposeLabel(item)} · {item.disciplineTitle} ·{' '}
                        {item.contentId}
                      </small>
                      <strong>{item.contentTitle}</strong>
                      <span>
                        {item.questionCount === 0
                          ? 'Ainda sem questões cadastradas.'
                          : `${Math.min(item.questionCount, QUIZ_SIZE)} questões${item.attempts ? ` · ${item.attempts} tentativa(s) antes` : ''}`}
                      </span>
                    </div>
                    <Button
                      className="primary-button"
                      disabled={item.questionCount === 0}
                      onClick={() => props.onPick(item)}
                    >
                      {item.openAttemptId ? (
                        <>
                          Continuar <ArrowRight size={16} />
                        </>
                      ) : (
                        <>
                          <Play size={15} fill="currentColor" /> Começar
                        </>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            className="qz-card qz-block"
            aria-labelledby="qz-history-title"
          >
            <h2 id="qz-history-title">Tentativas</h2>
            {overview.attempts.length === 0 ? (
              <p className="rm-muted">Nenhuma tentativa ainda.</p>
            ) : (
              <ul className="qz-list">
                {overview.attempts.map((attempt) => (
                  <li key={attempt.id}>
                    <div>
                      <small>
                        {formatDate(attempt.startedAt)} · {purposeLabel(attempt)}{' '}
                        · {attempt.contentId}
                      </small>
                      <strong>{attempt.contentTitle}</strong>
                      <span>
                        {attempt.status === 'enviado'
                          ? `${attempt.score}% · ${attempt.passed ? 'aprovado' : 'reprovado'}${attempt.late ? ' · enviado após o tempo' : ''}`
                          : attempt.status === 'autoavaliacao'
                            ? 'Falta comparar as dissertativas com o gabarito'
                            : 'Em andamento'}
                      </span>
                    </div>
                    {attempt.status === 'enviado' ? (
                      <span
                        className={`qz-verdict ${attempt.passed ? 'ok' : 'wrong'}`}
                      >
                        {attempt.passed ? 'Aprovado' : 'Reprovado'}
                      </span>
                    ) : null}
                    <Button
                      variant="outline"
                      className="qz-outline"
                      onClick={() => props.onOpenAttempt(attempt.id)}
                    >
                      {attempt.status === 'enviado'
                        ? 'Ver resultado'
                        : 'Continuar'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function QuizPrep(props: {
  item: QuizQueueItem;
  busy: boolean;
  error: string;
  onStart: () => void;
  onBack: () => void;
}) {
  const { item } = props;
  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <PageHeading
        eyebrow={`${purposeLabel(item).toUpperCase()} · ${item.disciplineTitle.toUpperCase()}`}
        title={item.contentTitle}
        titleId="qz-title"
      >
        {item.purpose === 'revisao'
          ? `Revisão de ${item.stage} do conteúdo (DEC-09): aprovada, o conteúdo fica revalidado; reprovada, ele é reaberto até você passar no quiz corretivo (refaça quantas vezes precisar).`
          : item.purpose === 'corretivo'
            ? 'Quiz corretivo depois da revisão que falhou: aprovado, o conteúdo volta a revalidado e o ciclo de revisões continua.'
            : 'Confira as regras antes de começar: o tempo começa a contar ao iniciar.'}
      </PageHeading>
      {props.error && (
        <div className="rm-callout qz-alert">
          <AlertTriangle size={16} />
          <p>{props.error}</p>
        </div>
      )}
      <div className="qz-prep">
        <article className="qz-card">
          <h2>Regras</h2>
          <ul className="qz-rules">
            {RULES.map((rule) => (
              <li key={rule}>
                <Check size={15} />
                {rule}
              </li>
            ))}
          </ul>
        </article>
        <aside className="qz-card qz-prep-side">
          <div className="qz-stat">
            <span>Questões</span>
            <strong>{Math.min(item.questionCount, QUIZ_SIZE)}</strong>
          </div>
          <div className="qz-stat">
            <span>Aprovação</span>
            <strong>{PASSING_SCORE}%</strong>
          </div>
          <div className="qz-stat">
            <span>Tentativas antes</span>
            <strong>{item.attempts}</strong>
          </div>
          <Button
            className="primary-button"
            disabled={props.busy || item.questionCount === 0}
            onClick={props.onStart}
          >
            <Play size={17} fill="currentColor" />{' '}
            {props.busy ? 'Abrindo…' : `Iniciar ${item.purpose === 'revisao' ? 'revisão' : 'quiz'}`}
          </Button>
          <Button
            variant="outline"
            className="qz-outline"
            onClick={props.onBack}
          >
            <ArrowLeft size={16} /> Voltar
          </Button>
        </aside>
      </div>
    </section>
  );
}

function QuizRunner({
  attempt,
  offsetMs,
  onChange,
}: {
  attempt: QuizAttempt;
  offsetMs: number;
  onChange: (next: QuizAttempt) => void;
}) {
  const questions = attempt.questions;
  const [answers, setAnswers] = useState<Answers>(() =>
    typeof window === 'undefined' ? {} : readAnswerDraft(attempt.id),
  );
  const answersRef = useRef(answers);
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sendingRef = useRef(false);

  const deadline = attempt.deadlineAt ? Date.parse(attempt.deadlineAt) : null;
  const remaining =
    deadline === null
      ? null
      : Math.max(0, Math.ceil((deadline - (now + offsetMs)) / 1000));

  async function finish(auto: boolean) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      const current = answersRef.current;
      const { attempt: next } = hasEssay(attempt)
        ? await sendQuizAttempt(attempt.id, {
            action: 'travar',
            answers: current,
          })
        : await sendQuizAttempt(attempt.id, {
            action: 'enviar',
            answers: current,
          });
      clearAnswerDraft(attempt.id);
      window.scrollTo(0, 0);
      onChange(next);
    } catch (cause) {
      sendingRef.current = false;
      setSending(false);
      setError(
        `${auto ? 'O tempo acabou, mas o envio falhou. ' : ''}${cause instanceof Error ? cause.message : 'Não foi possível enviar.'}`,
      );
    }
  }

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current + offsetMs >= deadline) void finishRef.current(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, offsetMs]);

  function answer(id: string, value: Answer) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    writeAnswerDraft(attempt.id, next);
  }

  const question = questions[index];
  const current = answers[question.id] ?? {};
  const unanswered = questions.filter(
    (item) => !isAnswered(item, answers[item.id]),
  );
  const essay = hasEssay(attempt);

  const timer = (
    <div
      className={`qz-timer ${remaining !== null && remaining <= 60 ? 'low' : ''}`}
      role="timer"
      aria-label="Tempo restante"
    >
      <Clock3 size={15} />{' '}
      {remaining === null ? 'Sem limite' : formatTime(remaining)}
    </div>
  );

  if (reviewing) {
    return (
      <section className="qz-view" aria-labelledby="qz-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              REVISÃO ANTES DO ENVIO · {attempt.contentTitle.toUpperCase()}
            </p>
            <h1 id="qz-title">Confira suas respostas.</h1>
            <p>
              {unanswered.length > 0
                ? `${unanswered.length} questão(ões) sem resposta.`
                : 'Todas as questões foram respondidas.'}
            </p>
          </div>
          {timer}
        </div>
        <ol className="qz-review">
          {questions.map((item, i) => (
            <li key={item.id} className="qz-card">
              <span className="qz-q-num">{i + 1}</span>
              <div>
                <strong>{item.prompt}</strong>
                <small>{KIND_LABEL[item.kind]}</small>
              </div>
              <span
                className={`qz-verdict ${isAnswered(item, answers[item.id]) ? 'ok' : 'wrong'}`}
              >
                {isAnswered(item, answers[item.id])
                  ? 'Respondida'
                  : 'Em branco'}
              </span>
              <Button
                variant="outline"
                className="qz-outline"
                size="sm"
                onClick={() => {
                  setIndex(i);
                  setReviewing(false);
                }}
              >
                Editar
              </Button>
            </li>
          ))}
        </ol>
        {unanswered.length > 0 && (
          <div className="rm-callout qz-alert">
            <AlertTriangle size={16} />
            <p>Questões em branco contam como incorretas.</p>
          </div>
        )}
        {essay && (
          <div className="rm-callout qz-note">
            <Lock size={16} />
            <p>
              Ao continuar, as respostas ficam travadas e o gabarito das
              dissertativas aparece para você se autoavaliar.
            </p>
          </div>
        )}
        {error && (
          <div className="rm-callout qz-alert">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        )}
        <div className="qz-nav">
          <Button
            variant="outline"
            className="qz-outline"
            onClick={() => setReviewing(false)}
          >
            <ArrowLeft size={16} /> Voltar às questões
          </Button>
          <Button
            className="primary-button"
            disabled={sending}
            onClick={() => void finish(false)}
          >
            {essay ? (
              <>
                <Lock size={16} /> Travar e autoavaliar
              </>
            ) : (
              <>
                <Send size={16} /> Enviar quiz
              </>
            )}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <div className="qz-topbar">
        <div>
          <p className="eyebrow">
            {purposeLabel(attempt).toUpperCase()} ·{' '}
            {attempt.contentTitle.toUpperCase()} · QUESTÃO {index + 1} DE{' '}
            {questions.length}
          </p>
          <h1 id="qz-title" className="qz-h1">
            {KIND_LABEL[question.kind]}
          </h1>
        </div>
        {timer}
      </div>
      {attempt.directed > 0 && (
        <p className="qz-directed">
          Quiz dirigido:{' '}
          {attempt.directed === 1
            ? 'a questão que você errou na última tentativa voltou.'
            : `as ${attempt.directed} questões que você errou na última tentativa voltaram.`}
        </p>
      )}

      <nav className="qz-steps" aria-label="Navegação entre questões">
        {questions.map((item, i) => {
          const done = isAnswered(item, answers[item.id]);
          return (
            <button
              key={item.id}
              className={`${i === index ? 'current' : ''} ${done ? 'done' : ''}`}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Questão ${i + 1}${done ? ', respondida' : ''}`}
              onClick={() => setIndex(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <article className="qz-card qz-question">
        {question.context && (
          <div className="qz-case">
            <small>CONTEXTO</small>
            <p>{question.context}</p>
          </div>
        )}
        <h2>{question.prompt}</h2>
        {question.kind === 'multipla' && question.options ? (
          <fieldset className="qz-options">
            <legend className="sr-only">Alternativas</legend>
            {question.options.map((option, optionIndex) => (
              <label
                key={option}
                className={current.option === optionIndex ? 'on' : ''}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={current.option === optionIndex}
                  onChange={() => answer(question.id, { option: optionIndex })}
                />
                <span className="qz-letter">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </label>
            ))}
          </fieldset>
        ) : question.kind === 'dissertativa' ? (
          <>
            <label className="sr-only" htmlFor="qz-answer">
              Sua resposta
            </label>
            <textarea
              id="qz-answer"
              className="qz-textarea"
              rows={6}
              placeholder="Escreva sua resposta…"
              value={current.text ?? ''}
              onChange={(event) =>
                answer(question.id, { text: event.target.value })
              }
            />
          </>
        ) : (
          <CalculationAnswer
            question={question}
            value={current}
            onChange={(next) => answer(question.id, next)}
          />
        )}
      </article>

      {error && (
        <div className="rm-callout qz-alert">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}
      <div className="qz-nav">
        <Button
          variant="outline"
          className="qz-outline"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <ArrowLeft size={16} /> Anterior
        </Button>
        {index < questions.length - 1 ? (
          <Button
            className="primary-button"
            onClick={() => setIndex(index + 1)}
          >
            Próxima <ArrowRight size={16} />
          </Button>
        ) : (
          <Button className="primary-button" onClick={() => setReviewing(true)}>
            <ListChecks size={16} /> Revisar e enviar
          </Button>
        )}
      </div>
    </section>
  );
}

function CalculationAnswer({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: Answer;
  onChange: (next: Answer) => void;
}) {
  const [raw, setRaw] = useState(
    typeof value.value === 'number'
      ? String(value.value).replace('.', ',')
      : '',
  );
  return (
    <div className="qz-calc">
      <label htmlFor="qz-value">Resultado</label>
      <input
        id="qz-value"
        className="qz-textarea"
        inputMode="decimal"
        value={raw}
        onChange={(event) => {
          setRaw(event.target.value);
          const parsed = Number(
            event.target.value.replace(/\./g, '').replace(',', '.'),
          );
          const next: Answer = { ...value };
          if (event.target.value.trim() && Number.isFinite(parsed))
            next.value = parsed;
          else delete next.value;
          onChange(next);
        }}
      />
      {question.verification?.map((item, itemIndex) => (
        <fieldset key={item.prompt} className="qz-options">
          <legend>
            Verificação {itemIndex + 1}: {item.prompt}
          </legend>
          {item.options.map((option, optionIndex) => {
            const checked = value.verification?.[itemIndex] === optionIndex;
            return (
              <label key={option} className={checked ? 'on' : ''}>
                <input
                  type="radio"
                  name={`${question.id}-v${itemIndex}`}
                  checked={checked}
                  onChange={() => {
                    const verification = Array.from(
                      { length: question.verification!.length },
                      (_, i) => value.verification?.[i] ?? -1,
                    );
                    verification[itemIndex] = optionIndex;
                    onChange({ ...value, verification });
                  }}
                />
                <span className="qz-letter">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

function QuizSelfAssessment({
  attempt,
  onChange,
}: {
  attempt: QuizAttempt;
  onChange: (next: QuizAttempt) => void;
}) {
  const essays = attempt.questions.filter(
    (question) => question.kind === 'dissertativa',
  );
  const [verdicts, setVerdicts] = useState<Record<string, 'certa' | 'errada'>>(
    {},
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pending = essays.filter((question) => !verdicts[question.id]).length;

  async function submit() {
    setSending(true);
    setError('');
    try {
      const { attempt: next } = await sendQuizAttempt(attempt.id, {
        action: 'enviar',
        selfAssessments: verdicts,
      });
      window.scrollTo(0, 0);
      onChange(next);
    } catch (cause) {
      setSending(false);
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível enviar.',
      );
    }
  }

  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <PageHeading
        eyebrow={`AUTOAVALIAÇÃO · ${attempt.contentTitle.toUpperCase()}`}
        title="Compare com o gabarito."
        titleId="qz-title"
      >
        Suas respostas estão travadas e o tempo parou. Para cada dissertativa,
        diga se sua resposta cobre o gabarito.
      </PageHeading>
      <ol className="qz-results">
        {essays.map((question) => (
          <li
            key={question.id}
            className={`qz-card qz-result ${verdicts[question.id] === 'certa' ? 'ok' : verdicts[question.id] ? 'wrong' : 'pending'}`}
          >
            <h3>{question.prompt}</h3>
            <div className="qz-compare">
              <div>
                <small>Sua resposta</small>
                <p>
                  {attempt.answers?.[question.id]?.text?.trim() ||
                    'Sem resposta'}
                </p>
              </div>
              <div>
                <small>Gabarito</small>
                <p>{attempt.modelAnswers?.[question.id]}</p>
              </div>
              <fieldset className="qz-grade">
                <legend>Sua resposta cobre o gabarito?</legend>
                {(['certa', 'errada'] as const).map((verdict) => (
                  <label
                    key={verdict}
                    className={verdicts[question.id] === verdict ? 'on' : ''}
                  >
                    <input
                      type="radio"
                      name={`grade-${question.id}`}
                      checked={verdicts[question.id] === verdict}
                      onChange={() =>
                        setVerdicts((cur) => ({
                          ...cur,
                          [question.id]: verdict,
                        }))
                      }
                    />
                    {verdict === 'certa' ? 'Sim, acertei' : 'Não, errei'}
                  </label>
                ))}
              </fieldset>
            </div>
          </li>
        ))}
      </ol>
      {error && (
        <div className="rm-callout qz-alert">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}
      <div className="qz-nav">
        <span className="rm-muted">
          {pending > 0 ? `Falta avaliar ${pending}.` : 'Tudo avaliado.'}
        </span>
        <Button
          className="primary-button"
          disabled={sending || pending > 0}
          onClick={() => void submit()}
        >
          <Send size={16} /> Enviar quiz
        </Button>
      </div>
    </section>
  );
}

function QuizResult(props: {
  attempt: QuizAttempt;
  busy: boolean;
  error: string;
  onBack: () => void;
  onStudyAgain: (contentId: string) => void;
  onRetry: (contentId: string) => void;
}) {
  const { attempt } = props;
  const results = new Map(
    (attempt.results ?? []).map((item) => [item.questionId, item]),
  );
  const passed = attempt.passed === true;
  const wrong = (attempt.results ?? []).filter(
    (item) => !item.correct && !item.voided,
  ).length;
  const review = attempt.review;
  // Próximo passo pela finalidade; a revisão fecha com o resumo do ciclo (MVP-06).
  const nextStep =
    attempt.purpose === 'quiz'
      ? passed
        ? {
            title: 'Conteúdo concluído',
            text: `${attempt.contentTitle} foi marcado como concluído no roadmap. A revisão de 24h já está na agenda.`,
          }
        : {
            title: 'Conteúdo bloqueado',
            text: `${wrong} questão(ões) erradas. O conteúdo fica bloqueado, e o próximo também, até você passar com ${PASSING_SCORE}%. Refaça o quiz agora ou revise suas notas antes; as questões erradas voltam.`,
          }
      : review?.cycleDone
        ? {
            title: 'Ciclo de revisões concluído',
            text: `Revisões de 24h, 7d e 30d aprovadas: ${attempt.contentTitle} está consolidado e não tem mais revisões agendadas.`,
          }
        : passed
          ? {
              title: 'Conteúdo revalidado',
              text: review?.next
                ? `Próxima: revisão de ${review.next.stage} em ${dayMonth(review.next.dueAt)}, já na agenda.`
                : 'O conteúdo foi revalidado.',
            }
          : {
              title: 'Conteúdo reaberto',
              text: `${wrong} questão(ões) erradas. ${attempt.contentTitle} está em revisão ativa até você passar no quiz corretivo com ${PASSING_SCORE}%. Faça-o agora ou revise suas notas antes; as questões erradas voltam.`,
            };
  return (
    <section className="qz-view" aria-labelledby="qz-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            RESULTADO · {purposeLabel(attempt).toUpperCase()} ·{' '}
            {attempt.contentTitle.toUpperCase()}
          </p>
          <h1 id="qz-title">
            {passed
              ? 'Aprovado. Bom trabalho.'
              : 'Vamos reforçar este conteúdo.'}
          </h1>
          <p>
            {attempt.late
              ? 'As respostas chegaram depois do fim do tempo. '
              : ''}
            Enviado em{' '}
            {attempt.submittedAt ? formatDate(attempt.submittedAt) : '—'}.
            Mínimo para aprovar: {PASSING_SCORE}%.
          </p>
        </div>
        <div className={`qz-score ${passed ? 'ok' : 'low'}`}>
          <strong>{attempt.score}%</strong>
          <span>{passed ? 'aprovado' : `abaixo de ${PASSING_SCORE}%`}</span>
        </div>
      </div>

      <ol className="qz-results">
        {attempt.questions.map((question, i) => {
          const result = results.get(question.id);
          const given = attempt.answers?.[question.id];
          const ok = result?.correct === true && !result.voided;
          return (
            <li
              key={question.id}
              className={`qz-card qz-result ${result?.voided ? 'pending' : ok ? 'ok' : 'wrong'}`}
            >
              <div className="qz-result-head">
                <span className="qz-q-num">{i + 1}</span>
                <span className="qz-kind">{KIND_LABEL[question.kind]}</span>
                {result?.voided ? (
                  <span className="qz-verdict wrong">
                    Anulada ({result.verificationCorrect}/{VERIFICATION_SIZE}{' '}
                    verificações)
                  </span>
                ) : ok ? (
                  <span className="qz-verdict ok">
                    <CircleCheck size={14} /> Correta
                  </span>
                ) : (
                  <span className="qz-verdict wrong">
                    <CircleX size={14} /> Incorreta
                  </span>
                )}
              </div>
              {question.context && (
                <p className="qz-context">{question.context}</p>
              )}
              <h3>{question.prompt}</h3>
              {question.kind === 'multipla' && question.options ? (
                <ul className="qz-options static">
                  {question.options.map((option, optionIndex) => {
                    const isRight = optionIndex === result?.correctOption;
                    const chosen = given?.option === optionIndex;
                    return (
                      <li
                        key={option}
                        className={
                          isRight ? 'correct' : chosen ? 'chosen-wrong' : ''
                        }
                      >
                        {isRight ? (
                          <Check size={14} />
                        ) : chosen ? (
                          <X size={14} />
                        ) : (
                          <span className="qz-dot" />
                        )}
                        {option}
                        {chosen && <em>sua resposta</em>}
                      </li>
                    );
                  })}
                  {given?.option === undefined && (
                    <li className="qz-empty">Sem resposta</li>
                  )}
                </ul>
              ) : question.kind === 'dissertativa' ? (
                <div className="qz-compare">
                  <div>
                    <small>Sua resposta</small>
                    <p>{given?.text?.trim() || 'Sem resposta'}</p>
                  </div>
                  <div>
                    <small>Gabarito</small>
                    <p>{result?.modelAnswer}</p>
                  </div>
                  <p className="rm-muted">
                    Sua autoavaliação:{' '}
                    {given?.selfAssessment === 'certa' ? 'acertei' : 'errei'}.
                  </p>
                </div>
              ) : (
                <div className="qz-compare">
                  <div>
                    <small>Seu resultado</small>
                    <p>
                      {typeof given?.value === 'number'
                        ? given.value.toLocaleString('pt-BR')
                        : 'Sem resposta'}
                    </p>
                  </div>
                  <div>
                    <small>Esperado</small>
                    <p>{result?.expectedValue?.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}
              <p className="qz-explain">
                <strong>Explicação:</strong> {result?.explanation}
              </p>
            </li>
          );
        })}
      </ol>

      <section
        className="qz-card qz-recovery"
        aria-labelledby="qz-recovery-title"
      >
        <div className="qz-recovery-head">
          <RotateCcw size={18} />
          <div>
            <p className="eyebrow">PRÓXIMO PASSO</p>
            <h2 id="qz-recovery-title">{nextStep.title}</h2>
          </div>
        </div>
        <p>{nextStep.text}</p>
        {props.error && (
          <div className="rm-callout qz-alert">
            <AlertTriangle size={16} />
            <p>{props.error}</p>
          </div>
        )}
        <div className="qz-recovery-actions">
          {passed ? (
            <Link className="ss-link" href="/roadmap">
              Ver no roadmap
            </Link>
          ) : (
            <>
              <Button
                className="primary-button"
                disabled={props.busy}
                onClick={() => props.onRetry(attempt.contentId)}
              >
                <RotateCcw size={16} /> Refazer o quiz
              </Button>
              <Button
                variant="outline"
                className="qz-outline"
                disabled={props.busy}
                onClick={() => props.onStudyAgain(attempt.contentId)}
              >
                Revisar as notas antes
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="qz-outline"
            onClick={props.onBack}
          >
            Voltar aos quizzes
          </Button>
        </div>
      </section>
    </section>
  );
}
