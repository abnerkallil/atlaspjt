import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CONTENT_STATES,
  CONTENT_TRANSITIONS,
  DISCIPLINE_STATES,
  DISCIPLINE_TRANSITIONS,
  INITIAL_CONTENT_STATE,
  INITIAL_DISCIPLINE_STATE,
  type Transition,
} from '../lib/pedagogy/states.js';
import { migratedDatabase } from './support/migrated-db.js';

function reachable<S extends string>(initial: S, transitions: Transition<S>[]): Set<S> {
  const seen = new Set<S>([initial]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const item of transitions) {
      if (seen.has(item.from) && !seen.has(item.to)) {
        seen.add(item.to);
        changed = true;
      }
    }
  }
  return seen;
}

void test('TEC-02: toda migration listada no journal existe e o journal cobre todos os arquivos', () => {
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as { entries: { tag: string }[] };
  const files = readdirSync('drizzle').filter((name) => name.endsWith('.sql')).map((name) => name.replace(/\.sql$/, ''));
  assert.deepEqual(journal.entries.map((entry) => entry.tag).sort(), files.sort());
});

void test('TEC-02: a espinha do DEC-05 existe no banco migrado, com estado e auditoria', () => {
  const db = migratedDatabase();
  const tables = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((row) => row.name),
  );
  for (const name of [
    'atlas_roadmaps', 'atlas_phases', 'atlas_disciplines', 'atlas_contents', 'atlas_subtopics', 'atlas_evidences',
    'atlas_content_prerequisites', 'atlas_content_states', 'atlas_discipline_states', 'atlas_state_audit',
  ]) {
    assert.ok(tables.has(name), `falta a tabela ${name}`);
  }
  // DEC-010: sessão, questão, tentativa, revisão e avaliação só chegam com o card MVP.
  const byCard: Record<string, string> = {
    atlas_study_sessions: 'MVP-02',
    atlas_questions: 'MVP-04',
    atlas_quiz_attempts: 'MVP-04',
    atlas_agenda_items: 'MVP-05',
    atlas_question_sources: 'APO-05',
  };
  for (const name of tables) {
    if (byCard[name]) continue;
    assert.doesNotMatch(name, /session|question|attempt|review|assessment|user/, `tabela fora da espinha: ${name}`);
  }
});

void test('TEC-02: hierarquia com chaves estáveis e remoção em cascata', () => {
  const db = migratedDatabase();
  const now = '2026-10-06T12:00:00.000Z';
  db.exec(`
    INSERT INTO atlas_roadmaps (id, title, created_at, updated_at) VALUES ('rm', 'Roadmap', '${now}', '${now}');
    INSERT INTO atlas_phases (id, roadmap_id, position, title) VALUES ('f1', 'rm', 1, 'Base');
    INSERT INTO atlas_disciplines (id, phase_id, position, title) VALUES ('cg', 'f1', 1, 'Contabilidade Geral');
    INSERT INTO atlas_contents (id, discipline_id, position, title) VALUES ('X-001', 'cg', 1, 'Conceitos'), ('X-002', 'cg', 2, 'Patrimônio');
    INSERT INTO atlas_content_prerequisites (content_id, prerequisite_id) VALUES ('X-002', 'X-001');
    INSERT INTO atlas_subtopics (id, content_id, position, title) VALUES ('X-002.1', 'X-002', 1, 'Bens');
    INSERT INTO atlas_evidences (id, content_id, subtopic_id, kind, summary, recorded_at) VALUES ('ev1', 'X-002', 'X-002.1', 'quiz', 'Quiz aprovado', '${now}');
    INSERT INTO atlas_content_states (content_id, state, updated_at) VALUES ('X-002', 'concluido', '${now}');
  `);
  assert.throws(() => db.exec("INSERT INTO atlas_contents (id, discipline_id, position, title) VALUES ('X', 'nao-existe', 1, 'X')"));
  db.exec("DELETE FROM atlas_roadmaps WHERE id = 'rm'");
  for (const [table, column] of [
    ['atlas_contents', 'id'], ['atlas_content_prerequisites', 'content_id'], ['atlas_subtopics', 'content_id'],
    ['atlas_evidences', 'content_id'], ['atlas_content_states', 'content_id'],
  ] as const) {
    assert.equal((db.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${column} LIKE 'X-%'`).get() as { n: number }).n, 0, table);
  }
});

void test('DEC-03: transições de conteúdo usam só estados válidos e cobrem todos os estados', () => {
  const states = new Set<string>(CONTENT_STATES);
  for (const item of CONTENT_TRANSITIONS) {
    assert.ok(states.has(item.from) && states.has(item.to), `${item.from} → ${item.to}`);
  }
  assert.deepEqual([...reachable(INITIAL_CONTENT_STATE, CONTENT_TRANSITIONS)].sort(), [...CONTENT_STATES].sort());
  // Nenhum par (estado, evento) é ambíguo.
  const keys = CONTENT_TRANSITIONS.map((item) => `${item.from}|${item.event}`);
  assert.equal(new Set(keys).size, keys.length);
  // No nível conteúdo tudo é automático (DEC-03).
  assert.ok(CONTENT_TRANSITIONS.every((item) => !item.requiresConfirmation));
});

void test('DEC-03: disciplina chega a concluída e só exame, atividade final e recuperação pedem confirmação', () => {
  const states = new Set<string>(DISCIPLINE_STATES);
  for (const item of DISCIPLINE_TRANSITIONS) {
    assert.ok(states.has(item.from) && states.has(item.to), `${item.from} → ${item.to}`);
  }
  assert.deepEqual([...reachable(INITIAL_DISCIPLINE_STATE, DISCIPLINE_TRANSITIONS)].sort(), [...DISCIPLINE_STATES].sort());
  assert.deepEqual(
    DISCIPLINE_TRANSITIONS.filter((item) => item.requiresConfirmation).map((item) => item.event).sort(),
    ['iniciar-atividade-final', 'iniciar-exame-meio', 'iniciar-recuperacao'],
  );
  // Recuperação só existe depois da atividade final (DEC-10).
  assert.deepEqual(
    DISCIPLINE_TRANSITIONS.filter((item) => item.to === 'recuperacao-liberada').map((item) => item.from),
    ['atividade-final-em-curso'],
  );
});
