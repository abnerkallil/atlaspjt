'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  ListChecks,
  LockKeyhole,
  Map,
  Menu,
  MessageCircle,
  PenLine,
  Play,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotesWorkspace } from '@/components/notes-workspace';

const navItems = ['Hoje', 'Estudar', 'Roadmap', 'Notas', 'Quizzes', 'Progresso'];

const tasks = [
  {
    id: 1,
    title: 'Regime de competência',
    description: 'Continue o conteúdo e registre os principais conceitos.',
    meta: '35 min',
    label: 'Continuar estudo',
    tone: 'blue',
    icon: BookOpen,
  },
  {
    id: 2,
    title: 'Contas patrimoniais',
    description: 'Revisão de 7 dias · consolide ativo, passivo e patrimônio líquido.',
    meta: '15 min',
    label: 'Revisão',
    tone: 'violet',
    icon: BrainCircuit,
  },
  {
    id: 3,
    title: 'Débito e crédito',
    description: 'Quiz rápido para medir retenção e localizar pontos frágeis.',
    meta: '20 min',
    label: 'Quiz',
    tone: 'amber',
    icon: Target,
  },
  {
    id: 4,
    title: 'Construção de balancete',
    description: 'Aplicação prática com um cenário contábil realista.',
    meta: '30 min',
    label: 'Prática',
    tone: 'green',
    icon: PenLine,
  },
];

