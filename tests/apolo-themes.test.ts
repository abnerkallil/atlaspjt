// APO-02 (DEC-014): taxonomia de tema aberta e mapa do conhecimento. Cadastrar
// um tema novo não exige migração nem deploy; um tema sem conteúdo do
// roadmap ligado é válido.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createTheme, getTheme, listThemes, setContentTheme } from '../lib/apolo/index.js';
import { getRoadmap } from '../lib/roadmap-store.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

void test('APO-02: cadastrar tema novo não exige migração, com hierarquia e área de conhecimento', async () => {
  const { db } = setup();
  // Id fora da bagagem inicial de temas (drizzle/0021_temas_bagagem_apolo.sql)
  // de propósito, para não colidir com um tema já semeado.
  await createTheme(db, { id: 'direito-previdenciario', title: 'Direito Previdenciário', knowledgeArea: 'juridico' }, now);
  await createTheme(
    db,
    { id: 'direito-previdenciario-rgps', title: 'RGPS', parentId: 'direito-previdenciario', knowledgeArea: 'juridico' },
    now,
  );

  const parent = await getTheme(db, 'direito-previdenciario');
  const child = await getTheme(db, 'direito-previdenciario-rgps');
  assert.equal(parent?.parentId, null);
  assert.equal(child?.parentId, 'direito-previdenciario');
  assert.equal(child?.knowledgeArea, 'juridico');
});

void test('APO-02: tema sem nenhum conteúdo do roadmap não quebra nada', async () => {
  const { db } = setup();
  await createTheme(db, { id: 'amazonia-plantas', title: 'Plantas da Amazônia' }, now);
  const themes = await listThemes(db);
  assert.ok(themes.some((theme) => theme.id === 'amazonia-plantas'));
});

void test('APO-02: conteúdo do roadmap ligado a um tema aparece em GET /api/roadmap', async () => {
  const { db } = setup();
  await createTheme(db, { id: 'contabilidade-basica', title: 'Contabilidade Básica', knowledgeArea: 'sociais_aplicadas' }, now);
  await setContentTheme(db, 'CG-001', 'contabilidade-basica');

  const roadmap = await getRoadmap(db);
  const content = roadmap?.phases.flatMap((phase) => phase.disciplines).flatMap((d) => d.contents).find((c) => c.id === 'CG-001');
  assert.equal(content?.themeId, 'contabilidade-basica');
  assert.equal(content?.themeTitle, 'Contabilidade Básica');

  const other = roadmap?.phases.flatMap((phase) => phase.disciplines).flatMap((d) => d.contents).find((c) => c.id === 'CG-002');
  assert.equal(other?.themeId, null);
  assert.equal(other?.themeTitle, null);
});
