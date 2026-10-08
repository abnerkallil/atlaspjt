'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Bell, BrainCircuit, CircleHelp, MessageCircle, Map as MapIcon, Menu, Search, Sparkles, UserRound, X } from 'lucide-react';
import { assistantDemo } from '@/lib/demo/today';
import { daySummary, useAgendaData, type AgendaState } from '@/components/atlas/use-agenda';

export const navItems = [
  { label: 'Hoje', href: '/' },
  { label: 'Estudar', href: '/estudar' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Notas', href: '/notas' },
  { label: 'Quizzes', href: '/quizzes' },
  { label: 'Progresso', href: '/progresso' },
];

// Estado compartilhado entre rotas: o resumo diário do cabeçalho e a jornada de Hoje leem a mesma agenda (MVP-05),
// e o modo de foco esconde navegação, perfil e assistente durante uma sessão de estudo ativa (DEC-01, DEC-12).
type ShellContextValue = {
  agenda: AgendaState;
  reloadAgenda: () => void;
  openAssistant: () => void;
  setFocusMode: (focus: boolean) => void;
};
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
  const { agenda, reload: reloadAgenda } = useAgendaData(pathname);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusMode, setFocusModeState] = useState(false);

  const openAssistant = useCallback(() => setAssistantOpen(true), []);
  const setFocusMode = useCallback((focus: boolean) => {
    setFocusModeState(focus);
    if (focus) setMenuOpen(false);
  }, []);
  const value = useMemo(
    () => ({ agenda, reloadAgenda, openAssistant, setFocusMode }),
    [agenda, reloadAgenda, openAssistant, setFocusMode],
  );

  const summary = agenda.status === 'ready' ? daySummary(agenda.items, agenda.today) : null;

  return (
    <ShellContext.Provider value={value}>
      <div className={focusMode ? 'atlas-shell focus-mode' : 'atlas-shell'}>
        {!focusMode && (
          <div className="top-ribbon">
            <div className="top-ribbon-inner">
              <div className="daily-summary">
                <span className="pulse-dot" />
                {summary ? (
                  <>
                    <strong>{summary.pending} {summary.pending === 1 ? 'atividade' : 'atividades'}</strong>
                    <span>·</span>
                    <span>{summary.minutes} min restantes</span>
                    <span className="summary-divider" />
                    <span>{summary.reviews} {summary.reviews === 1 ? 'revisão programada' : 'revisões programadas'}</span>
                  </>
                ) : (
                  <span>{agenda.status === 'error' ? 'Agenda indisponível' : 'Carregando agenda…'}</span>
                )}
              </div>
              <button className="quiet-button" onClick={openAssistant}>
                <Sparkles size={15} /> Ver orientação do Atlas
              </button>
            </div>
          </div>
        )}

        <header className="site-header">
          <div className="site-header-inner">
            <Link className="brand" href="/" aria-label="Atlas — início">
              <span className="brand-mark"><span /><span /><span /></span>
              <span>ATLAS</span>
            </Link>

            {focusMode ? (
              <p className="focus-mode-label">Sessão de estudo em andamento</p>
            ) : (
              <>
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
                  <button className="avatar" aria-label="Abrir perfil"><UserRound size={18} /></button>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="quiet-button">Sair</button>
                  </form>
                  <button className="mobile-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen((open) => !open)}>
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </div>
              </>
            )}
          </div>
          {menuOpen && !focusMode && (
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

        {!focusMode && (
          <button className="ask-atlas" onClick={openAssistant}>
            <span><MessageCircle size={19} /></span> Perguntar ao Atlas
          </button>
        )}

        {assistantOpen && <AssistantDrawer onClose={() => setAssistantOpen(false)} />}
      </div>
    </ShellContext.Provider>
  );
}
