// APO-05 (DEC-015): acervo de fontes no R2. Aqui só a parte de D1 (metadados);
// os bytes em si são gravados/lidos pelas rotas do Worker (fora deste spike).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SourceError,
  deleteSource,
  findSourceBySha256,
  getSource,
  insertSource,
  listSources,
  normalizeSourceInput,
  sourceObjectKey,
  themeSlug,
  validateSourceFile,
} from '../lib/apolo/index.js';
import { d1 } from './support/d1-sqlite.js';
import { migratedDatabase } from './support/migrated-db.js';

const now = '2026-10-08T12:00:00.000Z';

function setup() {
  const raw = migratedDatabase();
  return { raw, db: d1(raw) };
}

void test('APO-05: tema vira segmento de caminho normalizado; sem tema cai em sem-tema', () => {
  assert.equal(themeSlug('Direito Constitucional'), 'direito-constitucional');
  assert.equal(themeSlug(null), 'sem-tema');
  assert.equal(sourceObjectKey('Direito Constitucional', 'abc'), 'apolo/fontes/direito-constitucional/abc');
  assert.equal(sourceObjectKey(null, 'abc'), 'apolo/fontes/sem-tema/abc');
});

void test('APO-05: normaliza entrada — prova de concurso aceita banca/orgão/ano, apostila/lista não', () => {
  const prova = normalizeSourceInput({
    title: 'Prova TJ-SP 2023',
    theme: 'direito-constitucional',
    sourceType: 'prova_concurso',
    examBoard: 'FGV',
    examOrg: 'TJ-SP',
    examYear: '2023',
  });
  assert.deepEqual(prova, {
    title: 'Prova TJ-SP 2023',
    theme: 'direito-constitucional',
    sourceType: 'prova_concurso',
    examBoard: 'FGV',
    examOrg: 'TJ-SP',
    examYear: 2023,
  });

  const apostila = normalizeSourceInput({ title: 'Apostila módulo 1', sourceType: 'apostila', examBoard: 'ignorado' });
  assert.deepEqual(apostila, {
    title: 'Apostila módulo 1',
    theme: null,
    sourceType: 'apostila',
    examBoard: null,
    examOrg: null,
    examYear: null,
  });

  assert.throws(() => normalizeSourceInput({ title: 'x', sourceType: 'invalido' }), SourceError);
  assert.throws(() => normalizeSourceInput({ title: '   ', sourceType: 'lista' }), SourceError);
});

void test('APO-05: só aceita PDF, dentro do limite de 30MB', () => {
  assert.equal(validateSourceFile({ name: 'prova.pdf', size: 1024 }), 'application/pdf');
  assert.throws(() => validateSourceFile({ name: 'prova.docx', size: 1024 }), SourceError);
  assert.throws(() => validateSourceFile({ name: 'prova.pdf', size: 0 }), SourceError);
  assert.throws(() => validateSourceFile({ name: 'prova.pdf', size: 31 * 1024 * 1024 }), SourceError);
});

void test('APO-05: insere, lista por tema, busca por id e apaga a fonte', async () => {
  const { db } = setup();
  const common = { fileName: 'prova.pdf', mimeType: 'application/pdf', sizeBytes: 100, now };
  await insertSource(db, {
    id: 'src-1',
    title: 'Prova TJ-SP 2023',
    theme: 'direito-constitucional',
    sourceType: 'prova_concurso',
    examBoard: 'FGV',
    examOrg: 'TJ-SP',
    examYear: 2023,
    pageCount: null,
    sha256: 'hash-1',
    objectKey: sourceObjectKey('direito-constitucional', 'src-1'),
    ...common,
  });
  await insertSource(db, {
    id: 'src-2',
    title: 'Apostila módulo 1',
    theme: null,
    sourceType: 'apostila',
    examBoard: null,
    examOrg: null,
    examYear: null,
    pageCount: 40,
    sha256: 'hash-2',
    objectKey: sourceObjectKey(null, 'src-2'),
    ...common,
  });

  const all = await listSources(db);
  assert.deepEqual(all.map((s) => s.id).sort(), ['src-1', 'src-2']);

  const byTheme = await listSources(db, 'direito-constitucional');
  assert.deepEqual(byTheme.map((s) => s.id), ['src-1']);

  const found = await getSource(db, 'src-1');
  assert.equal(found?.source.examBoard, 'FGV');
  assert.equal(found?.objectKey, 'apolo/fontes/direito-constitucional/src-1');

  assert.equal((await getSource(db, 'não-existe')), null);

  const removed = await deleteSource(db, 'src-2');
  assert.equal(removed?.objectKey, 'apolo/fontes/sem-tema/src-2');
  assert.equal(await getSource(db, 'src-2'), null);
  assert.equal(await deleteSource(db, 'src-2'), null);
});

void test('APO-05: o mesmo PDF (sha256 igual) não entra duas vezes no acervo', async () => {
  const { db } = setup();
  const item = {
    id: 'src-a',
    title: 'Lista de exercícios',
    theme: 'direito-administrativo',
    sourceType: 'lista' as const,
    examBoard: null,
    examOrg: null,
    examYear: null,
    pageCount: null,
    fileName: 'lista.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 50,
    sha256: 'hash-dup',
    objectKey: sourceObjectKey('direito-administrativo', 'src-a'),
    now,
  };
  await insertSource(db, item);
  assert.equal((await findSourceBySha256(db, 'hash-dup'))?.id, 'src-a');
  await assert.rejects(
    insertSource(db, { ...item, id: 'src-b', objectKey: sourceObjectKey('direito-administrativo', 'src-b') }),
    SourceError,
  );
});
