'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Map,
  Menu,
  MessageCircle,
  PenLine,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                onClick={() => setActive(item)}
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
        <div className="page-heading">
          <div>
            <p className="eyebrow">QUINTA-FEIRA, 3 DE SETEMBRO</p>
            <h1>Bom dia, Marcos.</h1>
            <p>Seu próximo passo já está preparado. Uma sessão consistente vale mais que uma maratona.</p>
          </div>
          <div className="streak-pill"><Flame size={17} /> 7 dias de consistência</div>
        </div>

        {active !== 'Hoje' && (
          <div className="preview-notice" role="status">
            <span><Sparkles size={16} /> Prévia de <strong>{active}</strong></span>
            <button onClick={() => setActive('Hoje')}>Voltar para Hoje</button>
          </div>
        )}

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
