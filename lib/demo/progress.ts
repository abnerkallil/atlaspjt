// Dados demonstrativos da página Progresso. O cálculo real é MVP-07.

export type Competency = {
  id: string;
  name: string;
  proficiency: number; // desempenho recente em avaliações
  mastery: number; // domínio consolidado (desempenho + retenção + constância)
  retention: number;
  history: { proficiency: number[]; retention: number[] }; // 8 semanas
};

export const WEEK_LABELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

export const competencies: Competency[] = [
  { id: 'reconhecimento', name: 'Reconhecimento de receitas e despesas', proficiency: 78, mastery: 61, retention: 82,
    history: { proficiency: [52, 55, 61, 64, 70, 72, 75, 78], retention: [70, 72, 74, 77, 78, 80, 81, 82] } },
  { id: 'lancamentos', name: 'Débito, crédito e lançamentos', proficiency: 66, mastery: 58, retention: 64,
    history: { proficiency: [70, 72, 74, 73, 70, 68, 67, 66], retention: [80, 78, 75, 72, 69, 67, 65, 64] } },
  { id: 'patrimonio', name: 'Contas patrimoniais', proficiency: 88, mastery: 84, retention: 90,
    history: { proficiency: [60, 66, 72, 78, 82, 85, 87, 88], retention: [75, 78, 82, 85, 87, 88, 89, 90] } },
  { id: 'juros', name: 'Juros e descontos', proficiency: 71, mastery: 55, retention: 69,
    history: { proficiency: [40, 48, 55, 60, 64, 68, 70, 71], retention: [62, 64, 66, 68, 70, 70, 69, 69] } },
];

// 28 dias, do mais antigo ao mais recente; valor = minutos estudados.
export const consistencyDays = [
  35, 40, 0, 25, 30, 45, 0, 30, 0, 20, 35, 40, 25, 0,
  30, 35, 0, 45, 50, 30, 0, 25, 35, 40, 30, 20, 35, 40,
];

export const atRisk = [
  { id: 'r1', title: 'Débito e crédito', competency: 'lancamentos', reason: 'Retenção estimada em 64% e queda por 5 semanas seguidas.', recovery: 'Quiz de recuperação de 10 minutos' },
  { id: 'r2', title: 'Juros compostos', competency: 'juros', reason: 'Revisão programada atrasada há 4 dias.', recovery: 'Revisão espaçada de 15 minutos' },
];

export const recoveryPlan = [
  { id: 'p1', text: 'Refazer o quiz de Débito e crédito (10 min)' },
  { id: 'p2', text: 'Rever a aula de Juros compostos (15 min)' },
  { id: 'p3', text: 'Escrever uma nota de síntese sobre lançamentos (10 min)' },
];

export const recommendations = [
  { id: 'rec1', title: 'Faça a recuperação de Débito e crédito antes do balancete.',
    why: 'O balancete depende de Débito e crédito. Sua retenção nesse conteúdo caiu de 80% para 64% em oito semanas, e errar aqui reduziria o resultado do balancete.',
    data: 'Retenção 64% · proficiência 66% · domínio 58%' },
  { id: 'rec2', title: 'Antecipe a revisão de Juros compostos.',
    why: 'A revisão de 7 dias está atrasada. O domínio (55%) está bem abaixo da proficiência (71%): você acerta questões, mas ainda não consolidou o conteúdo.',
    data: 'Proficiência 71% · domínio 55% · revisão atrasada em 4 dias' },
  { id: 'rec3', title: 'Mantenha o ritmo: prática logo após a teoria.',
    why: 'Nos últimos 30 dias, você reteve mais quando praticou no mesmo dia da teoria (+6% de retenção).',
    data: 'Consistência 7 dias · retenção geral 82%' },
];

// Resumo usado por Hoje e Progresso, para as duas páginas mostrarem os mesmos números.
const average = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);

function trailingStreak(days: number[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0 && days[i] > 0; i -= 1) streak += 1;
  return streak;
}

const weeks = WEEK_LABELS.length;
const retentionAt = (week: number) => average(competencies.map((c) => c.history.retention[week]));

export const progressSummary = {
  mastery: average(competencies.map((c) => c.mastery)),
  retention: average(competencies.map((c) => c.retention)),
  retentionChange: retentionAt(weeks - 1) - retentionAt(0),
  currentStreak: trailingStreak(consistencyDays),
  studiedDays: consistencyDays.filter((minutes) => minutes > 0).length,
};
