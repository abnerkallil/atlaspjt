// MVP-07: progresso determinístico (DEC-02) — fórmula versionada, origem de
// cada componente, proficiência, retenção, consistência e leitura do D1.
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTransition } from '../lib/pedagogy/transitions.js';
import {
  DEFAULT_WEIGHTS,
  FORMULA_VERSION,
  computeProgress,
  loadProgressInput,
  reviewTally,
  validateWeights,
  type ProgressInput,
} from '../lib/progress.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T15:00:00.000Z';
const today = '2026-10-08';

const input = (overrides: Partial<ProgressInput> = {}): ProgressInput => ({
  disciplines: [
    {
      id: 'D1',
      title: 'Contabilidade',
      contents: [
        { id: 'A', title: 'Conteúdo A', state: 'revalidado' },
        { id: 'B', title: 'Conteúdo B', state: 'concluido' },
        { id: 'C', title: 'Conteúdo C', state: 'em-revisao-ativa' },
        { id: 'D', title: 'Conteúdo D', state: 'nao-iniciado' },
      ],
    },
  ],
  attempts: [],
  events: [],
  sessions: [],
  ...overrides,
});

void test('pesos padrão do DEC-02 somam 100 e os limites de ±10 pp são verificados', () => {
  assert.equal(FORMULA_VERSION, 'v1');
  assert.deepEqual(validateWeights(DEFAULT_WEIGHTS), []);
  assert.equal(validateWeights({ ...DEFAULT_WEIGHTS, avaliacoes: 41, cobertura: 9 }).length, 2);
  assert.match(validateWeights({ ...DEFAULT_WEIGHTS, quiz: 20 }).join(' '), /somam 105%/);
});

void test('sem histórico tudo é zero, mas a cobertura já conta e cada número diz de onde veio', () => {
  const report = computeProgress(input(), { now, today, tzOffsetMinutes: 180 });
  const [discipline] = report.disciplines;
  const byKey = Object.fromEntries(discipline.components.map((item) => [item.key, item]));
  assert.equal(byKey.cobertura.detail, '2 de 4 conteúdos concluídos.');
  assert.equal(byKey.cobertura.points, 10);
  assert.equal(byKey.avaliacoes.available, false);
  assert.equal(byKey.revisao.detail, 'Nenhuma revisão vencida ainda.');
  assert.equal(discipline.score, 10);
  assert.equal(report.overall.mastery, 10);
  assert.equal(discipline.mastery, 10);
  assert.deepEqual(report.consistency, { days: Array(28).fill(0), streak: 0, studiedDays: 0 });
  assert.deepEqual(
    report.atRisk.map((item) => [item.id, item.state]),
    [['C', 'em-revisao-ativa']],
  );
});

