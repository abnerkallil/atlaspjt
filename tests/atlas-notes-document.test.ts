import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema } from '@tiptap/pm/model';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_MARK_COLORS,
  ATLAS_NOTES_VERSION,
  AtlasNotesValidationError,
  assertAtlasNotesRequestSize,
  canonicalizeAtlasNotesContent,
  canonicalizeAtlasNotesContentV1,
  canonicalizeAtlasNotesContentV2,
  extractAtlasNotesFavorites,
  isAtlasNotesDocument,
  legacyTextToAtlasNotesContent,
  plainTextToAtlasNotesBlocks,
  prepareAtlasNotesForSave,
  projectAtlasNotesBody,
} from '../lib/atlas-notes-document.js';

const text = (value: string, marks?: unknown[]) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const paragraph = (value = '') => ({
  type: 'paragraph',
  ...(value ? { content: [text(value)] } : {}),
});
const richParagraph = (content: unknown[]) => ({ type: 'paragraph', content });
const envelope = (content: unknown[], version: unknown = 2) => ({
  format: ATLAS_NOTES_FORMAT,
  version,
  doc: { type: 'doc', content },
});
const nestedBulletList = (levels: number, withText = true): unknown => {
  const itemContent: unknown[] = [
    paragraph(withText ? `level ${levels}` : ''),
  ];
  if (levels > 1) {
    itemContent.push(nestedBulletList(levels - 1, withText));
  }
  return {
    type: 'bulletList',
    content: [{ type: 'listItem', content: itemContent }],
  };
};

function expectCode(action: () => unknown, code: string, status = 400) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AtlasNotesValidationError);
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return true;
  });
}

void test('publishes DEC-003 depth and unchanged safety limits', () => {
  assert.equal(ATLAS_NOTES_VERSION, 2);
  assert.deepEqual(ATLAS_NOTES_LIMITS, {
    requestBytes: 1_310_720,
    structuredBytes: 1_048_576,
    depth: 16,
    nodes: 20_000,
    textNodeLength: 100_000,
    visibleLength: 100_000,
  });
});

void test('reads v1 without mutation and preserves its projection', () => {
  const source = envelope(
    [
      { type: 'heading', attrs: { level: 3 }, content: [text('Título')] },
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
    ],
    1,
  );
  const before = JSON.stringify(source);
  const canonical = canonicalizeAtlasNotesContent(source);
  assert.equal(canonical.version, 1);
  assert.equal(JSON.stringify(source), before);
  assert.equal(projectAtlasNotesBody(source), 'Título\na\nb\nc\nq1\nq2');
  assert.deepEqual(canonicalizeAtlasNotesContentV1(source), canonical);
});

void test('reads v2 and accepts every canonical block and inline node', () => {
  const source = envelope([
    { type: 'heading', attrs: { level: 6 }, content: [text('H6')] },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [paragraph('bullet')] }],
    },
    {
      type: 'orderedList',
      attrs: { start: 1, type: null },
      content: [{ type: 'listItem', content: [paragraph('ordered')] }],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [paragraph('task')],
        },
      ],
    },
    { type: 'blockquote', content: [paragraph('quote')] },
    { type: 'horizontalRule' },
    {
      type: 'codeBlock',
      attrs: { language: 'TypeScript' },
      content: [text('const x = 1;\n'), text('x;')],
    },
    { type: 'mathBlock', attrs: { latex: 'x^2' } },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [paragraph('head')] },
            { type: 'tableCell', content: [paragraph('cell')] },
          ],
        },
      ],
    },
    {
      type: 'callout',
      content: [
        richParagraph([
          text('callout '),
          { type: 'mathInline', attrs: { latex: 'a+b' } },
          { type: 'footnoteRef', attrs: { id: 'note-1' } },
        ]),
      ],
    },
    { type: 'footnote', attrs: { id: 'note-1' }, content: [paragraph('foot')] },
  ]);
  const canonical = canonicalizeAtlasNotesContentV2(source);
  assert.equal(canonical.version, 2);
  assert.equal(
    projectAtlasNotesBody(canonical),
    'H6\nbullet\nordered\ntask\nquote\n\nconst x = 1;\nx;\nx^2\nhead\tcell\ncallout a+b\nfoot',
  );
  assert.deepEqual(canonical.doc.content[6], {
    type: 'codeBlock',
    attrs: { language: 'TypeScript' },
    content: [{ type: 'text', text: 'const x = 1;\nx;' }],
  });
});

