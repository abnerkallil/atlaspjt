// Dados demonstrativos das páginas Hoje e do cabeçalho. Não há backend de estudo ainda (TEC-04).
// Os números de Hoje vêm das mesmas fontes demonstrativas de Estudar e Progresso, para as páginas não se contradizerem.
// O cartão de roadmap já lê o roadmap real (GET /api/roadmap, TEC-04/MVP-01).
import { progressSummary } from './progress';

export type TaskTone = 'blue' | 'violet' | 'amber' | 'green';
export type TaskIcon = 'book' | 'brain' | 'target' | 'pen';


// href: página definitiva onde cada atividade é feita.
export const todayTasks: {
  id: number; title: string; description: string; minutes: number; label: string; tone: TaskTone; icon: TaskIcon; href: string;
}[] = [
  { id: 1, title: 'Regime de competência', description: 'Continue o conteúdo e registre os principais conceitos.', minutes: 35, label: 'Continuar estudo', tone: 'blue', icon: 'book', href: '/estudar' },
  { id: 2, title: 'Contas patrimoniais', description: 'Revisão de 7 dias · consolide ativo, passivo e patrimônio líquido.', minutes: 15, label: 'Revisão', tone: 'violet', icon: 'brain', href: '/quizzes' },
  { id: 3, title: 'Débito e crédito', description: 'Quiz rápido para medir retenção e localizar pontos frágeis.', minutes: 20, label: 'Quiz', tone: 'amber', icon: 'target', href: '/quizzes' },
  { id: 4, title: 'Construção de balancete', description: 'Aplicação prática com um cenário contábil realista.', minutes: 30, label: 'Prática', tone: 'green', icon: 'pen', href: '/estudar' },
];

export const dailySummary = {
  plannedMinutes: todayTasks.reduce((sum, task) => sum + task.minutes, 0),
  scheduledReviews: todayTasks.filter((task) => task.label === 'Revisão').length,
};


export const todayMetrics = [
  { tone: 'gold', icon: 'target', label: 'Domínio geral', value: `${progressSummary.mastery}%`, hint: 'Conhecimento consolidado' },
  {
    tone: 'violet', icon: 'brain', label: 'Retenção média', value: `${progressSummary.retention}%`,
    hint: `${progressSummary.retentionChange >= 0 ? '+' : ''}${progressSummary.retentionChange} pontos em 8 semanas`,
  },
  { tone: 'green', icon: 'flame', label: 'Consistência', value: `${progressSummary.currentStreak} dias`, hint: `${progressSummary.studiedDays} de 28 dias com estudo` },
] as const;

export const assistantDemo = {
  greeting: `Olá. Organizei sua jornada para reforçar o que você estudou e transformar teoria em prática. Em que posso ajudar?`,
  shortcuts: [
    { icon: 'help', text: 'Por que esta ordem de estudos?' },
    { icon: 'brain', text: 'Como está minha retenção?' },
    { icon: 'map', text: 'O que vem depois nesta fase?' },
  ],
} as const;
