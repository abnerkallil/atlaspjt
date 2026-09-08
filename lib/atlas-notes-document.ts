export const ATLAS_NOTES_FORMAT = 'atlas-notes' as const;
export const ATLAS_NOTES_VERSION = 1 as const;

export const ATLAS_NOTES_LIMITS = {
  requestBytes: 1_310_720,
  structuredBytes: 1_048_576,
  depth: 8,
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

export type AtlasNotesMark = { type: 'bold' | 'italic' };
export type AtlasNotesText = {
  type: 'text';
  text: string;
  marks?: AtlasNotesMark[];
};
export type AtlasNotesParagraph = {
  type: 'paragraph';
  content?: AtlasNotesText[];
};
export type AtlasNotesHeading = {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 };
  content?: AtlasNotesText[];
};
export type AtlasNotesListItem = {
  type: 'listItem';
  content: [AtlasNotesParagraph];
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
export type AtlasNotesBlockquote = {
  type: 'blockquote';
  content: AtlasNotesParagraph[];
};
export type AtlasNotesBlock =
  | AtlasNotesParagraph
  | AtlasNotesHeading
  | AtlasNotesBulletList
  | AtlasNotesOrderedList
  | AtlasNotesBlockquote;
export type AtlasNotesDocument = {
  type: 'doc';
  content: AtlasNotesBlock[];
};
export type AtlasNotesEnvelope = {
  format: typeof ATLAS_NOTES_FORMAT;
  version: typeof ATLAS_NOTES_VERSION;
  doc: AtlasNotesDocument;
};

type UnknownRecord = Record<string, unknown>;

const encoder = new TextEncoder();
const markRank = { bold: 0, italic: 1 } as const;

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

function canonicalizeMarks(
  value: unknown,
  path: string,
): AtlasNotesMark[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    fail('INVALID_MARK', 'Marcas de texto inválidas.', path);
  }
  const seen = new Set<AtlasNotesMark['type']>();
  const marks = value.map((candidate, index) => {
    const markPath = `${path}[${index}]`;
    const mark = asRecord(candidate, markPath);
    assertKeys(mark, ['type'], markPath);
    if (mark.type !== 'bold' && mark.type !== 'italic') {
      fail('INVALID_MARK', 'Marca de texto não permitida.', markPath);
    }
    const type: AtlasNotesMark['type'] = mark.type;
    if (seen.has(type)) {
      fail('INVALID_MARK', 'Marca de texto duplicada.', markPath);
    }
    seen.add(type);
    return { type };
  });
  if (!marks.length) return undefined;
  return marks.sort((a, b) => markRank[a.type] - markRank[b.type]);
}

function sameMarks(
  left: AtlasNotesMark[] | undefined,
  right: AtlasNotesMark[] | undefined,
) {
  if (left === undefined || right === undefined) return left === right;
  return (
    left.length === right.length &&
    left.every((mark, index) => mark.type === right[index]?.type)
  );
}

function canonicalizeText(value: unknown, path: string): AtlasNotesText {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'text', 'marks'], path);
  if (node.type !== 'text' || typeof node.text !== 'string' || !node.text) {
    fail('INVALID_NODE', 'Nó de texto inválido.', path);
  }
  const marks = canonicalizeMarks(node.marks, `${path}.marks`);
  return marks
    ? { type: 'text', text: node.text, marks }
    : { type: 'text', text: node.text };
}