void test('keeps v1-subset projection byte-identical between versions', () => {
  const blocks = [
    paragraph('  início'),
    { type: 'heading', attrs: { level: 2 }, content: [text('título')] },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [paragraph('item')] }],
    },
    {
      type: 'orderedList',
      attrs: { start: 1, type: null },
      content: [{ type: 'listItem', content: [paragraph('número')] }],
    },
    { type: 'blockquote', content: [paragraph('fim  ')] },
  ];
  assert.equal(
    projectAtlasNotesBody(envelope(blocks, 1)),
    projectAtlasNotesBody(envelope(blocks, 2)),
  );
});

void test('accepts mixed nested lists and projects them depth-first', () => {
  const source = envelope([
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            paragraph('bullet parent'),
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [paragraph('bullet child')] },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            paragraph('ordered parent'),
            {
              type: 'orderedList',
              attrs: { start: 1, type: null },
              content: [{ type: 'listItem', content: [paragraph('ordered child')] }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            paragraph('task parent'),
            {
              type: 'taskList',
              content: [{ type: 'taskItem', attrs: { checked: false }, content: [paragraph('task child')] }],
            },
          ],
        },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            paragraph('task root'),
            {
              type: 'bulletList',
              content: [{ type: 'listItem', content: [paragraph('bullet under task')] }],
            },
          ],
        },
      ],
    },
  ]);
  const canonical = canonicalizeAtlasNotesContentV2(source);
  assert.deepEqual(canonical, source);
  assert.equal(
    projectAtlasNotesBody(canonical),
    'bullet parent\nbullet child\nordered parent\nordered child\ntask parent\ntask child\ntask root\nbullet under task',
  );
});

void test('rejects invalid nested list child order, types and empty lists', () => {
  const invalidCases: unknown[] = [
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [paragraph('parent'), paragraph('not a list')],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'orderedList', attrs: { start: 1, type: null }, content: [] }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [paragraph('parent'), { type: 'paragraph' }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            paragraph('parent'),
            { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('child'), { type: 'callout', content: [paragraph('bad')] }] }] },
          ],
        },
      ],
    },
  ];
  for (const invalid of invalidCases) {
    assert.throws(() => canonicalizeAtlasNotesContent(envelope([invalid])), (error) => {
      assert.ok(error instanceof AtlasNotesValidationError);
      assert.ok(error.code === 'INVALID_NODE' || error.code === 'UNKNOWN_FIELD');
      return true;
    });
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [paragraph('parent'), paragraph('nested')],
              },
            ],
          },
        ], 1),
      ),
    'INVALID_NODE',
  );
});

void test('accepts depth through 16 and rejects structures beyond it', () => {
  assert.doesNotThrow(() =>
    canonicalizeAtlasNotesContent(envelope([nestedBulletList(6)])),
  );
  assert.doesNotThrow(() =>
    canonicalizeAtlasNotesContent(envelope([nestedBulletList(7, false)])),
  );
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([nestedBulletList(7)])),
    'STRUCTURE_TOO_DEEP',
  );
});

void test('normalizes every structured save to v2, including explicit v1 saves', () => {
  const prepared = prepareAtlasNotesForSave(envelope([paragraph('v1')], 1));
  assert.equal(prepared.content.version, 2);
  assert.equal(JSON.parse(prepared.contentJson).version, 2);
  assert.equal(prepared.body, 'v1');
  assert.equal(prepared.characterCount, 2);
});

