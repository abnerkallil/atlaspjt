import { mergeAttributes, Node } from '@tiptap/react';

const textAttribute = (defaultValue = '') => ({ default: defaultValue });

export const AtlasMathInline = Node.create({
  name: 'mathInline',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() {
    return { latex: textAttribute() };
  },
  parseHTML() {
    return [{ tag: 'span[data-atlas-math-inline]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-atlas-math-inline': '',
        'data-value': node.attrs.latex,
        contenteditable: 'false',
      }),
      node.attrs.latex,
    ];
  },
});

export const AtlasFootnoteRef = Node.create({
  name: 'footnoteRef',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes() {
    return { id: textAttribute() };
  },
  parseHTML() {
    return [{ tag: 'sup[data-atlas-footnote-ref]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        'data-atlas-footnote-ref': '',
        'data-value': node.attrs.id,
        contenteditable: 'false',
      }),
      `[${node.attrs.id}]`,
    ];
  },
});

export const AtlasMathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,
  defining: true,
  addAttributes() {
    return { latex: textAttribute() };
  },
  parseHTML() {
    return [{ tag: 'div[data-atlas-math-block]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-atlas-math-block': '',
        'data-value': node.attrs.latex,
        contenteditable: 'false',
      }),
      node.attrs.latex,
    ];
  },
});

export const AtlasTable = Node.create({
  name: 'table',
  group: 'block',
  content: 'tableRow+',
  isolating: true,
  parseHTML() {
    return [{ tag: 'table' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['table', mergeAttributes(HTMLAttributes), ['tbody', 0]];
  },
});

export const AtlasTableRow = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)+',
  parseHTML() {
    return [{ tag: 'tr' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes), 0];
  },
});

const createTableCell = (name: 'tableCell' | 'tableHeader', tag: 'td' | 'th') =>
  Node.create({
    name,
    content: 'paragraph+',
    isolating: true,
    parseHTML() {
      return [{ tag }];
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes), 0];
    },
  });

export const AtlasTableCell = createTableCell('tableCell', 'td');
export const AtlasTableHeader = createTableCell('tableHeader', 'th');

const createParagraphContainer = (name: 'footnote' | 'callout', tag: 'aside' | 'section') =>
  Node.create({
    name,
    group: 'block',
    content: 'paragraph+',
    defining: true,
    isolating: true,
    ...(name === 'footnote'
      ? {
          addAttributes() {
            return { id: textAttribute() };
          },
        }
      : {}),
    parseHTML() {
      return [
        {
          tag: `${tag}[data-atlas-${name}]`,
          ...(name === 'footnote'
            ? { contentElement: '[data-atlas-footnote-body]' }
            : {}),
        },
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      const attrs =
        name === 'footnote'
          ? {
              'data-atlas-footnote': '',
              'data-value': node.attrs.id,
            }
          : { 'data-atlas-callout': '' };
      const heading =
        name === 'footnote'
          ? ['strong', {}, `Nota de rodapé ${node.attrs.id}`]
          : ['strong', {}, 'Callout'];
      const bodyAttrs =
        name === 'footnote' ? { 'data-atlas-footnote-body': '' } : {};
      return [
        tag,
        mergeAttributes(HTMLAttributes, attrs),
        heading,
        ['div', bodyAttrs, 0],
      ];
    },
  });

export const AtlasFootnote = createParagraphContainer('footnote', 'aside');
export const AtlasCallout = createParagraphContainer('callout', 'section');

export const AtlasAdvancedNodes = [
  AtlasMathInline,
  AtlasFootnoteRef,
  AtlasMathBlock,
  AtlasTable,
  AtlasTableRow,
  AtlasTableCell,
  AtlasTableHeader,
  AtlasFootnote,
  AtlasCallout,
];
