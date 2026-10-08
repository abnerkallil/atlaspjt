// APO-09: habilidade Elo por tema sobe com acerto e desce com erro;
// reprocessar o mesmo histórico duas vezes dá o mesmo resultado; o perfil lido
// do D1 real (via um quiz de verdade) aparece em getStudentProfile.
import assert from 'node:assert/strict';
import test from 'node:test';
import { foldMemory, foldSkills, type SkillEvent } from '../lib/apolo/skill.js';
import { getStudentProfile } from '../lib/apolo/index.js';
import { startQuiz, submitQuiz, listQuestions, type Answers } from '../lib/quizzes.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const t0 = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(t0) + seconds * 1000).toISOString();

function event(overrides: Partial<SkillEvent>): SkillEvent {
  return {
    theme: 'direito-constitucional',
    contentId: 'CG-001',
    subtopicId: null,
    questionId: 'Q1',
    difficulty: 'media',
    correct: true,
    at: t0,
    ...overrides,
  };
}

void test('APO-09: acerto sobe a habilidade, erro desce', () => {
  const [afterCorrect] = foldSkills([event({ correct: true })]);
  assert.ok(afterCorrect.elo > 1200);
  const [afterWrong] = foldSkills([event({ correct: false })]);
  assert.ok(afterWrong.elo < 1200);
});

void test('APO-09: reprocessar o mesmo histórico duas vezes dá o mesmo resultado', () => {
  const history: SkillEvent[] = [
    event({ questionId: 'Q1', correct: true, at: at(0) }),
    event({ questionId: 'Q2', correct: false, at: at(60) }),
    event({ questionId: 'Q1', correct: true, at: at(120) }),
    event({ theme: 'contabilidade-geral', contentId: 'CG-002', questionId: 'Q3', correct: false, at: at(180) }),
  ];
  assert.deepEqual(foldSkills(history), foldSkills(history));
  assert.deepEqual(foldMemory(history), foldMemory(history));
});

void test('APO-09: o passo de atualização encolhe com mais respostas (K maior no início)', () => {
  // Habilidade é por tema/conteúdo/subtópico, não por questão: 10 acertos no
  // mesmo grupo viram 1 só estado, cujo ganho por acerto encolhe com o tempo.
  const sequential = Array.from({ length: 10 }, (_, index) => event({ questionId: `Q${index}`, correct: true, at: at(index * 60) }));
  const after = (n: number) => foldSkills(sequential.slice(0, n))[0]!.elo;
  const firstGain = after(1) - 1200;
  const tenthGain = after(10) - after(9);
  assert.ok(tenthGain < firstGain, 'o ganho por acerto deve ficar menor conforme mais respostas se acumulam');
  assert.equal(foldSkills(sequential).length, 1);
});

void test('APO-09: erro aumenta a dificuldade e derruba a estabilidade; acerto faz o oposto', () => {
  const [afterWrong] = foldMemory([event({ questionId: 'Q1', correct: false, at: t0 })]);
  assert.ok(afterWrong.difficulty > 5);
  const [afterRight] = foldMemory([event({ questionId: 'Q1', correct: true, at: t0 })]);
  assert.ok(afterRight.difficulty < 5);
  assert.ok(afterRight.stability > afterWrong.stability);
  assert.ok(Date.parse(afterRight.dueAt) > Date.parse(afterRight.reviewedAt));
});

void test('APO-09: getStudentProfile lê um quiz de verdade do D1 e monta o perfil por tema', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });

  raw.prepare(`UPDATE atlas_questions SET theme = 'direito-constitucional', difficulty_nominal = 'media' WHERE content_id = 'CG-001'`).run();

  await startQuiz(db, 'CG-001', { now: at(100), id: 'a1' });
  const row = raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get('a1') as { questions_json: string };
  const stored = JSON.parse(row.questions_json) as { questionIds: string[] };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  stored.questionIds.forEach((id, index) => {
    const question = bank.get(id)!;
    // Metade certa, metade errada — só para ver as duas direções no perfil.
    const right = index % 2 === 0;
    answers[id] =
      question.kind === 'multipla' || question.kind === 'certo_errado'
        ? { option: right ? question.correctOption! : (question.correctOption! + 1) % (question.options?.length ?? 2) }
        : { text: 'resposta', selfAssessment: right ? 'certa' : 'errada' };
  });
  await submitQuiz(db, 'a1', { answers }, { now: at(400) });

  const profile = await getStudentProfile(db);
  assert.equal(profile.temas.length, 1);
  const [tema] = profile.temas;
  assert.equal(tema!.theme, 'direito-constitucional');
  assert.equal(tema!.contentId, 'CG-001');
  assert.equal(tema!.answers, 10);
  assert.ok(profile.filaRecuperacao.length > 0);

  const reprocessed = await getStudentProfile(db);
  assert.deepEqual(reprocessed, profile);
});
