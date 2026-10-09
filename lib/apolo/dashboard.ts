// Painel do banco e do Apolo (APO-22): junta dados que já existiam em
// módulos separados (estatística de itens — APO-10; acervo no R2 — APO-05;
// modelo do aluno — APO-09) com uma visão nova — cobertura do banco por
// tema/conteúdo/Bloom/dificuldade — para o Abner ver numa tela só onde o
// banco está fraco e o que o Apolo andou decidindo. Tudo recalculado do
// zero a cada chamada (DEC-017), sem nenhum estado próprio.
import type { D1Like } from '../pedagogy/transitions.js';
import { getItemAudit, type ItemAudit } from './item-audit.js';
import { listSources } from './sources.js';
import { getStudentProfile } from './profile.js';
import type { SelectionReason } from './selector.js';
import type { DifficultyLevel } from './types.js';

// Teto de questões ativas por conteúdo abaixo do qual o Abner precisa
// reforçar o banco (card: "menos de 30 questões ativas, por tema").
export const LOW_BANK_THRESHOLD = 30;

export type ContentCoverage = {
  contentId: string;
  contentTitle: string;
  theme: string | null;
  active: number;
  byBloom: Record<string, number>;
  byDifficulty: Record<DifficultyLevel | 'sem_dificuldade', number>;
  low: boolean;
};

export type ThemeCoverage = {
  theme: string;
  active: number;
  contents: ContentCoverage[];
  lowContents: number;
};

export type BankCoverage = {
  themes: ThemeCoverage[];
  // Conteúdos sem tema atribuído ainda (APO-02): aparecem aqui, fora de
  // qualquer tema, para não desaparecer do painel.
  withoutTheme: ContentCoverage[];
};

type QuestionRow = {
  content_id: string;
  content_title: string;
  theme: string | null;
  bloom_level: string | null;
  difficulty_nominal: string | null;
};

// Pura: agrupa linhas de questão ativa em cobertura por conteúdo e por tema.
export function bankCoverageOf(rows: QuestionRow[]): BankCoverage {
  const byContent = new Map<string, ContentCoverage>();
  for (const row of rows) {
    let entry = byContent.get(row.content_id);
    if (!entry) {
      entry = {
        contentId: row.content_id,
        contentTitle: row.content_title,
        theme: row.theme,
        active: 0,
        byBloom: {},
        byDifficulty: { facil: 0, media: 0, dificil: 0, sem_dificuldade: 0 },
        low: false,
      };
      byContent.set(row.content_id, entry);
    }
    entry.active += 1;
    const bloom = row.bloom_level ?? 'sem_bloom';
    entry.byBloom[bloom] = (entry.byBloom[bloom] ?? 0) + 1;
    const difficulty = (row.difficulty_nominal as DifficultyLevel | null) ?? 'sem_dificuldade';
    entry.byDifficulty[difficulty] = (entry.byDifficulty[difficulty] ?? 0) + 1;
  }
  const contents = [...byContent.values()].map((entry) => ({ ...entry, low: entry.active < LOW_BANK_THRESHOLD }));
  const themes = new Map<string, ContentCoverage[]>();
  const withoutTheme: ContentCoverage[] = [];
  for (const content of contents) {
    if (!content.theme) {
      withoutTheme.push(content);
      continue;
    }
    const list = themes.get(content.theme) ?? [];
    list.push(content);
    themes.set(content.theme, list);
  }
  return {
    themes: [...themes.entries()]
      .map(([theme, list]) => ({
        theme,
        active: list.reduce((sum, item) => sum + item.active, 0),
        contents: list.sort((a, b) => a.contentTitle.localeCompare(b.contentTitle)),
        lowContents: list.filter((item) => item.low).length,
      }))
      .sort((a, b) => a.theme.localeCompare(b.theme)),
    withoutTheme: withoutTheme.sort((a, b) => a.contentTitle.localeCompare(b.contentTitle)),
  };
}

export async function getBankCoverage(db: D1Like): Promise<BankCoverage> {
  const { results: rows } = await db
    .prepare(
      `SELECT q.content_id, c.title AS content_title, q.theme, q.bloom_level, q.difficulty_nominal
       FROM atlas_questions q JOIN atlas_contents c ON c.id = q.content_id
       WHERE q.lifecycle_state = 'ativa'`,
    )
    .all<QuestionRow>();
  return bankCoverageOf(rows);
}

export type SourcesSummary = {
  count: number;
  totalBytes: number;
  byTheme: { theme: string; count: number; bytes: number }[];
};

