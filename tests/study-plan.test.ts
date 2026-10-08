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

void test('conteúdo bloqueado pelo quiz vem antes de começar um novo', async () => {
  const db = d1(migratedDatabase());
  for (const event of ['abrir-material', 'encerrar-sessao', 'quiz-reprovado']) {
    await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-007', event, actor: 'sistema' });
  }
  const next = pickNextStudy(await getRoadmap(db), []);
  assert.equal(next?.kind, 'iniciar');
  assert.equal(next?.contentId, 'CG-007');
});

void test('roadmap vazio não sugere nada', () => {
  assert.equal(pickNextStudy(null, []), null);
});
