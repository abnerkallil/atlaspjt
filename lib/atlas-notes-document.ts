export const ATLAS_NOTES_FORMAT = 'atlas-notes' as const;
export const ATLAS_NOTES_VERSION = 2 as const;

export const ATLAS_NOTES_LIMITS = {
  requestBytes: 1_310_720,
  structuredBytes: 1_048_576,
  depth: 16,
  nodes: 20_000,
  textNodeLength: 100_000,
  visibleLength: 100_000,
} as const;

export type AtlasNotesErrorCode =
  | 'REQUEST_TOO_LARGE'
  | 'STRUCTURED_CONTENT_TOO_LARGE'
  | 'STRUCTURE_TOO_DEEP'
  | 'TOO_MANY_NODES'
  | 'TEXT_NODE_TOO_LONG'
  | 'INVALID_ENVELOPE'
  | 'INVALID_NODE'
  | 'INVALID_MARK'
  | 'UNKNOWN_FIELD'
  | 'INVALID_REQUEST'
  | 'BODY_PROJECTION_MISMATCH'
  | 'OPERATION_CONFLICT'
  | 'STRUCTURED_DOWNGRADE'
  | 'EMPTY_CONTENT'
  | 'VISIBLE_LIMIT_EXCEEDED';

export class AtlasNotesValidationError extends Error {
  constructor(
    public readonly code: AtlasNotesErrorCode,
    message: string,
    public readonly status: 400 | 413 = 400,
    public readonly path?: string,
  ) {
    super(message);
    this.name = 'AtlasNotesValidationError';
  }
}

export type AtlasNotesVersion = 1 | 2;
export const ATLAS_NOTES_MARK_COLORS = [
  'yellow',
  'green',
  'blue',
  'pink',
  'purple',
] as const;
export type AtlasNotesMarkColor = (typeof ATLAS_NOTES_MARK_COLORS)[number];
export type AtlasNotesMark =
  | {
      type: 'bold' | 'italic' | 'strike' | 'code' | 'comment';
    }
  | { type: 'highlight'; attrs?: { color: AtlasNotesMarkColor } }
  | {
      type: 'favorite';
      attrs: { id: string; color: AtlasNotesMarkColor; createdAt: string };
    }
  | { type: 'link'; attrs: { href: string } };
export type AtlasNotesText = {
  type: 'text';
  text: string;
  marks?: AtlasNotesMark[];
};
export type AtlasNotesMathInline = {
  type: 'mathInline';
  attrs: { latex: string };
};
export type AtlasNotesFootnoteRef = {
  type: 'footnoteRef';
  attrs: { id: string };
};
export type AtlasNotesInline =
  | AtlasNotesText
  | AtlasNotesMathInline
  | AtlasNotesFootnoteRef;
export type AtlasNotesParagraph = {
  type: 'paragraph';
  content?: AtlasNotesInline[];
};
export type AtlasNotesHeading = {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: AtlasNotesInline[];
};
export type AtlasNotesListItem = {
  type: 'listItem';
  content: [AtlasNotesParagraph, ...AtlasNotesNestedList[]];
};
export type AtlasNotesTaskItem = {
  type: 'taskItem';
  attrs: { checked: boolean };
  content: [AtlasNotesParagraph, ...AtlasNotesNestedList[]];
};
export type AtlasNotesBulletList = {
  type: 'bulletList';
  content: AtlasNotesListItem[];
};
export type AtlasNotesOrderedList = {
  type: 'orderedList';
  attrs: { start: 1; type: null };
  content: AtlasNotesListItem[];
};
export type AtlasNotesTaskList = {
  type: 'taskList';
  content: AtlasNotesTaskItem[];
};
export type AtlasNotesNestedList =
  | AtlasNotesBulletList
  | AtlasNotesOrderedList
  | AtlasNotesTaskList;
export type AtlasNotesBlockquote = {
  type: 'blockquote';
  content: AtlasNotesParagraph[];
};
export type AtlasNotesHorizontalRule = { type: 'horizontalRule' };
export type AtlasNotesCodeText = {
  type: 'text';
  text: string;
};
export type AtlasNotesCodeBlock = {
  type: 'codeBlock';
  attrs: { language: string | null };
  content?: AtlasNotesCodeText[];
};
export type AtlasNotesMathBlock = {
  type: 'mathBlock';
  attrs: { latex: string };
};
export type AtlasNotesTableCell = {
  type: 'tableCell' | 'tableHeader';
  content: AtlasNotesParagraph[];
};
export type AtlasNotesTableRow = {
  type: 'tableRow';
  content: AtlasNotesTableCell[];
};
export type AtlasNotesTable = {
  type: 'table';
  content: AtlasNotesTableRow[];
};
export type AtlasNotesFootnote = {
  type: 'footnote';
  attrs: { id: string };
  content: AtlasNotesParagraph[];
};
export type AtlasNotesCallout = {
  type: 'callout';
  content: AtlasNotesParagraph[];
};
export type AtlasNotesBlock =
  | AtlasNotesParagraph
  | AtlasNotesHeading
  | AtlasNotesBulletList
  | AtlasNotesOrderedList
  | AtlasNotesTaskList
  | AtlasNotesBlockquote
  | AtlasNotesHorizontalRule
  | AtlasNotesCodeBlock
  | AtlasNotesMathBlock
  | AtlasNotesTable
  | AtlasNotesFootnote
  | AtlasNotesCallout;
