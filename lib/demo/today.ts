// Dados demonstrativos que restam em Hoje (indicadores e assistente). A jornada do dia e o resumo do cabeçalho
// vêm da agenda real (MVP-05).
// Os números de Hoje vêm das mesmas fontes demonstrativas de Estudar e Progresso, para as páginas não se contradizerem.
// O cartão de roadmap já lê o roadmap real (GET /api/roadmap, TEC-04/MVP-01).
import { progressSummary } from './progress';

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
