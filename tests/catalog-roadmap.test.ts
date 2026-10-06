import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CATALOG_ROADMAP_ID,
  CATALOG_SEED_MIGRATION,
  buildCatalogRoadmap,
  catalogSeedMigrationSql,
} from '../lib/catalog/roadmap-seed.js';
import { contentCatalog } from '../lib/content-catalog.js';
import { applyTransition } from '../lib/pedagogy/transitions.js';
import { getRoadmap } from '../lib/roadmap-store.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

void test('TEC-04: a migration de carga é exatamente o que o gerador produz (rode pnpm run db:catalog)', () => {
  assert.equal(readFileSync(`drizzle/${CATALOG_SEED_MIGRATION}.sql`, 'utf8'), catalogSeedMigrationSql());
});

void test('TEC-04: uma fase por matéria, todos os conteúdos da planilha, pré-requisito em sequência na unidade', () => {
  const roadmap = buildCatalogRoadmap();
  assert.deepEqual(roadmap.phases.map((phase) => phase.title), ['Contabilidade Geral', 'Contabilidade Tributária']);
  assert.deepEqual(roadmap.disciplines.map((item) => item.title), ['Contabilidade Geral', 'Contabilidade Tributária']);
  assert.deepEqual(roadmap.contents.map((item) => item.id).sort(), contentCatalog.map((item) => item.id).sort());

  const byId = new Map(roadmap.contents.map((item) => [item.id, item]));
  const units = new Set(contentCatalog.map((item) => `${item.subject}|${item.unit}`));
  assert.equal(roadmap.prerequisites.length, contentCatalog.length - units.size, 'só o primeiro de cada unidade fica livre');
  for (const edge of roadmap.prerequisites) {
    const content = byId.get(edge.contentId);
    const prerequisite = byId.get(edge.prerequisiteId);
    assert.ok(content && prerequisite);
    assert.equal(content.unit, prerequisite.unit);
    assert.equal(content.disciplineId, prerequisite.disciplineId);
    assert.equal(prerequisite.position, content.position - 1);
  }
});

void test('TEC-04: o banco migrado devolve o roadmap com estado inicial e reflete transições', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  const roadmap = await getRoadmap(db);
  assert.ok(roadmap);
  assert.equal(roadmap.id, CATALOG_ROADMAP_ID);
  const contents = roadmap.phases.flatMap((phase) => phase.disciplines.flatMap((item) => item.contents));
  assert.equal(contents.length, contentCatalog.length);
  assert.ok(contents.every((item) => item.state === 'nao-iniciado'));
  assert.deepEqual(contents.find((item) => item.id === 'CG-002')?.prerequisites, ['CG-001']);
  assert.deepEqual(contents.find((item) => item.id === 'CG-001')?.prerequisites, []);

  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario' });
  const after = await getRoadmap(db);
  const first = after?.phases[0]?.disciplines[0]?.contents[0];
  assert.equal(first?.id, 'CG-001');
  assert.equal(first?.state, 'em-estudo');
});

void test('TEC-04: reaplicar a carga atualiza o catálogo sem apagar estado nem auditoria', async () => {
  const raw = migratedDatabase();
  const db = d1(raw);
  await applyTransition(db, { entityType: 'conteudo', entityId: 'CG-001', event: 'abrir-material', actor: 'usuario' });
  raw.exec("UPDATE atlas_contents SET title = 'antigo' WHERE id = 'CG-001'");
  for (const statement of catalogSeedMigrationSql().split('--> statement-breakpoint')) raw.exec(statement);
  const roadmap = await getRoadmap(db);
  const first = roadmap?.phases[0]?.disciplines[0]?.contents[0];
  assert.equal(first?.title, contentCatalog[0]?.title);
  assert.equal(first?.state, 'em-estudo');
  assert.equal((raw.prepare('SELECT count(*) AS n FROM atlas_state_audit').get() as { n: number }).n, 1);
});