export type AtlasNotesDocument = {
  type: 'doc';
  content: AtlasNotesBlock[];
};
export type AtlasNotesEnvelope = {
  format: typeof ATLAS_NOTES_FORMAT;
  version: AtlasNotesVersion;
  doc: AtlasNotesDocument;
};
export type AtlasNotesEnvelopeV2 = AtlasNotesEnvelope & { version: 2 };

type UnknownRecord = Record<string, unknown>;
type FootnoteContext = {
  definitions: Map<string, string>;
  references: Array<{ id: string; path: string }>;
};

const encoder = new TextEncoder();
const markRank: Record<AtlasNotesMark['type'], number> = {
  bold: 0,
  italic: 1,
  strike: 2,
  code: 3,
  highlight: 4,
  favorite: 5,
  comment: 6,
  link: 7,
};
const stableIdPattern = /^[A-Za-z0-9_-]{1,64}$/;
const markColorSet = new Set<string>(ATLAS_NOTES_MARK_COLORS);
const codeLanguagePattern = /^[a-z0-9._+#-]{1,32}$/i;

function fail(
  code: AtlasNotesErrorCode,
  message: string,
  path?: string,
  status: 400 | 413 = 400,
): never {
  throw new AtlasNotesValidationError(code, message, status, path);
}

function asRecord(value: unknown, path: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('INVALID_NODE', 'Estrutura de nota inválida.', path);
  }
  return value as UnknownRecord;
}

function asEnvelope(value: unknown): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('INVALID_ENVELOPE', 'Envelope de nota inválido.', 'content');
  }
  return value as UnknownRecord;
}

function assertKeys(
  value: UnknownRecord,
  allowed: readonly string[],
  path: string,
) {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  if (unexpected) {
    fail(
      'UNKNOWN_FIELD',
      `Campo não permitido: ${unexpected}.`,
      `${path}.${unexpected}`,
    );
  }
}

function jsonByteLength(value: unknown, path: string) {
  try {
    return encoder.encode(JSON.stringify(value)).byteLength;
  } catch {
    fail(
      'INVALID_ENVELOPE',
      'O conteúdo estruturado não é serializável.',
      path,
    );
  }
}

function inspectStructure(
  value: unknown,
  path: string,
  depth: number,
  stats: { nodes: number },
) {
  const node = asRecord(value, path);
  stats.nodes += 1;
  if (stats.nodes > ATLAS_NOTES_LIMITS.nodes) {
    fail('TOO_MANY_NODES', 'A nota possui blocos demais.', path);
  }
  if (depth > ATLAS_NOTES_LIMITS.depth) {
    fail(
      'STRUCTURE_TOO_DEEP',
      'A estrutura da nota excede a profundidade permitida.',
      path,
    );
  }
  if (
    node.type === 'text' &&
    typeof node.text === 'string' &&
    node.text.length > ATLAS_NOTES_LIMITS.textNodeLength
  ) {
    fail(
      'TEXT_NODE_TOO_LONG',
      'Um trecho de texto excede o limite permitido.',
      `${path}.text`,
    );
  }
  if (Array.isArray(node.content)) {
    node.content.forEach((child, index) =>
      inspectStructure(child, `${path}.content[${index}]`, depth + 1, stats),
    );
  }
}

function canonicalizeLinkMark(mark: UnknownRecord, path: string) {
  assertKeys(mark, ['type', 'attrs'], path);
  const attrs = asRecord(mark.attrs, `${path}.attrs`);
  assertKeys(attrs, ['href'], `${path}.attrs`);
  if (typeof attrs.href !== 'string') {
    fail('INVALID_MARK', 'Link inválido.', `${path}.attrs.href`);
  }
  const href = attrs.href.trim();
  if (!href || href.length > 2_048) {
    fail('INVALID_MARK', 'Link inválido.', `${path}.attrs.href`);
  }
  let protocol: string;
  try {
    protocol = new URL(href).protocol;
  } catch {
    fail('INVALID_MARK', 'Link inválido.', `${path}.attrs.href`);
  }
  if (protocol !== 'http:' && protocol !== 'https:' && protocol !== 'mailto:') {
    fail(
      'INVALID_MARK',
      'Protocolo de link não permitido.',
      `${path}.attrs.href`,
    );
  }
  return { type: 'link', attrs: { href } } as const;
}

function canonicalizeMarkColor(value: unknown, path: string): AtlasNotesMarkColor {
  if (typeof value !== 'string' || !markColorSet.has(value)) {
    fail('INVALID_MARK', 'Cor de marcação não permitida.', path);
  }
  return value as AtlasNotesMarkColor;
}

