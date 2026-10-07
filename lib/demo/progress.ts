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

// Zerados: o Atlas começa do zero e ainda não há cálculo real (MVP-07). Os nomes ficam
// como estrutura da página; os valores sobem quando o cálculo real chegar.
const empty = () => ({ proficiency: 0, mastery: 0, retention: 0, history: { proficiency: [0, 0, 0, 0, 0, 0, 0, 0], retention: [0, 0, 0, 0, 0, 0, 0, 0] } });

export const competencies: Competency[] = [
  { id: 'reconhecimento', name: 'Reconhecimento de receitas e despesas', ...empty() },
  { id: 'lancamentos', name: 'Débito, crédito e lançamentos', ...empty() },
  { id: 'patrimonio', name: 'Contas patrimoniais', ...empty() },
  { id: 'juros', name: 'Juros e descontos', ...empty() },
];

// 28 dias, do mais antigo ao mais recente; valor = minutos estudados.
export const consistencyDays: number[] = Array(28).fill(0);

export const atRisk: { id: string; title: string; competency: string; reason: string; recovery: string }[] = [];

export const recoveryPlan: { id: string; text: string }[] = [];

export const recommendations: { id: string; title: string; why: string; data: string }[] = [];

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
