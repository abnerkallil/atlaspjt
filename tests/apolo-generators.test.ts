// APO-16: os 5 geradores reais (um por categoria estrutural, separada do
// tema) precisam nunca produzir versão inválida, qualquer que seja a
// semente — teste de 10 mil sementes por molde, como o card pede.
import assert from 'node:assert/strict';
import test from 'node:test';
import { expandItemModel, type GeneratedQuestion } from '../lib/apolo/index.js';
import { itemModelFromRow, type ItemModel, type ItemModelRow } from '../lib/apolo/types.js';
import { migratedDatabase } from './support/migrated-db.js';

const SEEDS_PER_MODEL = 10_000;

function allItemModels(raw: ReturnType<typeof migratedDatabase>): ItemModel[] {
  const rows = raw.prepare(`SELECT * FROM atlas_item_models ORDER BY id`).all() as unknown as ItemModelRow[];
  return rows.map(itemModelFromRow);
}

function assertValidQuestion(model: ItemModel, q: GeneratedQuestion) {
  assert.equal(q.kind, model.kind, `kind da questão gerada deve bater com o molde ${model.id}`);
  assert.ok(q.prompt.trim().length > 0, `prompt vazio em ${model.id}`);
  assert.ok(q.explanation.trim().length > 0, `explicação vazia em ${model.id}`);
  if (q.kind === 'multipla' || q.kind === 'certo_errado') {
    assert.ok(Array.isArray(q.options) && q.options.length >= 2, `opções insuficientes em ${model.id}`);
    assert.equal(new Set(q.options).size, q.options!.length, `opções repetidas em ${model.id}`);
    assert.ok(
      typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption < q.options!.length,
      `correctOption inválido em ${model.id}`,
    );
  } else if (q.kind === 'lacuna_numerica') {
    assert.equal(q.options, null, `lacuna_numerica não deveria ter opções em ${model.id}`);
    assert.ok(Number.isFinite(q.expectedValue), `expectedValue inválido em ${model.id}`);
    assert.ok(
      typeof q.tolerance === 'number' && Number.isFinite(q.tolerance) && q.tolerance >= 0,
      `tolerance inválida em ${model.id}`,
    );
  } else if (q.kind === 'dissertativa') {
    assert.equal(q.options, null, `dissertativa não deveria ter opções em ${model.id}`);
    assert.ok(
      typeof q.modelAnswer === 'string' && q.modelAnswer.trim().length > 0,
      `modelAnswer vazio em ${model.id}`,
    );
  }
}

void test('APO-16: migração cria os moldes do piloto, todos nascendo rascunho', () => {
  const raw = migratedDatabase();
  const models = allItemModels(raw);
  assert.equal(models.length, 11);
  assert.ok(models.every((m) => m.lifecycleState === 'rascunho'), 'nenhum molde pode nascer ativo (curadoria humana antes)');
  const cg = models.filter((m) => m.theme === 'contabilidade-geral');
  assert.equal(cg.length, 10, 'card pede 10 moldes de Contabilidade Geral para os conteúdos do piloto');
});

void test('APO-16: ao menos 1 categoria estrutural (generatorKey) reaproveitada em 2 temas diferentes', () => {
  const raw = migratedDatabase();
  const models = allItemModels(raw);
  const byGenerator = new Map<string, Set<string>>();
  for (const model of models) {
    const temas = byGenerator.get(model.generatorKey) ?? new Set<string>();
    temas.add(model.theme);
    byGenerator.set(model.generatorKey, temas);
  }
  const reused = [...byGenerator.entries()].filter(([, temas]) => temas.size >= 2);
  assert.ok(reused.length >= 1, 'nenhuma categoria estrutural foi reaproveitada entre temas diferentes');
  const [generatorKey, temas] = reused[0];
  assert.equal(generatorKey, 'calculo_percentual');
  assert.deepEqual([...temas].sort(), ['contabilidade-geral', 'direito-tributario']);
});

void test('APO-16: cada molde gera 10 mil versões válidas, sem nenhuma inválida', () => {
  const raw = migratedDatabase();
  const models = allItemModels(raw);
  assert.ok(models.length > 0);
  for (const model of models) {
    for (let i = 0; i < SEEDS_PER_MODEL; i += 1) {
      const question = expandItemModel(model, `${model.id}-${i}`);
      assertValidQuestion(model, question);
    }
  }
});

void test('APO-16: a mesma semente produz sempre a mesma versão (determinístico, sem IA)', () => {
  const raw = migratedDatabase();
  const models = allItemModels(raw);
  for (const model of models) {
    const first = expandItemModel(model, 'semente-fixa-123');
    const again = expandItemModel(model, 'semente-fixa-123');
    assert.deepEqual(first, again, `molde ${model.id} não é determinístico`);
  }
});
