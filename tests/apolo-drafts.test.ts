// APO-07: curadoria de rascunhos — um rascunho aprovado aparece no próximo
// quiz do conteúdo; descartado não volta. Nunca entra sozinho no banco.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DraftError,
  approveDraft,
  discardDraft,
  getDraft,
  insertDrafts,
  listDrafts,
  updateDraft,
} from '../lib/apolo/index.js';
import { listQuestions } from '../lib/quizzes.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

async function seedDraft(db: ReturnType<typeof d1>, overrides: Partial<Parameters<typeof insertDrafts>[1][0]> = {}) {
  await insertDrafts(
    db,
    [
      {
        id: 'draft-1',
        sourceId: null,
        theme: 'direito-constitucional',
        kind: 'certo_errado',
        prompt: 'O Brasil é uma república federativa.',
        explanation: null,
        lintWarnings: ['enunciado não parece terminar em pergunta'],
        ...overrides,
      },
    ],
    now,
  );
}

void test('APO-07: rascunho recém-extraído entra pendente, sem conteúdo nem Bloom', async () => {
  const { db } = setup();
  await seedDraft(db);
  const draft = await getDraft(db, 'draft-1');
  assert.equal(draft?.status, 'pendente');
  assert.equal(draft?.contentId, null);
  assert.equal(draft?.bloomLevel, null);
  assert.deepEqual(draft?.lintWarnings, ['enunciado não parece terminar em pergunta']);
  const pendentes = await listDrafts(db, 'pendente');
  assert.equal(pendentes.length, 1);
});

void test('APO-07: aprovar exige conteúdo, Bloom e explicação antes de gravar a questão', async () => {
  const { db } = setup();
  await seedDraft(db);
  await assert.rejects(approveDraft(db, 'draft-1', now), DraftError);

  await updateDraft(db, 'draft-1', { contentId: 'CG-001' });
  await assert.rejects(approveDraft(db, 'draft-1', now), DraftError);

  await updateDraft(db, 'draft-1', { bloomLevel: 'entender' });
  await assert.rejects(approveDraft(db, 'draft-1', now), DraftError);

  await updateDraft(db, 'draft-1', { explanation: 'República federativa é forma de governo e de Estado.' });
  const { draft, questionId } = await approveDraft(db, 'draft-1', now);
  assert.equal(draft.status, 'aprovado');
  assert.equal(draft.approvedQuestionId, questionId);
});

void test('APO-07: rascunho aprovado aparece no próximo quiz do conteúdo', async () => {
  const { db } = setup();
  await seedDraft(db);
  await updateDraft(db, 'draft-1', {
    contentId: 'CG-001',
    bloomLevel: 'entender',
    explanation: 'República federativa é forma de governo e de Estado.',
  });
  const { questionId } = await approveDraft(db, 'draft-1', now);
  const questions = await listQuestions(db, 'CG-001');
  const found = questions.find((q) => q.id === questionId);
  assert.ok(found, 'a questão aprovada deveria aparecer em listQuestions (CG-001)');
  assert.equal(found?.kind, 'certo_errado');
});

void test('APO-07: descartado some da fila e não volta', async () => {
  const { db } = setup();
  await seedDraft(db);
  const discarded = await discardDraft(db, 'draft-1', now);
  assert.equal(discarded.status, 'descartado');
  assert.equal((await listDrafts(db, 'pendente')).length, 0);
  await assert.rejects(approveDraft(db, 'draft-1', now), DraftError);
  await assert.rejects(discardDraft(db, 'draft-1', now), DraftError);
});

void test('APO-07: editar/aprovar/descartar um rascunho que não existe dá erro claro', async () => {
  const { db } = setup();
  await assert.rejects(updateDraft(db, 'não-existe', { contentId: 'CG-001' }), DraftError);
  await assert.rejects(approveDraft(db, 'não-existe', now), DraftError);
  await assert.rejects(discardDraft(db, 'não-existe', now), DraftError);
});
