// APA-18: confere que cada lote de aulas manuais em data/apache/aulas/
// (carregado em produção por scripts/apache-carregar-aulas.mjs) passa pela
// MESMA validação de lib/apache/schema.ts#validateLesson usada por
// saveLesson (APA-05) — nunca grava uma aula fora do schema real.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { validateLesson } from '../lib/apache/schema.js';

const LOTES_DIR = join(process.cwd(), 'data/apache/aulas');

// scripts/apache-carregar-aulas.mjs (--all): carrega TODOS os lotes num
// único comando, na mesma ordem que `listLoteFiles()` expõe — testa isso sem
// tocar wrangler/D1/R2 de verdade (só as funções puras exportadas pelo
// script: listagem e validação de cada lote).
type CarregarAulasModule = {
  listLoteFiles(): string[];
  readLoteEntries(file: string): { contentId: string; lesson: unknown }[];
};

const carregarAulas = (await import(
  pathToFileURL(join(process.cwd(), 'scripts/apache-carregar-aulas.mjs')).href
)) as CarregarAulasModule;

function loadLotes(): { file: string; entries: { contentId: string; lesson: unknown }[] }[] {
  return readdirSync(LOTES_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((file) => ({ file, entries: JSON.parse(readFileSync(join(LOTES_DIR, file), 'utf8')) }));
}

void test('todo lote de aulas manuais é uma lista não vazia de {contentId, lesson}', () => {
  const lotes = loadLotes();
  assert.ok(lotes.length > 0, 'nenhum lote encontrado em data/apache/aulas/');
  for (const { file, entries } of lotes) {
    assert.ok(Array.isArray(entries) && entries.length > 0, `${file}: precisa ser uma lista não vazia`);
    for (const entry of entries) {
      assert.equal(typeof entry.contentId, 'string', `${file}: contentId ausente`);
      assert.ok(entry.contentId.length > 0, `${file}: contentId vazio`);
    }
  }
});

void test('toda aula manual passa pela validação real de lib/apache/schema.ts', () => {
  const lotes = loadLotes();
  for (const { file, entries } of lotes) {
    for (const entry of entries) {
      try {
        validateLesson(entry.lesson);
      } catch (error) {
        throw new Error(`${file} (${entry.contentId}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
});

void test('contentIds de cada lote são únicos dentro do lote', () => {
  const lotes = loadLotes();
  for (const { file, entries } of lotes) {
    const ids = entries.map((entry) => entry.contentId);
    assert.equal(new Set(ids).size, ids.length, `${file}: contentId duplicado`);
  }
});

void test('--all (listLoteFiles) vê exatamente os mesmos lotes de data/apache/aulas/, em ordem alfabética', () => {
  const expected = readdirSync(LOTES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => join('data/apache/aulas', name));
  assert.deepEqual(carregarAulas.listLoteFiles(), expected);
});

void test('--all (readLoteEntries) valida cada lote da mesma forma que --file, incluindo o sub-lote 15 (Reforma tributária — Documentos fiscais)', () => {
  for (const file of carregarAulas.listLoteFiles()) {
    const entries = carregarAulas.readLoteEntries(file);
    assert.ok(entries.length > 0, `${file}: lote vazio`);
  }
  const ultimoLote = carregarAulas.readLoteEntries('data/apache/aulas/contabilidade-tributaria-15.json');
  assert.deepEqual(
    ultimoLote.map((entry) => entry.contentId),
    ['CT-118', 'CT-119', 'CT-120', 'CT-121', 'CT-122', 'CT-123', 'CT-124'],
  );
});

void test('--all (readLoteEntries) rejeita um lote com aula fora do schema, apontando o contentId', () => {
  assert.throws(
    () => carregarAulas.readLoteEntries('tests/fixtures/apache-lote-invalido.json'),
    /CT-999/,
  );
});
