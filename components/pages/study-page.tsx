'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bookmark, Check, Clock3, ListChecks, LockKeyhole, Pause, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionStartModal } from '@/components/atlas/session-start-modal';
import { StudySession } from '@/components/pages/study-session';
import {
  fetchStudySession,
  formatMinutes,
  startStudySession,
  useStudyOverview,
  type StudyContent,
} from '@/components/pages/use-study-overview';
import { CONTENT_STATE_META, LOCKED_META } from '@/lib/pedagogy/state-labels';
import { isPrerequisiteMet } from '@/lib/pedagogy/prerequisites';
import { elapsedSeconds, type StudySession as StudySessionData } from '@/lib/study-sessions';

type ActiveSession = { session: StudySessionData; serverNow: string };

function sessionStepLabel(session: StudySessionData) {
  const step = session.checkpoint?.stepTitle;
  return typeof step === 'string' && step ? `Parou em: ${step}` : 'Seu ponto atual fica salvo.';
}

export function StudyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('sessao');
  const { overview, reload } = useStudyOverview();
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [modalContent, setModalContent] = useState<StudyContent | null>(null);
  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [error, setError] = useState('');

  // /estudar?sessao=<id> abre direto a sessão (vinda do Roadmap ou de Hoje).
  useEffect(() => {
    if (!requested || requested === 'iniciar') return;
    let alive = true;
    fetchStudySession(requested)
      .then(({ session, now }) => {
        if (!alive) return;
        if (session.status === 'concluida') router.replace('/estudar');
        else setActive({ session, serverNow: now });
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : 'Sessão não encontrada.');
      });
    return () => {
      alive = false;
    };
  }, [requested, router]);

  async function beginSession(contentId: string) {
    setStarting(true);
    setError('');
    try {
      const session = await startStudySession(contentId);
      setModalContent(null);
      setOverviewOpen(false);
      router.replace(`/estudar?sessao=${encodeURIComponent(session.id)}`);
      window.scrollTo(0, 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a sessão.');
      setModalContent(null);
    } finally {
      setStarting(false);
    }
  }

  if (active) {
    return (
      <StudySession
        key={active.session.id}
        session={active.session}
        serverNow={active.serverNow}
        onBack={() => {
          setActive(null);
          reload();
          router.replace('/estudar');
        }}
      />
    );
  }

  if (overview.status !== 'ready') {
    return (
      <section className="study-view">
        <div className="study-heading compact">
          <div>
            <p className="eyebrow">ESTUDAR</p>
            <h1>{overview.status === 'error' ? 'Não deu para carregar seus estudos.' : 'Carregando seus estudos…'}</h1>
            {overview.status === 'error' && <p role="alert">{overview.message}</p>}
          </div>
        </div>
      </section>
    );
  }

  const { roadmap, openSessions, next, nextContent } = overview;
  const openSession = next?.kind === 'retomar' ? openSessions.find((item) => item.id === next.sessionId) : undefined;
  const discipline = roadmap?.phases
    .flatMap((phase) => phase.disciplines)
    .find((item) => item.contents.some((content) => content.id === next?.contentId));
  const percent = discipline?.progress.percent ?? 0;

  if (overviewOpen && discipline) {
    return (
      <section className="study-view study-overview">
        <button className="study-back" onClick={() => setOverviewOpen(false)}>
          <ArrowLeft size={16} /> Voltar ao estudo
        </button>
        <div className="study-heading">
          <div>
            <p className="eyebrow">CONTEÚDO COMPLETO</p>
            <h1>{discipline.title}</h1>
            <p>A sequência da disciplina, com o estado de cada conteúdo e o que ainda depende de pré-requisito.</p>
          </div>
          <div className="course-progress-badge"><strong>{percent}%</strong><span>concluído</span></div>
        </div>
        <div className="lesson-list study-content-list">
          {discipline.contents.map((content) => {
            const meta = content.locked ? LOCKED_META : CONTENT_STATE_META[content.state];
            const done = !content.locked && isPrerequisiteMet(content.state);
            const current = content.id === next?.contentId;
            return (
              <button
                key={content.id}
                className={current ? 'active' : ''}
                disabled={content.locked || starting}
                onClick={() => setModalContent({ ...content, disciplineId: discipline.id, disciplineTitle: discipline.title })}
              >
                {done ? <Check size={15} /> : content.locked ? <LockKeyhole size={15} /> : current ? <Play size={15} /> : <span className="lesson-dot" />}
                <span><strong>{content.title}</strong><small>{content.unit ? `${content.unit} · ` : ''}{meta.label}</small></span>
              </button>
            );
          })}
        </div>
        {error && <p className="rm-error" role="alert">{error}</p>}
        {modalContent && (
          <SessionStartModal
            title={modalContent.title}
            description={describeContent(modalContent)}
            starting={starting}
            onClose={() => setModalContent(null)}
            onStart={() => void beginSession(modalContent.id)}
          />
        )}
      </section>
    );
  }

  return (
    <>
      <section className="study-view">
        {discipline && (
          <button className="study-back" onClick={() => setOverviewOpen(true)}>
            <ListChecks size={16} /> Ver conteúdo completo
          </button>
        )}

        <div className="study-heading compact">
          <div>
            <p className="eyebrow">{discipline ? discipline.title.toUpperCase() : 'ESTUDAR'}</p>
            <h1>{nextContent?.title ?? 'Nada para estudar agora.'}</h1>
            <p>
              {next?.kind === 'retomar'
                ? 'Você tem uma sessão aberta. Retome exatamente de onde parou.'
                : next
                  ? next.reason
                  : 'Todos os conteúdos liberados já foram estudados. Veja o roadmap para o que vem depois.'}
            </p>
          </div>
          {discipline && <div className="course-progress-badge"><strong>{percent}%</strong><span>da disciplina</span></div>}
        </div>

        {nextContent && next && (
          <div className="study-workspace">
            <article className="lesson-card">
              <div className="lesson-cover">
                <span className="lesson-status">
                  <Bookmark size={15} /> {openSession ? (openSession.status === 'pausada' ? 'SESSÃO PAUSADA' : 'SESSÃO EM ANDAMENTO') : 'PRÓXIMO PASSO'}
                </span>
                <div className="lesson-visual">
                  <div className="balance-symbol"><span>{nextContent.unit ?? discipline?.title}</span><i /><span>{nextContent.id}</span></div>
                </div>
              </div>
              <div className="lesson-content">
                <div>
                  <span>{CONTENT_STATE_META[nextContent.state].label}</span>
                  {openSession ? (
                    <span><Clock3 size={14} /> {formatMinutes(elapsedSeconds(openSession, overview.serverNow))} estudados</span>
                  ) : (
                    nextContent.estimatedMinutes && <span><Clock3 size={14} /> {nextContent.estimatedMinutes} min</span>
                  )}
                </div>
                <h2>{nextContent.title}</h2>
                <p>{openSession ? sessionStepLabel(openSession) : describeContent(nextContent)}</p>
                {openSession ? (
                  <Button
                    className="primary-button study-start"
                    onClick={() => router.replace(`/estudar?sessao=${encodeURIComponent(openSession.id)}`)}
                  >
                    {openSession.status === 'pausada' ? <Play size={17} fill="currentColor" /> : <Pause size={17} />} Retomar sessão
                  </Button>
                ) : (
                  <Button className="primary-button study-start" onClick={() => setModalContent(nextContent)}>
                    <Play size={17} fill="currentColor" /> Iniciar sessão
                  </Button>
                )}
                {error && <p className="rm-error" role="alert">{error}</p>}
              </div>
            </article>

            <aside className="study-side-card">
              <p className="eyebrow">SESSÕES ABERTAS</p>
              <h2>{openSessions.length ? 'Retome de onde parou.' : 'Uma sessão objetiva.'}</h2>
              {openSessions.length === 0 && (
                <p className="ss-muted">
                  Ao iniciar, o Atlas cronometra o estudo, guarda seu ponto atual e, ao concluir, registra a evidência e libera o quiz do conteúdo.
                </p>
              )}
              {openSessions.map((session, index) => (
                <Link className={`session-step ${index === 0 ? 'active' : ''}`} key={session.id} href={`/estudar?sessao=${encodeURIComponent(session.id)}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{session.contentTitle}</strong>
                    <small>
                      {session.status === 'pausada' ? 'Pausada' : 'Em andamento'} · {formatMinutes(elapsedSeconds(session, overview.serverNow))}
                    </small>
                  </div>
                </Link>
              ))}
              <div className="session-note"><Sparkles size={16} /><p>O progresso vem do que você conclui: sessão, quiz e revisões ficam registrados no roadmap.</p></div>
            </aside>
          </div>
        )}
      </section>
      {modalContent && (
        <SessionStartModal
          title={modalContent.title}
          description={describeContent(modalContent)}
          starting={starting}
          onClose={() => setModalContent(null)}
          onStart={() => void beginSession(modalContent.id)}
        />
      )}
    </>
  );
}

function describeContent(content: StudyContent) {
  const parts = [
    content.disciplineTitle,
    content.unit,
    content.estimatedMinutes ? `${content.estimatedMinutes} min estimados` : null,
  ].filter(Boolean);
  return `${parts.join(' · ')}. Material e notas lado a lado; ao concluir, o quiz do conteúdo fica disponível.`;
}
