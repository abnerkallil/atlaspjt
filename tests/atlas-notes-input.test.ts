import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_VERSION,
  AtlasNotesValidationError,
} from '../lib/atlas-notes-document.js';
import {
  assertAtlasNotesOperationTarget,
  assertAtlasNotesStructuredWrite,
  parseAtlasNotesSaveRequest,
} from '../lib/atlas-notes-input.js';

const content = {
  format: ATLAS_NOTES_FORMAT,
  version: ATLAS_NOTES_VERSION,
  doc: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Atlas' }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] },
    ],
  },
};

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: 'note-1',
    operationId: 'operation-1',
    title: 'Nota',
    body: 'Atlas\nNotes',
    contentIds: [],
    ...overrides,
  });
}

function expectCode(action: () => unknown, code: string, status = 400) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AtlasNotesValidationError);
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return true;
  });
}

void test('accepts a structured additive request and derives canonical fields', () => {
  const parsed = parseAtlasNotesSaveRequest(payload({ content }), 'update');
  assert.equal(parsed.body, 'Atlas\nNotes');
  assert.equal(parsed.title, 'Nota');
  assert.deepEqual(parsed.content, content);
  assert.deepEqual(JSON.parse(parsed.contentJson!), content);
});

void test('rejects a client body that diverges from the structured projection', () => {
  expectCode(
    () =>
      parseAtlasNotesSaveRequest(
        payload({ body: 'texto divergente', content }),
        'update',
      ),
    'BODY_PROJECTION_MISMATCH',
  );
});

void test('preserves the legacy body-only contract with existing trim behavior', () => {
  const parsed = parseAtlasNotesSaveRequest(
    payload({ body: '  texto legado  ' }),
    'update',
  );
  assert.equal(parsed.body, 'texto legado');
  assert.equal(parsed.content, null);
  assert.equal(parsed.contentJson, null);
});

void test('rejects malformed input and invalid relationships', () => {
  expectCode(
    () => parseAtlasNotesSaveRequest('{', 'create'),
    'INVALID_REQUEST',
  );
  expectCode(
    () => parseAtlasNotesSaveRequest(payload({ contentIds: [7] }), 'create'),
    'INVALID_REQUEST',
  );
});

void test('enforces visible and raw request guards without truncating', () => {
  expectCode(
    () =>
      parseAtlasNotesSaveRequest(
        payload({ body: 'x'.repeat(ATLAS_NOTES_LIMITS.visibleLength + 1) }),
        'create',
      ),
    'VISIBLE_LIMIT_EXCEEDED',
  );
  expectCode(
    () =>
      parseAtlasNotesSaveRequest(
        ' '.repeat(ATLAS_NOTES_LIMITS.requestBytes + 1),
        'create',
      ),
    'REQUEST_TOO_LARGE',
    413,
  );
});

void test('protects structured rows from downgrade', () => {
  assert.doesNotThrow(() => assertAtlasNotesStructuredWrite(null, null));
  assert.doesNotThrow(() => assertAtlasNotesStructuredWrite(null, '{}'));
  assert.doesNotThrow(() => assertAtlasNotesStructuredWrite('{}', '{}'));
  expectCode(
    () => assertAtlasNotesStructuredWrite('{}', null),
    'STRUCTURED_DOWNGRADE',
  );
});

void test('keeps an operation id scoped to its first note', () => {
  assert.doesNotThrow(() =>
    assertAtlasNotesOperationTarget('note-1', 'note-1'),
  );
  expectCode(
    () => assertAtlasNotesOperationTarget('note-1', 'note-2'),
    'OPERATION_CONFLICT',
  );
});