function canonicalizeHighlightMark(mark: UnknownRecord, path: string): AtlasNotesMark {
  if (mark.attrs === undefined) {
    assertKeys(mark, ['type'], path);
    return { type: 'highlight' };
  }
  assertKeys(mark, ['type', 'attrs'], path);
  const attrs = asRecord(mark.attrs, `${path}.attrs`);
  assertKeys(attrs, ['color'], `${path}.attrs`);
  const color = canonicalizeMarkColor(attrs.color, `${path}.attrs.color`);
  return color === 'yellow'
    ? { type: 'highlight' }
    : { type: 'highlight', attrs: { color } };
}

function canonicalizeFavoriteMark(mark: UnknownRecord, path: string): AtlasNotesMark {
  assertKeys(mark, ['type', 'attrs'], path);
  const attrs = asRecord(mark.attrs, `${path}.attrs`);
  assertKeys(attrs, ['id', 'color', 'createdAt'], `${path}.attrs`);
  const id = canonicalizeStableId(attrs.id, `${path}.attrs.id`);
  const color = canonicalizeMarkColor(attrs.color, `${path}.attrs.color`);
  const createdAt = canonicalizeTimestamp(attrs.createdAt, `${path}.attrs.createdAt`);
  return { type: 'favorite', attrs: { id, color, createdAt } };
}

function canonicalizeMarks(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
): AtlasNotesMark[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    fail('INVALID_MARK', 'Marcas de texto inválidas.', path);
  }
  const seen = new Set<AtlasNotesMark['type']>();
  const marks = value.map<AtlasNotesMark>((candidate, index) => {
    const markPath = `${path}[${index}]`;
    const mark = asRecord(candidate, markPath);
    const allowedTypes: readonly string[] =
      version === 1
        ? ['bold', 'italic']
        : [
            'bold',
            'italic',
            'strike',
            'code',
            'highlight',
            'favorite',
            'comment',
            'link',
          ];
    if (typeof mark.type !== 'string' || !allowedTypes.includes(mark.type)) {
      fail('INVALID_MARK', 'Marca de texto não permitida.', markPath);
    }
    const type = mark.type as AtlasNotesMark['type'];
    if (seen.has(type)) {
      fail('INVALID_MARK', 'Marca de texto duplicada.', markPath);
    }
    seen.add(type);
    if (type === 'link') return canonicalizeLinkMark(mark, markPath);
    if (type === 'highlight') return canonicalizeHighlightMark(mark, markPath);
    if (type === 'favorite') return canonicalizeFavoriteMark(mark, markPath);
    assertKeys(mark, ['type'], markPath);
    return { type };
  });
  if (!marks.length) return undefined;
  return marks.sort(
    (left, right) => markRank[left.type] - markRank[right.type],
  );
}

function sameMarks(
  left: AtlasNotesMark[] | undefined,
  right: AtlasNotesMark[] | undefined,
) {
  if (left === undefined || right === undefined) return left === right;
  return (
    left.length === right.length &&
    left.every((mark, index) => {
      const other = right[index];
      if (!other || mark.type !== other.type) return false;
      if (mark.type === 'link' && other.type === 'link') {
        return mark.attrs.href === other.attrs.href;
      }
      if (mark.type === 'highlight' && other.type === 'highlight') {
        return (mark.attrs?.color ?? null) === (other.attrs?.color ?? null);
      }
      if (mark.type === 'favorite' && other.type === 'favorite') {
        return mark.attrs.id === other.attrs.id;
      }
      return true;
    })
  );
}

function canonicalizeText(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  allowMarks = true,
): AtlasNotesText {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'text', 'marks'], path);
  if (node.type !== 'text' || typeof node.text !== 'string' || !node.text) {
    fail('INVALID_NODE', 'Nó de texto inválido.', path);
  }
  if (!allowMarks && node.marks !== undefined) {
    fail(
      'INVALID_MARK',
      'Blocos de código não aceitam marcas.',
      `${path}.marks`,
    );
  }
  const marks = allowMarks
    ? canonicalizeMarks(node.marks, `${path}.marks`, version)
    : undefined;
  return marks
    ? { type: 'text', text: node.text, marks }
    : { type: 'text', text: node.text };
}

function canonicalizeLatex(
  value: unknown,
  path: string,
  maximumLength: number,
) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > maximumLength
  ) {
    fail('INVALID_NODE', 'Expressão matemática inválida.', path);
  }
  return value;
}

function canonicalizeStableId(value: unknown, path: string) {
  if (typeof value !== 'string' || !stableIdPattern.test(value)) {
    fail('INVALID_NODE', 'Identificador estável inválido.', path);
  }
  return value;
}

function canonicalizeTimestamp(value: unknown, path: string) {
  if (typeof value !== 'string' || value.length > 40) {
    fail('INVALID_MARK', 'Data inválida.', path);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    fail('INVALID_MARK', 'Data inválida.', path);
  }
  return value;
}

