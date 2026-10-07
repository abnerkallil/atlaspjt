// TEC-05 (UI): o editor de notas envia, lista, baixa e remove anexos de
// verdade pelas rotas /api/attachments, e não sobra nada do bloco
// demonstrativo.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ATTACHMENT_ACCEPT,
  attachmentDownloadUrl,
  deleteAttachment,
  describeAttachment,
  fetchNoteAttachments,
  prepareAttachmentItem,
  savedAttachmentItem,
  uploadAttachment,
  type AttachmentMeta,
} from '../components/notes-attachments.js';
import { MAX_ATTACHMENT_BYTES } from '../lib/attachments.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..', '..');
const read = (...parts: string[]) =>
  readFileSync(path.join(repoRoot, ...parts), 'utf8');

const meta: AttachmentMeta = {
  id: 'att-1',
  noteId: 'note-1',
  fileName: 'resumo.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
  createdAt: '2026-10-07T12:00:00.000Z',
};

type Call = { url: string; init?: RequestInit };

function fakeFetch(status: number, body: unknown, calls: Call[]) {
  return async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

void test('arquivo aceito fica pendente com o arquivo guardado para envio', () => {
  const file = new File(['%PDF-1.4'], 'aula.pdf', { type: 'application/pdf' });
  const item = prepareAttachmentItem(file, 'k1');
  assert.equal(item.status, 'pending');
  assert.equal(item.mimeType, 'application/pdf');
  assert.equal(item.file, file);
  assert.equal(item.id, null);
});

void test('formato ou tamanho fora do limite é recusado antes do envio', () => {
  const exe = prepareAttachmentItem(new File(['x'], 'virus.exe'), 'k2');
  assert.equal(exe.status, 'error');
  assert.match(exe.error ?? '', /Formato não suportado/);
  assert.equal(exe.file, undefined);

  const big = new File([new Uint8Array(MAX_ATTACHMENT_BYTES + 1)], 'grande.png', {
    type: 'image/png',
  });
  const tooBig = prepareAttachmentItem(big, 'k3');
  assert.equal(tooBig.status, 'error');
  assert.match(tooBig.error ?? '', /10MB/);
});

void test('anexo salvo vira item baixável com o id do servidor', () => {
  const item = savedAttachmentItem(meta);
  assert.equal(item.status, 'saved');
  assert.equal(item.id, 'att-1');
  assert.equal(item.name, 'resumo.pdf');
  assert.equal(attachmentDownloadUrl('att-1'), '/api/attachments/att-1');
  assert.equal(describeAttachment(item, '2.0 KB'), '2.0 KB');
  assert.match(
    describeAttachment({ ...item, status: 'pending' }, '2.0 KB'),
    /envia ao salvar/,
  );
});

void test('lista os anexos da nota pela API', async () => {
  const calls: Call[] = [];
  const list = await fetchNoteAttachments(
    'note 1',
    fakeFetch(200, { attachments: [meta] }, calls),
  );
  assert.deepEqual(list, [meta]);
  assert.equal(calls[0].url, '/api/attachments?noteId=note%201');
});

void test('envia o arquivo como multipart com noteId', async () => {
  const calls: Call[] = [];
  const file = new File(['%PDF-1.4'], 'aula.pdf', { type: 'application/pdf' });
  const saved = await uploadAttachment(
    'note-1',
    file,
    fakeFetch(201, { attachment: meta }, calls),
  );
  assert.equal(saved.id, 'att-1');
  assert.equal(calls[0].url, '/api/attachments');
  assert.equal(calls[0].init?.method, 'POST');
  const form = calls[0].init?.body as FormData;
  assert.equal(form.get('noteId'), 'note-1');
  assert.equal((form.get('file') as File).name, 'aula.pdf');
});

void test('mostra a mensagem do servidor quando o envio falha', async () => {
  await assert.rejects(
    uploadAttachment(
      'note-1',
      new File(['x'], 'a.pdf'),
      fakeFetch(404, { error: 'Nota não encontrada.' }, []),
    ),
    /Nota não encontrada/,
  );
});

void test('remove pelo DELETE e tolera anexo já removido', async () => {
  const calls: Call[] = [];
  await deleteAttachment('att-1', fakeFetch(200, { ok: true }, calls));
  assert.equal(calls[0].url, '/api/attachments/att-1');
  assert.equal(calls[0].init?.method, 'DELETE');
  await deleteAttachment('att-1', fakeFetch(404, { error: 'x' }, []));
  await assert.rejects(
    deleteAttachment('att-1', fakeFetch(500, { error: 'Falhou.' }, [])),
    /Falhou/,
  );
});

void test('editor usa a API real e não tem mais o bloco demonstrativo', () => {
  const workspace = read('components', 'notes-workspace.tsx');
  assert.doesNotMatch(workspace, /Demonstrativo|sem upload real|DemoAttachment/);
  assert.doesNotMatch(workspace, /fora do escopo/);
  assert.match(workspace, /loadAttachments\(note\.id\)/);
  assert.match(workspace, /accept=\{ATTACHMENT_ACCEPT\}/);
  assert.match(workspace, /Baixar anexo/);
  assert.match(workspace, /Remover anexo/);
  assert.equal(ATTACHMENT_ACCEPT, '.png,.jpg,.jpeg,.pdf,.docx');

  const css = read('app', 'globals.css');
  assert.doesNotMatch(css, /attachments-demo-badge/);

  const session = read('components', 'pages', 'study-session.tsx');
  assert.doesNotMatch(session, /quando o armazenamento de anexos for ativado/);
});
