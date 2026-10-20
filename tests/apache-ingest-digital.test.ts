// APA-09: ingestão de arquivo digital (PDF/DOCX/XLSX) via toMarkdown.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ApacheError } from '../lib/apache/errors.js';
import {
  extractDigital,
  MAX_EXTRACTED_CHARS,
  type MarkdownConversionAi,
} from '../lib/apache/ingest-digital.js';

function fakeAi(data: string | null): MarkdownConversionAi {
  return {
    toMarkdown: async () =>
      data === null ? { format: 'error', error: 'falhou' } : { format: 'markdown', data },
  };
}

async function assertApacheError(run: () => Promise<unknown>, status: number) {
  await assert.rejects(run, (err: unknown) => err instanceof ApacheError && err.status === status);
}

void test('fixture digital: extrai o markdown e conta páginas pelos marcadores "Page N"', async () => {
  const markdown =
    '### Page 1\n' +
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(5) +
    '\n\n### Page 2\n' +
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(5);
  const result = await extractDigital(fakeAi(markdown), {
    bytes: new ArrayBuffer(0),
    mimeType: 'application/pdf',
  });
  assert.equal(result.markdown, markdown);
  assert.equal(result.pages, 2);
  assert.equal(result.provavelmenteEscaneado, false);
});

void test('fixture escaneada: markdown vazio sinaliza provavelmente escaneado', async () => {
  const result = await extractDigital(fakeAi(''), {
    bytes: new ArrayBuffer(0),
    mimeType: 'application/pdf',
  });
  assert.equal(result.provavelmenteEscaneado, true);
  assert.equal(result.pages, 1);
});

void test('DOCX/XLSX sem marcador de página usa a heurística por tamanho (6.000 chars/página)', async () => {
  const markdown = 'x'.repeat(12_000);
  const result = await extractDigital(fakeAi(markdown), {
    bytes: new ArrayBuffer(0),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  assert.equal(result.pages, 2);
  assert.equal(result.provavelmenteEscaneado, false);
});

void test('rejeita acima de MAX_EXTRACTED_CHARS (Gate APA-14 item 5) mesmo com 1 página marcada', async () => {
  const markdown = '### Page 1\n' + 'x'.repeat(MAX_EXTRACTED_CHARS + 1);
  await assertApacheError(
    () => extractDigital(fakeAi(markdown), { bytes: new ArrayBuffer(0), mimeType: 'application/pdf' }),
    413,
  );
});

void test('rejeita quando o toMarkdown devolve format "error"', async () => {
  await assertApacheError(
    () => extractDigital(fakeAi(null), { bytes: new ArrayBuffer(0), mimeType: 'application/pdf' }),
    422,
  );
});

void test('rejeita mimeType fora de PDF/DOCX/XLSX', async () => {
  await assertApacheError(
    () => extractDigital(fakeAi('qualquer coisa'), { bytes: new ArrayBuffer(0), mimeType: 'image/png' }),
    415,
  );
});