function canonicalizeInlineContent(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesInline[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    fail('INVALID_NODE', 'Conteúdo textual inválido.', path);
  }
  const result: AtlasNotesInline[] = [];
  value.forEach((candidate, index) => {
    const inlinePath = `${path}[${index}]`;
    const inline = asRecord(candidate, inlinePath);
    let next: AtlasNotesInline;
    if (inline.type === 'text') {
      next = canonicalizeText(inline, inlinePath, version);
    } else if (version === 2 && inline.type === 'mathInline') {
      assertKeys(inline, ['type', 'attrs'], inlinePath);
      const attrs = asRecord(inline.attrs, `${inlinePath}.attrs`);
      assertKeys(attrs, ['latex'], `${inlinePath}.attrs`);
      next = {
        type: 'mathInline',
        attrs: {
          latex: canonicalizeLatex(
            attrs.latex,
            `${inlinePath}.attrs.latex`,
            5_000,
          ),
        },
      };
    } else if (version === 2 && inline.type === 'footnoteRef') {
      assertKeys(inline, ['type', 'attrs'], inlinePath);
      const attrs = asRecord(inline.attrs, `${inlinePath}.attrs`);
      assertKeys(attrs, ['id'], `${inlinePath}.attrs`);
      const id = canonicalizeStableId(attrs.id, `${inlinePath}.attrs.id`);
      footnotes.references.push({ id, path: `${inlinePath}.attrs.id` });
      next = { type: 'footnoteRef', attrs: { id } };
    } else {
      fail('INVALID_NODE', 'Nó inline não permitido.', inlinePath);
    }
    const previous = result.at(-1);
    if (
      previous?.type === 'text' &&
      next.type === 'text' &&
      sameMarks(previous.marks, next.marks)
    ) {
      if (
        previous.text.length + next.text.length >
        ATLAS_NOTES_LIMITS.textNodeLength
      ) {
        fail(
          'TEXT_NODE_TOO_LONG',
          'Um trecho de texto excede o limite permitido.',
          `${inlinePath}.text`,
        );
      }
      previous.text += next.text;
    } else {
      result.push(next);
    }
  });
  return result.length ? result : undefined;
}

