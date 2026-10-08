// MVP-02: o que estudar agora — retomar a sessão aberta, depois o que pede atenção, depois o próximo liberado.
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTransition } from '../lib/pedagogy/transitions.js';
import { getRoadmap } from '../lib/roadmap-store.js';
import { pickNextStudy } from '../lib/study-plan.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

void test('sem nada começado, sugere o primeiro conteúdo liberado do roadmap', async () => {
  const db = d1(migratedDatabase());
  const next = pickNextStudy(await getRoadmap(db), []);
  assert.deepEqual(next, { kind: 'iniciar', contentId: 'CG-001', reason: 'Próximo conteúdo liberado do roadmap.' });
});

void test('sessão aberta vem primeiro', async () => {
  const db = d1(migratedDatabase());
  const next = pickNextStudy(await getRoadmap(db), [{ id: 's9', contentId: 'CG-007' }]);
  assert.deepEqual(next, { kind: 'retomar', sessionId: 's9', contentId: 'CG-007' });
});

void test('conteúdo reprovado no quiz vem antes de começar um novo: refazer o quiz', async () => {
  const db = d1(migratedDatabase());
  for (const event of ['abrir-material', 'encerrar-sessao', 'quiz-reprovado']) {
    await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-007', event, actor: 'sistema' });
  }
  const next = pickNextStudy(await getRoadmap(db), []);
  assert.deepEqual(
    next && next.kind === 'quiz' ? [next.contentId, next.label, next.canStudy] : next,
    ['CG-007', 'Refazer o quiz', true],
  );
});

void test('quiz liberado vem antes de começar um novo conteúdo', async () => {
  const db = d1(migratedDatabase());
  for (const event of ['abrir-material', 'encerrar-sessao']) {
    await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event, actor: 'sistema' });
  }
  const next = pickNextStudy(await getRoadmap(db), []);
  assert.deepEqual(next && next.kind === 'quiz' ? [next.contentId, next.label, next.canStudy] : next, ['CG-001', 'Fazer o quiz', false]);
});

void test('roadmap vazio não sugere nada', () => {
  assert.equal(pickNextStudy(null, []), null);
});
