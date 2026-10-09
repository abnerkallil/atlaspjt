// Simulador do Apolo (APO-23): prova, com alunos sintéticos de habilidade
// conhecida respondendo pelo modelo de Rasch (mesma forma logística do Elo,
// `lib/apolo/skill.ts`), que os algoritmos do motor se comportam como o
// desenho pretende — sem precisar do banco real (ainda pequeno, em
// curadoria) nem de alunos de verdade. Tudo função pura e determinística
// (mesma semente, mesmo resultado); nenhuma chamada ao D1 aqui.
//
// Metas medidas (ver docs/APOLO.md, "Painel do simulador"): Elo converge
// para a habilidade verdadeira dentro da faixa de dificuldade cadastrada
// (±100 pontos com 300+ respostas); o seletor nunca ultrapassa o plano nem
// a cota por conteúdo, e expõe o banco inteiro (nenhum item nunca
// escolhido, nenhum item escolhido sempre) quando há mais itens que o
// necessário; o KR-20 de uma prova de 60 itens bem calibrada ao Elo da
// população chega a 0,80 — a meta que o card pede.
import { kFactor, DIFFICULTY_ELO, INITIAL_ELO } from './skill.js';
import { kr20 } from './item-stats.js';
import { probability } from './proficiency.js';
import type { CandidateQuestion, SelectInput } from './selector.js';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from './types.js';

export { probability };

// Mesmo mulberry32 de lib/quizzes.ts/lib/apolo/selector.ts (não exportado
// de lá) — determinístico a partir de uma semente em texto. Nome próprio
// (não `seededRandom`) para não colidir com o gerador de moldes
// (lib/apolo/generators.ts), que exporta um com o mesmo nome e outro uso.
export function simulatorRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SyntheticAnswer = { difficulty: DifficultyLevel; correct: boolean };

// Um aluno sintético de habilidade (θ) fixa respondendo `n` questões cuja
// dificuldade nominal é sorteada entre as 3 faixas cadastradas
// (`DIFFICULTY_ELO`, lib/apolo/skill.ts) — mesmo universo que o modelo do
// aluno (APO-09) usa de oponente.
export function simulateStudentAnswers(theta: number, n: number, seed: string): SyntheticAnswer[] {
  const random = simulatorRandom(seed);
  const levels = Object.keys(DIFFICULTY_ELO) as DifficultyLevel[];
  const answers: SyntheticAnswer[] = [];
  for (let i = 0; i < n; i += 1) {
    const difficulty = levels[Math.floor(random() * levels.length)];
    const correct = random() < probability(theta, DIFFICULTY_ELO[difficulty]);
    answers.push({ difficulty, correct });
  }
  return answers;
}

// Mesma conta de `foldSkills` (lib/apolo/skill.ts), mas sem o aparato de
// tema/conteúdo/subtópico — só a trajetória do Elo de UM aluno sintético,
// para medir convergência isolada do resto do modelo.
export function foldEloTrajectory(answers: SyntheticAnswer[]): number[] {
  let elo = INITIAL_ELO;
  let count = 0;
  const trajectory: number[] = [];
  for (const answer of answers) {
    const opponent = DIFFICULTY_ELO[answer.difficulty];
    const expected = probability(elo, opponent);
    const actual = answer.correct ? 1 : 0;
    elo += kFactor(count) * (actual - expected);
    count += 1;
    trajectory.push(elo);
  }
  return trajectory;
}

export type SyntheticItem = CandidateQuestion & { itemElo: number };

// Banco sintético com `n` itens de dificuldade Elo espalhada uniformemente
// num intervalo, todos ativos, cobrindo `contentCount` conteúdos em
// rodízio — o bastante para testar cobertura/exposição e KR-20 sem
// depender do banco real (ainda em curadoria, pequeno). `difficultyNominal`
// roda entre as 3 faixas (em vez de ficar tudo `null`): no seletor fora do
// modo adaptativo (lib/apolo/selector.ts), itens com a mesma falta de
// cobertura empatam e o desempate por sorteio só olha os 5 primeiros do
// array — sem a rotação, o banco nunca circularia por igual.
export function syntheticBank(options: { count: number; spread: number; center?: number; contentCount?: number }): SyntheticItem[] {
  const { count, spread, center = INITIAL_ELO, contentCount = 1 } = options;
  return Array.from({ length: count }, (_, index) => {
    const itemElo = count === 1 ? center : center - spread / 2 + (spread * index) / (count - 1);
    return {
      id: `sim-item-${index}`,
      contentId: `sim-content-${index % contentCount}`,
      kind: 'multipla' as const,
      theme: 'sim-tema',
      subtopicId: null,
      bloomLevel: null,
      difficultyNominal: DIFFICULTY_LEVELS[index % DIFFICULTY_LEVELS.length],
      lifecycleState: 'ativa' as const,
      itemModelId: null,
      itemElo,
    };
  });
}

// Alunos sintéticos com θ espalhado uniformemente num intervalo — uma
// população, não um único aluno (para KR-20, que precisa de variância
// entre aplicações).
export function syntheticStudents(count: number, spread: number, center = INITIAL_ELO): number[] {
  return Array.from({ length: count }, (_, index) => (count === 1 ? center : center - spread / 2 + (spread * index) / (count - 1)));
}

export type SimulatedExam = { items: { correct: number; answers: number }[]; scores: number[] };

// Aplica o banco sintético (dificuldade Elo contínua) à população de
// alunos sintéticos, pelo modelo de Rasch — para medir o KR-20 que o
// desenho do Apolo produziria com itens bem calibrados.
export function simulateExam(items: SyntheticItem[], students: number[], seed: string): SimulatedExam {
  const random = simulatorRandom(seed);
  const itemStats = items.map(() => ({ correct: 0, answers: 0 }));
  const scores: number[] = [];
  for (const theta of students) {
    let correctCount = 0;
    for (let index = 0; index < items.length; index += 1) {
      const correct = random() < probability(theta, items[index].itemElo);
      itemStats[index].answers += 1;
      if (correct) {
        itemStats[index].correct += 1;
        correctCount += 1;
      }
    }
    scores.push((correctCount / items.length) * 100);
  }
  return { items: itemStats, scores };
}

export function simulatedKr20(items: SyntheticItem[], students: number[], seed: string): number | null {
  const exam = simulateExam(items, students, seed);
  return kr20(exam.items, exam.scores);
}

// Monta `runs` provas com `selectQuestions` (lib/apolo/selector.ts), uma
// semente diferente por rodada — para medir se o banco inteiro circula
// (exposição) e se nenhuma regra do plano é violada.
export function simulateAssemblies(
  select: (input: SelectInput) => { questionId: string }[],
  baseInput: Omit<SelectInput, 'seed'>,
  runs: number,
): { assemblies: string[][]; exposure: Map<string, number> } {
  const assemblies: string[][] = [];
  const exposure = new Map<string, number>();
  for (let run = 0; run < runs; run += 1) {
    const selected = select({ ...baseInput, seed: `sim-run-${run}` }).map((item) => item.questionId);
    assemblies.push(selected);
    for (const id of selected) exposure.set(id, (exposure.get(id) ?? 0) + 1);
  }
  return { assemblies, exposure };
}
