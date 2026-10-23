// APA-18: confere que cada lote de aulas manuais em data/apache/aulas/
// (carregado em produção por scripts/apache-carregar-aulas.mjs) passa pela
// MESMA validação de lib/apache/schema.ts#validateLesson usada por
// saveLesson (APA-05) — nunca grava uma aula fora do schema real.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { validateLesson } from '../lib/apache/schema.js';

const LOTES_DIR = join(process.cwd(), 'data/apache/aulas');

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
