// Seletor adaptativo (APO-12, DEC-017): função pura que monta a lista de
// questões de uma prova a partir do plano (APO-11), do perfil do aluno
// (APO-09) e do histórico recente. Mesma entrada (mesmo histórico, mesma
// semente) dá sempre a mesma prova — nenhuma aleatoriedade real, nenhum I/O
// aqui. Nunca seleciona questão fora de `lifecycleState: 'ativa'` (DEC-014):
// rascunho, curadoria e aposentada nunca saem daqui.
//
// Prioridade, nessa ordem: (1) questão da fila de recuperação já vencida
// (APO-09), mais atrasada primeiro; (2) questão de um subtópico fraco
// (Elo de habilidade abaixo do limiar); (3) o resto, cobrindo a mistura de
// tipo/dificuldade do plano (ou, em modo adaptativo, o item mais próximo da
// habilidade do aluno — Rasch de 1 parâmetro, sempre priorização, nunca
// nota, DEC-017). Em cada passo, quando há empate ou várias opções válidas,
// sorteia-se (com semente) entre as 5 melhores, para não expor sempre o
// mesmo item. No máximo uma questão por família de molde (`itemModelId`)
// por prova. Evita repetir o que está em `recentlySeen`; só volta a
// considerar essas questões se não der para completar o plano sem elas —
// nunca falta questão por causa da regra de não repetição.
import { allocateCounts, type ExamPlan } from './plans.js';
import type { StudentProfile } from './profile.js';
import {
  DIFFICULTY_LEVELS,
  QUESTION_KINDS,
  type BloomLevel,
  type DifficultyLevel,
  type LifecycleState,
  type QuestionKind,
} from './types.js';

export type CandidateQuestion = {
  id: string;
  contentId: string;
  kind: QuestionKind;
  theme: string | null;
  subtopicId: string | null;
  bloomLevel: BloomLevel | null;
  difficultyNominal: DifficultyLevel | null;
  lifecycleState: LifecycleState;
  itemModelId: string | null;
};

export type SelectionReason = 'recuperacao-vencida' | 'subtopico-fraco' | 'cobertura-do-plano';
export type SelectedQuestion = { questionId: string; reason: SelectionReason };

export type SelectInput = {
  plan: ExamPlan;
  profile: StudentProfile;
  bank: CandidateQuestion[];
  recentlySeen: string[];
  seed: string;
  now: string;
  // Dificuldade do item (Elo, APO-10) por questão — só lido em modo
  // adaptativo; questão sem valor aqui entra pela cobertura normal do plano.
  itemElo?: Record<string, number>;
  adaptive?: boolean;
};

// Abaixo disso, o grupo tema×conteúdo×subtópico é considerado "fraco" —
// mesmo valor usado como oponente de dificuldade "média" em lib/apolo/skill.ts.
const WEAK_SKILL_ELO = 1150;

