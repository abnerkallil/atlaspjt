import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AttachmentError,
  MAX_ATTACHMENT_BYTES,
  objectKeyFor,
  sanitizeFileName,
  validateAttachment,
} from '../lib/attachments.js';

void test('aceita PNG/JPG/JPEG/PDF/DOCX dentro de 10MB', () => {
  assert.equal(validateAttachment({ name: 'a.PNG', size: 10, type: 'image/png' }), 'image/png');
  assert.equal(validateAttachment({ name: 'a.jpg', size: 10, type: 'image/jpeg' }), 'image/jpeg');
  assert.equal(validateAttachment({ name: 'a.jpeg', size: 10, type: '' }), 'image/jpeg');
  assert.equal(validateAttachment({ name: 'a.pdf', size: MAX_ATTACHMENT_BYTES, type: 'application/pdf' }), 'application/pdf');
  assert.ok(validateAttachment({ name: 'a.docx', size: 10, type: '' }).includes('wordprocessingml'));
});

void test('recusa acima de 10MB, vazio, formato e tipo divergente', () => {
  const status = (f: { name: string; size: number; type: string }) => {
    try {
      validateAttachment(f);
    } catch (e) {
      assert.ok(e instanceof AttachmentError);
      return e.status;
    }
    return 200;
  };
  assert.equal(status({ name: 'a.pdf', size: MAX_ATTACHMENT_BYTES + 1, type: 'application/pdf' }), 413);
  assert.equal(status({ name: 'a.pdf', size: 0, type: 'application/pdf' }), 400);
  assert.equal(status({ name: 'a.exe', size: 5, type: '' }), 415);
  assert.equal(status({ name: 'a', size: 5, type: '' }), 415);
  assert.equal(status({ name: 'a.png', size: 5, type: 'application/pdf' }), 415);
});

void test('nome de exibição é sanitizado e a chave R2 não usa o nome', () => {
  assert.equal(sanitizeFileName('../../etc/pa"sswd.png'), 'passwd.png');
  assert.equal(sanitizeFileName(''), 'arquivo');
  assert.equal(objectKeyFor('n1', 'a1'), 'attachments/n1/a1');
});