void test('rejects missing, coerced, invalid and future versions', () => {
  const missingVersion = envelope([paragraph('x')]);
  delete (missingVersion as { version?: unknown }).version;
  expectCode(
    () => canonicalizeAtlasNotesContent(missingVersion),
    'INVALID_ENVELOPE',
  );
  for (const version of [null, '2', 0, 3, 99]) {
    expectCode(
      () => canonicalizeAtlasNotesContent(envelope([paragraph('x')], version)),
      'INVALID_ENVELOPE',
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent({
        format: 'other',
        version: 2,
        doc: { type: 'doc', content: [paragraph('x')] },
      }),
    'INVALID_ENVELOPE',
  );
});

void test('rejects extra envelope, document, paragraph and text fields', () => {
  expectCode(
    () =>
      canonicalizeAtlasNotesContent({
        ...envelope([paragraph('x')]),
        extra: true,
      }),
    'UNKNOWN_FIELD',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent({
        ...envelope([paragraph('x')]),
        doc: { type: 'doc', content: [paragraph('x')], extra: true },
      }),
    'UNKNOWN_FIELD',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ ...paragraph('x'), attrs: {} }]),
      ),
    'UNKNOWN_FIELD',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([richParagraph([{ ...text('x'), extra: true }])]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('canonicalizes all v2 marks by rank and merges only equal mark sets', () => {
  const canonical = canonicalizeAtlasNotesContent(
    envelope([
      richParagraph([
        text('Atlas', [
          { type: 'link', attrs: { href: ' https://atlas.example/note ' } },
          { type: 'comment' },
          { type: 'highlight' },
          { type: 'code' },
          { type: 'strike' },
          { type: 'italic' },
          { type: 'bold' },
        ]),
        text(' Notes', [
          { type: 'bold' },
          { type: 'italic' },
          { type: 'strike' },
          { type: 'code' },
          { type: 'highlight' },
          { type: 'comment' },
          { type: 'link', attrs: { href: 'https://atlas.example/note' } },
        ]),
        text(' other', [
          { type: 'link', attrs: { href: 'https://atlas.example/other' } },
        ]),
      ]),
    ]),
  );
  assert.deepEqual(canonical.doc.content[0], {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: 'Atlas Notes',
        marks: [
          { type: 'bold' },
          { type: 'italic' },
          { type: 'strike' },
          { type: 'code' },
          { type: 'highlight' },
          { type: 'comment' },
          { type: 'link', attrs: { href: 'https://atlas.example/note' } },
        ],
      },
      {
        type: 'text',
        text: ' other',
        marks: [
          { type: 'link', attrs: { href: 'https://atlas.example/other' } },
        ],
      },
    ],
  });
  assert.equal(projectAtlasNotesBody(canonical), 'Atlas Notes other');
});

void test('rejects duplicate, unknown and attributed attrless marks', () => {
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([text('x', [{ type: 'bold' }, { type: 'bold' }])]),
        ]),
      ),
    'INVALID_MARK',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([richParagraph([text('x', [{ type: 'underline' }])])]),
      ),
    'INVALID_MARK',
  );
  for (const type of ['bold', 'italic', 'strike', 'code', 'comment']) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([richParagraph([text('x', [{ type, attrs: {} }])])]),
        ),
      'UNKNOWN_FIELD',
    );
  }
  // highlight now accepts attrs (color), but an attrs object without a
  // valid color is rejected rather than silently treated as unknown.
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([text('x', [{ type: 'highlight', attrs: {} }])]),
        ]),
      ),
    'INVALID_MARK',
  );
});

void test('canonicalizes highlight color: yellow normalizes to attrless legacy shape', () => {
  for (const input of [
    { type: 'highlight' },
    { type: 'highlight', attrs: { color: 'yellow' } },
  ]) {
    const canonical = canonicalizeAtlasNotesContent(
      envelope([richParagraph([text('x', [input])])]),
    );
    assert.deepEqual(canonical.doc.content[0], {
      type: 'paragraph',
      content: [{ type: 'text', text: 'x', marks: [{ type: 'highlight' }] }],
    });
  }
});

