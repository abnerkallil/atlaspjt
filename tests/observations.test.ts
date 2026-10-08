// UX-06: "O Atlas observou" em Hoje — uma observação por regra fixa sobre o progresso.
import assert from 'node:assert/strict';
import test from 'node:test';
import { observe } from '../lib/observations.js';
import type { ProgressReport } from '../lib/progress.js';

const report = (overrides: Partial<ProgressReport> = {}): ProgressReport => ({
  formulaVersion: 'v1',
  weights: { avaliacoes: 30, atividades: 20, cobertura: 20, revisao: 15, quiz: 15 },
  weeks: [],
  disciplines: [],
  overall: { mastery: 0, retention: 0, retentionChange: 0, reviewsTaken: 0 },
  consistency: { days: [], streak: 0, studiedDays: 0 },
  atRisk: [],
  ...overrides,
});

void test('sem histórico, convida a estudar', () => {
  assert.equal(observe(report()).title, 'Ainda sem histórico.');
});

void test('conteúdo em risco vem primeiro, com link para o relatório', () => {
  const risk = { id: 'CG-001', title: 'Conceitos', discipline: 'CG', state: 'bloqueado' as const, reason: 'Reprovado no quiz de conteúdo.', action: 'Refaça o quiz.', failures: 1 };
  const seen = observe(report({ atRisk: [risk, { ...risk, id: 'CG-002' }], consistency: { days: [30], streak: 5, studiedDays: 5 } }));
  assert.equal(seen.title, 'Conceitos pede atenção.');
  assert.equal(seen.text, 'Reprovado no quiz de conteúdo. Refaça o quiz. Há mais 1 conteúdo em risco em Progresso.');
  assert.equal(seen.href, '/relatorio?conteudo=CG-001');
});

void test('sequência de 3 dias ou mais, depois retenção, depois constância', () => {
  assert.equal(observe(report({ consistency: { days: [], streak: 4, studiedDays: 6 } })).title, '4 dias seguidos de estudo.');
  const retention = observe(report({ consistency: { days: [], streak: 1, studiedDays: 2 }, overall: { mastery: 0, retention: 60, retentionChange: 0, reviewsTaken: 3 } }));
  assert.equal(retention.title, '60% das revisões aprovadas.');
  assert.match(retention.text, /Abaixo de 75%/);
  assert.equal(observe(report({ consistency: { days: [], streak: 1, studiedDays: 1 } })).title, '1 dia com estudo nos últimos 28.');
});
