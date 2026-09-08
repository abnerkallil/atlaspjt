import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_VERSION,
  AtlasNotesValidationError,
  assertAtlasNotesRequestSize,
  canonicalizeAtlasNotesContent,
  isAtlasNotesDocument,
  legacyTextToAtlasNotesContent,
  plainTextToAtlasNotesBlocks,
  prepareAtlasNotesForSave,
  projectAtlasNotesBody,
} from '../lib/atlas-notes-document.js';

const text = (value: string, marks?: Array<{ type: 'bold' | 'italic' }>) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const paragraph = (value = '') => ({
  type: 'paragraph',
  ...(value ? { content: [text(value)] } : {}),
});
const envelope = (content: unknown[]) => ({
  format: ATLAS_NOTES_FORMAT,
  version: ATLAS_NOTES_VERSION,
  doc: { type: 'doc', content },
});

function expectCode(action: () => unknown, code: string, status = 400) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AtlasNotesValidationError);
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return true;
  });
}

void test('canonicalizes mark order and merges adjacent equivalent text', () => {
  const canonical = canonicalizeAtlasNotesContent(
    envelope([
      {
        type: 'paragraph',
        content: [
          text('Atlas', [{ type: 'italic' }, { type: 'bold' }]),
          text(' Notes', [{ type: 'bold' }, { type: 'italic' }]),
        ],
      },
    ]),
  );
  assert.deepEqual(canonical.doc.content[0], {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: 'Atlas Notes',
        marks: [{ type: 'bold' }, { type: 'italic' }],
      },
    ],
  });
});

void test('projects paragraphs and empty paragraphs with exact LF semantics', () => {
  assert.equal(
    projectAtlasNotesBody(
      envelope([paragraph('a'), paragraph(), paragraph('b')]),
    ),
    'a\n\nb',
  );
  assert.equal(
    projectAtlasNotesBody(envelope([paragraph(), paragraph('a'), paragraph()])),
    'a',
  );
});

void test('projects lists, headings and quotes without visual markers', () => {
  const content = envelope([
    { type: 'heading', attrs: { level: 2 }, content: [text('Título')] },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [paragraph('a')] },
        { type: 'listItem', content: [paragraph('b')] },
      ],
    },
    {
      type: 'orderedList',
      attrs: { start: 1, type: null },
      content: [{ type: 'listItem', content: [paragraph('c')] }],
    },
    { type: 'blockquote', content: [paragraph('q1'), paragraph('q2')] },
  ]);
  assert.equal(projectAtlasNotesBody(content), 'Título\na\nb\nc\nq1\nq2');
});

void test('imports legacy line endings and preserves blank lines structurally', () => {
  const imported = legacyTextToAtlasNotesContent('\r\na\r\n\r\nb\r');
  assert.deepEqual(imported.doc.content, [
    paragraph(),
    paragraph('a'),
    paragraph(),
    paragraph('b'),
    paragraph(),
  ]);
  assert.equal(projectAtlasNotesBody(imported), 'a\n\nb');
});

void test('converts pasted rich-looking text without interpreting HTML', () => {
  assert.deepEqual(plainTextToAtlasNotesBlocks('<strong>texto</strong>\r\n'), [
    paragraph('<strong>texto</strong>'),
    paragraph(),
  ]);
});

void test('derives the only body and UTF-16 character count', () => {
  const prepared = prepareAtlasNotesForSave(
    envelope([paragraph('  texto 😀  ')]),
  );
  assert.equal(prepared.body, 'texto 😀');
  assert.equal(prepared.characterCount, 8);
  assert.deepEqual(JSON.parse(prepared.contentJson), prepared.content);
});

void test('accepts only Tiptap 3.31.3 default ordered-list attributes', () => {
  assert.doesNotThrow(() =>
    canonicalizeAtlasNotesContent(
      envelope([
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [{ type: 'listItem', content: [paragraph('item')] }],
        },
      ]),
    ),
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'orderedList',
            attrs: { start: 2, type: null },
            content: [{ type: 'listItem', content: [paragraph('item')] }],
          },
        ]),
      ),
    'INVALID_NODE',
  );
});

void test('rejects unsupported nodes, marks, attributes and heading levels', () => {
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([{ type: 'hardBreak' }])),
    'INVALID_NODE',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'x', marks: [{ type: 'strike' }] }],
          },
        ]),
      ),
    'INVALID_MARK',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'paragraph', attrs: { class: 'hostile' } }]),
      ),
    'UNKNOWN_FIELD',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          { type: 'heading', attrs: { level: 4 }, content: [text('x')] },
        ]),
      ),
    'INVALID_NODE',
  );
});

void test('rejects nested lists and non-paragraph list or quote children', () => {
  const nested = {
    type: 'bulletList',
    content: [
      {
        type: 'listItem',
        content: [
          paragraph('outer'),
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [paragraph('inner')] }],
          },
        ],
      },
    ],
  };
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([nested])),
    'INVALID_NODE',
  );
  assert.equal(isAtlasNotesDocument({ type: 'doc', content: [nested] }), false);
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'blockquote',
            content: [
              {
                type: 'bulletList',
                content: [{ type: 'listItem', content: [paragraph('x')] }],
              },
            ],
          },
        ]),
      ),
    'INVALID_NODE',
  );
});

void test('rejects empty saves and visible text above the limit', () => {
  expectCode(
    () => prepareAtlasNotesForSave(envelope([paragraph()])),
    'EMPTY_CONTENT',
  );
  const first = 'a'.repeat(50_000);
  const second = 'b'.repeat(50_000);
  expectCode(
    () =>
      prepareAtlasNotesForSave(envelope([paragraph(first), paragraph(second)])),
    'VISIBLE_LIMIT_EXCEEDED',
  );
});

void test('enforces request, structured, node and text-node guards', () => {
  expectCode(
    () =>
      assertAtlasNotesRequestSize(
        'a'.repeat(ATLAS_NOTES_LIMITS.requestBytes + 1),
      ),
    'REQUEST_TOO_LARGE',
    413,
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          paragraph('a'.repeat(ATLAS_NOTES_LIMITS.textNodeLength + 1)),
        ]),
      ),
    'TEXT_NODE_TOO_LONG',
  );
  const manyParagraphs = Array.from({ length: ATLAS_NOTES_LIMITS.nodes }, () =>
    paragraph(),
  );
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope(manyParagraphs)),
    'TOO_MANY_NODES',
  );
  const segmented = Array.from({ length: 19_999 }, () => text('x'.repeat(40)));
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'paragraph', content: segmented }]),
      ),
    'STRUCTURED_CONTENT_TOO_LARGE',
    413,
  );
});
