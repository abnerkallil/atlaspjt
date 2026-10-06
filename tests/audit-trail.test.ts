import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TransitionError,
  applyTransition,
  currentState,
  listAudit,
  planTransition,
} from '../lib/pedagogy/transitions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

function seeded() {
  const raw = migratedDatabase();
  const now = '2026-10-06T12:00:00.000Z';
  raw.exec(`
    INSERT INTO atlas_roadmaps (id, title, created_at, updated_at) VALUES ('rm', 'Roadmap', '${now}', '${now}');
    INSERT INTO atlas_phases (id, roadmap_id, position, title) VALUES ('f1', 'rm', 1, 'Base');
    INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('cg', 'f1', 1, 'Contabilidade Geral');
    INSERT INTO atlas_contents (id, discipline_id, position, title) VALUES ('CG-001', 'cg', 1, 'Conceitos');
    INSERT INTO atlas_evidences (id, content_id, kind, summary, recorded_at) VALUES ('ev-quiz', 'CG-001', 'quiz', '9/10', '${now}');
  `);
  return { raw, db: d1(raw) };
}

const at = (minute: number) => `2026-10-06T13:${String(minute).padStart(2, '0')}:00.000Z`;

void test('TEC-06: cada transição grava autor, momento, estado anterior, novo, motivo e evidência', async () => {
  const { db } = seeded();
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario' }, { now: at(1), id: 'a1' });
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'encerrar-sessao', actor: 'sistema' }, { now: at(2), id: 'a2' });
  await applyTransition(
    db,
    { entityType: 'conteudo', entityId: 'CG-001', event: 'quiz-aprovado', actor: 'sistema', reason: 'Acertou 9 de 10.', evidenceId: 'ev-quiz' },
    { now: at(3), id: 'a3' },
  );

  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'concluido');
  const history = await listAudit(db, { entityType: 'conteudo', entityId: 'CG-001' });
  assert.deepEqual(
    history.map((entry) => [entry.fromState, entry.toState, entry.actor]),
    [
      ['aguardando-quiz', 'concluido', 'sistema'],
      ['em-estudo', 'aguardando-quiz', 'sistema'],
      ['nao-iniciado', 'em-estudo', 'usuario'],
    ],
  );
  assert.equal(history[0]?.reason, 'Acertou 9 de 10.');
  assert.equal(history[0]?.evidenceId, 'ev-quiz');
  assert.equal(history[0]?.occurredAt, at(3));
  assert.equal(history[2]?.reason, 'Abriu o material do conteúdo.', 'sem motivo explícito vale a descrição da regra');
});

void test('TEC-06: transição recusada não altera estado nem grava auditoria', async () => {
  const { db } = seeded();
  await assert.rejects(
    applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'quiz-aprovado', actor: 'sistema', evidenceId: 'ev-quiz' }),
    (error: unknown) => error instanceof TransitionError && error.code === 'invalid',
  );
  await assert.rejects(
    applyTransition(db, { entityType: 'conteudo', entityId: 'nao-existe', event: 'abrir-material', actor: 'usuario' }),
    (error: unknown) => error instanceof TransitionError && error.code === 'not-found',
  );
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'nao-iniciado');
  assert.deepEqual(await listAudit(db), []);
});

void test('DEC-03: exame, atividade final e recuperação só começam com confirmação do usuário', async () => {
  const { db } = seeded();
  await applyTransition(db, { entityType: 'disciplina', entityId: 'cg', event: 'conteudo-50', actor: 'sistema' });
  for (const request of [
    { actor: 'sistema' as const, confirmed: true },
    { actor: 'usuario' as const, confirmed: false },
    { actor: 'usuario' as const },
  ]) {
    await assert.rejects(
      applyTransition(db, { entityType: 'disciplina', entityId: 'cg', event: 'iniciar-exame-meio', ...request }),
      (error: unknown) => error instanceof TransitionError && error.code === 'confirmation',
    );
  }
  const entry = await applyTransition(db, { entityType: 'disciplina', entityId: 'cg', event: 'iniciar-exame-meio', actor: 'usuario', confirmed: true });
  assert.equal(entry.toState, 'exame-meio-em-curso');
  assert.equal(await currentState(db, 'disciplina', 'cg'), 'exame-meio-em-curso');
});

void test('TEC-06: quiz aprovado e dispensa por proficiência exigem evidência', () => {
  assert.throws(
    () => planTransition({ entityType: 'conteudo', entityId: 'CG-001', event: 'quiz-aprovado', actor: 'sistema' }, 'aguardando-quiz', at(0), 'x'),
    (error: unknown) => error instanceof TransitionError && error.code === 'evidence',
  );
  assert.throws(
    () => planTransition({ entityType: 'conteudo', entityId: 'CG-001', event: 'dispensa-proficiencia', actor: 'sistema' }, 'nao-iniciado', at(0), 'x'),
    (error: unknown) => error instanceof TransitionError && error.code === 'evidence',
  );
});

void test('TEC-06: escrita concorrente não deixa estado sem registro nem registro sem estado', async () => {
  const { raw, db } = seeded();
  // Simula outra escrita entre a leitura do estado e o batch.
  const racing = {
    ...db,
    prepare: db.prepare.bind(db),
    batch: (statements: Parameters<typeof db.batch>[0]) => {
      raw.exec(`INSERT INTO atlas_content_states (content_id, state, updated_at) VALUES ('CG-001', 'em-estudo', '${at(0)}')`);
      return db.batch(statements);
    },
  };
  await assert.rejects(
    applyTransition(racing, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario' }),
    (error: unknown) => error instanceof TransitionError && error.code === 'conflict',
  );
  assert.deepEqual(await listAudit(db), []);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'em-estudo');
});

void test('TEC-06: a auditoria sobrevive à remoção do conteúdo', async () => {
  const { raw, db } = seeded();
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario' });
  raw.exec("DELETE FROM atlas_contents WHERE id = 'CG-001'");
  assert.equal((await listAudit(db, { entityId: 'CG-001' })).length, 1);
});
