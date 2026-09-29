// Dados demonstrativos do Roadmap. A lógica real de pré-requisitos e progresso é MVP-01/MVP-07.

export type PedagogicalState =
  | 'nao-iniciado'
  | 'em-estudo'
  | 'praticado'
  | 'dominado'
  | 'em-revisao'
  | 'em-risco'
  | 'bloqueado';

export const STATE_META: Record<PedagogicalState, { label: string; hint: string }> = {
  'nao-iniciado': { label: 'Não iniciado', hint: 'Liberado, ainda sem sessão de estudo.' },
  'em-estudo': { label: 'Em estudo', hint: 'Teoria em andamento.' },
  praticado: { label: 'Praticado', hint: 'Teoria concluída e exercícios feitos.' },
  dominado: { label: 'Dominado', hint: 'Comprovado em avaliação recente.' },
  'em-revisao': { label: 'Em revisão', hint: 'Revisão espaçada programada.' },
  'em-risco': { label: 'Em risco', hint: 'Retenção abaixo do esperado.' },
  bloqueado: { label: 'Bloqueado', hint: 'Depende de pré-requisitos ainda não cumpridos.' },
};

export type RoadmapContent = {
  id: string;
  title: string;
  state: PedagogicalState;
  minutes: number;
  prerequisites: string[];
  penalty?: { points: number; reason: string; recovery: string };
};

export type RoadmapDiscipline = {
  id: string;
  name: string;
  raw: number;
  adjusted: number;
  contents: RoadmapContent[];
};

export type RoadmapPhase = {
  id: string;
  name: string;
  summary: string;
  status: 'concluida' | 'atual' | 'futura';
  raw: number;
  adjusted: number;
  disciplines: RoadmapDiscipline[];
};

export const roadmapPhases: RoadmapPhase[] = [
  {
    id: 'fase-1',
    name: 'Base Contábil',
    summary: 'Fundamentos, regimes e reconhecimento.',
    status: 'atual',
    raw: 68,
    adjusted: 61,
    disciplines: [
      {
        id: 'contabilidade-geral',
        name: 'Contabilidade Geral',
        raw: 72,
        adjusted: 64,
        contents: [
          { id: 'c-fundamentos', title: 'Patrimônio e equação patrimonial', state: 'dominado', minutes: 40, prerequisites: [] },
          { id: 'c-debito-credito', title: 'Débito e crédito', state: 'em-risco', minutes: 35, prerequisites: ['c-fundamentos'],
            penalty: { points: 6, reason: 'Acerto de 48% no último quiz.', recovery: 'Refazer o quiz de recuperação com 70% ou mais.' } },
          { id: 'c-caixa', title: 'Regime de caixa', state: 'praticado', minutes: 30, prerequisites: ['c-fundamentos'] },
          { id: 'c-competencia', title: 'Regime de competência', state: 'em-estudo', minutes: 35, prerequisites: ['c-caixa'] },
          { id: 'c-ajustes', title: 'Ajustes de competência', state: 'nao-iniciado', minutes: 30, prerequisites: ['c-competencia'] },
          { id: 'c-balancete', title: 'Construção de balancete', state: 'bloqueado', minutes: 45, prerequisites: ['c-debito-credito', 'c-competencia'] },
        ],
      },
      {
        id: 'matematica-financeira',
        name: 'Matemática Financeira',
        raw: 58,
        adjusted: 55,
        contents: [
          { id: 'm-juros', title: 'Juros simples e compostos', state: 'em-revisao', minutes: 40, prerequisites: [] },
          { id: 'm-descontos', title: 'Descontos', state: 'praticado', minutes: 30, prerequisites: ['m-juros'] },
          { id: 'm-series', title: 'Séries de pagamentos', state: 'bloqueado', minutes: 45, prerequisites: ['m-juros', 'm-descontos'],
            penalty: { points: 3, reason: 'Revisão de juros compostos atrasada há 4 dias.', recovery: 'Concluir a revisão programada.' } },
        ],
      },
    ],
  },
  {
    id: 'fase-2',
    name: 'Demonstrações Contábeis',
    summary: 'Fechamento e leitura das demonstrações.',
    status: 'futura',
    raw: 0,
    adjusted: 0,
    disciplines: [
      {
        id: 'demonstracoes',
        name: 'Demonstrações Financeiras',
        raw: 0,
        adjusted: 0,
        contents: [
          { id: 'd-dre', title: 'Demonstração do resultado', state: 'bloqueado', minutes: 40, prerequisites: ['c-balancete'] },
          { id: 'd-bp', title: 'Balanço patrimonial', state: 'bloqueado', minutes: 45, prerequisites: ['c-balancete'] },
        ],
      },
    ],
  },
  {
    id: 'fase-0',
    name: 'Nivelamento',
    summary: 'Revisão inicial de pré-requisitos gerais.',
    status: 'concluida',
    raw: 100,
    adjusted: 100,
    disciplines: [
      {
        id: 'nivelamento',
        name: 'Raciocínio Quantitativo',
        raw: 100,
        adjusted: 100,
        contents: [
          { id: 'n-porcentagem', title: 'Porcentagem e proporção', state: 'dominado', minutes: 25, prerequisites: [] },
          { id: 'n-leitura', title: 'Leitura de tabelas', state: 'dominado', minutes: 20, prerequisites: [] },
        ],
      },
    ],
  },
];

export const roadmapChanges = [
  { id: 'ch-1', date: '1 set', change: 'Balancete movido para depois de Ajustes de competência.', reason: 'O quiz de débito e crédito indicou base frágil; o balancete exige os dois conteúdos.' },
  { id: 'ch-2', date: '28 ago', change: 'Revisão de Juros compostos antecipada em 2 dias.', reason: 'A retenção estimada caiu abaixo de 70%.' },
  { id: 'ch-3', date: '25 ago', change: 'Séries de pagamentos bloqueada.', reason: 'Pré-requisito Juros ainda em revisão.' },
];

export const roadmapPhaseOrder = ['fase-0', 'fase-1', 'fase-2'];