void test('rejects a null highlight color, the exact shape ProseMirror emits for an attribute at its schema default', () => {
  // Regression test for QUEST-005: the editor's `color` attribute used to
  // default to `null` (to mirror the legacy attrless yellow shape), but
  // ProseMirror's Mark.toJSON() always includes every registered attribute
  // — including ones still at their default — so every highlight mark
  // (new or pre-existing) was serialized as `attrs: { color: null }` on
  // every edit, not the hand-written string `'yellow'` the older tests
  // exercised. The editor now defaults `color` to the string 'yellow'
  // instead, so this shape should never reach the schema again — but the
  // schema itself must keep rejecting it if it ever does.
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([
            text('x', [{ type: 'highlight', attrs: { color: null } }]),
          ]),
        ]),
      ),
    'INVALID_MARK',
  );
});

void test('accepts every standard highlight color and rejects unknown ones', () => {
  for (const color of ATLAS_NOTES_MARK_COLORS) {
    if (color === 'yellow') continue;
    const canonical = canonicalizeAtlasNotesContent(
      envelope([
        richParagraph([text('x', [{ type: 'highlight', attrs: { color } }])]),
      ]),
    );
    assert.deepEqual(canonical.doc.content[0], {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'x',
          marks: [{ type: 'highlight', attrs: { color } }],
        },
      ],
    });
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([
            text('x', [{ type: 'highlight', attrs: { color: 'orange' } }]),
          ]),
        ]),
      ),
    'INVALID_MARK',
  );
});

void test('merges adjacent highlight runs only when the color matches', () => {
  const canonical = canonicalizeAtlasNotesContent(
    envelope([
      richParagraph([
        text('a', [{ type: 'highlight', attrs: { color: 'green' } }]),
        text('b', [{ type: 'highlight', attrs: { color: 'green' } }]),
        text('c', [{ type: 'highlight', attrs: { color: 'blue' } }]),
        text('d', [{ type: 'highlight' }]),
      ]),
    ]),
  );
  assert.deepEqual(canonical.doc.content[0], {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: 'ab',
        marks: [{ type: 'highlight', attrs: { color: 'green' } }],
      },
      {
        type: 'text',
        text: 'c',
        marks: [{ type: 'highlight', attrs: { color: 'blue' } }],
      },
      { type: 'text', text: 'd', marks: [{ type: 'highlight' }] },
    ],
  });
  assert.equal(projectAtlasNotesBody(canonical), 'abcd');
});

void test('recoloring a highlight/favorite mark replaces it instead of stacking a duplicate', () => {
  // Regression test for QUEST-005 (bug #3, found during manual review):
  // AtlasHighlight and AtlasFavorite (components/notes-editor.tsx) used to
  // set `excludes: ''` on their mark spec. That disables ProseMirror's
  // *default* exclusion behavior, under which a mark type excludes marks
  // of its own type unless told otherwise — the exact mechanism that makes
  // reapplying a mark with new attrs ("recoloring") replace the previous
  // instance rather than add a second one. With self-exclusion disabled,
  // recoloring left both the old and new mark instances on the same text
  // run, and this schema's own canonicalizeMarks correctly rejected that
  // duplicate with INVALID_MARK ("Marca de texto duplicada"), silently
  // blocking every recolor. The fix was to stop overriding `excludes` on
  // both marks. This test builds a minimal ProseMirror schema mirroring
  // that (fixed) shape — an attrs-bearing mark with no `excludes`
  // override — and exercises the exact mark-set mechanics
  // (`Mark#addToSet`) the editor's `setMark` command relies on, proving a
  // second color instance collapses into one instead of stacking.
  const schema = new Schema({
    nodes: { doc: { content: 'text*' }, text: {} },
    marks: { highlight: { attrs: { color: { default: 'yellow' } } } },
  });
  const highlightType = schema.marks.highlight;
  let markSet = highlightType.create({ color: 'yellow' }).addToSet([]);
  markSet = highlightType.create({ color: 'green' }).addToSet(markSet);
  assert.equal(markSet.length, 1);
  assert.equal(markSet[0].attrs.color, 'green');
});