export default function Home() {
  const [active, setActive] = useState('Hoje');
  const [done, setDone] = useState<number[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [studyOverview, setStudyOverview] = useState(false);

  const completedMinutes = useMemo(
    () => done.reduce((sum, id) => sum + Number(tasks.find((task) => task.id === id)?.meta.split(' ')[0] ?? 0), 0),
    [done],
  );

  const toggleTask = (id: number) => {
    setDone((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="atlas-shell">
      <div className="top-ribbon">
        <div className="top-ribbon-inner">
          <div className="daily-summary">
            <span className="pulse-dot" />
            <strong>{4 - done.length} atividades</strong>
            <span>·</span>
            <span>{Math.max(0, 100 - completedMinutes)} min restantes</span>
            <span className="summary-divider" />
            <span>2 revisões programadas</span>
          </div>
          <button className="quiet-button" onClick={() => setAssistantOpen(true)}>
            <Sparkles size={15} /> Ver orientação do Atlas
          </button>
        </div>
      </div>

      <header className="site-header">
        <div className="site-header-inner">
          <button className="brand" onClick={() => setActive('Hoje')} aria-label="Atlas — início">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <span>ATLAS</span>
          </button>

          <nav className="main-nav" aria-label="Navegação principal">
            {navItems.map((item) => (
              <button
                key={item}
                className={active === item ? 'active' : ''}
                onClick={() => {
                  setActive(item);
                  if (item === 'Estudar') setStudyOverview(false);
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button aria-label="Buscar"><Search size={18} /></button>
            <button aria-label="Notificações" className="notification-button">
              <Bell size={18} /><span />
            </button>
            <button className="avatar" aria-label="Abrir perfil">MS</button>
            <button className="mobile-menu" aria-label="Abrir menu"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      <section className="page-wrap">
        {active === 'Hoje' && <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">QUINTA-FEIRA, 3 DE SETEMBRO</p>
            <h1>Bom dia, Marcos.</h1>
            <p>Seu próximo passo já está preparado. Uma sessão consistente vale mais que uma maratona.</p>
          </div>
          <div className="streak-pill"><Flame size={17} /> 7 dias de consistência</div>
        </div>

        <div className="hero-grid">
          <article className="continue-card">
            <div className="card-kicker"><BookOpen size={15} /> CONTINUE DE ONDE PAROU</div>
            <div className="continue-content">
              <div>
                <span className="subject-chip">Contabilidade Geral</span>
                <h2>Regime de competência</h2>
                <p>Reconhecimento de receitas e despesas no período correto.</p>
              </div>
              <div className="progress-copy"><strong>42%</strong><span>do conteúdo</span></div>
            </div>
            <div className="progress-track"><span style={{ width: '42%' }} /></div>
            <div className="continue-footer">
              <span><Clock3 size={15} /> Última sessão há 2 dias</span>
              <Button className="primary-button" onClick={() => setJourneyStarted(true)}>
                Continuar estudo <ArrowRight size={17} />
              </Button>
            </div>
          </article>

          <aside className="atlas-observed-card">
            <div className="atlas-orbit"><Sparkles size={19} /></div>
            <p className="card-kicker">O ATLAS OBSERVOU</p>
            <h3>Seu ritmo está consistente.</h3>
            <p>Você retém melhor quando pratica logo após a teoria. Por isso, incluímos um balancete ao fim da jornada.</p>
            <button onClick={() => setAssistantOpen(true)}>Entender recomendação <ChevronRight size={16} /></button>
          </aside>
        </div>

        <section className="metrics-section" aria-label="Indicadores de aprendizagem">
          <div className="metric-card gold">
            <div className="metric-icon"><Target size={19} /></div>
            <div><span>Domínio atual</span><strong>74%</strong><small>Proficiência consolidada</small></div>
          </div>
          <div className="metric-card violet">
            <div className="metric-icon"><BrainCircuit size={19} /></div>
            <div><span>Retenção</span><strong>82%</strong><small>+6% nos últimos 30 dias</small></div>
          </div>
          <div className="metric-card green">
            <div className="metric-icon"><Flame size={19} /></div>
            <div><span>Consistência</span><strong>7 dias</strong><small>Melhor sequência: 12 dias</small></div>
          </div>
        </section>

        <section className="journey-section">
          <div className="section-heading">
            <div><p className="eyebrow">SUA JORNADA DE HOJE</p><h2>Quatro passos, um objetivo claro.</h2></div>
            <div className="journey-total"><Clock3 size={16} /> 1h40 planejadas</div>
          </div>

          <div className="task-list">
            {tasks.map((task, index) => {
              const Icon = task.icon;
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
                    <div><span className={`task-label ${task.tone}`}>{task.label}</span><span className="task-time"><Clock3 size={13} />{task.meta}</span></div>
                    <h3>{task.title}</h3>
                    <p>{isDone ? 'Atividade concluída. Bom trabalho.' : task.description}</p>
                  </div>
                  <button className="task-arrow" aria-label={`Abrir ${task.title}`}><ChevronRight size={19} /></button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="roadmap-card">
          <div className="roadmap-title"><div className="map-icon"><Map size={19} /></div><div><span>ROADMAP ATUAL</span><h2>Base Contábil</h2></div></div>
          <div className="roadmap-progress">
            <div><span>Progresso da fase</span><strong>68%</strong></div>
            <div className="progress-track"><span style={{ width: '68%' }} /></div>
          </div>
          <button>Ver roadmap completo <ChevronRight size={17} /></button>
        </section>
        </>}

        {active === 'Estudar' && (
          studyOverview ? (
            <section className="study-view study-overview">
              <button className="study-back" onClick={() => setStudyOverview(false)}>
                <ArrowLeft size={16} /> Voltar ao estudo
              </button>
              <div className="study-heading">
                <div>
                  <p className="eyebrow">CONTEÚDO COMPLETO</p>
                  <h1>Contabilidade Geral</h1>
                  <p>Consulte a sequência, os pré-requisitos e retome qualquer conteúdo já liberado.</p>
                </div>
                <div className="course-progress-badge"><strong>42%</strong><span>concluído</span></div>
              </div>

              <div className="module-list">
                <article className="module-card complete">
                  <div className="module-number"><Check size={18} /></div>
                  <div className="module-copy"><span>MÓDULO 1 · CONCLUÍDO</span><h2>Fundamentos contábeis</h2><p>Patrimônio, equação patrimonial, contas, débito e crédito.</p></div>
                  <strong>100%</strong>
                </article>
                <article className="module-card current">
                  <div className="module-number">02</div>
                  <div className="module-copy"><span>MÓDULO 2 · EM ANDAMENTO</span><h2>Regimes e reconhecimento</h2><p>Regime de caixa, regime de competência e ajustes.</p>
                    <div className="lesson-list">
                      <button><Check size={15} /><span><strong>Regime de caixa</strong><small>Concluído</small></span></button>
                      <button className="active" onClick={() => setStudyOverview(false)}><Play size={15} /><span><strong>Regime de competência</strong><small>Continuar de onde parou</small></span><ChevronRight size={16} /></button>
                      <button><span className="lesson-dot" /><span><strong>Ajustes de competência</strong><small>Próximo conteúdo</small></span></button>
                    </div>
                  </div>
                  <strong>42%</strong>
                </article>
                <article className="module-card locked">
                  <div className="module-number"><LockKeyhole size={17} /></div>
                  <div className="module-copy"><span>MÓDULO 3 · BLOQUEADO</span><h2>Fechamento e demonstrações</h2><p>Liberado após a conclusão dos regimes e reconhecimento.</p></div>
                  <span className="prerequisite">Pré-requisito</span>
                </article>
              </div>
            </section>
          ) : (
            <section className="study-view">
              <button className="study-back" onClick={() => setStudyOverview(true)}>
                <ListChecks size={16} /> Ver conteúdo completo
              </button>

              <div className="study-heading compact">
                <div>
                  <p className="eyebrow">CONTABILIDADE GERAL · MÓDULO 2</p>
                  <h1>Regime de competência</h1>
                  <p>Você parou em reconhecimento de receitas e despesas.</p>
                </div>
                <div className="course-progress-badge"><strong>42%</strong><span>do conteúdo</span></div>
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
                    <div><span>AULA 4 DE 9</span><span><Clock3 size={14} /> 35 min</span></div>
                    <h2>Reconhecimento de receitas e despesas</h2>
                    <p>Retome diretamente o conceito que conecta o fato gerador ao período contábil correto.</p>
                    <Button className="primary-button study-start" onClick={() => setJourneyStarted(true)}>
                      <Play size={17} fill="currentColor" /> Retomar estudo
                    </Button>
                  </div>
                </article>

                <aside className="study-side-card">
                  <p className="eyebrow">SEU PONTO ATUAL</p>
                  <h2>Uma sessão objetiva.</h2>
                  <div className="session-step done"><span><Check size={15} /></span><div><strong>Leitura inicial</strong><small>Concluída</small></div></div>
                  <div className="session-step active"><span>2</span><div><strong>Reconhecimento contábil</strong><small>Retomar agora</small></div></div>
                  <div className="session-step"><span>3</span><div><strong>Nota de síntese</strong><small>Após o conteúdo</small></div></div>
                  <div className="session-step"><span>4</span><div><strong>Fixação</strong><small>2 questões</small></div></div>
                  <div className="session-note"><Sparkles size={16} /><p>O Atlas salvou seu progresso. Você não precisa procurar a aula nem reorganizar a sessão.</p></div>
                </aside>
              </div>
            </section>
          )
        )}

        {active === 'Notas' && <NotesWorkspace />}

        {active !== 'Hoje' && active !== 'Estudar' && active !== 'Notas' && (
          <div className="preview-notice" role="status">
            <span><Sparkles size={16} /> A página <strong>{active}</strong> será desenhada na próxima etapa.</span>
            <button onClick={() => setActive('Hoje')}>Voltar para Hoje</button>
          </div>
        )}
      </section>

      <button className="ask-atlas" onClick={() => setAssistantOpen(true)}>
        <span><MessageCircle size={19} /></span> Perguntar ao Atlas
      </button>

      {assistantOpen && (
        <div className="drawer-backdrop" onClick={() => setAssistantOpen(false)}>
          <aside className="assistant-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header"><div><span className="atlas-orbit small"><Sparkles size={15} /></span><div><strong>Atlas</strong><small>Orientador de estudos</small></div></div><button onClick={() => setAssistantOpen(false)}><X size={20} /></button></div>
            <div className="drawer-body">
              <div className="atlas-message">Bom dia, Marcos. Organizei sua jornada para reforçar o que você estudou e transformar teoria em prática. Em que posso ajudar?</div>
              <button><CircleHelp size={16} /> Por que esta ordem de estudos?</button>
              <button><BrainCircuit size={16} /> Como está minha retenção?</button>
              <button><Map size={16} /> O que vem depois nesta fase?</button>
            </div>
            <div className="drawer-input"><input placeholder="Escreva sua pergunta..." /><button><ArrowRight size={18} /></button></div>
          </aside>
        </div>
      )}

      {journeyStarted && (
        <div className="modal-backdrop" onClick={() => setJourneyStarted(false)}>
          <div className="start-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-symbol"><BookOpen size={24} /></div>
            <p className="eyebrow">SESSÃO PREPARADA</p>
            <h2>Regime de competência</h2>
            <p>35 minutos · teoria, anotação e duas questões de fixação.</p>
            <div className="modal-actions"><Button variant="outline" onClick={() => setJourneyStarted(false)}>Agora não</Button><Button className="primary-button" onClick={() => setJourneyStarted(false)}>Iniciar sessão <ArrowRight size={17} /></Button></div>
          </div>
        </div>
      )}
    </main>
  );
}