void test('quiz usa a melhor nota por conteúdo; revisão conta etapas vencidas e aprovadas', () => {
  const report = computeProgress(
    input({
      attempts: [
        { contentId: 'A', purpose: 'quiz', score: 60, passed: false, submittedAt: '2026-09-01T10:00:00.000Z' },
        { contentId: 'A', purpose: 'quiz', score: 90, passed: true, submittedAt: '2026-09-02T10:00:00.000Z' },
        { contentId: 'B', purpose: 'quiz', score: 70, passed: true, submittedAt: '2026-10-01T10:00:00.000Z' },
        { contentId: 'A', purpose: 'revisao', score: 80, passed: true, submittedAt: '2026-09-03T10:00:00.000Z' },
        { contentId: 'A', purpose: 'revisao', score: 50, passed: false, submittedAt: '2026-09-09T10:00:00.000Z' },
        { contentId: 'A', purpose: 'corretivo', score: 100, passed: true, submittedAt: '2026-09-10T10:00:00.000Z' },
      ],
      events: [
        { contentId: 'A', event: 'quiz-aprovado', occurredAt: '2026-09-02T10:00:00.000Z' },
        { contentId: 'A', event: 'revisao-aprovada', occurredAt: '2026-09-03T10:00:00.000Z' },
        { contentId: 'A', event: 'revisao-aprovada', occurredAt: '2026-09-10T10:00:00.000Z' },
        { contentId: 'B', event: 'quiz-aprovado', occurredAt: '2026-10-01T10:00:00.000Z' },
      ],
    }),
    { now, today, tzOffsetMinutes: 180 },
  );
  const [discipline] = report.disciplines;
  const byKey = Object.fromEntries(discipline.components.map((item) => [item.key, item]));
  // A: 24h, 7d e 30d vencidas (30d em 02/10), 2 aprovadas. B: 24h e 7d vencidas, nenhuma aprovada.
  assert.equal(byKey.revisao.detail, '2 de 5 revisões vencidas aprovadas.');
  assert.equal(byKey.revisao.points, 6);
  assert.equal(byKey.quiz.points, 12, 'média (90 + 70) / 2 = 80% de 15');
  assert.equal(discipline.score, 28);
  // Proficiência: últimas 5 tentativas em ordem (60 sai).
  assert.equal(discipline.proficiency, Math.round((90 + 80 + 50 + 100 + 70) / 5));
  assert.deepEqual([discipline.retention, discipline.reviewsTaken], [50, 2]);
  assert.equal(discipline.history.retention.at(-1), 50);
  assert.equal(discipline.history.proficiency.length, 8);
});

void test('reviewTally ignora revisões de um ciclo anterior', () => {
  const tally = reviewTally(
    [
      { contentId: 'A', event: 'quiz-aprovado', occurredAt: '2026-09-01T00:00:00.000Z' },
      { contentId: 'A', event: 'revisao-aprovada', occurredAt: '2026-09-02T00:00:00.000Z' },
      { contentId: 'A', event: 'dispensa-proficiencia', occurredAt: '2026-10-05T00:00:00.000Z' },
    ],
    now,
  );
  assert.deepEqual(tally, { due: 1, passed: 0 });
});

void test('consistência pelo dia local e sequência até hoje', () => {
  const report = computeProgress(
    input({
      sessions: [
        { activeSeconds: 45 * 60, at: '2026-10-08T02:00:00.000Z' }, // 07/10 às 23h em UTC−3
        { activeSeconds: 20 * 60, at: '2026-10-08T12:00:00.000Z' },
        { activeSeconds: 10 * 60, at: '2026-10-05T12:00:00.000Z' },
        { activeSeconds: 30, at: '2026-10-01T12:00:00.000Z' },
        { activeSeconds: 600, at: '2026-09-01T12:00:00.000Z' },
      ],
    }),
    { now, today, tzOffsetMinutes: 180 },
  );
  assert.deepEqual(report.consistency.days.slice(-4), [10, 0, 45, 20]);
  assert.equal(report.consistency.streak, 2);
  const yesterdayOnly = computeProgress(input({ sessions: [{ activeSeconds: 600, at: '2026-10-07T12:00:00.000Z' }] }), {
    now,
    today,
    tzOffsetMinutes: 180,
  });
  assert.equal(yesterdayOnly.consistency.streak, 1, 'hoje sem estudo ainda não quebra a sequência');
  assert.equal(report.consistency.days[20], 1, '30 s de estudo contam como 1 min');
  assert.equal(report.consistency.studiedDays, 4, 'sessão fora dos 28 dias não conta');
});

void test('loadProgressInput lê estados, quizzes enviados, auditoria e sessões do D1', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario', reason: 'teste' }, { now });
  const loaded = await loadProgressInput(db);
  assert.ok(loaded.disciplines.length > 0);
  const content = loaded.disciplines.flatMap((item) => item.contents).find((item) => item.id === 'CG-001');
  assert.equal(content?.state, 'em-estudo');
  assert.ok(content?.title);
  assert.deepEqual(loaded.attempts, []);
});
