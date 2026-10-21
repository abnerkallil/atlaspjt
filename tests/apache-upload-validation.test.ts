import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import { MAX_APACHE_UPLOAD_BYTES, validateApacheUpload } from '../lib/apache/upload-validation.js';

function bytesOf(...values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer;
}

void test('APA-12: aceita PDF com magic bytes corretos', () => {
  const pdf = bytesOf(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34);
  assert.doesNotThrow(() => validateApacheUpload(pdf, 'application/pdf'));
});

void test('APA-12: aceita DOCX (ZIP) com magic bytes corretos', () => {
  const zip = bytesOf(0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0);
  assert.doesNotThrow(() =>
    validateApacheUpload(zip, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
  );
});

void test('APA-12: rejeita quando o conteúdo não combina com o tipo declarado', () => {
  const notAPdf = bytesOf(0x50, 0x4b, 0x03, 0x04);
  assert.throws(() => validateApacheUpload(notAPdf, 'application/pdf'), ApacheError);
});

void test('APA-12: rejeita tipo não suportado', () => {
  const pdf = bytesOf(0x25, 0x50, 0x44, 0x46);
  assert.throws(() => validateApacheUpload(pdf, 'image/png'), ApacheError);
});

void test('APA-12: rejeita arquivo maior que 10MB', () => {
  const big = new Uint8Array(MAX_APACHE_UPLOAD_BYTES + 1);
  big.set([0x25, 0x50, 0x44, 0x46]);
  assert.throws(() => validateApacheUpload(big.buffer, 'application/pdf'), ApacheError);
});

void test('APA-12: rejeita arquivo vazio', () => {
  assert.throws(() => validateApacheUpload(new ArrayBuffer(0), 'application/pdf'), ApacheError);
});
