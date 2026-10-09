// APO-22: painel do banco e do Apolo — cobertura por tema/conteúdo/Bloom/
// dificuldade (nova), acervo e espaço no R2 (APO-05), ponto do usuário por
// tema (APO-09) e últimas provas montadas com o motivo de cada questão
// (persistido de forma aditiva em StoredExamQuestions.selectionReasons).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LOW_BANK_THRESHOLD,
  assembledExamOf,
  bankCoverageOf,
  getApoloPanel,
  sourcesSummaryOf,
  themeSkillOf,
} from '../lib/apolo/dashboard.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

void test('bankCoverageOf: agrupa por conteúdo e por tema; sinaliza abaixo do teto; conteúdo sem tema fica fora de qualquer tema', () => {
  const rows = [
    { content_id: 'A', content_title: 'Conteúdo A', theme: 'tema-1', bloom_level: 'lembrar', difficulty_nominal: 'facil' },
    { content_id: 'A', content_title: 'Conteúdo A', theme: 'tema-1', bloom_level: 'aplicar', difficulty_nominal: 'media' },
    { content_id: 'B', content_title: 'Conteúdo B', theme: 'tema-1', bloom_level: null, difficulty_nominal: null },
    { content_id: 'C', content_title: 'Conteúdo C', theme: null, bloom_level: null, difficulty_nominal: 'dificil' },
  ];
  const coverage = bankCoverageOf(rows);
  assert.equal(coverage.themes.length, 1);
  const [tema1] = coverage.themes;
  assert.equal(tema1.theme, 'tema-1');
  assert.equal(tema1.active, 3);
  assert.equal(tema1.lowContents, 2, 'A (2 questões) e B (1 questão) ficam abaixo do teto de 30');
  const a = tema1.contents.find((item) => item.contentId === 'A')!;
  assert.equal(a.active, 2);
  assert.deepEqual(a.byBloom, { lembrar: 1, aplicar: 1 });
  assert.equal(a.low, true);
  assert.equal(coverage.withoutTheme.length, 1);
  assert.equal(coverage.withoutTheme[0].contentId, 'C');
});

void test('bankCoverageOf: conteúdo com LOW_BANK_THRESHOLD questões ativas não fica marcado como baixo', () => {
  const rows = Array.from({ length: LOW_BANK_THRESHOLD }, () => ({
    content_id: 'X',
    content_title: 'Conteúdo X',
    theme: 'tema-x',
    bloom_level: null,
    difficulty_nominal: null,
  }));
  const coverage = bankCoverageOf(rows);
  assert.equal(coverage.themes[0].contents[0].low, false);
});

void test('sourcesSummaryOf: conta e soma bytes, por tema; sem tema cai em "sem tema"', () => {
  const summary = sourcesSummaryOf([
    { theme: 'direito', sizeBytes: 1000 },
    { theme: 'direito', sizeBytes: 2000 },
    { theme: null, sizeBytes: 500 },
  ]);
  assert.equal(summary.count, 3);
  assert.equal(summary.totalBytes, 3500);
  assert.deepEqual(summary.byTheme, [
    { theme: 'direito', count: 2, bytes: 3000 },
    { theme: 'sem tema', count: 1, bytes: 500 },
  ]);
});

void test('themeSkillOf: média do Elo ponderada pelo número de respostas de cada combinação tema×conteúdo×subtópico', () => {
  const result = themeSkillOf([
    { theme: 'direito', elo: 1200, answers: 10, correct: 6 },
    { theme: 'direito', elo: 1400, answers: 30, correct: 24 },
    { theme: 'matematica', elo: 1000, answers: 5, correct: 1 },
  ]);
  const direito = result.find((item) => item.theme === 'direito')!;
  // (1200*10 + 1400*30) / 40 = 1350
  assert.equal(direito.elo, 1350);
  assert.equal(direito.answers, 40);
  assert.equal(direito.correct, 30);
  const matematica = result.find((item) => item.theme === 'matematica')!;
  assert.deepEqual(matematica, { theme: 'matematica', elo: 1000, answers: 5, correct: 1 });
});

void test('assembledExamOf: junta o boletim (correct/voided) com o motivo gravado na montagem; sem motivo gravado, reason fica null', () => {
  const row = {
    id: 'ex1',
    discipline_id: 'D1',
    discipline_title: 'Contabilidade',
    instrument: 'exame_meio',
    submitted_at: '2026-10-09T00:00:00.000Z',
    questions_json: JSON.stringify({
      questionIds: ['q1', 'q2', 'q3'],
      selectionReasons: { q1: 'subtopico-fraco' },
    }),
    result_json: JSON.stringify({
      results: [
        { questionId: 'q1', correct: true, voided: false },
        { questionId: 'q2', correct: false, voided: false },
      ],
    }),
  };
  const exam = assembledExamOf(row);
  assert.deepEqual(exam.questions, [
    { questionId: 'q1', correct: true, voided: false, reason: 'subtopico-fraco' },
    { questionId: 'q2', correct: false, voided: false, reason: null },
    // q3 nunca respondida (ex.: tentativa em andamento): sem resultado no boletim, mas aparece.
    { questionId: 'q3', correct: false, voided: false, reason: null },
  ]);
});

void test('getApoloPanel: lê do D1 sem quebrar com o banco semeado (sem tema/Bloom/dificuldade ainda) e sem nenhuma prova montada', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  const panel = await getApoloPanel(db);
  // O banco semeado (MVP-04) não tem tema/Bloom/dificuldade atribuídos ainda — tudo cai em "sem tema".
  assert.equal(panel.coverage.themes.length, 0);
  assert.ok(panel.coverage.withoutTheme.length > 0);
  const cg001 = panel.coverage.withoutTheme.find((item) => item.contentId === 'CG-001')!;
  assert.ok(cg001.active > 0);
  assert.equal(cg001.low, cg001.active < LOW_BANK_THRESHOLD);
  assert.deepEqual(panel.sources, { count: 0, totalBytes: 0, byTheme: [] });
  assert.deepEqual(panel.lastExams, []);
  assert.deepEqual(panel.skillByTheme, []);
});
