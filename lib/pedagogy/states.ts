// Máquina de estados pedagógica do DEC-03 em dois níveis (conteúdo e
// disciplina), como regra executável. É a única lista de estados válidos para
// atlas_content_states / atlas_discipline_states (TEC-02 / DEC-010).
//
// Pré-requisito não cumprido NÃO é um estado: é calculado a partir de
// atlas_content_prerequisites (MVP-01). "bloqueado" aqui é só o bloqueio por
// reprovação no quiz, como o DEC-03 define.

export const CONTENT_STATES = [
  'nao-iniciado',
  'em-estudo',
  'aguardando-quiz',
  'concluido',
  'bloqueado',
  'aguardando-revisao',
  'revalidado',
  'em-revisao-ativa',
] as const;
export type ContentState = (typeof CONTENT_STATES)[number];

export const DISCIPLINE_STATES = [
  'em-andamento',
  'exame-meio-liberado',
  'exame-meio-em-curso',
  'exame-meio-concluido',
  'atividade-final-liberada',
  'atividade-final-em-curso',
  'recuperacao-liberada',
  'recuperacao-em-curso',
  'concluida',
] as const;
export type DisciplineState = (typeof DISCIPLINE_STATES)[number];

export const INITIAL_CONTENT_STATE: ContentState = 'nao-iniciado';
export const INITIAL_DISCIPLINE_STATE: DisciplineState = 'em-andamento';

export type Transition<S extends string> = {
  event: string;
  from: S;
  to: S;
  // DEC-03: tentativa única ou irreversível exige confirmação explícita do usuário.
  requiresConfirmation: boolean;
  description: string;
};

export const CONTENT_TRANSITIONS: Transition<ContentState>[] = [
  { event: 'abrir-material', from: 'nao-iniciado', to: 'em-estudo', requiresConfirmation: false, description: 'Abriu o material do conteúdo.' },
  { event: 'abrir-material', from: 'bloqueado', to: 'em-estudo', requiresConfirmation: false, description: 'Voltou a estudar um conteúdo bloqueado para refazer o quiz.' },
  { event: 'encerrar-sessao', from: 'em-estudo', to: 'aguardando-quiz', requiresConfirmation: false, description: 'Saiu da sessão de estudo; o quiz do conteúdo foi gerado.' },
  { event: 'quiz-aprovado', from: 'aguardando-quiz', to: 'concluido', requiresConfirmation: false, description: 'Passou no quiz; evidência registrada.' },
  { event: 'quiz-reprovado', from: 'aguardando-quiz', to: 'bloqueado', requiresConfirmation: false, description: 'Reprovou no quiz; a conclusão da matéria fica congelada.' },
  { event: 'revisao-vencida', from: 'concluido', to: 'aguardando-revisao', requiresConfirmation: false, description: 'Chegou o prazo de revisão (24h/7d/30d).' },
  { event: 'revisao-vencida', from: 'revalidado', to: 'aguardando-revisao', requiresConfirmation: false, description: 'Chegou o próximo prazo de revisão (7d/30d).' },
  { event: 'revisao-aprovada', from: 'aguardando-revisao', to: 'revalidado', requiresConfirmation: false, description: 'Passou na revisão.' },
  { event: 'revisao-reprovada', from: 'aguardando-revisao', to: 'em-revisao-ativa', requiresConfirmation: false, description: 'Falhou na revisão; o conteúdo foi reaberto.' },
  { event: 'revisao-aprovada', from: 'em-revisao-ativa', to: 'revalidado', requiresConfirmation: false, description: 'Mostrou domínio de novo após a revisão ativa.' },
  // DEC-05: exame de proficiência acima de 85 dispensa o conteúdo sem afetar a nota.
  { event: 'dispensa-proficiencia', from: 'nao-iniciado', to: 'concluido', requiresConfirmation: false, description: 'Dispensado por proficiência (nota acima de 85).' },
];

export const DISCIPLINE_TRANSITIONS: Transition<DisciplineState>[] = [
  { event: 'conteudo-50', from: 'em-andamento', to: 'exame-meio-liberado', requiresConfirmation: false, description: '50% do conteúdo concluído; exame de meio de curso liberado.' },
  { event: 'iniciar-exame-meio', from: 'exame-meio-liberado', to: 'exame-meio-em-curso', requiresConfirmation: true, description: 'Iniciou o exame de meio de curso (tentativa única).' },
  { event: 'exame-meio-entregue', from: 'exame-meio-em-curso', to: 'exame-meio-concluido', requiresConfirmation: false, description: 'Entregou o exame de meio de curso.' },
  { event: 'conteudo-100', from: 'exame-meio-concluido', to: 'atividade-final-liberada', requiresConfirmation: false, description: '100% do conteúdo concluído; atividade final liberada.' },
  { event: 'iniciar-atividade-final', from: 'atividade-final-liberada', to: 'atividade-final-em-curso', requiresConfirmation: true, description: 'Iniciou a atividade final (irreversível).' },
  { event: 'atividade-final-aprovada', from: 'atividade-final-em-curso', to: 'concluida', requiresConfirmation: false, description: 'Resultado satisfatório na atividade final.' },
  { event: 'atividade-final-insatisfatoria', from: 'atividade-final-em-curso', to: 'recuperacao-liberada', requiresConfirmation: false, description: 'Resultado insatisfatório; recuperação liberada.' },
  { event: 'iniciar-recuperacao', from: 'recuperacao-liberada', to: 'recuperacao-em-curso', requiresConfirmation: true, description: 'Iniciou a recuperação (única da cadeia).' },
  { event: 'recuperacao-entregue', from: 'recuperacao-em-curso', to: 'concluida', requiresConfirmation: false, description: 'Entregou a recuperação; vale a maior nota.' },
];

export function isContentState(value: string): value is ContentState {
  return (CONTENT_STATES as readonly string[]).includes(value);
}

export function isDisciplineState(value: string): value is DisciplineState {
  return (DISCIPLINE_STATES as readonly string[]).includes(value);
}

export function findTransition<S extends string>(
  transitions: Transition<S>[],
  from: S,
  event: string,
): Transition<S> | undefined {
  return transitions.find((item) => item.from === from && item.event === event);
}