void test('validates favorite marks: shape, colors and stable ids', () => {
  const favorite = (id: string, color = 'yellow', createdAt = '2026-09-13T10:00:00.000Z') => ({
    type: 'favorite',
    attrs: { id, color, createdAt },
  });
  const canonical = canonicalizeAtlasNotesContent(
    envelope([richParagraph([text('x', [favorite('fav-1')])])]),
  );
  assert.deepEqual(canonical.doc.content[0], {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: 'x',
        marks: [
          {
            type: 'favorite',
            attrs: {
              id: 'fav-1',
              color: 'yellow',
              createdAt: '2026-09-13T10:00:00.000Z',
            },
          },
        ],
      },
    ],
  });
  // Unlike footnote definitions, a favorite mark has no separate
  // "definition" node — the same id may legitimately reappear on more than
  // one text run (e.g. a single favorited selection spanning a paragraph
  // break), so the canonicalizer must not reject repeated ids.
  assert.doesNotThrow(() =>
    canonicalizeAtlasNotesContent(
      envelope([
        richParagraph([text('a', [favorite('fav-2')])]),
        richParagraph([text('b', [favorite('fav-2')])]),
      ]),
    ),
  );
  for (const [badAttrs, code] of [
    [
      { id: 'fav-3', color: 'not-a-color', createdAt: '2026-09-13T10:00:00.000Z' },
      'INVALID_MARK',
    ],
    [
      { id: 'has space', color: 'yellow', createdAt: '2026-09-13T10:00:00.000Z' },
      'INVALID_NODE',
    ],
    [{ id: 'fav-3', color: 'yellow', createdAt: 'not-a-date' }, 'INVALID_MARK'],
    [{ id: 'fav-3', color: 'yellow' }, 'INVALID_MARK'],
  ] as const) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([
            richParagraph([
              text('x', [{ type: 'favorite', attrs: badAttrs }]),
            ]),
          ]),
        ),
      code,
    );
  }
});

void test('does not merge adjacent favorite runs with different ids', () => {
  const canonical = canonicalizeAtlasNotesContent(
    envelope([
      richParagraph([
        text('a', [
          {
            type: 'favorite',
            attrs: { id: 'fav-a', color: 'yellow', createdAt: '2026-09-13T10:00:00.000Z' },
          },
        ]),
        text('b', [
          {
            type: 'favorite',
            attrs: { id: 'fav-b', color: 'yellow', createdAt: '2026-09-13T10:00:00.000Z' },
          },
        ]),
      ]),
    ]),
  );
  const marksTexts = (
    canonical.doc.content[0] as { content: Array<{ text: string }> }
  ).content.map((node) => node.text);
  assert.deepEqual(marksTexts, ['a', 'b']);
});

