import assert from 'node:assert/strict';
import test from 'node:test';
import { TransitionError, applyTransition, currentState, listAudit } from '../lib/pedagogy/transitions.js';
import { getRoadmap } from '../lib/roadmap-store.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-06T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

async function complete(raw: ReturnType<typeof setup>['raw'], db: ReturnType<typeof setup>['db'], id: string) {
  raw.exec(`INSERT INTO atlas_evidences (id, content_id, kind, summary, recorded_at) VALUES ('ev-${id}', '${id}', 'quiz', '10/10', '${now}')`);
  await applyTransition(db, { entityType: 'conteudo', entityId: id, event: 'abrir-material', actor: 'usuario' });
  await applyTransition(db, { entityType: 'conteudo', entityId: id, event: 'encerrar-sessao', actor: 'sistema' });
  await applyTransition(db, { entityType: 'conteudo', entityId: id, event: 'quiz-aprovado', actor: 'sistema', evidenceId: `ev-${id}` });
}

const contentById = async (db: ReturnType<typeof setup>['db'], id: string) =>
  (await getRoadmap(db))?.phases.flatMap((phase) => phase.disciplines.flatMap((item) => item.contents)).find((item) => item.id === id);

void test('MVP-01: conteúdo com pré-requisito pendente não começa e nada é gravado', async () => {
  const { db } = setup();
  await assert.rejects(
    applyTransition(db, { entityType: 'conteudo', entityId: 'CG-002', event: 'abrir-material', actor: 'usuario' }),
    (error: unknown) => error instanceof TransitionError && error.code === 'prerequisite' && error.message.includes('CG-001'),
  );
  assert.equal(await currentState(db, 'conteudo', 'CG-002'), 'nao-iniciado');
  assert.deepEqual(await listAudit(db), []);
  const view = await contentById(db, 'CG-002');
  assert.deepEqual(view?.pendingPrerequisites, ['CG-001']);
  assert.equal(view?.locked, true);
  assert.equal((await contentById(db, 'CG-001'))?.locked, false, 'primeiro da unidade é livre');
  assert.equal((await contentById(db, 'CG-007'))?.locked, false, 'primeiro de outra unidade também');
});

void test('MVP-01: concluir o pré-requisito destrava o próximo e atualiza o progresso', async () => {
  const { raw, db } = setup();
  await complete(raw, db, 'CG-001');
  const view = await contentById(db, 'CG-002');
  assert.deepEqual(view?.pendingPrerequisites, []);
  assert.equal(view?.locked, false);
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-002', event: 'abrir-material', actor: 'usuario' });
  assert.equal(await currentState(db, 'conteudo', 'CG-002'), 'em-estudo');

  const roadmap = await getRoadmap(db);
  const phase = roadmap?.phases[0];
  assert.equal(phase?.progress.completed, 1);
  assert.equal(phase?.progress.total, phase?.disciplines[0]?.contents.length);
  assert.equal(roadmap?.phases[1]?.progress.completed, 0);
});

void test('MVP-01: revisão ativa volta a travar quem ainda não começou', async () => {
  const { raw, db } = setup();
  await complete(raw, db, 'CG-001');
  raw.exec(`UPDATE atlas_content_states SET state = 'em-revisao-ativa' WHERE content_id = 'CG-001'`);
  assert.equal((await contentById(db, 'CG-002'))?.locked, true);
});

void test('DEC-05: dispensa por proficiência pula pré-requisitos, mas só com evidência de proficiência do próprio conteúdo', async () => {
  const { raw, db } = setup();
  raw.exec(`
    INSERT INTO atlas_evidences (id, content_id, kind, summary, recorded_at) VALUES
      ('ev-quiz', 'CG-003', 'quiz', '9/10', '${now}'),
      ('ev-outro', 'CG-001', 'proficiencia', '92', '${now}'),
      ('ev-prof', 'CG-003', 'proficiencia', 'Exame de proficiência: 92', '${now}');
  `);
  for (const evidenceId of ['ev-quiz', 'ev-outro', 'nao-existe']) {
    await assert.rejects(
      applyTransition(db, { entityType: 'conteudo', entityId: 'CG-003', event: 'dispensa-proficiencia', actor: 'sistema', evidenceId }),
      (error: unknown) => error instanceof TransitionError && error.code === 'evidence',
      evidenceId,
    );
  }
  const entry = await applyTransition(db, {
    entityType: 'conteudo', entityId: 'CG-003', event: 'dispensa-proficiencia', actor: 'sistema', evidenceId: 'ev-prof',
  });
  assert.equal(entry.toState, 'concluido');
  assert.equal((await contentById(db, 'CG-004'))?.locked, false, 'conteúdo dispensado conta como cumprido');
});
