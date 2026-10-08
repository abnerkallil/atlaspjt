// MVP-02: iniciar, pausar, retomar, concluir, salvar ponto atual e registrar evidências.
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentState, listAudit } from '../lib/pedagogy/transitions.js';
import {
  SessionError,
  concludeSession,
  elapsedSeconds,
  getSession,
  listOpenSessions,
  listSessions,
  pauseSession,
  resumeSession,
  saveCheckpoint,
  serializeCheckpoint,
  startSession,
} from '../lib/study-sessions.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const t0 = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(Date.parse(t0) + seconds * 1000).toISOString();

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

void test('iniciar abre o material (DEC-03) e grava a sessão em andamento', async () => {
  const { db } = setup();
  const session = await startSession(db, 'CG-001', { now: t0, id: 's1' });
  assert.equal(session.status, 'em-andamento');
  assert.equal(session.contentTitle.length > 0, true);
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'em-estudo');
  const [audit] = await listAudit(db);
  assert.equal(audit.event, 'abrir-material');
  assert.equal(audit.reason, 'Começou uma sessão de estudo.');
});

void test('iniciar recusa conteúdo com pré-requisito pendente (MVP-01) e não cria sessão', async () => {
  const { db } = setup();
  await assert.rejects(startSession(db, 'CG-002', { now: t0 }), /Conclua antes/);
  assert.deepEqual(await listSessions(db), []);
});

void test('pausar congela o tempo; retomar volta a contar', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  const paused = await pauseSession(db, 's1', { now: at(300) });
  assert.equal(paused.status, 'pausada');
  assert.equal(paused.activeSeconds, 300);
  assert.equal(elapsedSeconds(paused, at(5000)), 300, 'pausada não conta tempo');

  const resumed = await resumeSession(db, 's1', { now: at(1000) });
  assert.equal(resumed.status, 'em-andamento');
  assert.equal(elapsedSeconds(resumed, at(1060)), 360);
});

void test('salvar ponto atual guarda o checkpoint sem mudar status nem tempo', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  const saved = await saveCheckpoint(db, 's1', { step: 'pratica', completed: ['leitura'] }, { now: at(30) });
  assert.deepEqual(saved.checkpoint, { step: 'pratica', completed: ['leitura'] });
  assert.equal(saved.status, 'em-andamento');
  assert.equal(saved.activeSeconds, 0);
  assert.throws(() => serializeCheckpoint('texto'), SessionError);
  assert.throws(() => serializeCheckpoint({ big: 'x'.repeat(17 * 1024) }), /16KB/);
});

void test('iniciar de novo o mesmo conteúdo retoma a sessão aberta com o ponto salvo', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await pauseSession(db, 's1', { now: at(120), checkpoint: { step: 'midia' } });
  const again = await startSession(db, 'CG-001', { now: at(600), id: 's2' });
  assert.equal(again.id, 's1');
  assert.equal(again.status, 'em-andamento');
  assert.deepEqual(again.checkpoint, { step: 'midia' });
  assert.equal((await listSessions(db)).length, 1);
  assert.equal((await listAudit(db)).length, 1, 'não abre o material duas vezes');
});

void test('só uma sessão em andamento: começar outro conteúdo pausa a anterior com o tempo', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await startSession(db, 'CG-007', { now: at(90), id: 's2' });
  const first = await getSession(db, 's1');
  assert.equal(first?.status, 'pausada');
  assert.equal(first?.activeSeconds, 90);
  const open = await listOpenSessions(db);
  assert.deepEqual(open.map((item) => item.id), ['s2', 's1']);
});

void test('concluir registra a evidência e leva o conteúdo a "aguardando quiz"', async () => {
  const { db, raw } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await saveCheckpoint(db, 's1', { noteId: 'nota-1' }, { now: at(10) });
  const done = await concludeSession(db, 's1', { now: at(1500), evidenceId: 'ev1' });
  assert.equal(done.status, 'concluida');
  assert.equal(done.activeSeconds, 1500);
  assert.equal(done.finishedAt, at(1500));
  assert.equal(done.evidenceId, 'ev1');
  const evidence = raw.prepare('SELECT kind, source_ref, summary FROM atlas_evidences WHERE id = ?').get('ev1') as Record<string, string>;
  assert.equal(evidence.kind, 'sessao');
  assert.equal(evidence.source_ref, 's1');
  assert.equal(evidence.summary, 'Sessão de estudo concluída (25 min, com nota).');
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'aguardando-quiz');
  const [last] = await listAudit(db);
  assert.equal(last.event, 'encerrar-sessao');
  assert.equal(last.evidenceId, 'ev1');
  assert.equal(last.actor, 'sistema');
});

void test('sessão concluída não pausa, não retoma, não conclui de novo', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });
  for (const action of [
    () => pauseSession(db, 's1'),
    () => resumeSession(db, 's1'),
    () => saveCheckpoint(db, 's1', {}),
    () => concludeSession(db, 's1'),
  ]) {
    await assert.rejects(action(), (error: unknown) => error instanceof SessionError && error.status === 409);
  }
});

void test('estudar de novo um conteúdo já em "aguardando quiz" não muda o estado', async () => {
  const { db } = setup();
  await startSession(db, 'CG-001', { now: t0, id: 's1' });
  await concludeSession(db, 's1', { now: at(60) });
  const second = await startSession(db, 'CG-001', { now: at(120), id: 's2' });
  assert.equal(second.id, 's2');
  await concludeSession(db, 's2', { now: at(300) });
  assert.equal(await currentState(db, 'conteudo', 'CG-001'), 'aguardando-quiz');
  assert.equal((await listAudit(db)).length, 2, 'só abrir-material e encerrar-sessao da primeira');
  assert.equal((await listSessions(db, { contentId: 'CG-001' })).length, 2);
});

void test('sessão inexistente responde 404', async () => {
  const { db } = setup();
  await assert.rejects(pauseSession(db, 'nada'), (error: unknown) => error instanceof SessionError && error.status === 404);
});