// Mesmo mulberry32 de lib/quizzes.ts (seededRandom, não exportado de lá) —
// determinístico a partir de uma semente em texto.
function seededRandom(seed: string) {
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

// Sorteia 1 item entre os `topN` melhores candidatos (menor `score` primeiro).
function pickFromTopN<T>(candidates: T[], score: (item: T) => number, topN: number, random: () => number): T | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((a, b) => score(a) - score(b) || 0);
  const pool = ranked.slice(0, Math.min(topN, ranked.length));
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

function skillKey(theme: string, contentId: string, subtopicId: string | null): string {
  return `${theme}::${contentId}::${subtopicId ?? ''}`;
}

export function selectQuestions(input: SelectInput): SelectedQuestion[] {
  const random = seededRandom(input.seed);
  const active = input.bank.filter((q) => q.lifecycleState === 'ativa');
  const skillByKey = new Map(input.profile.temas.map((s) => [skillKey(s.theme, s.contentId, s.subtopicId), s]));
  const recoveryByQuestion = new Map(input.profile.filaRecuperacao.map((m) => [m.questionId, m]));
  const recentlySeen = new Set(input.recentlySeen);

  const selected: SelectedQuestion[] = [];
  const selectedIds = new Set<string>();
  const usedModels = new Set<string>();
  const difficultyUsed = Object.fromEntries(DIFFICULTY_LEVELS.map((d) => [d, 0])) as Record<DifficultyLevel, number>;
  const kindUsed = Object.fromEntries(QUESTION_KINDS.map((k) => [k, 0])) as Record<QuestionKind, number>;
  const difficultyTargets = allocateCounts(input.plan.difficultyMix, input.plan.size, DIFFICULTY_LEVELS);
  const kindTargets = allocateCounts(input.plan.kindMix, input.plan.size, QUESTION_KINDS);

  function available(excludeRecent: boolean): CandidateQuestion[] {
    return active.filter(
      (q) =>
        !selectedIds.has(q.id) &&
        (q.itemModelId === null || !usedModels.has(q.itemModelId)) &&
        (!excludeRecent || !recentlySeen.has(q.id)),
    );
  }

  function take(question: CandidateQuestion, reason: SelectionReason) {
    selected.push({ questionId: question.id, reason });
    selectedIds.add(question.id);
    if (question.itemModelId) usedModels.add(question.itemModelId);
    if (question.difficultyNominal) difficultyUsed[question.difficultyNominal] += 1;
    kindUsed[question.kind] += 1;
  }

  function fillRecovery(excludeRecent: boolean) {
    while (selected.length < input.plan.size) {
      const pool = available(excludeRecent).filter((q) => {
        const memory = recoveryByQuestion.get(q.id);
        return memory !== undefined && memory.dueAt <= input.now;
      });
      const picked = pickFromTopN(pool, (q) => Date.parse(recoveryByQuestion.get(q.id)!.dueAt), 5, random);
      if (!picked) return;
      take(picked, 'recuperacao-vencida');
    }
  }

  function fillWeakSubtopics(excludeRecent: boolean) {
    while (selected.length < input.plan.size) {
      const pool = available(excludeRecent).filter((q) => {
        if (!q.theme) return false;
        const skill = skillByKey.get(skillKey(q.theme, q.contentId, q.subtopicId));
        return skill !== undefined && skill.elo < WEAK_SKILL_ELO;
      });
      const picked = pickFromTopN(pool, (q) => skillByKey.get(skillKey(q.theme!, q.contentId, q.subtopicId))!.elo, 5, random);
      if (!picked) return;
      take(picked, 'subtopico-fraco');
    }
  }

  // Menor score primeiro. Modo adaptativo (Rasch de 1 parâmetro): distância
  // entre a dificuldade do item (Elo, APO-10) e a habilidade do aluno no tema
  // — quanto mais perto de ~50% de chance de acerto, mais informativo o item
  // (só prioriza, nunca afeta nota, DEC-017); item sem dado suficiente fica
  // por último. Fora do modo adaptativo: o tipo/faixa de dificuldade que o
  // plano ainda mais precisa. As duas escalas nunca se misturam no mesmo
  // sorteio — o modo da chamada decide qual delas vale para todo mundo.
  function coverageScore(q: CandidateQuestion): number {
    if (input.adaptive) {
      const skill = q.theme ? skillByKey.get(skillKey(q.theme, q.contentId, q.subtopicId)) : undefined;
      const itemElo = input.itemElo?.[q.id];
      return skill && itemElo !== undefined ? Math.abs(itemElo - skill.elo) : Number.POSITIVE_INFINITY;
    }
    const difficultyNeed = q.difficultyNominal ? difficultyTargets[q.difficultyNominal] - difficultyUsed[q.difficultyNominal] : 0;
    const kindNeed = kindTargets[q.kind] - kindUsed[q.kind];
    return -(Math.max(0, difficultyNeed) + Math.max(0, kindNeed));
  }

  // Em modo adaptativo o item escolhido é sempre o mais informativo (o mais
  // próximo da habilidade do aluno) — um CAT clássico de Rasch decide assim,
  // não por sorteio; só a cobertura normal do plano sorteia entre os 5
  // melhores, para não expor sempre a mesma questão.
  function fillPlanCoverage(excludeRecent: boolean) {
    const topN = input.adaptive ? 1 : 5;
    while (selected.length < input.plan.size) {
      const pool = available(excludeRecent);
      const picked = pickFromTopN(pool, coverageScore, topN, random);
      if (!picked) return;
      take(picked, 'cobertura-do-plano');
    }
  }

  fillRecovery(true);
  fillWeakSubtopics(true);
  fillPlanCoverage(true);
  // Só volta a considerar "últimas vistas" se não der pra completar sem elas.
  if (selected.length < input.plan.size) {
    fillRecovery(false);
    fillWeakSubtopics(false);
    fillPlanCoverage(false);
  }

  return selected;
}
