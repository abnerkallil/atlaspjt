'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Bell, BrainCircuit, CircleHelp, MessageCircle, Map as MapIcon, Menu, Search, Sparkles, X } from 'lucide-react';
import { assistantDemo, dailySummary, learner, todayTasks } from '@/lib/demo/today';

export const navItems = [
  { label: 'Hoje', href: '/' },
  { label: 'Estudar', href: '/estudar' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Notas', href: '/notas' },
  { label: 'Quizzes', href: '/quizzes' },
  { label: 'Progresso', href: '/progresso' },
];

// Único estado compartilhado entre rotas: o resumo diário do cabeçalho depende das tarefas concluídas em Hoje.
type ShellContextValue = { done: number[]; toggleTask: (id: number) => void; openAssistant: () => void };
const ShellContext = createContext<ShellContextValue | null>(null);

export function useAtlasShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error('useAtlasShell precisa estar dentro de <AtlasShell>.');
  return value;
}

const shortcutIcons = { help: CircleHelp, brain: BrainCircuit, map: MapIcon } as const;

function AssistantDrawer({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const onBackdropClick = (event: MouseEvent) => { if (event.target === dialog) dialog.close(); };
    dialog.addEventListener('click', onBackdropClick);
    return () => dialog.removeEventListener('click', onBackdropClick);
  }, []);
  return (
    <dialog ref={ref} className="assistant-drawer" aria-labelledby="assistant-title" onClose={onClose}>
      <div className="drawer-header">
        <div><span className="atlas-orbit small"><Sparkles size={15} /></span><div><strong id="assistant-title">Atlas</strong><small>Orientador de estudos</small></div></div>
        <button onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      </div>
      <div className="drawer-body">
        <div className="atlas-message">{assistantDemo.greeting}</div>
        {assistantDemo.shortcuts.map((item) => {
          const Icon = shortcutIcons[item.icon];
          return <button key={item.text}><Icon size={16} /> {item.text}</button>;
        })}
      </div>
      <div className="drawer-input"><input placeholder="Escreva sua pergunta..." aria-label="Pergunta ao Atlas" /><button aria-label="Enviar"><ArrowRight size={18} /></button></div>
    </dialog>
  );
}

export function AtlasShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [done, setDone] = useState<number[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTask = useCallback((id: number) => {
    setDone((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);
  const openAssistant = useCallback(() => setAssistantOpen(true), []);
  const value = useMemo(() => ({ done, toggleTask, openAssistant }), [done, toggleTask, openAssistant]);

  const completedMinutes = done.reduce((sum, id) => sum + (todayTasks.find((task) => task.id === id)?.minutes ?? 0), 0);

  return (
    <ShellContext.Provider value={value}>
      <div className="atlas-shell">
        <div className="top-ribbon">
          <div className="top-ribbon-inner">
            <div className="daily-summary">
              <span className="pulse-dot" />
              <strong>{todayTasks.length - done.length} atividades</strong>
              <span>·</span>
              <span>{Math.max(0, dailySummary.plannedMinutes - completedMinutes)} min restantes</span>
              <span className="summary-divider" />
              <span>{dailySummary.scheduledReviews} revisões programadas</span>
            </div>
            <button className="quiet-button" onClick={openAssistant}>
              <Sparkles size={15} /> Ver orientação do Atlas
            </button>
          </div>
        </div>

        <header className="site-header">
          <div className="site-header-inner">
            <Link className="brand" href="/" aria-label="Atlas — início">
              <span className="brand-mark"><span /><span /><span /></span>
              <span>ATLAS</span>
            </Link>

            <nav className="main-nav" aria-label="Navegação principal">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} aria-current={pathname === item.href ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="header-actions">
              <button aria-label="Buscar"><Search size={18} /></button>
              <button aria-label="Notificações" className="notification-button"><Bell size={18} /><span /></button>
              <button className="avatar" aria-label="Abrir perfil">{learner.initials}</button>
              <button className="mobile-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen((open) => !open)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav id="mobile-nav" className="mobile-nav" aria-label="Navegação principal (menu)">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <main className="page-wrap">{children}</main>

        <button className="ask-atlas" onClick={openAssistant}>
          <span><MessageCircle size={19} /></span> Perguntar ao Atlas
        </button>

        {assistantOpen && <AssistantDrawer onClose={() => setAssistantOpen(false)} />}
      </div>
    </ShellContext.Provider>
  );
}