void test('extractAtlasNotesFavorites reflects the live document, not a frozen copy', () => {
  const favoriteAttrs = (id: string, color = 'yellow') => ({
    id,
    color,
    createdAt: '2026-09-13T10:00:00.000Z',
  });
  const doc = {
    type: 'doc',
    content: [
      richParagraph([
        text('Conceito ', []),
        text('importante', [{ type: 'favorite', attrs: favoriteAttrs('fav-1', 'purple') }]),
      ]),
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              richParagraph([
                text('item', [{ type: 'favorite', attrs: favoriteAttrs('fav-2', 'pink') }]),
              ]),
            ],
          },
        ],
      },
    ],
  };
  const canonical = canonicalizeAtlasNotesContent(envelope(doc.content));
  const favorites = extractAtlasNotesFavorites(canonical.doc);
  assert.deepEqual(
    favorites.map((entry) => [entry.id, entry.color, entry.text]),
    [
      ['fav-1', 'purple', 'importante'],
      ['fav-2', 'pink', 'item'],
    ],
  );

  // Simulate editing the favorited excerpt: the extraction must reflect the
  // current text, never a copy captured when the favorite was created.
  const edited = {
    type: 'doc',
    content: [
      richParagraph([
        text('Conceito ', []),
        text('atualizado', [{ type: 'favorite', attrs: favoriteAttrs('fav-1', 'purple') }]),
      ]),
    ],
  };
  const canonicalEdited = canonicalizeAtlasNotesContent(envelope(edited.content));
  assert.deepEqual(
    extractAtlasNotesFavorites(canonicalEdited.doc).map((entry) => entry.text),
    ['atualizado'],
  );

  // Simulate the favorited text being fully deleted: it must disappear
  // from the extracted list rather than linger as a stale entry.
  const deleted = { type: 'doc', content: [paragraph('sem favoritos')] };
  const canonicalDeleted = canonicalizeAtlasNotesContent(
    envelope(deleted.content),
  );
  assert.deepEqual(extractAtlasNotesFavorites(canonicalDeleted.doc), []);
});

void test('validates link shape, length and protocols', () => {
  for (const href of [
    'https://atlas.example/path',
    'http://atlas.example',
    'mailto:atlas@example.com',
  ]) {
    assert.doesNotThrow(() =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([text('link', [{ type: 'link', attrs: { href } }])]),
        ]),
      ),
    );
  }
  for (const href of [
    'javascript:alert(1)',
    'data:text/plain,x',
    'vbscript:x',
    'file:///tmp/x',
    '/relative',
    '',
    'x'.repeat(2_049),
  ]) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([
            richParagraph([text('link', [{ type: 'link', attrs: { href } }])]),
          ]),
        ),
      'INVALID_MARK',
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([
            text('link', [
              {
                type: 'link',
                attrs: { href: 'https://atlas.example', title: 'x' },
              },
            ]),
          ]),
        ]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('keeps v1 mark and heading allowlists unchanged', () => {
  assert.doesNotThrow(() =>
    canonicalizeAtlasNotesContent(
      envelope(
        [richParagraph([text('x', [{ type: 'bold' }, { type: 'italic' }])])],
        1,
      ),
    ),
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([richParagraph([text('x', [{ type: 'strike' }])])], 1),
      ),
    'INVALID_MARK',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope(
          [{ type: 'heading', attrs: { level: 4 }, content: [text('x')] }],
          1,
        ),
      ),
    'INVALID_NODE',
  );
  for (const level of [1, 2, 3, 4, 5, 6]) {
    assert.doesNotThrow(() =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'heading', attrs: { level }, content: [text('x')] }]),
      ),
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'heading', attrs: { level: 7 } }]),
      ),
    'INVALID_NODE',
  );
});

void test('validates flat bullet and ordered list invariants', () => {
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
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [paragraph('outer'), paragraph('nested')],
              },
            ],
          },
        ]),
      ),
    'INVALID_NODE',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'bulletList', content: [] }]),
      ),
    'INVALID_NODE',
  );
});

void test('validates task list state, item shape and projection', () => {
  const source = envelope([
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [paragraph('a')],
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [paragraph('b')],
        },
      ],
    },
  ]);
  assert.equal(projectAtlasNotesBody(source), 'a\nb');
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: 'yes' },
                content: [paragraph('x')],
              },
            ],
          },
        ]),
      ),
    'INVALID_NODE',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, collapsed: true },
                content: [paragraph('x')],
              },
            ],
          },
        ]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('validates blockquote and callout paragraph-only content', () => {
  assert.equal(
    projectAtlasNotesBody(
      envelope([
        { type: 'blockquote', content: [paragraph('q1'), paragraph('q2')] },
        { type: 'callout', content: [paragraph('c1'), paragraph('c2')] },
      ]),
    ),
    'q1\nq2\nc1\nc2',
  );
  for (const type of ['blockquote', 'callout']) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([{ type, content: [{ type: 'horizontalRule' }] }]),
        ),
      'INVALID_NODE',
    );
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([{ type, content: [], attrs: {} }]),
        ),
      'UNKNOWN_FIELD',
    );
  }
});

