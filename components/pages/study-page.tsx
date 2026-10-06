'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bookmark, Check, ChevronRight, Clock3, ListChecks, LockKeyhole, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionStartModal } from '@/components/atlas/session-start-modal';
import { StudySession } from '@/components/pages/study-session';
import { sessionSteps, studyCourse, studyLesson, studyModules } from '@/lib/demo/study';

export function StudyPage() {
  const [overview, setOverview] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // "Iniciar sessão" em Hoje abre esta página já com a sessão em andamento (/estudar?sessao=iniciar).
  const [sessionActive, setSessionActive] = useState(() => searchParams.get('sessao') === 'iniciar');

  function startSession() {
    setSessionOpen(false);
    setOverview(false);
    setSessionActive(true);
    window.scrollTo(0, 0);
  }

  if (sessionActive) {
    return (
      <StudySession
        onBack={() => {
          setSessionActive(false);
          router.replace('/estudar');
        }}
      />
    );
  }

  return (
    <>
      {overview ? (
        <section className="study-view study-overview">
          <button className="study-back" onClick={() => setOverview(false)}>
            <ArrowLeft size={16} /> Voltar ao estudo
          </button>
          <div className="study-heading">
            <div>
              <p className="eyebrow">CONTEÚDO COMPLETO</p>
              <h1>{studyCourse.name}</h1>
              <p>Consulte a sequência, os pré-requisitos e retome qualquer conteúdo já liberado.</p>
            </div>
            <div className="course-progress-badge"><strong>{studyCourse.progress}%</strong><span>concluído</span></div>
          </div>

          <div className="module-list">
            {studyModules.map((module) => (
              <article className={`module-card ${module.status}`} key={module.id}>
                <div className="module-number">
                  {module.status === 'complete' ? <Check size={18} /> : module.status === 'locked' ? <LockKeyhole size={17} /> : String(module.id).padStart(2, '0')}
                </div>
                <div className="module-copy">
                  <span>{module.kicker}</span>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                  {'lessons' in module && (
                    <div className="lesson-list">
                      {module.lessons.map((lesson) => (
                        <button key={lesson.title} className={lesson.status === 'active' ? 'active' : ''} onClick={lesson.status === 'active' ? () => setOverview(false) : undefined}>
                          {lesson.status === 'done' ? <Check size={15} /> : lesson.status === 'active' ? <Play size={15} /> : <span className="lesson-dot" />}
                          <span><strong>{lesson.title}</strong><small>{lesson.hint}</small></span>
                          {lesson.status === 'active' && <ChevronRight size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {'progress' in module ? <strong>{module.progress}</strong> : <span className="prerequisite">Pré-requisito</span>}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="study-view">
          <button className="study-back" onClick={() => setOverview(true)}>
            <ListChecks size={16} /> Ver conteúdo completo
          </button>

          <div className="study-heading compact">
            <div>
              <p className="eyebrow">{studyLesson.eyebrow}</p>
              <h1>{studyLesson.title}</h1>
              <p>{studyLesson.subtitle}</p>
            </div>
            <div className="course-progress-badge"><strong>{studyCourse.progress}%</strong><span>do conteúdo</span></div>
          </div>

          <div className="study-workspace">
            <article className="lesson-card">
              <div className="lesson-cover">
                <span className="lesson-status"><Bookmark size={15} /> ÚLTIMO PONTO ESTUDADO</span>
                <div className="lesson-visual">
                  <div className="balance-symbol"><span>Receita</span><i /><span>Despesa</span></div>
                </div>
              </div>
              <div className="lesson-content">
                <div><span>{studyLesson.position}</span><span><Clock3 size={14} /> {studyLesson.minutes} min</span></div>
                <h2>{studyLesson.heading}</h2>
                <p>{studyLesson.description}</p>
                <Button className="primary-button study-start" onClick={() => setSessionOpen(true)}>
                  <Play size={17} fill="currentColor" /> Retomar estudo
                </Button>
              </div>
            </article>

            <aside className="study-side-card">
              <p className="eyebrow">SEU PONTO ATUAL</p>
              <h2>Uma sessão objetiva.</h2>
              {sessionSteps.map((step, index) => (
                <div className={`session-step ${step.status === 'todo' ? '' : step.status}`} key={step.title}>
                  <span>{step.status === 'done' ? <Check size={15} /> : index + 1}</span>
                  <div><strong>{step.title}</strong><small>{step.hint}</small></div>
                </div>
              ))}
              <div className="session-note"><Sparkles size={16} /><p>O Atlas salvou seu progresso. Você não precisa procurar a aula nem reorganizar a sessão.</p></div>
            </aside>
          </div>
        </section>
      )}
      {sessionOpen && <SessionStartModal onClose={() => setSessionOpen(false)} onStart={startSession} />}
    </>
  );
}
