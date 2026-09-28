// Dados demonstrativos da página Estudar.

export const studyCourse = { name: 'Contabilidade Geral', progress: 42 };

export const studyLesson = {
  eyebrow: 'CONTABILIDADE GERAL · MÓDULO 2',
  title: 'Regime de competência',
  subtitle: 'Você parou em reconhecimento de receitas e despesas.',
  position: 'AULA 4 DE 9',
  minutes: 35,
  heading: 'Reconhecimento de receitas e despesas',
  description: 'Retome diretamente o conceito que conecta o fato gerador ao período contábil correto.',
};

export const sessionSteps = [
  { title: 'Leitura inicial', hint: 'Concluída', status: 'done' },
  { title: 'Reconhecimento contábil', hint: 'Retomar agora', status: 'active' },
  { title: 'Nota de síntese', hint: 'Após o conteúdo', status: 'todo' },
  { title: 'Fixação', hint: '2 questões', status: 'todo' },
] as const;

export const studyModules = [
  { id: 1, status: 'complete', kicker: 'MÓDULO 1 · CONCLUÍDO', title: 'Fundamentos contábeis', description: 'Patrimônio, equação patrimonial, contas, débito e crédito.', progress: '100%' },
  {
    id: 2, status: 'current', kicker: 'MÓDULO 2 · EM ANDAMENTO', title: 'Regimes e reconhecimento',
    description: 'Regime de caixa, regime de competência e ajustes.', progress: '42%',
    lessons: [
      { title: 'Regime de caixa', hint: 'Concluído', status: 'done' },
      { title: 'Regime de competência', hint: 'Continuar de onde parou', status: 'active' },
      { title: 'Ajustes de competência', hint: 'Próximo conteúdo', status: 'todo' },
    ],
  },
  { id: 3, status: 'locked', kicker: 'MÓDULO 3 · BLOQUEADO', title: 'Fechamento e demonstrações', description: 'Liberado após a conclusão dos regimes e reconhecimento.' },
] as const;

export const sessionModal = {
  title: 'Regime de competência',
  description: '35 minutos · teoria, anotação e duas questões de fixação.',
};
