import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_VERSION,
  AtlasNotesValidationError,
  canonicalizeAtlasNotesContent,
  projectAtlasNotesBody,
} from '../lib/atlas-notes-document.js';
import {
  assertAtlasNotesOperationTarget,
  assertAtlasNotesStructuredWrite,
  parseAtlasNotesSaveRequest,
} from '../lib/atlas-notes-input.js';
import { canSinkListItemWithinDepth } from '../components/notes-editor-list-guard.js';

const v2Content = {
  format: ATLAS_NOTES_FORMAT,
  version: ATLAS_NOTES_VERSION,
  doc: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 6 },
        content: [{ type: 'text', text: 'Atlas' }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] },
    ],
  },
};

const v1Content = {
  format: ATLAS_NOTES_FORMAT,
  version: 1,
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

void test('prevents sinking a list item beyond the canonical depth limit', () => {
  assert.equal(canSinkListItemWithinDepth(5, 2, ATLAS_NOTES_LIMITS.depth), true);
  assert.equal(canSinkListItemWithinDepth(6, 2, ATLAS_NOTES_LIMITS.depth), false);
  assert.equal(ATLAS_NOTES_LIMITS.depth, 16);
});

void test('accepts structured v2 input and persists canonical v2 fields', () => {
  const parsed = parseAtlasNotesSaveRequest(
    payload({ content: v2Content }),
    'update',
  );
  assert.equal(parsed.body, 'Atlas\nNotes');
  assert.equal(parsed.title, 'Nota');
  assert.equal(parsed.content?.version, 2);
  assert.deepEqual(parsed.content, v2Content);
  assert.deepEqual(JSON.parse(parsed.contentJson!), v2Content);
});

void test('explicit structured save migrates v1 input to v2', () => {
  const original = JSON.stringify(v1Content);
  const parsed = parseAtlasNotesSaveRequest(
    payload({ content: v1Content }),
    'update',
  );
  assert.equal(parsed.content?.version, 2);
  assert.equal(JSON.parse(parsed.contentJson!).version, 2);
  assert.equal(parsed.body, 'Atlas\nNotes');
  assert.equal(JSON.stringify(v1Content), original);
});

void test('rejects invalid and future structured versions', () => {
  for (const version of [undefined, null, '2', 0, 3]) {
    expectCode(
      () =>
        parseAtlasNotesSaveRequest(
          payload({ content: { ...v2Content, version } }),
          'update',
        ),
      'INVALID_ENVELOPE',
    );
  }
});

void test('rejects a client body that diverges from structured projection', () => {
  expectCode(
    () =>
      parseAtlasNotesSaveRequest(
        payload({ body: 'texto divergente', content: v2Content }),
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

void test('round-trips all v2 persistence shapes through request and stored JSON', () => {
  const content = {
    format: ATLAS_NOTES_FORMAT,
    version: 2,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'marks',
              marks: [
                { type: 'bold' },
                { type: 'italic' },
                { type: 'strike' },
                { type: 'code' },
                { type: 'highlight' },
                { type: 'comment' },
                { type: 'link', attrs: { href: 'https://atlas.example' } },
              ],
            },
            { type: 'mathInline', attrs: { latex: 'x' } },
            { type: 'footnoteRef', attrs: { id: 'f1' } },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 6 },
          content: [{ type: 'text', text: 'h' }],
        },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
        },
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'task' }],
                },
              ],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'q' }] },
          ],
        },
        { type: 'horizontalRule' },
        {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [{ type: 'text', text: 'code' }],
        },
        { type: 'mathBlock', attrs: { latex: 'y' } },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'th' }],
                    },
                  ],
                },
                {
                  type: 'tableCell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'td' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'callout',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'callout' }] },
          ],
        },
        {
          type: 'footnote',
          attrs: { id: 'f1' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'footnote' }],
            },
          ],
        },
      ],
    },
  };
  const body = projectAtlasNotesBody(content);
  const parsed = parseAtlasNotesSaveRequest(
    payload({ body, content }),
    'create',
  );
  const stored = canonicalizeAtlasNotesContent(JSON.parse(parsed.contentJson!));
  assert.deepEqual(stored, parsed.content);
  assert.equal(projectAtlasNotesBody(stored), body);
  assert.equal(stored.version, 2);
});

void test('round-trips nested lists through structured save and hydration', () => {
  const content = {
    format: ATLAS_NOTES_FORMAT,
    version: 2,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'parent' }] },
                {
                  type: 'orderedList',
                  attrs: { start: 1, type: null },
                  content: [
                    {
                      type: 'listItem',
                      content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'child' }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const body = projectAtlasNotesBody(content);
  const parsed = parseAtlasNotesSaveRequest(
    payload({ body, content }),
    'create',
  );
  const stored = canonicalizeAtlasNotesContent(JSON.parse(parsed.contentJson!));
  assert.equal(body, 'parent\nchild');
  assert.deepEqual(stored, parsed.content);
  assert.equal(projectAtlasNotesBody(stored), body);
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

void test('protects structured rows from body-only downgrade', () => {
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