void test('projects horizontal rules as structural empty blocks and rejects fields', () => {
  assert.equal(
    projectAtlasNotesBody(
      envelope([paragraph('a'), { type: 'horizontalRule' }, paragraph('b')]),
    ),
    'a\n\nb',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'horizontalRule', attrs: {} }]),
      ),
    'UNKNOWN_FIELD',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'horizontalRule', content: [paragraph('x')] }]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('canonicalizes code blocks and preserves internal LF', () => {
  const canonical = canonicalizeAtlasNotesContent(
    envelope([
      {
        type: 'codeBlock',
        attrs: { language: '  ts  ' },
        content: [text('a\n'), text('b')],
      },
      { type: 'codeBlock', attrs: { language: '   ' } },
    ]),
  );
  assert.deepEqual(canonical.doc.content[0], {
    type: 'codeBlock',
    attrs: { language: 'ts' },
    content: [text('a\nb')],
  });
  assert.deepEqual(canonical.doc.content[1], {
    type: 'codeBlock',
    attrs: { language: null },
  });
  assert.equal(projectAtlasNotesBody(canonical), 'a\nb');
  for (const language of ['spaces not allowed', 'x'.repeat(33), 7]) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([{ type: 'codeBlock', attrs: { language } }]),
        ),
      'INVALID_NODE',
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'codeBlock',
            attrs: { language: null },
            content: [text('x', [{ type: 'bold' }])],
          },
        ]),
      ),
    'INVALID_MARK',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'codeBlock',
            attrs: { language: null },
            content: [paragraph('x')],
          },
        ]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('validates and projects inline and block latex without trimming it', () => {
  const source = envelope([
    richParagraph([
      text('before '),
      { type: 'mathInline', attrs: { latex: ' x + y ' } },
      text(' after'),
    ]),
    { type: 'mathBlock', attrs: { latex: '\\int_0^1 x dx' } },
  ]);
  const canonical = canonicalizeAtlasNotesContent(source);
  assert.equal(
    projectAtlasNotesBody(canonical),
    'before  x + y  after\n\\int_0^1 x dx',
  );
  for (const node of [
    { type: 'mathInline', attrs: { latex: ' ' } },
    { type: 'mathInline', attrs: { latex: 'x'.repeat(5_001) } },
  ]) {
    expectCode(
      () => canonicalizeAtlasNotesContent(envelope([richParagraph([node])])),
      'INVALID_NODE',
    );
  }
  for (const node of [
    { type: 'mathBlock', attrs: { latex: '' } },
    { type: 'mathBlock', attrs: { latex: 'x'.repeat(10_001) } },
  ]) {
    expectCode(
      () => canonicalizeAtlasNotesContent(envelope([node])),
      'INVALID_NODE',
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'mathBlock', attrs: { latex: 'x', display: true } }]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('validates table hierarchy and deterministic cell separators', () => {
  const source = envelope([
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [paragraph('h1'), paragraph('h2')],
            },
            { type: 'tableCell', content: [paragraph('c1')] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [paragraph('a')] },
            { type: 'tableCell', content: [paragraph('b')] },
          ],
        },
      ],
    },
  ]);
  assert.equal(projectAtlasNotesBody(source), 'h1\nh2\tc1\na\tb');
  const invalidTables: Array<[unknown, string]> = [
    [{ type: 'table', content: [] }, 'INVALID_NODE'],
    [
      { type: 'table', content: [{ type: 'tableRow', content: [] }] },
      'INVALID_NODE',
    ],
    [
      {
        type: 'table',
        content: [
          { type: 'tableRow', content: [{ type: 'tableCell', content: [] }] },
        ],
      },
      'INVALID_NODE',
    ],
    [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'heading', attrs: { level: 1 } }],
              },
            ],
          },
        ],
      },
      'UNKNOWN_FIELD',
    ],
  ];
  for (const [invalid, code] of invalidTables) {
    expectCode(() => canonicalizeAtlasNotesContent(envelope([invalid])), code);
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    attrs: { colspan: 2 },
                    content: [paragraph('x')],
                  },
                ],
              },
            ],
          },
        ]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('validates footnote definitions, references and identifiers', () => {
  const valid = envelope([
    richParagraph([
      text('a'),
      { type: 'footnoteRef', attrs: { id: 'ref_1' } },
      { type: 'footnoteRef', attrs: { id: 'ref_1' } },
    ]),
    {
      type: 'footnote',
      attrs: { id: 'ref_1' },
      content: [paragraph('definition')],
    },
    {
      type: 'footnote',
      attrs: { id: 'orphan' },
      content: [paragraph('orphan text')],
    },
  ]);
  assert.equal(projectAtlasNotesBody(valid), 'a\ndefinition\norphan text');
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([{ type: 'footnoteRef', attrs: { id: 'missing' } }]),
        ]),
      ),
    'INVALID_NODE',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'footnote',
            attrs: { id: 'same' },
            content: [paragraph('a')],
          },
          {
            type: 'footnote',
            attrs: { id: 'same' },
            content: [paragraph('b')],
          },
        ]),
      ),
    'INVALID_NODE',
  );
  for (const id of ['', 'has space', 'x'.repeat(65)]) {
    expectCode(
      () =>
        canonicalizeAtlasNotesContent(
          envelope([
            { type: 'footnote', attrs: { id }, content: [paragraph('x')] },
          ]),
        ),
      'INVALID_NODE',
    );
  }
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          {
            type: 'footnote',
            attrs: { id: 'a', label: 'A' },
            content: [paragraph('x')],
          },
        ]),
      ),
    'UNKNOWN_FIELD',
  );
});