function canonicalizeInlineContent(
  value: unknown,
  path: string,
): AtlasNotesText[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    fail('INVALID_NODE', 'Conteúdo textual inválido.', path);
  }
  const result: AtlasNotesText[] = [];
  value.forEach((candidate, index) => {
    const next = canonicalizeText(candidate, `${path}[${index}]`);
    const previous = result.at(-1);
    if (previous && sameMarks(previous.marks, next.marks)) {
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
): AtlasNotesParagraph {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (node.type !== 'paragraph') {
    fail('INVALID_NODE', 'Era esperado um parágrafo.', path);
  }
  const content = canonicalizeInlineContent(node.content, `${path}.content`);
  return content ? { type: 'paragraph', content } : { type: 'paragraph' };
}

function canonicalizeListItem(
  value: unknown,
  path: string,
): AtlasNotesListItem {
  const node = asRecord(value, path);
  assertKeys(node, ['type', 'content'], path);
  if (
    node.type !== 'listItem' ||
    !Array.isArray(node.content) ||
    node.content.length !== 1
  ) {
    fail(
      'INVALID_NODE',
      'Cada item de lista deve conter exatamente um parágrafo.',
      path,
    );
  }
  return {
    type: 'listItem',
    content: [canonicalizeParagraph(node.content[0], `${path}.content[0]`)],
  };
}

function canonicalizeBlock(value: unknown, path: string): AtlasNotesBlock {
  const node = asRecord(value, path);
  if (node.type === 'paragraph') return canonicalizeParagraph(node, path);

  if (node.type === 'heading') {
    assertKeys(node, ['type', 'attrs', 'content'], path);
    const attrs = asRecord(node.attrs, `${path}.attrs`);
    assertKeys(attrs, ['level'], `${path}.attrs`);
    if (attrs.level !== 1 && attrs.level !== 2 && attrs.level !== 3) {
      fail(
        'INVALID_NODE',
        'Nível de título não permitido.',
        `${path}.attrs.level`,
      );
    }
    const content = canonicalizeInlineContent(node.content, `${path}.content`);
    return content
      ? { type: 'heading', attrs: { level: attrs.level }, content }
      : { type: 'heading', attrs: { level: attrs.level } };
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
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
      canonicalizeListItem(item, `${path}.content[${index}]`),
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
    return {
      type: 'orderedList',
      attrs: { start: 1, type: null },
      content,
    };
  }

  if (node.type === 'blockquote') {
    assertKeys(node, ['type', 'content'], path);
    if (!Array.isArray(node.content) || !node.content.length) {
      fail(
        'INVALID_NODE',
        'Uma citação precisa ter ao menos um parágrafo.',
        path,
      );
    }
    return {
      type: 'blockquote',
      content: node.content.map((paragraph, index) =>
        canonicalizeParagraph(paragraph, `${path}.content[${index}]`),
      ),
    };
  }

  fail('INVALID_NODE', 'Tipo de bloco não permitido.', path);
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

export function canonicalizeAtlasNotesContent(
  value: unknown,
): AtlasNotesEnvelope {
  const envelope = asRecord(value, 'content');
  assertKeys(envelope, ['format', 'version', 'doc'], 'content');
  if (
    envelope.format !== ATLAS_NOTES_FORMAT ||
    envelope.version !== ATLAS_NOTES_VERSION
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
  const doc = asRecord(envelope.doc, 'content.doc');
  assertKeys(doc, ['type', 'content'], 'content.doc');
  if (
    doc.type !== 'doc' ||
    !Array.isArray(doc.content) ||
    !doc.content.length
  ) {
    fail('INVALID_NODE', 'Documento de nota inválido.', 'content.doc');
  }

  return {
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc: {
      type: 'doc',
      content: doc.content.map((block, index) =>
        canonicalizeBlock(block, `content.doc.content[${index}]`),
      ),
    },
  };
}

function projectInline(content: AtlasNotesText[] | undefined) {
  return content?.map((node) => node.text).join('') ?? '';
}

function projectBlock(block: AtlasNotesBlock): string {
  if (block.type === 'paragraph' || block.type === 'heading') {
    return projectInline(block.content);
  }
  if (block.type === 'bulletList' || block.type === 'orderedList') {
    return block.content
      .map((item) => projectInline(item.content[0].content))
      .join('\n');
  }
  return block.content
    .map((paragraph) => projectInline(paragraph.content))
    .join('\n');
}

export function projectAtlasNotesBody(value: unknown) {
  const content = canonicalizeAtlasNotesContent(value);
  return content.doc.content.map(projectBlock).join('\n').trim();
}

export function prepareAtlasNotesForSave(value: unknown) {
  const content = canonicalizeAtlasNotesContent(value);
  const body = content.doc.content.map(projectBlock).join('\n').trim();
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
): AtlasNotesEnvelope {
  return {
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc: {
      type: 'doc',
      content: plainTextToAtlasNotesBlocks(body),
    },
  };
}

export function isAtlasNotesDocument(value: unknown) {
  try {
    canonicalizeAtlasNotesContent({
      format: ATLAS_NOTES_FORMAT,
      version: ATLAS_NOTES_VERSION,
      doc: value,
    });
    return true;
  } catch {
    return false;
  }
}
