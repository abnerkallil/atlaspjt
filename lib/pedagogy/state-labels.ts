// Rótulos dos estados do DEC-03 para a interface (sem dependência de servidor).
import type { ContentState } from './states.js';

export type StateTone = 'neutral' | 'blue' | 'purple' | 'green' | 'orange';

export const CONTENT_STATE_META: Record<ContentState, { label: string; hint: string; tone: StateTone }> = {
  'nao-iniciado': { label: 'Não iniciado', hint: 'Liberado, ainda sem estudo.', tone: 'neutral' },
  'em-estudo': { label: 'Em estudo', hint: 'Material aberto; o quiz vem ao encerrar a sessão.', tone: 'blue' },
  'aguardando-quiz': { label: 'Aguardando quiz', hint: 'Sessão encerrada; falta o quiz do conteúdo.', tone: 'purple' },
  concluido: { label: 'Concluído', hint: 'Quiz aprovado; revisões 24h, 7d e 30d agendadas.', tone: 'green' },
  bloqueado: { label: 'Bloqueado', hint: 'Reprovado no quiz; revise e refaça para liberar a conclusão da matéria.', tone: 'orange' },
  'aguardando-revisao': { label: 'Aguardando revisão', hint: 'Chegou o prazo de uma revisão.', tone: 'purple' },
  revalidado: { label: 'Revalidado', hint: 'Passou na revisão mais recente.', tone: 'green' },
  'em-revisao-ativa': { label: 'Em revisão ativa', hint: 'Falhou numa revisão; o conteúdo foi reaberto.', tone: 'orange' },
};

export const LOCKED_META = {
  label: 'Aguardando pré-requisito',
  hint: 'Comece depois de concluir os pré-requisitos abaixo.',
  tone: 'neutral' as StateTone,
};
