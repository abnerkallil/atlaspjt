// Dados demonstrativos da página Estudar.

// Progresso zerado: o Atlas começa do zero e o cálculo real ainda não existe (MVP-07).
export const studyCourse = { name: 'Contabilidade Geral', progress: 0 };

export const studyLesson = {
  eyebrow: 'CONTABILIDADE GERAL · MÓDULO 2',
  title: 'Regime de competência',
  subtitle: 'Conteúdo de demonstração da sessão de estudo.',
  position: 'AULA 4 DE 9',
  minutes: 35,
  heading: 'Reconhecimento de receitas e despesas',
  description: 'Retome diretamente o conceito que conecta o fato gerador ao período contábil correto.',
};

type StepStatus = 'done' | 'active' | 'todo';

export const sessionSteps: { title: string; hint: string; status: StepStatus }[] = [
  { title: 'Material de leitura', hint: 'Começar por aqui', status: 'active' },
  { title: 'Vídeo ou PDF', hint: 'Aula gravada e apostila', status: 'todo' },
  { title: 'Atividade prática', hint: '3 lançamentos', status: 'todo' },
  { title: 'Fixação', hint: '2 questões ao encerrar', status: 'todo' },
];

type StudyModule = {
  id: number;
  status: 'complete' | 'current' | 'locked';
  kicker: string;
  title: string;
  description: string;
  progress?: string;
  lessons?: { title: string; hint: string; status: StepStatus }[];
};

export const studyModules: StudyModule[] = [
  { id: 1, status: 'current', kicker: 'MÓDULO 1 · NÃO INICIADO', title: 'Fundamentos contábeis', description: 'Patrimônio, equação patrimonial, contas, débito e crédito.', progress: '0%' },
  {
    id: 2, status: 'current', kicker: 'MÓDULO 2 · NÃO INICIADO', title: 'Regimes e reconhecimento',
    description: 'Regime de caixa, regime de competência e ajustes.', progress: '0%',
    lessons: [
      { title: 'Regime de caixa', hint: 'Não iniciado', status: 'todo' },
      { title: 'Regime de competência', hint: 'Sessão de demonstração', status: 'active' },
      { title: 'Ajustes de competência', hint: 'Próximo conteúdo', status: 'todo' },
    ],
  },
  { id: 3, status: 'locked', kicker: 'MÓDULO 3 · BLOQUEADO', title: 'Fechamento e demonstrações', description: 'Liberado após a conclusão dos regimes e reconhecimento.' },
];

export const sessionModal = {
  title: 'Regime de competência',
  description: '35 minutos · leitura, vídeo ou PDF, atividade prática e notas. Ao encerrar, duas questões de fixação.',
};

// Sessão de estudo (UX-01). Material, atividade e fixação demonstrativos do
// conteúdo "Regime de competência", vinculado ao item CG-021 do catálogo.
export const sessionContentId = 'CG-021';

export type SessionStepId = 'leitura' | 'midia' | 'pratica';

export const sessionPlan: { id: SessionStepId; title: string; hint: string }[] = [
  { id: 'leitura', title: 'Material de leitura', hint: 'Texto-base do conteúdo' },
  { id: 'midia', title: 'Vídeo ou PDF', hint: 'Aula gravada e apostila' },
  { id: 'pratica', title: 'Atividade prática', hint: 'Classifique os lançamentos' },
];

export const sessionReading = {
  title: 'Reconhecimento de receitas e despesas',
  paragraphs: [
    'Pelo regime de competência, receitas e despesas pertencem ao período em que o fato gerador acontece, independentemente de quando o dinheiro entra ou sai do caixa.',
    'A receita é reconhecida quando o serviço é prestado ou a mercadoria é entregue. A despesa é reconhecida quando o recurso é consumido para gerar receita, mesmo que o pagamento aconteça em outro mês.',
    'É isso que permite confrontar, no mesmo período, o esforço (despesas) com o resultado que ele produziu (receitas). Sem esse confronto, o lucro de um mês ficaria distorcido por pagamentos antecipados ou atrasados.',
  ],
  keyIdea: 'Pergunta-guia: em que mês o fato aconteceu? A data do pagamento não decide o período.',
};

export const sessionMedia = {
  video: {
    title: 'Aula 4 · Fato gerador e período contábil',
    minutes: 12,
    transcript: [
      'Hoje vamos separar duas datas que costumam se misturar: a data do fato gerador e a data do pagamento.',
      'Imagine um aluguel de março pago em abril. A despesa é de março, porque foi em março que o imóvel foi usado.',
      'Agora o contrário: um cliente paga em janeiro um serviço que será prestado em fevereiro. Em janeiro, a empresa tem uma obrigação, não uma receita.',
    ],
  },
  pdf: {
    title: 'Apostila · Regime de competência.pdf',
    pages: 8,
    summary: 'Resumo, quadro comparativo entre caixa e competência e 6 exemplos resolvidos.',
  },
};

export const sessionPractice = {
  prompt: 'Em que mês cada fato deve ser reconhecido pelo regime de competência?',
  items: [
    {
      id: 'p1',
      text: 'Aluguel de março, pago em 5 de abril.',
      options: ['Março', 'Abril'],
      answer: 0,
      explanation: 'O imóvel foi usado em março: a despesa é de março, mesmo paga em abril.',
    },
    {
      id: 'p2',
      text: 'Serviço prestado em junho, recebido em julho.',
      options: ['Junho', 'Julho'],
      answer: 0,
      explanation: 'A receita nasce com a prestação do serviço, em junho.',
    },
    {
      id: 'p3',
      text: 'Adiantamento recebido em agosto por um serviço que será prestado em setembro.',
      options: ['Agosto', 'Setembro'],
      answer: 1,
      explanation: 'Em agosto há só uma obrigação com o cliente; a receita é de setembro, quando o serviço é prestado.',
    },
  ],
};

export const sessionFixation = [
  {
    id: 'f1',
    prompt: 'Uma empresa pagou em dezembro o seguro de janeiro a dezembro do ano seguinte. Em dezembro, esse valor é:',
    options: ['Despesa de dezembro', 'Despesa antecipada (ativo)', 'Receita a apropriar'],
    answer: 1,
    explanation: 'O seguro ainda não foi consumido; fica no ativo e vira despesa mês a mês ao longo do ano seguinte.',
  },
  {
    id: 'f2',
    prompt: 'Pelo regime de competência, o que define o período de uma receita?',
    options: ['A data do recebimento', 'A emissão do boleto', 'A ocorrência do fato gerador'],
    answer: 2,
    explanation: 'A receita pertence ao período em que o fato gerador acontece, independentemente do recebimento.',
  },
];

// Intervalos de revisão definidos no DEC-09, contados a partir da conclusão.
export const reviewIntervals = [
  { label: '24h', days: 1 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
];