function canonicalizeParagraph(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesParagraph {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (node.type !== 'paragraph') {
    fail('INVALID_NODE', 'Era esperado um parágrafo.', path);
  }
  const content = canonicalizeInlineContent(
    node.content,
    `${path}.content`,
    version,
    footnotes,
  );
  return content ? { type: 'paragraph', content } : { type: 'paragraph' };
}

function canonicalizeParagraphs(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
) {
  if (!Array.isArray(value) || !value.length) {
    fail('INVALID_NODE', 'O bloco precisa ter ao menos um parágrafo.', path);
  }
  return value.map((paragraph, index) =>
    canonicalizeParagraph(paragraph, `${path}[${index}]`, version, footnotes),
  );
}

function canonicalizeListItem(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesListItem {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (
    node.type !== 'listItem' ||
    !Array.isArray(node.content) ||
    node.content.length < 1
  ) {
    fail(
      'INVALID_NODE',
      'Cada item de lista deve começar com um parágrafo.',
      path,
    );
  }
  if (version === 1 && node.content.length !== 1) {
    fail(
      'INVALID_NODE',
      'Listas v1 não aceitam listas aninhadas.',
      `${path}.content`,
    );
  }
  const nested = (node.content as unknown[]).slice(1).map((child, index) =>
    canonicalizeNestedList(
      child,
      `${path}.content[${index + 1}]`,
      version,
      footnotes,
    ),
  );
  return {
    type: 'listItem',
    content: [
      canonicalizeParagraph(
        node.content[0],
        `${path}.content[0]`,
        version,
        footnotes,
      ),
      ...nested,
    ] as [AtlasNotesParagraph, ...AtlasNotesNestedList[]],
  };
}

function canonicalizeTaskItem(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesTaskItem {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'attrs', 'content'], path);
  const attrs = asRecord(node.attrs, `${path}.attrs`);
  assertKeys(attrs, ['checked'], `${path}.attrs`);
  if (
    node.type !== 'taskItem' ||
    typeof attrs.checked !== 'boolean' ||
    !Array.isArray(node.content) ||
    node.content.length < 1
  ) {
    fail(
      'INVALID_NODE',
      'Cada tarefa deve conter estado e começar com um parágrafo.',
      path,
    );
  }
  const nested = (node.content as unknown[]).slice(1).map((child, index) =>
    canonicalizeNestedList(
      child,
      `${path}.content[${index + 1}]`,
      version,
      footnotes,
    ),
  );
  return {
    type: 'taskItem',
    attrs: { checked: attrs.checked },
    content: [
      canonicalizeParagraph(
        node.content[0],
        `${path}.content[0]`,
        version,
        footnotes,
      ),
      ...nested,
    ] as [AtlasNotesParagraph, ...AtlasNotesNestedList[]],
  };
}

function canonicalizeNestedList(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesNestedList {
  const node = asRecord(value, path);
  if (node.type === 'taskList') {
    if (version === 1) {
      fail('INVALID_NODE', 'Tipo de bloco não permitido.', path);
    }
    assertKeys(node, ['type', 'content'], path);
    if (!Array.isArray(node.content) || !node.content.length) {
      fail('INVALID_NODE', 'Uma lista de tarefas precisa ter itens.', path);
    }
    return {
      type: 'taskList',
      content: node.content.map((item, index) =>
        canonicalizeTaskItem(
          item,
          `${path}.content[${index}]`,
          version,
          footnotes,
        ),
      ),
    };
  }
  if (node.type !== 'bulletList' && node.type !== 'orderedList') {
    fail('INVALID_NODE', 'Lista aninhada não permitida.', path);
  }
  const ordered = node.type === 'orderedList';
  assertKeys(
    node,
    ordered ? ['type', 'attrs', 'content'] : ['type', 'content'],
    path,
  );
  if (!Array.isArray(node.content) || !node.content.length) {
    fail('INVALID_NODE', 'Uma lista precisa ter ao menos um item.', path);
  }
  const content = node.content.map((item, index) =>
    canonicalizeListItem(
      item,
      `${path}.content[${index}]`,
      version,
      footnotes,
    ),
  );
  if (!ordered) return { type: 'bulletList', content };
  const attrs = asRecord(node.attrs, `${path}.attrs`);
  assertKeys(attrs, ['start', 'type'], `${path}.attrs`);
  if (attrs.start !== 1 || attrs.type !== null) {
    fail(
      'INVALID_NODE',
      'A lista numerada deve usar a numeração padrão.',
      `${path}.attrs`,
    );
  }
  return { type: 'orderedList', attrs: { start: 1, type: null }, content };
}

function canonicalizeTableCell(
  value: unknown,
  path: string,
  footnotes: FootnoteContext,
): AtlasNotesTableCell {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (node.type !== 'tableCell' && node.type !== 'tableHeader') {
    fail('INVALID_NODE', 'Célula de tabela inválida.', path);
  }
  return {
    type: node.type,
    content: canonicalizeParagraphs(
      node.content,
      `${path}.content`,
      2,
      footnotes,
    ),
  };
}

function canonicalizeTableRow(
  value: unknown,
  path: string,
  footnotes: FootnoteContext,
): AtlasNotesTableRow {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (
    node.type !== 'tableRow' ||
    !Array.isArray(node.content) ||
    !node.content.length
  ) {
    fail('INVALID_NODE', 'Linha de tabela inválida.', path);
  }
  return {
    type: 'tableRow',
    content: node.content.map((cell, index) =>
      canonicalizeTableCell(cell, `${path}.content[${index}]`, footnotes),
    ),
  };
}

function canonicalizeCodeBlock(
  node: UnknownRecord,
  path: string,
): AtlasNotesCodeBlock {
  assertKeys(node, ['type', 'attrs', 'content'], path);
  const attrs = asRecord(node.attrs, `${path}.attrs`);
  assertKeys(attrs, ['language'], `${path}.attrs`);
  if (attrs.language !== null && typeof attrs.language !== 'string') {
    fail(
      'INVALID_NODE',
      'Linguagem de código inválida.',
      `${path}.attrs.language`,
    );
  }
  const trimmedLanguage =
    typeof attrs.language === 'string' ? attrs.language.trim() : null;
  const language = trimmedLanguage || null;
  if (language !== null && !codeLanguagePattern.test(language)) {
    fail(
      'INVALID_NODE',
      'Linguagem de código inválida.',
      `${path}.attrs.language`,
    );
  }
  if (node.content !== undefined && !Array.isArray(node.content)) {
    fail('INVALID_NODE', 'Conteúdo de código inválido.', `${path}.content`);
  }
  const content: AtlasNotesCodeText[] = [];
  (node.content as unknown[] | undefined)?.forEach((candidate, index) => {
    const next = canonicalizeText(
      candidate,
      `${path}.content[${index}]`,
      2,
      false,
    );
    const previous = content.at(-1);
    if (previous) {
      if (
        previous.text.length + next.text.length >
        ATLAS_NOTES_LIMITS.textNodeLength
      ) {
        fail(
          'TEXT_NODE_TOO_LONG',
          'Um trecho de texto excede o limite permitido.',
          `${path}.content[${index}].text`,
        );
      }
      previous.text += next.text;
    } else {
      content.push(next);
    }
  });
  return content.length
    ? { type: 'codeBlock', attrs: { language }, content }
    : { type: 'codeBlock', attrs: { language } };
}

function canonicalizeBlock(
  value: unknown,
  path: string,
  version: AtlasNotesVersion,
  footnotes: FootnoteContext,
): AtlasNotesBlock {
  const node = asRecord(value, path);
  if (node.type === 'paragraph') {
    return canonicalizeParagraph(node, path, version, footnotes);
  }

  if (node.type === 'heading') {
    assertKeys(node, ['type', 'attrs', 'content'], path);
    const attrs = asRecord(node.attrs, `${path}.attrs`);
    assertKeys(attrs, ['level'], `${path}.attrs`);
    const allowedLevels = version === 1 ? [1, 2, 3] : [1, 2, 3, 4, 5, 6];
    if (!allowedLevels.includes(attrs.level as number)) {
      fail(
        'INVALID_NODE',
        'Nível de título não permitido.',
        `${path}.attrs.level`,
      );
    }
    const level = attrs.level as AtlasNotesHeading['attrs']['level'];
    const content = canonicalizeInlineContent(
      node.content,
      `${path}.content`,
      version,
      footnotes,
    );
    return content
      ? { type: 'heading', attrs: { level }, content }
      : { type: 'heading', attrs: { level } };
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return canonicalizeNestedList(node, path, version, footnotes);
  }

  if (node.type === 'blockquote') {
    assertKeys(node, ['type', 'content'], path);
    return {
      type: 'blockquote',
      content: canonicalizeParagraphs(
        node.content,
        `${path}.content`,
        version,
        footnotes,
      ),
    };
  }

  if (version === 1) {
    fail('INVALID_NODE', 'Tipo de bloco não permitido.', path);
  }

  if (node.type === 'taskList') {
    assertKeys(node, ['type', 'content'], path);
    if (!Array.isArray(node.content) || !node.content.length) {
      fail('INVALID_NODE', 'Uma lista de tarefas precisa ter itens.', path);
    }
    return {
      type: 'taskList',
      content: node.content.map((item, index) =>
        canonicalizeTaskItem(
          item,
          `${path}.content[${index}]`,
          version,
          footnotes,
        ),
      ),
    };
  }

  if (node.type === 'horizontalRule') {
    assertKeys(node, ['type'], path);
    return { type: 'horizontalRule' };
  }

  if (node.type === 'codeBlock') return canonicalizeCodeBlock(node, path);

  if (node.type === 'mathBlock') {
    assertKeys(node, ['type', 'attrs'], path);
    const attrs = asRecord(node.attrs, `${path}.attrs`);
    assertKeys(attrs, ['latex'], `${path}.attrs`);
    return {
      type: 'mathBlock',
      attrs: {
        latex: canonicalizeLatex(attrs.latex, `${path}.attrs.latex`, 10_000),
      },
    };
  }

  if (node.type === 'table') {
    assertKeys(node, ['type', 'content'], path);
    if (!Array.isArray(node.content) || !node.content.length) {
      fail('INVALID_NODE', 'Tabela inválida.', path);
    }
    return {
      type: 'table',
      content: node.content.map((row, index) =>
        canonicalizeTableRow(row, `${path}.content[${index}]`, footnotes),
      ),
    };
  }

  if (node.type === 'footnote') {
    assertKeys(node, ['type', 'attrs', 'content'], path);
    const attrs = asRecord(node.attrs, `${path}.attrs`);
    assertKeys(attrs, ['id'], `${path}.attrs`);
    const id = canonicalizeStableId(attrs.id, `${path}.attrs.id`);
    if (footnotes.definitions.has(id)) {
      fail('INVALID_NODE', 'Nota de rodapé duplicada.', `${path}.attrs.id`);
    }
    footnotes.definitions.set(id, `${path}.attrs.id`);
    return {
      type: 'footnote',
      attrs: { id },
      content: canonicalizeParagraphs(
        node.content,
        `${path}.content`,
        2,
        footnotes,
      ),
    };
  }

  if (node.type === 'callout') {
    assertKeys(node, ['type', 'content'], path);
    return {
      type: 'callout',
      content: canonicalizeParagraphs(
        node.content,
        `${path}.content`,
        2,
        footnotes,
      ),
    };
  }

  fail('INVALID_NODE', 'Tipo de bloco não permitido.', path);
}

function inspectEnvelope(value: unknown) {
  const envelope = asEnvelope(value);
  assertKeys(envelope, ['format', 'version', 'doc'], 'content');
  if (
    envelope.format !== ATLAS_NOTES_FORMAT ||
    (envelope.version !== 1 && envelope.version !== 2)
  ) {
    fail(
      'INVALID_ENVELOPE',
      'Formato ou versão de nota não suportados.',
      'content',
    );
  }
  if (
    jsonByteLength(envelope, 'content') > ATLAS_NOTES_LIMITS.structuredBytes
  ) {
    fail(
      'STRUCTURED_CONTENT_TOO_LARGE',
      'O conteúdo estruturado excede o limite permitido.',
      'content',
      413,
    );
  }
  inspectStructure(envelope.doc, 'content.doc', 1, { nodes: 0 });
  return envelope as UnknownRecord & { version: AtlasNotesVersion };
}

function canonicalizeEnvelope(
  envelope: UnknownRecord & { version: AtlasNotesVersion },
): AtlasNotesEnvelope {
  const doc = asRecord(envelope.doc, 'content.doc');
  assertKeys(doc, ['type', 'content'], 'content.doc');
  if (
    doc.type !== 'doc' ||
    !Array.isArray(doc.content) ||
    !doc.content.length
  ) {
    fail('INVALID_NODE', 'Documento de nota inválido.', 'content.doc');
  }
  const footnotes: FootnoteContext = {
    definitions: new Map(),
    references: [],
  };
  const content = doc.content.map((block, index) =>
    canonicalizeBlock(
      block,
      `content.doc.content[${index}]`,
      envelope.version,
      footnotes,
    ),
  );
  const unresolved = footnotes.references.find(
    ({ id }) => !footnotes.definitions.has(id),
  );
  if (unresolved) {
    fail(
      'INVALID_NODE',
      'Referência de nota de rodapé sem definição.',
      unresolved.path,
    );
  }
  return {
    format: ATLAS_NOTES_FORMAT,
    version: envelope.version,
    doc: { type: 'doc', content },
  };
}

export function assertAtlasNotesRequestSize(requestBody: string | Uint8Array) {
  const size =
    typeof requestBody === 'string'
      ? encoder.encode(requestBody).byteLength
      : requestBody.byteLength;
  if (size > ATLAS_NOTES_LIMITS.requestBytes) {
    fail(
      'REQUEST_TOO_LARGE',
      'A requisição excede o limite permitido.',
      undefined,
      413,
    );
  }
}

export function canonicalizeAtlasNotesContentV1(
  value: unknown,
): AtlasNotesEnvelope & { version: 1 } {
  const envelope = inspectEnvelope(value);
  if (envelope.version !== 1) {
    fail(
      'INVALID_ENVELOPE',
      'Era esperado um documento versão 1.',
      'content.version',
    );
  }
  return canonicalizeEnvelope(envelope) as AtlasNotesEnvelope & { version: 1 };
}

export function canonicalizeAtlasNotesContentV2(
  value: unknown,
): AtlasNotesEnvelopeV2 {
  const envelope = inspectEnvelope(value);
  if (envelope.version !== 2) {
    fail(
      'INVALID_ENVELOPE',
      'Era esperado um documento versão 2.',
      'content.version',
    );
  }
  return canonicalizeEnvelope(envelope) as AtlasNotesEnvelopeV2;
}

export function canonicalizeAtlasNotesContent(
  value: unknown,
): AtlasNotesEnvelope {
  return canonicalizeEnvelope(inspectEnvelope(value));
}

function projectInline(
  content: AtlasNotesInline[] | undefined,
  version: AtlasNotesVersion,
) {
  return (
    content
      ?.map((node) => {
        if (node.type === 'text') return node.text;
        if (version === 2 && node.type === 'mathInline')
          return node.attrs.latex;
        return '';
      })
      .join('') ?? ''
  );
}

function projectParagraphs(
  content: AtlasNotesParagraph[],
  version: AtlasNotesVersion,
) {
  return content
    .map((paragraph) => projectInline(paragraph.content, version))
    .join('\n');
}

function projectListItem(
  item: AtlasNotesListItem | AtlasNotesTaskItem,
  version: AtlasNotesVersion,
): string {
  return [
    projectInline(item.content[0].content, version),
    ...(item.content.slice(1) as AtlasNotesNestedList[]).map((list) =>
      projectList(list, version),
    ),
  ].join('\n');
}

function projectList(list: AtlasNotesNestedList, version: AtlasNotesVersion): string {
  return list.content.map((item) => projectListItem(item, version)).join('\n');
}

function projectBlockV1(block: AtlasNotesBlock): string {
  if (block.type === 'paragraph' || block.type === 'heading') {
    return projectInline(block.content, 1);
  }
  if (block.type === 'bulletList' || block.type === 'orderedList') {
    return block.content
      .map((item) => projectListItem(item, 1))
      .join('\n');
  }
  if (block.type === 'blockquote') return projectParagraphs(block.content, 1);
  fail('INVALID_NODE', 'Tipo de bloco v1 não permitido.', 'content.doc');
}

function projectBlockV2(block: AtlasNotesBlock): string {
  if (block.type === 'paragraph' || block.type === 'heading') {
    return projectInline(block.content, 2);
  }
  if (
    block.type === 'bulletList' ||
    block.type === 'orderedList' ||
    block.type === 'taskList'
  ) {
    return block.content
      .map((item) => projectListItem(item, 2))
      .join('\n');
  }
  if (
    block.type === 'blockquote' ||
    block.type === 'callout' ||
    block.type === 'footnote'
  ) {
    return projectParagraphs(block.content, 2);
  }
  if (block.type === 'horizontalRule') return '';
  if (block.type === 'codeBlock') {
    return block.content?.map((node) => node.text).join('') ?? '';
  }
  if (block.type === 'mathBlock') return block.attrs.latex;
  return block.content
    .map((row) =>
      row.content.map((cell) => projectParagraphs(cell.content, 2)).join('\t'),
    )
    .join('\n');
}

function projectCanonicalContent(content: AtlasNotesEnvelope) {
  const projectBlock = content.version === 1 ? projectBlockV1 : projectBlockV2;
  return content.doc.content.map(projectBlock).join('\n').trim();
}

export function projectAtlasNotesBody(value: unknown) {
  return projectCanonicalContent(canonicalizeAtlasNotesContent(value));
}

export type AtlasNotesFavoriteEntry = {
  id: string;
  color: AtlasNotesMarkColor;
  createdAt: string;
  text: string;
};

function walkFavoriteInline(
  content: AtlasNotesInline[] | undefined,
  onText: (id: string, color: AtlasNotesMarkColor, createdAt: string, text: string) => void,
) {
  content?.forEach((node) => {
    if (node.type !== 'text' || !node.marks) return;
    const favorite = node.marks.find(
      (mark): mark is Extract<AtlasNotesMark, { type: 'favorite' }> =>
        mark.type === 'favorite',
    );
    if (!favorite) return;
    onText(favorite.attrs.id, favorite.attrs.color, favorite.attrs.createdAt, node.text);
  });
}

function walkFavoriteListItems(
  items: Array<AtlasNotesListItem | AtlasNotesTaskItem>,
  onText: Parameters<typeof walkFavoriteInline>[1],
) {
  items.forEach((item) => {
    const [paragraph, ...nested] = item.content;
    walkFavoriteInline(paragraph.content, onText);
    nested.forEach((list) => walkFavoriteBlocks([list], onText));
  });
}

function walkFavoriteBlocks(
  blocks: AtlasNotesBlock[],
  onText: Parameters<typeof walkFavoriteInline>[1],
) {
  blocks.forEach((block) => {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        walkFavoriteInline(block.content, onText);
        break;
      case 'bulletList':
      case 'orderedList':
        walkFavoriteListItems(block.content, onText);
        break;
      case 'taskList':
        walkFavoriteListItems(block.content, onText);
        break;
      case 'blockquote':
      case 'callout':
      case 'footnote':
        block.content.forEach((paragraph) =>
          walkFavoriteInline(paragraph.content, onText),
        );
        break;
      case 'table':
        block.content.forEach((row) =>
          row.content.forEach((cell) =>
            cell.content.forEach((paragraph) =>
              walkFavoriteInline(paragraph.content, onText),
            ),
          ),
        );
        break;
      default:
        break;
    }
  });
}

/**
 * Extrai todos os trechos favoritados de um documento canônico, na ordem em
 * que aparecem. O texto e a posição lógica sempre refletem o estado atual do
 * documento (nunca uma cópia congelada), já que o favorito é identificado
 * por um id estável (mark), não por uma posição bruta.
 */
export function extractAtlasNotesFavorites(
  doc: AtlasNotesDocument,
): AtlasNotesFavoriteEntry[] {
  const order: string[] = [];
  const byId = new Map<
    string,
    { color: AtlasNotesMarkColor; createdAt: string; parts: string[] }
  >();
  walkFavoriteBlocks(doc.content, (id, color, createdAt, text) => {
    let entry = byId.get(id);
    if (!entry) {
      entry = { color, createdAt, parts: [] };
      byId.set(id, entry);
      order.push(id);
    }
    entry.parts.push(text);
  });
  return order.map((id) => {
    const entry = byId.get(id)!;
    return {
      id,
      color: entry.color,
      createdAt: entry.createdAt,
      text: entry.parts.join(' ').trim(),
    };
  });
}

export function prepareAtlasNotesForSave(value: unknown) {
  const source = canonicalizeAtlasNotesContent(value);
  const content = canonicalizeAtlasNotesContentV2({
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc: source.doc,
  });
  const body = projectCanonicalContent(content);
  if (!body) {
    fail('EMPTY_CONTENT', 'Escreva o conteúdo da nota.', 'content.doc');
  }
  if (body.length > ATLAS_NOTES_LIMITS.visibleLength) {
    fail(
      'VISIBLE_LIMIT_EXCEEDED',
      'A nota excede o limite de 100 mil caracteres.',
      'content.doc',
    );
  }
  return {
    content,
    contentJson: JSON.stringify(content),
    body,
    characterCount: body.length,
  };
}

export function plainTextToAtlasNotesBlocks(
  body: string,
): AtlasNotesParagraph[] {
  return body
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      line
        ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
        : { type: 'paragraph' },
    );
}

export function legacyTextToAtlasNotesContent(
  body: string,
): AtlasNotesEnvelopeV2 {
  return {
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc: { type: 'doc', content: plainTextToAtlasNotesBlocks(body) },
  };
}

export function isAtlasNotesDocument(value: unknown) {
  try {
    canonicalizeAtlasNotesContentV2({
      format: ATLAS_NOTES_FORMAT,
      version: ATLAS_NOTES_VERSION,
      doc: value,
    });
    return true;
  } catch {
    return false;
  }
}