void test('rejects unsupported nodes, invalid children and empty documents', () => {
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([{ type: 'hardBreak' }])),
    'INVALID_NODE',
  );
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([{ type: 'listItem', content: [paragraph('x')] }]),
      ),
    'INVALID_NODE',
  );
  expectCode(() => canonicalizeAtlasNotesContent(envelope([])), 'INVALID_NODE');
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([richParagraph([text('')])])),
    'INVALID_NODE',
  );
  assert.equal(
    isAtlasNotesDocument({ type: 'doc', content: [{ type: 'hardBreak' }] }),
    false,
  );
});

void test('imports legacy text into an in-memory v2 document with LF semantics', () => {
  const imported = legacyTextToAtlasNotesContent('\r\na\r\n\r\nb\r');
  assert.equal(imported.version, 2);
  assert.deepEqual(imported.doc.content, [
    paragraph(),
    paragraph('a'),
    paragraph(),
    paragraph('b'),
    paragraph(),
  ]);
  assert.equal(projectAtlasNotesBody(imported), 'a\n\nb');
  assert.deepEqual(plainTextToAtlasNotesBlocks('<strong>x</strong>\r\n'), [
    paragraph('<strong>x</strong>'),
    paragraph(),
  ]);
});

void test('rejects empty saves and visible projections above the limit', () => {
  expectCode(
    () => prepareAtlasNotesForSave(envelope([{ type: 'horizontalRule' }])),
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

void test('enforces request, structured, depth, node and text-node guards', () => {
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
  expectCode(
    () =>
      canonicalizeAtlasNotesContent(
        envelope([
          richParagraph([text('a'.repeat(60_000)), text('b'.repeat(40_001))]),
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
  let tooDeep: unknown = { type: 'text', text: 'x' };
  for (let index = 0; index < 15; index += 1) {
    tooDeep = { type: `level-${index}`, content: [tooDeep] };
  }
  expectCode(
    () => canonicalizeAtlasNotesContent(envelope([tooDeep])),
    'STRUCTURE_TOO_DEEP',
  );
});