// Pura: agrega o acervo (APO-05) em contagem e bytes, por tema.
export function sourcesSummaryOf(sources: { theme: string | null; sizeBytes: number }[]): SourcesSummary {
  const byTheme = new Map<string, { count: number; bytes: number }>();
  for (const source of sources) {
    const theme = source.theme ?? 'sem tema';
    const entry = byTheme.get(theme) ?? { count: 0, bytes: 0 };
    entry.count += 1;
    entry.bytes += source.sizeBytes;
    byTheme.set(theme, entry);
  }
  return {
    count: sources.length,
    totalBytes: sources.reduce((sum, item) => sum + item.sizeBytes, 0),
    byTheme: [...byTheme.entries()]
      .map(([theme, entry]) => ({ theme, ...entry }))
      .sort((a, b) => a.theme.localeCompare(b.theme)),
  };
}

export type ThemeSkill = { theme: string; elo: number; answers: number; correct: number };

// Pura: o ponto do usuário por tema (APO-09) — média do Elo de
// tema×conteúdo×subtópico ponderada pelo número de respostas de cada
// combinação, para um tema com mais histórico pesar mais que um com uma
// única resposta.
export function themeSkillOf(skills: { theme: string; elo: number; answers: number; correct: number }[]): ThemeSkill[] {
  const byTheme = new Map<string, { eloWeighted: number; answers: number; correct: number }>();
  for (const skill of skills) {
    const entry = byTheme.get(skill.theme) ?? { eloWeighted: 0, answers: 0, correct: 0 };
    entry.eloWeighted += skill.elo * skill.answers;
    entry.answers += skill.answers;
    entry.correct += skill.correct;
    byTheme.set(skill.theme, entry);
  }
  return [...byTheme.entries()]
    .map(([theme, entry]) => ({
      theme,
      elo: entry.answers ? Math.round(entry.eloWeighted / entry.answers) : 1200,
      answers: entry.answers,
      correct: entry.correct,
    }))
    .sort((a, b) => a.theme.localeCompare(b.theme));
}

export type AssembledExamQuestion = { questionId: string; correct: boolean; voided: boolean; reason: SelectionReason | null };
export type AssembledExam = {
  attemptId: string;
  disciplineId: string;
  disciplineTitle: string;
  instrument: string;
  submittedAt: string | null;
  questions: AssembledExamQuestion[];
};

type ExamAttemptRow = {
  id: string;
  discipline_id: string;
  discipline_title: string;
  instrument: string;
  submitted_at: string | null;
  questions_json: string;
  result_json: string | null;
};

// Pura: junta o boletim (correct/voided por questão) com o motivo gravado na
// montagem da prova (APO-22, novo campo aditivo `selectionReasons` em
// StoredExamQuestions — ausente em provas montadas antes deste card, ou
// sem seletor adaptativo: aparece `reason: null`, nunca inventado).
export function assembledExamOf(row: ExamAttemptRow): AssembledExam {
  const stored = JSON.parse(row.questions_json) as { questionIds: string[]; selectionReasons?: Record<string, SelectionReason> };
  const result = row.result_json
    ? (JSON.parse(row.result_json) as { results?: { questionId: string; correct: boolean; voided: boolean }[] })
    : null;
  const byId = new Map((result?.results ?? []).map((item) => [item.questionId, item]));
  return {
    attemptId: row.id,
    disciplineId: row.discipline_id,
    disciplineTitle: row.discipline_title,
    instrument: row.instrument,
    submittedAt: row.submitted_at,
    questions: stored.questionIds.map((questionId) => ({
      questionId,
      correct: byId.get(questionId)?.correct ?? false,
      voided: byId.get(questionId)?.voided ?? false,
      reason: stored.selectionReasons?.[questionId] ?? null,
    })),
  };
}

export async function getLastAssembledExams(db: D1Like, limit = 10): Promise<AssembledExam[]> {
  const { results: rows } = await db
    .prepare(
      `SELECT a.id, a.discipline_id, d.title AS discipline_title, a.instrument, a.submitted_at, a.questions_json, a.result_json
       FROM atlas_exam_attempts a JOIN atlas_disciplines d ON d.id = a.discipline_id
       ORDER BY COALESCE(a.submitted_at, a.started_at) DESC LIMIT ?1`,
    )
    .bind(limit)
    .all<ExamAttemptRow>();
  return rows.map(assembledExamOf);
}

export type ApoloPanel = {
  coverage: BankCoverage;
  audit: ItemAudit;
  sources: SourcesSummary;
  skillByTheme: ThemeSkill[];
  lastExams: AssembledExam[];
};

export async function getApoloPanel(db: D1Like): Promise<ApoloPanel> {
  const [coverage, audit, sources, profile, lastExams] = await Promise.all([
    getBankCoverage(db),
    getItemAudit(db),
    listSources(db),
    getStudentProfile(db),
    getLastAssembledExams(db),
  ]);
  return {
    coverage,
    audit,
    sources: sourcesSummaryOf(sources),
    skillByTheme: themeSkillOf(profile.temas),
    lastExams,
  };
}
