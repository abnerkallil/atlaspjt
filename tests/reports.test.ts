// MVP-09: relatórios explicáveis — origem da nota, mudanças de estado, risco,
// próxima ação e histórico de um conteúdo.
import assert from 'node:assert/strict';
import test from 'node:test';
import { listQuestions, shuffleQuestion, startQuiz, submitQuiz, type Answers } from '../lib/quizzes.js';
import { assessRisk, atividadeStatusOf, contentReport, nextAction, type ReportFacts } from '../lib/reports.js';
import { concludeSession, startSession } from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const day = '2026-10-08';
const at = (hour: number) => `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;

const facts = (overrides: Partial<ReportFacts> = {}): ReportFacts => ({
  state: 'nao-iniciado',
  locked: false,
  pendingTitles: [],
  recovery: null,
  next: null,
  hasOpenSession: false,
  now: at(12),
  tzOffsetMinutes: 180,
  atividade: { status: null, failures: 0 },
  ...overrides,
});

void test('risco e próxima ação seguem o estado do DEC-03', () => {
  assert.deepEqual(nextAction(facts({ locked: true, pendingTitles: ['Base'] }), 'X'), {
    label: 'Concluir os pré-requisitos',
    detail: 'Antes deste conteúdo: Base.',
    href: '/roadmap',
  });
  assert.equal(assessRisk(facts()).level, 'sem-dados');
  const recovery = { contentId: 'X', failures: 2, lastFailureAt: at(9), lastPurpose: 'quiz', lastScore: 40, missed: [] };
  const blocked = assessRisk(facts({ state: 'bloqueado', recovery }));
  assert.equal(blocked.level, 'alto');
  assert.match(blocked.reasons.join(' '), /2 reprovações seguidas/);
  assert.equal(nextAction(facts({ state: 'aguardando-quiz', recovery }), 'X').label, 'Fazer o quiz dirigido');
  assert.deepEqual(
    [nextAction(facts({ state: 'bloqueado', recovery }), 'X').label, nextAction(facts({ state: 'bloqueado', recovery }), 'X').href],
    ['Refazer o quiz', '/quizzes?conteudo=X'],
  );
  assert.equal(nextAction(facts({ state: 'em-revisao-ativa' }), 'X').href, '/quizzes?conteudo=X');
  const next = { stage: '7d' as const, dueAt: '2026-10-15T12:00:00.000Z' };
  assert.equal(assessRisk(facts({ state: 'revalidado', next })).reasons[0], 'Próxima revisão (7d) em 15/10.');
  assert.equal(nextAction(facts({ state: 'revalidado', next }), 'X').label, 'Revisão de 7d em 15/10');
});

void test('relatório do conteúdo a partir do D1', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  assert.equal(await contentReport(db, 'NAO-EXISTE', { today: day, tzOffsetMinutes: 0 }), null);

  await startSession(db, 'CG-001', { now: at(8), id: 's1' });
  await concludeSession(db, 's1', { now: at(9) });
  const attempt = await startQuiz(db, 'CG-001', { now: at(10), id: 'q1' });
  const stored = JSON.parse(
    (raw.prepare('SELECT questions_json FROM atlas_quiz_attempts WHERE id = ?').get(attempt.id) as { questions_json: string }).questions_json,
  ) as { questionIds: string[]; optionOrders: Record<string, number[]> };
  const bank = new Map((await listQuestions(db, 'CG-001')).map((item) => [item.id, item]));
  const answers: Answers = {};
  for (const id of stored.questionIds) {
    const question = shuffleQuestion(bank.get(id)!, stored.optionOrders[id]);
    answers[id] = question.kind === 'multipla' ? { option: question.correctOption! } : { text: 'r', selfAssessment: 'certa' };
  }
  await submitQuiz(db, 'q1', { answers }, { now: at(11) });

  const report = await contentReport(db, 'CG-001', { now: at(12), today: day, tzOffsetMinutes: 0 });
  assert.ok(report);
  assert.equal(report.content.state, 'concluido');
  assert.equal(report.content.stateLabel, 'Concluído');
  // Origem: o conteúdo conta na cobertura e no quiz da disciplina.
  assert.match(report.origin.contribution[0], /conta como 1 dos/);
  assert.match(report.origin.contribution[1], /melhor nota aprovada 100%/);
  assert.ok(report.origin.disciplineScore > 0);
  assert.equal(report.origin.formulaVersion, 'v1');
  // Mudanças de estado com motivo, da mais recente à mais antiga.
  assert.deepEqual(
    report.stateChanges.map((item) => item.toState),
    ['concluido', 'aguardando-quiz', 'em-estudo'],
  );
  // Risco e próxima ação: em dia, próxima revisão de 24h.
  assert.equal(report.risk.level, 'em-dia');
  assert.equal(report.nextAction.label, 'Revisão de 24h em 09/10');
  // Histórico: sessão e quiz.
  assert.deepEqual(
    report.history.map((item) => item.kind),
    ['quiz', 'sessao'],
  );
  assert.match(report.history[0].title, /Quiz do conteúdo: aprovado/);
});

void test('APO-17 (DEC-018): atividade reprovada pede atenção mesmo com state em dia, sem criar trilha de risco paralela', () => {
  const emDia = assessRisk(facts({ state: 'em-estudo' }));
  assert.equal(emDia.level, 'em-dia');

  const comAtividadeReprovada = assessRisk(
    facts({ state: 'em-estudo', atividade: { status: 'reprovada', failures: 1 } }),
  );
  assert.equal(comAtividadeReprovada.level, 'atencao');
  assert.equal(comAtividadeReprovada.reasons[0], 'Atividade reprovada: refaça até passar com mais de 70%.');

  // Já em risco alto pelo state: nível não regride, mas o motivo da atividade aparece também.
  const jaAlto = assessRisk(
    facts({ state: 'bloqueado', atividade: { status: 'reprovada', failures: 3 } }),
  );
  assert.equal(jaAlto.level, 'alto');
  assert.equal(jaAlto.reasons[0], 'Atividade reprovada (3 seguidas): refaça até passar com mais de 70%.');

  // Aprovada ou nunca feita: nenhum motivo extra.
  const aprovada = assessRisk(facts({ state: 'em-estudo', atividade: { status: 'aprovada', failures: 0 } }));
  assert.deepEqual(aprovada, emDia);
});

void test('APO-17: atividadeStatusOf — aprovada se alguma tentativa passou, mesmo depois de reprovar antes', () => {
  assert.deepEqual(atividadeStatusOf([]), { status: null, failures: 0 });
  assert.deepEqual(
    atividadeStatusOf([{ purpose: 'quiz', passed: true, submittedAt: '2026-10-01T00:00:00.000Z' }]),
    { status: null, failures: 0 },
  );
  assert.deepEqual(
    atividadeStatusOf([
      { purpose: 'atividade', passed: false, submittedAt: '2026-10-01T00:00:00.000Z' },
      { purpose: 'atividade', passed: false, submittedAt: '2026-10-02T00:00:00.000Z' },
    ]),
    { status: 'reprovada', failures: 2 },
  );
  assert.deepEqual(
    atividadeStatusOf([
      { purpose: 'atividade', passed: false, submittedAt: '2026-10-01T00:00:00.000Z' },
      { purpose: 'atividade', passed: true, submittedAt: '2026-10-02T00:00:00.000Z' },
    ]),
    { status: 'aprovada', failures: 0 },
  );
});
