// Dados demonstrativos do Quiz. A execução e a correção reais são MVP-04.

export type QuizQuestion =
  | { id: string; kind: 'multipla'; topic: string; prompt: string; options: string[]; correct: number; explanation: string }
  | { id: string; kind: 'discursiva'; topic: string; prompt: string; modelAnswer: string; explanation: string }
  | { id: string; kind: 'caso'; topic: string; context: string; prompt: string; modelAnswer: string; explanation: string };

export const demoQuiz = {
  title: 'Débito e crédito',
  subject: 'Contabilidade Geral',
  durationSeconds: 10 * 60,
  passingScore: 70,
  rules: [
    'Cinco questões: três de múltipla escolha, uma discursiva e um caso prático.',
    'Tempo total de 10 minutos. Ao zerar, o quiz é enviado automaticamente.',
    'Você pode navegar entre as questões e revisar tudo antes de enviar.',
    'Questões discursivas e casos práticos são comparados ao gabarito por autoavaliação.',
    'Nota mínima para aprovação: 70%.',
  ],
  questions: [
    {
      id: 'q1', kind: 'multipla', topic: 'Débito e crédito',
      prompt: 'A empresa recebe R$ 5.000 à vista por um serviço prestado. Qual é o lançamento correto?',
      options: ['Débito em Caixa e crédito em Receita de serviços', 'Débito em Receita de serviços e crédito em Caixa', 'Débito em Caixa e crédito em Capital social', 'Débito em Fornecedores e crédito em Caixa'],
      correct: 0,
      explanation: 'Caixa (ativo) aumenta, portanto é debitado; a receita aumenta e é creditada.',
    },
    {
      id: 'q2', kind: 'multipla', topic: 'Contas patrimoniais',
      prompt: 'Qual das contas abaixo pertence ao passivo?',
      options: ['Estoques', 'Fornecedores', 'Caixa', 'Máquinas e equipamentos'],
      correct: 1,
      explanation: 'Fornecedores representa uma obrigação da empresa, logo é passivo.',
    },
    {
      id: 'q3', kind: 'multipla', topic: 'Regime de competência',
      prompt: 'Pelo regime de competência, uma despesa é reconhecida quando…',
      options: ['o pagamento é efetuado', 'o fato gerador ocorre', 'a nota fiscal é arquivada', 'o exercício social termina'],
      correct: 1,
      explanation: 'A competência associa receitas e despesas ao período em que o fato gerador ocorre, independentemente do caixa.',
    },
    {
      id: 'q4', kind: 'discursiva', topic: 'Equação patrimonial',
      prompt: 'Explique com suas palavras por que o total de débitos é sempre igual ao total de créditos.',
      modelAnswer: 'Cada fato contábil afeta ao menos duas contas, com valores iguais em débito e em crédito (partidas dobradas). Assim, a equação Ativo = Passivo + Patrimônio Líquido se mantém equilibrada.',
      explanation: 'Uma boa resposta cita partidas dobradas e a manutenção da equação patrimonial.',
    },
    {
      id: 'q5', kind: 'caso', topic: 'Construção de balancete',
      context: 'A Loja Aurora comprou R$ 8.000 em mercadorias a prazo e vendeu metade delas por R$ 6.000 à vista no mesmo mês.',
      prompt: 'Descreva os lançamentos da compra e da venda (contas debitadas e creditadas) e indique o efeito no caixa.',
      modelAnswer: 'Compra: D Estoques 8.000 / C Fornecedores 8.000. Venda: D Caixa 6.000 / C Receita de vendas 6.000 e D CMV 4.000 / C Estoques 4.000. O caixa aumenta em R$ 6.000; o pagamento a fornecedores ainda não afetou o caixa.',
      explanation: 'O caso exige separar o efeito patrimonial (compra a prazo) do efeito no caixa (venda à vista).',
    },
  ] satisfies QuizQuestion[],
};

export const REPORT_REASONS = [
  'Enunciado ambíguo ou confuso',
  'Alternativa correta está errada',
  'Gabarito discorda do conteúdo estudado',
  'Erro de digitação ou formatação',
  'Outro motivo',
];
