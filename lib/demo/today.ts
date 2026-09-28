// Dados demonstrativos das páginas Hoje e do cabeçalho. Não há backend de estudo ainda.

export type TaskTone = 'blue' | 'violet' | 'amber' | 'green';
export type TaskIcon = 'book' | 'brain' | 'target' | 'pen';

export const learner = { name: 'Marcos', initials: 'MS' };

export const todayTasks: {
  id: number; title: string; description: string; minutes: number; label: string; tone: TaskTone; icon: TaskIcon;
}[] = [
  { id: 1, title: 'Regime de competência', description: 'Continue o conteúdo e registre os principais conceitos.', minutes: 35, label: 'Continuar estudo', tone: 'blue', icon: 'book' },
  { id: 2, title: 'Contas patrimoniais', description: 'Revisão de 7 dias · consolide ativo, passivo e patrimônio líquido.', minutes: 15, label: 'Revisão', tone: 'violet', icon: 'brain' },
  { id: 3, title: 'Débito e crédito', description: 'Quiz rápido para medir retenção e localizar pontos frágeis.', minutes: 20, label: 'Quiz', tone: 'amber', icon: 'target' },
  { id: 4, title: 'Construção de balancete', description: 'Aplicação prática com um cenário contábil realista.', minutes: 30, label: 'Prática', tone: 'green', icon: 'pen' },
];

export const dailySummary = { plannedMinutes: 100, scheduledReviews: 2 };

export const todayContinue = {
  eyebrow: 'QUINTA-FEIRA, 3 DE SETEMBRO',
  subject: 'Contabilidade Geral',
  title: 'Regime de competência',
  description: 'Reconhecimento de receitas e despesas no período correto.',
  progress: 42,
  lastSession: 'Última sessão há 2 dias',
};

export const todayMetrics = [
  { tone: 'gold', icon: 'target', label: 'Domínio atual', value: '74%', hint: 'Proficiência consolidada' },
  { tone: 'violet', icon: 'brain', label: 'Retenção', value: '82%', hint: '+6% nos últimos 30 dias' },
  { tone: 'green', icon: 'flame', label: 'Consistência', value: '7 dias', hint: 'Melhor sequência: 12 dias' },
] as const;

export const todayRoadmap = { phase: 'Base Contábil', progress: 68 };

export const assistantDemo = {
  greeting: 'Bom dia, Marcos. Organizei sua jornada para reforçar o que você estudou e transformar teoria em prática. Em que posso ajudar?',
  shortcuts: [
    { icon: 'help', text: 'Por que esta ordem de estudos?' },
    { icon: 'brain', text: 'Como está minha retenção?' },
    { icon: 'map', text: 'O que vem depois nesta fase?' },
  ],
} as const;
