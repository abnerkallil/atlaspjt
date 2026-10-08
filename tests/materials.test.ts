// UX-01: material de estudo por conteúdo (texto, link ou arquivo anexado pelo usuário).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_MATERIALS_PER_CONTENT,
  MaterialError,
  assertCanAdd,
  deleteMaterial,
  fileTitle,
  insertMaterial,
  listMaterials,
  materialObjectKey,
  normalizeMaterial,
} from '../lib/materials.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

void test('texto e link são validados e normalizados', () => {
  assert.deepEqual(normalizeMaterial({ kind: 'texto', title: '  Resumo   da aula ', body: ' Contrato é acordo. ' }), {
    kind: 'texto',
    title: 'Resumo da aula',
    body: 'Contrato é acordo.',
    url: null,
  });
  const link = normalizeMaterial({ kind: 'link', title: '', url: ' https://youtu.be/abc ' });
  assert.equal(link.url, 'https://youtu.be/abc');
  assert.equal(link.title, 'youtu.be', 'sem título usa o domínio');
  assert.throws(() => normalizeMaterial({ kind: 'texto', title: 'x', body: '  ' }), MaterialError);
  assert.throws(() => normalizeMaterial({ kind: 'texto', title: '', body: 'a' }), /título/);
  assert.throws(() => normalizeMaterial({ kind: 'link', url: 'javascript:alert(1)' }), /http/);
  assert.throws(() => normalizeMaterial({ kind: 'link', url: 'youtube.com' }), /https:\/\//);
  assert.throws(() => normalizeMaterial({ kind: 'arquivo' }), /Tipo/);
  assert.throws(() => normalizeMaterial({ kind: 'texto', title: 'x', body: 'a'.repeat(20_001) }), (error: MaterialError) => error.status === 413);
  assert.equal(fileTitle('', 'C:\\docs\\Aula 3.pdf'), 'Aula 3');
  assert.equal(materialObjectKey('CG-001', 'm1'), 'materials/CG-001/m1');
});

void test('materiais ficam por conteúdo, em ordem, e saem com a chave do R2', async () => {
  const db = d1(migratedDatabase());
  await assertCanAdd(db, 'CG-001');
  await insertMaterial(db, { id: 'm1', contentId: 'CG-001', kind: 'texto', title: 'Resumo', body: 'texto', now });
  await insertMaterial(db, {
    id: 'm2',
    contentId: 'CG-001',
    kind: 'arquivo',
    title: 'Slides',
    file: { fileName: 'pasta/slides.pdf', mimeType: 'application/pdf', sizeBytes: 10, objectKey: 'materials/CG-001/m2' },
    now,
  });
  await insertMaterial(db, { id: 'm3', contentId: 'CG-002', kind: 'link', title: 'Vídeo', url: 'https://example.com/', now });

  const list = await listMaterials(db, 'CG-001');
  assert.deepEqual(list.map((item) => item.id), ['m1', 'm2']);
  assert.equal(list[1].fileName, 'slides.pdf', 'nome sem caminho');
  assert.equal(list[1].sizeBytes, 10);
  assert.equal('objectKey' in list[1], false, 'a chave do R2 não vai para o navegador');

  assert.deepEqual(await deleteMaterial(db, 'm2'), { objectKey: 'materials/CG-001/m2' });
  assert.deepEqual(await deleteMaterial(db, 'm1'), { objectKey: null });
  assert.equal(await deleteMaterial(db, 'm1'), null);
  assert.deepEqual(await listMaterials(db, 'CG-001'), []);
});

void test('conteúdo inexistente e limite por conteúdo param antes de gravar', async () => {
  const db = d1(migratedDatabase());
  await assert.rejects(assertCanAdd(db, 'CG-999'), (error: MaterialError) => error.status === 404);
  for (let index = 0; index < MAX_MATERIALS_PER_CONTENT; index += 1) {
    await insertMaterial(db, { id: `m${index}`, contentId: 'CG-001', kind: 'texto', title: 't', body: 'b', now });
  }
  await assert.rejects(assertCanAdd(db, 'CG-001'), (error: MaterialError) => error.status === 409);
});
