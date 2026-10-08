// Leitura do modelo do aluno (APO-09) a partir do histórico real: explode
// atlas_quiz_attempts (só tentativas enviadas) e junta com atlas_questions
// para saber tema/conteúdo/subtópico/dificuldade de cada resposta. Questão
// sem tema (anterior ao Apolo) fica fora — o Apolo só enxerga o que ele
// próprio classificou.
import type { D1Like } from '../pedagogy/transitions.js';
import type { DifficultyLevel } from './types.js';
import { foldMemory, foldSkills, type QuestionMemory, type SkillEvent, type SkillState } from './skill.js';

type AttemptRow = { content_id: string; submitted_at: string; result_json: string };
type QuestionRow = {
  id: string;
  theme: string | null;
  content_id: string;
  subtopic_id: string | null;
  difficulty_nominal: string | null;
};
type StoredResult = { results?: { questionId: string; correct: boolean; voided: boolean }[] };

const CHUNK = 100;

export async function loadSkillEvents(db: D1Like): Promise<SkillEvent[]> {
  const { results: attempts } = await db
    .prepare(
      `SELECT content_id, submitted_at, result_json FROM atlas_quiz_attempts
       WHERE status = 'enviado' AND submitted_at IS NOT NULL AND result_json IS NOT NULL
       ORDER BY submitted_at, id`,
    )
    .all<AttemptRow>();
  if (attempts.length === 0) return [];

  const parsed = attempts.map((row) => ({
    submittedAt: row.submitted_at,
    items: (JSON.parse(row.result_json) as StoredResult).results ?? [],
  }));
  const questionIds = [...new Set(parsed.flatMap((attempt) => attempt.items.map((item) => item.questionId)))];
  if (questionIds.length === 0) return [];

  const meta = new Map<string, QuestionRow>();
  for (let i = 0; i < questionIds.length; i += CHUNK) {
    const chunk = questionIds.slice(i, i + CHUNK);
    const placeholders = chunk.map((_, index) => `?${index + 1}`).join(',');
    const { results: rows } = await db
      .prepare(`SELECT id, theme, content_id, subtopic_id, difficulty_nominal FROM atlas_questions WHERE id IN (${placeholders})`)
      .bind(...chunk)
      .all<QuestionRow>();
    for (const row of rows) meta.set(row.id, row);
  }

  const events: SkillEvent[] = [];
  for (const attempt of parsed) {
    for (const item of attempt.items) {
      if (item.voided) continue;
      const info = meta.get(item.questionId);
      if (!info?.theme) continue;
      events.push({
        theme: info.theme,
        contentId: info.content_id,
        subtopicId: info.subtopic_id,
        questionId: item.questionId,
        difficulty: (info.difficulty_nominal as DifficultyLevel | null) ?? null,
        correct: item.correct,
        at: attempt.submittedAt,
      });
    }
  }
  return events;
}

export type StudentProfile = {
  temas: SkillState[];
  filaRecuperacao: QuestionMemory[];
};

// Recalculado do zero a cada chamada (DEC-017: nenhum estado incremental
// guardado) — reprocessar duas vezes com o mesmo histórico dá o mesmo
// resultado, por construção (foldSkills/foldMemory são funções puras).
export async function getStudentProfile(db: D1Like): Promise<StudentProfile> {
  const events = await loadSkillEvents(db);
  return {
    temas: foldSkills(events),
    filaRecuperacao: [...foldMemory(events)].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  };
}
