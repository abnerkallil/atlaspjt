// APO-01 (DEC-014): fundação do Apolo — moldes, ciclo de vida e geradores
// determinísticos. Sem IA; a mesma semente deve sempre produzir a mesma
// questão.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createItemModel,
  expandItemModel,
  getItemModel,
  listActiveItemModels,
  listActiveQuestionsByTheme,
  registerGenerator,
  seededRandom,
  setItemModelLifecycle,
  UnknownGeneratorError,
  type GeneratedQuestion,
} from '../lib/apolo/index.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

void test('APO-01: migração aditiva não afeta questões curadas existentes', () => {
  const { raw } = setup();
  const row = raw
    .prepare(`SELECT theme, lifecycle_state as lifecycleState, item_model_id as itemModelId FROM atlas_questions LIMIT 1`)
    .get() as { theme: string | null; lifecycleState: string; itemModelId: string | null };
  assert.equal(row.theme, null, 'questões curadas ainda não têm tema');
  assert.equal(row.lifecycleState, 'ativa', 'default compatível com o active=1 já existente');
  assert.equal(row.itemModelId, null);
});

void test('APO-01: molde nasce rascunho e só aparece para o Apolo depois de ativado', async () => {
  const { db } = setup();
  await createItemModel(
    db,
    {
      id: 'MOLDE-001',
      theme: 'direito-tributario',
      title: 'Cálculo de alíquota',
      kind: 'calculo',
      generatorKey: 'aliquota-percentual',
      params: { min: 1, max: 10 },
      curatedBy: 'abner',
    },
    now,
  );

  assert.deepEqual(await listActiveItemModels(db, 'direito-tributario'), []);
  const draft = await getItemModel(db, 'MOLDE-001');
  assert.equal(draft?.lifecycleState, 'rascunho');

  await setItemModelLifecycle(db, 'MOLDE-001', 'ativa', now);
  const active = await listActiveItemModels(db, 'direito-tributario');
  assert.equal(active.length, 1);
  assert.equal(active[0].generatorKey, 'aliquota-percentual');
  assert.deepEqual(active[0].params, { min: 1, max: 10 });
});

void test('APO-01: expandir um molde sem gerador registrado falha explicitamente', async () => {
  const { db } = setup();
  await createItemModel(
    db,
    {
      id: 'MOLDE-002',
      theme: 'amazonia-plantas',
      title: 'Molde sem gerador',
      kind: 'multipla',
      generatorKey: 'inexistente',
      params: {},
      curatedBy: 'abner',
    },
    now,
  );
  await setItemModelLifecycle(db, 'MOLDE-002', 'ativa', now);
  const model = await getItemModel(db, 'MOLDE-002');
  assert.throws(
    () => expandItemModel(model!, 'semente-1'),
    (error: unknown) => error instanceof UnknownGeneratorError && error.generatorKey === 'inexistente',
  );
});

void test('APO-01: expansão de molde é determinística pela semente', async () => {
  const { db } = setup();
  registerGenerator('soma-fixa-teste', (params, seed): GeneratedQuestion => {
    const a = Number(params.a);
    const b = Math.floor(seededRandom(seed)() * 5) + 1;
    return {
      kind: 'calculo',
      prompt: `Quanto é ${a} + ${b}?`,
      context: null,
      options: null,
      correctOption: null,
      modelAnswer: null,
      expectedValue: a + b,
      tolerance: 0,
      explanation: `${a} + ${b} = ${a + b}`,
    };
  });
  await createItemModel(
    db,
    {
      id: 'MOLDE-003',
      theme: 'contabilidade-geral',
      title: 'Soma fixa',
      kind: 'calculo',
      generatorKey: 'soma-fixa-teste',
      params: { a: 7 },
      curatedBy: 'abner',
    },
    now,
  );
  await setItemModelLifecycle(db, 'MOLDE-003', 'ativa', now);
  const model = await getItemModel(db, 'MOLDE-003');

  const first = expandItemModel(model!, 'tentativa-123');
  const again = expandItemModel(model!, 'tentativa-123');
  const other = expandItemModel(model!, 'tentativa-456');
  assert.deepEqual(first, again, 'mesma semente produz sempre a mesma questão');
  assert.equal(first.expectedValue, 7 + Math.floor(seededRandom('tentativa-123')() * 5) + 1);
  assert.notDeepEqual(first, other, 'sementes diferentes produzem questões diferentes');
});

void test('APO-01: questões ativas de um tema independem de conteúdo/roadmap', async () => {
  const { raw, db } = setup();
  raw.exec(
    `UPDATE atlas_questions SET theme = 'amazonia-plantas' WHERE id IN ('CG-001-Q01', 'CG-001-Q02')`,
  );
  const results = await listActiveQuestionsByTheme(db, 'amazonia-plantas');
  assert.deepEqual(
    results.map((item) => item.id).sort(),
    ['CG-001-Q01', 'CG-001-Q02'],
  );
});
