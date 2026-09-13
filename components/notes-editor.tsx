// oxlint-disable react(react-compiler)
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EditorContent,
  Extension,
  Mark,
  mergeAttributes,
  useEditor,
} from '@tiptap/react';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import { Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Code,
  MessageSquare,
  Eraser,
  List,
  ListOrdered,
  ListTodo,
  Pilcrow,
  Quote,
  Heading,
  Paintbrush,
  Check,
  Link2,
  Minus,
  Code2,
  Sigma,
  Table2,
  Footprints,
  Megaphone,
  Plus,
  ListPlus,
  ListMinus,
  Columns3,
  Trash2,
  Star,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  ATLAS_NOTES_FORMAT,
  ATLAS_NOTES_LIMITS,
  ATLAS_NOTES_MARK_COLORS,
  ATLAS_NOTES_VERSION,
  canonicalizeAtlasNotesContent,
  plainTextToAtlasNotesBlocks,
  projectAtlasNotesBody,
  type AtlasNotesEnvelope,
  type AtlasNotesMarkColor,
} from '@/lib/atlas-notes-document';
import { AtlasAdvancedNodes } from './notes-editor-extensions';
import {
  canSinkListItemWithinDepth,
  maxNodeDepth,
} from './notes-editor-list-guard';
import styles from './notes-editor.module.css';

export type NotesEditorSnapshot = {
  body: string;
  characterCount: number;
  content: AtlasNotesEnvelope;
};

export type NotesEditorFocusRequest = {
  favoriteId: string;
  nonce: number;
};

type NotesEditorProps = {
  initialContent: AtlasNotesEnvelope;
  noteTitle: string;
  onChange: (snapshot: NotesEditorSnapshot) => void;
  onValidationChange: (message: string) => void;
  focusRequest?: NotesEditorFocusRequest | null;
  onFocusRequestHandled?: () => void;
};

export const MARK_COLOR_META: Record<
  AtlasNotesMarkColor,
  { label: string; hex: string }
> = {
  yellow: { label: 'Amarelo', hex: '#e3b431' },
  green: { label: 'Verde', hex: '#128864' },
  blue: { label: 'Azul-claro', hex: '#5f8ff7' },
  pink: { label: 'Rosa', hex: '#d1548a' },
  purple: { label: 'Roxo', hex: '#7c3aed' },
};

function findMarkRange(
  doc: PMNode,
  markName: string,
  matches: (attrs: Record<string, unknown>) => boolean,
): { from: number; to: number } | null {
  let from: number | null = null;
  let to: number | null = null;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const hasMatch = node.marks.some(
      (mark) => mark.type.name === markName && matches(mark.attrs),
    );
    if (!hasMatch) return;
    if (from === null) from = pos;
    to = pos + node.nodeSize;
  });
  return from !== null && to !== null ? { from, to } : null;
}

function collectMarkIds(doc: PMNode, markName: string): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (!node.isText) return;
    node.marks.forEach((mark) => {
      if (mark.type.name === markName && typeof mark.attrs.id === 'string') {
        ids.add(mark.attrs.id);
      }
    });
  });
  return ids;
}

function newStableId(existing: Set<string>, prefix: string) {
  let id = `${prefix}-${Date.now().toString(36)}`;
  let suffix = 1;
  while (existing.has(id)) id = `${prefix}-${Date.now().toString(36)}-${suffix++}`;
  return id;
}

function envelopeFromDocument(doc: unknown) {
  return canonicalizeAtlasNotesContent({
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc,
  });
}

function createP0Guard(
  onRejected: (message: string) => void,
  onListDepthLimit: () => void,
) {
  return Extension.create({
    name: 'atlasP0Guard',
    priority: 1_000,
    addKeyboardShortcuts() {
      const moveTableCell = (backward: boolean) => {
        const { doc, selection } = this.editor.state;
        const cells: number[] = [];
        doc.descendants((node, position) => {
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader')
            cells.push(position);
        });
        if (!cells.length) return false;
        let currentPosition = -1;
        for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
          const node = selection.$from.node(depth);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            currentPosition = selection.$from.before(depth);
            break;
          }
        }
        const currentIndex = Math.max(0, cells.indexOf(currentPosition));
        const offset = backward ? -1 : 1;
        const targetIndex = (currentIndex + offset + cells.length) % cells.length;
        const targetPosition = cells[targetIndex] + 2;
        this.editor.commands.setTextSelection({
          from: targetPosition,
          to: targetPosition,
        });
        this.editor.commands.focus();
        return true;
      };
      const sinkListItem = (itemType: 'listItem' | 'taskItem') => {
        const { $from } = this.editor.state.selection;
        let itemDepth = -1;
        for (let depth = $from.depth; depth > 0; depth -= 1) {
          const type = $from.node(depth).type.name;
          if (type === itemType) {
            itemDepth = depth;
            break;
          }
        }
        if (itemDepth < 0) return false;
        let listLevel = 0;
        for (let depth = itemDepth - 1; depth > 0; depth -= 1) {
          const type = $from.node(depth).type.name;
          if (type === 'bulletList' || type === 'orderedList' || type === 'taskList') {
            listLevel += 1;
          }
        }
        const item = $from.node(itemDepth);
        if (
          !canSinkListItemWithinDepth(
            listLevel,
            maxNodeDepth(item),
            ATLAS_NOTES_LIMITS.depth,
          )
        ) {
          onListDepthLimit();
          return true;
        }
        return this.editor.commands.sinkListItem(itemType);
      };
      return {
        Tab: () => {
          if (this.editor.isActive('taskItem')) {
            return sinkListItem('taskItem');
          }
          if (this.editor.isActive('listItem')) {
            return sinkListItem('listItem');
          }
          if (
            this.editor.isActive('tableCell') ||
            this.editor.isActive('tableHeader')
          ) {
            return moveTableCell(false);
          }
          return false;
        },
        'Shift-Tab': () => {
          if (this.editor.isActive('listItem') || this.editor.isActive('taskItem'))
            return true;
          if (
            this.editor.isActive('tableCell') ||
            this.editor.isActive('tableHeader')
          ) {
            return moveTableCell(true);
          }
          return false;
        },
        'Shift-Enter': () => this.editor.commands.splitBlock(),
      };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          filterTransaction: (transaction) => {
            if (!transaction.docChanged) return true;
            try {
              const content = envelopeFromDocument(transaction.doc.toJSON());
              const body = projectAtlasNotesBody(content);
              if (body.length > ATLAS_NOTES_LIMITS.visibleLength) {
                onRejected(
                  'Limite de 100 mil caracteres atingido. O excedente não foi inserido.',
                );
                return false;
              }
              return true;
            } catch (error) {
              onRejected(
                error instanceof Error
                  ? error.message
                  : 'A alteração não pertence ao formato permitido.',
              );
              return false;
            }
          },
        }),
      ];
    },
  });
}

const PlainTextPaste = Extension.create({
  name: 'atlasPlainTextPaste',
  priority: 1_100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const plainText = event.clipboardData?.getData('text/plain');
            if (plainText === undefined) return false;
            event.preventDefault();
            return this.editor.commands.insertContent(
              plainTextToAtlasNotesBlocks(plainText),
            );
          },
        },
      }),
    ];
  },
});

const inlineMark = (name: string, tag: string) =>
  Mark.create({
    name,
    excludes: '',
    parseHTML: () => [
      { tag: name === 'comment' ? 'span[data-atlas-comment]' : tag },
    ],
    renderHTML: () => [
      tag,
      name === 'comment' ? { 'data-atlas-comment': '' } : {},
      0,
    ],
  });

const AtlasLink = Mark.create({
  name: 'link',
  inclusive: false,
  addAttributes() {
    return { href: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'a[data-atlas-link]' }, { tag: 'a[href]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      {
        ...HTMLAttributes,
        'data-atlas-link': '',
        rel: 'noreferrer',
      },
      0,
    ];
  },
});

const AtlasHighlight = Mark.create({
  name: 'highlight',
  excludes: '',
  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-color') ?? 'yellow',
        renderHTML: (attrs: { color: string }) =>
          attrs.color && attrs.color !== 'yellow'
            ? { 'data-color': attrs.color }
            : {},
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'mark[data-atlas-highlight]' },
      { tag: 'mark:not([data-atlas-favorite])' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes, { 'data-atlas-highlight': '' }), 0];
  },
});

const AtlasFavorite = Mark.create({
  name: 'favorite',
  excludes: '',
  addAttributes() {
    return {
      id: { default: null },
      color: {
        default: 'yellow',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-color'),
        renderHTML: (attrs: { color: string }) => ({ 'data-color': attrs.color }),
      },
      createdAt: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'mark[data-atlas-favorite]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes, { 'data-atlas-favorite': '' }), 0];
  },
});

function isAllowedHref(value: string) {
  try {
    const protocol = new URL(value.trim()).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

function newInlineId(existing: Set<string>) {
  return newStableId(existing, 'fn');
}

type LinkPopoverState = {
  href: string;
  from: number;
  to: number;
  left: number;
  top: number;
};

type TableContextState = {
  tablePos: number;
  rowIndex: number;
  colIndex: number;
  left: number;
  top: number;
};

type TableCellJSON = {
  type: 'tableCell' | 'tableHeader';
  content: Array<{ type: 'paragraph'; content?: Array<{ type: 'text'; text: string }> }>;
};
type TableRowJSON = { type: 'tableRow'; content: TableCellJSON[] };
type TableJSON = { type: 'table'; content: TableRowJSON[] };

function markRangeAt(doc: PMNode, pos: number, name: string) {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  const parent = $pos.parent;
  const start = $pos.start($pos.depth);
  let offset = 0;
  let first: number | null = null;
  let last: number | null = null;
  for (let index = 0; index < parent.childCount; index += 1) {
    const child = parent.child(index);
    const childStart = start + offset;
    const hasMark =
      child.isText &&
      child.marks.some((mark) => mark.type.name === name);
    if (hasMark) {
      first ??= childStart;
      last = childStart + child.nodeSize;
    } else if (first !== null) break;
    offset += child.nodeSize;
  }
  return first !== null && last !== null ? { from: first, to: last } : null;
}

export function NotesEditor({
  initialContent,
  noteTitle,
  onChange,
  onValidationChange,
  focusRequest,
  onFocusRequestHandled,
}: NotesEditorProps) {
  const [validationError, setValidationError] = useState('');
  const [listDepthNotice, setListDepthNotice] = useState('');
  const listDepthNoticeTimer = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const linkPopoverTimer = useRef<number | null>(null);
  const [linkPopover, setLinkPopover] = useState<LinkPopoverState | null>(null);
  const [confirmHref, setConfirmHref] = useState<string | null>(null);
  const [inputDialog, setInputDialog] = useState<{
    kind: 'link' | 'mathInline' | 'mathBlock' | 'footnoteTitle';
    currentHref?: string;
    currentTitle?: string;
    position?: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [tableDialog, setTableDialog] = useState<{
    mode: 'insert' | 'addColumn';
    columns: number;
    rows: number;
    headers: string[];
    step: 'dimensions' | 'headers' | 'column';
  } | null>(null);
  const [tableContext, setTableContext] = useState<TableContextState | null>(null);
  const showListDepthNotice = useCallback(() => {
    setListDepthNotice('Profundidade máxima da lista atingida.');
  }, []);
  const guard = useMemo(
    () =>
      createP0Guard(
        (message) => setValidationError(message),
        showListDepthNotice,
      ),
    [showListDepthNotice],
  );
  useEffect(
    () => {
      if (!listDepthNotice) return;
      listDepthNoticeTimer.current = window.setTimeout(() => {
        setListDepthNotice('');
        listDepthNoticeTimer.current = null;
      }, 2_600);
      return () => {
        if (listDepthNoticeTimer.current !== null) {
          window.clearTimeout(listDepthNoticeTimer.current);
          listDepthNoticeTimer.current = null;
        }
      };
    },
    [listDepthNotice],
  );
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: {},
        hardBreak: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        horizontalRule: {},
        link: false,
        listKeymap: false,
        strike: {},
        trailingNode: false,
        underline: false,
      }),
      AtlasHighlight,
      AtlasFavorite,
      inlineMark('comment', 'span'),
      inlineMark('code', 'code'),
      AtlasLink,
      TaskList,
      TaskItem.configure({ nested: true }),
      ...AtlasAdvancedNodes,
      guard,
      PlainTextPaste,
    ],
    [guard],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: initialContent.doc,
    editorProps: {
      attributes: {
        class: styles.proseMirror,
        'aria-label': 'Texto da nota',
        'data-placeholder':
          'Escreva sua síntese, dúvida, exemplo ou raciocínio…',
        spellcheck: 'true',
      },
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement | null;
          const link = target?.closest('a[data-atlas-link]');
          const footnoteRef = target?.closest('[data-atlas-footnote-ref]');
          if (link) {
            event.preventDefault();
            return true;
          }
          if (footnoteRef) {
            event.preventDefault();
            const id = footnoteRef.getAttribute('data-value');
            if (!id) return true;
            let targetPosition: number | null = null;
            view.state.doc.descendants((node, position) => {
              if (targetPosition === null && node.type.name === 'footnote' && node.attrs.id === id)
                targetPosition = position + 2;
            });
            if (targetPosition !== null) {
              view.dispatch(
                view.state.tr.setSelection(
                  TextSelection.near(view.state.doc.resolve(targetPosition)),
                ),
              );
              view.focus();
              view.dispatch(view.state.tr.scrollIntoView());
            }
            return true;
          }
          return false;
        },
        mouseover: (view, event) => {
          const target = event.target as HTMLElement | null;
          const link = target?.closest('a[data-atlas-link]');
          if (!link || !view.dom.contains(link)) return false;
          if (linkPopoverTimer.current !== null) {
            window.clearTimeout(linkPopoverTimer.current);
            linkPopoverTimer.current = null;
          }
          const position = view.posAtDOM(link, 0);
          const range = markRangeAt(view.state.doc, position, 'link') ?? {
            from: view.state.selection.from,
            to: view.state.selection.to,
          };
          const shell = editorShellRef.current?.getBoundingClientRect();
          const rect = link.getBoundingClientRect();
          if (shell) {
            setLinkPopover({
              href: link.getAttribute('href') ?? '',
              from: range.from,
              to: range.to,
              left: Math.min(
                Math.max(8, rect.left - shell.left),
                Math.max(8, shell.width - 368),
              ),
              top: Math.min(
                Math.max(8, rect.bottom - shell.top + 6),
                Math.max(8, shell.height - 92),
              ),
            });
          }
          return false;
        },
        mouseout: (_view, event) => {
          const target = event.target as HTMLElement | null;
          const related = event.relatedTarget as HTMLElement | null;
          if (!target?.closest('a[data-atlas-link]') || related?.closest('a[data-atlas-link]'))
            return false;
          linkPopoverTimer.current = window.setTimeout(() => {
            setLinkPopover(null);
          }, 180);
          return false;
        },
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      try {
        const content = envelopeFromDocument(currentEditor.getJSON());
        const body = projectAtlasNotesBody(content);
        const snapshot = {
          content,
          body,
          characterCount: body.length,
        };
        setValidationError('');
        onValidationChange('');
        onChange(snapshot);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Estrutura inválida.';
        setValidationError(message);
        onValidationChange(message);
      }
    },
  });

  useEffect(() => {
    if (!editor || !menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      editor.commands.focus();
    };

    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [editor, menuOpen]);

  useEffect(() => {
    if (!editor) return;
    const updateTableContext = () => {
      const { $from } = editor.state.selection;
      let tableDepth = -1;
      let rowDepth = -1;
      let cellDepth = -1;
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const type = $from.node(depth).type.name;
        if (type === 'tableCell' || type === 'tableHeader') {
          cellDepth = depth;
        } else if (type === 'tableRow') {
          rowDepth = depth;
        } else if (type === 'table') {
          tableDepth = depth;
          break;
        }
      }
      if (tableDepth < 0 || rowDepth < 0 || cellDepth < 0) {
        setTableContext(null);
        return;
      }
      const table = $from.node(tableDepth);
      const row = $from.node(rowDepth);
      const cell = $from.node(cellDepth);
      let rowIndex = -1;
      table.forEach((child, _offset, index) => {
        if (child === row) rowIndex = index;
      });
      let colIndex = -1;
      row.forEach((child, _offset, index) => {
        if (child === cell) colIndex = index;
      });
      const cellPos = $from.before(cellDepth);
      const dom = editor.view.nodeDOM(cellPos) as HTMLElement | null;
      const shell = editorShellRef.current?.getBoundingClientRect();
      const rect = dom?.getBoundingClientRect();
      if (!shell || !rect || rowIndex < 0 || colIndex < 0) {
        setTableContext(null);
        return;
      }
      setTableContext({
        tablePos: $from.before(tableDepth),
        rowIndex,
        colIndex,
        left: Math.min(
          Math.max(8, rect.left - shell.left),
          Math.max(8, shell.width - 190),
        ),
        top: Math.min(
          Math.max(8, rect.top - shell.top - 38),
          Math.max(8, shell.height - 44),
        ),
      });
    };
    editor.on('selectionUpdate', updateTableContext);
    editor.on('transaction', updateTableContext);
    window.addEventListener('resize', updateTableContext);
    updateTableContext();
    return () => {
      editor.off('selectionUpdate', updateTableContext);
      editor.off('transaction', updateTableContext);
      window.removeEventListener('resize', updateTableContext);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const closeTransient = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setLinkPopover(null);
      setConfirmHref(null);
      setInputDialog(null);
      setTableDialog(null);
      setInputError('');
      editor.commands.focus();
    };
    const keepLinkPopover = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-atlas-link-popover]')) return;
      if (linkPopoverTimer.current !== null) {
        window.clearTimeout(linkPopoverTimer.current);
        linkPopoverTimer.current = null;
      }
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          '[data-atlas-link-popover], [data-atlas-link-confirm], [data-atlas-input-popover], [data-atlas-table-popover], a[data-atlas-link]',
        )
      )
        return;
      setLinkPopover(null);
      setConfirmHref(null);
      setInputDialog(null);
      setTableDialog(null);
    };
    document.addEventListener('keydown', closeTransient, true);
    document.addEventListener('pointerover', keepLinkPopover, true);
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => {
      document.removeEventListener('keydown', closeTransient, true);
      document.removeEventListener('pointerover', keepLinkPopover, true);
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onFootnoteEdit = (event: Event) => {
      const position = (event as CustomEvent<{ position: number }>).detail?.position;
      if (typeof position !== 'number') return;
      const node = editor.state.doc.nodeAt(position);
      if (!node || node.type.name !== 'footnote') return;
      setInputValue(node.firstChild?.textContent ?? '');
      setInputError('');
      setInputDialog({ kind: 'footnoteTitle', currentTitle: node.firstChild?.textContent ?? '', position });
    };
    editor.view.dom.addEventListener('atlas-footnote-edit', onFootnoteEdit);
    return () => editor.view.dom.removeEventListener('atlas-footnote-edit', onFootnoteEdit);
  }, [editor]);

  useEffect(() => {
    if (!editor || !focusRequest) return;
    const range = findMarkRange(
      editor.state.doc,
      'favorite',
      (attrs) => attrs.id === focusRequest.favoriteId,
    );
    if (range) {
      editor.chain().setTextSelection(range).focus().scrollIntoView().run();
    }
    onFocusRequestHandled?.();
    // Re-run whenever a new focus request comes in (identified by nonce),
    // even if it targets the same favorite id as before.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, focusRequest?.favoriteId, focusRequest?.nonce]);

  if (!editor) {
    return <div className={styles.loading}>Preparando editor…</div>;
  }

  const run = (action: () => void) => {
    if (savedSelection) editor.commands.setTextSelection(savedSelection);
    editor.commands.focus();
    action();
    setMenuOpen(false);
  };
  const applyHighlightColor = (color: AtlasNotesMarkColor) => {
    run(() => {
      editor
        .chain()
        .extendMarkRange('highlight')
        .setMark('highlight', { color })
        .run();
    });
  };
  const applyFavoriteColor = (color: AtlasNotesMarkColor) => {
    const existing = editor.getAttributes('favorite') as {
      id?: string;
      createdAt?: string;
    };
    const id =
      typeof existing.id === 'string'
        ? existing.id
        : newStableId(collectMarkIds(editor.state.doc, 'favorite'), 'fav');
    const createdAt =
      typeof existing.createdAt === 'string'
        ? existing.createdAt
        : new Date().toISOString();
    run(() => {
      editor
        .chain()
        .extendMarkRange('favorite')
        .setMark('favorite', { id, color, createdAt })
        .run();
    });
  };
  const openMathDialog = (kind: 'mathInline' | 'mathBlock', position?: number) => {
    const current = position === undefined ? '' : editor.state.doc.nodeAt(position)?.attrs.latex ?? '';
    setInputError('');
    setInputValue(current || 'x^2');
    setInputDialog({ kind, position });
    setMenuOpen(false);
  };
  const createFootnote = (humanTitle: string) => {
    const ids = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'footnote' || node.type.name === 'footnoteRef') {
        if (typeof node.attrs.id === 'string') ids.add(node.attrs.id);
      }
    });
    const id = newInlineId(ids);
    run(() => {
      editor.commands.insertContent({ type: 'footnoteRef', attrs: { id } });
      editor.commands.insertContentAt(editor.state.doc.content.size, {
        type: 'footnote',
        attrs: { id },
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: humanTitle }],
        }],
      });
    });
  };
  const insertFootnote = () => {
    const humanTitle = noteTitle.trim();
    if (!humanTitle) {
      setInputError('Informe o título da nota de rodapé.');
      setInputValue('');
      setInputDialog({ kind: 'footnoteTitle' });
      setMenuOpen(false);
      return;
    }
    createFootnote(humanTitle);
  };
  const editLink = () => {
    const current = editor.getAttributes('link').href as string | undefined;
    setMenuOpen(false);
    setInputError('');
    setInputValue(current ?? 'https://');
    setInputDialog({ kind: 'link', currentHref: current });
  };
  const replaceTable = (mutate: (table: TableJSON) => TableJSON) => {
    if (!tableContext) return;
    const current = editor.state.doc.nodeAt(tableContext.tablePos);
    if (!current || current.type.name !== 'table') return;
    const next = mutate(current.toJSON());
    const replacement = editor.schema.nodeFromJSON(next);
    editor.view.dispatch(
      editor.state.tr
        .replaceWith(
          tableContext.tablePos,
          tableContext.tablePos + current.nodeSize,
          replacement,
        )
        .scrollIntoView(),
    );
    editor.commands.focus();
  };
  const makeCell = (type: 'tableCell' | 'tableHeader', value = ''): TableCellJSON => ({
    type,
    content: [
      {
        type: 'paragraph',
        ...(value ? { content: [{ type: 'text', text: value }] } : {}),
      },
    ],
  });
  const insertConfiguredTable = (columns: number, rows: number, headers: string[]) => {
    run(() => {
      editor.commands.insertContent({
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: headers.map((header) => makeCell('tableHeader', header)),
          },
          ...Array.from({ length: rows }, () => ({
            type: 'tableRow',
            content: Array.from({ length: columns }, () => makeCell('tableCell')),
          })),
        ],
      });
    });
  };
  const addTableRow = () => {
    replaceTable((table) => {
      const columns = table.content?.[0]?.content?.length ?? 1;
      table.content.push({
        type: 'tableRow',
        content: Array.from({ length: columns }, () => makeCell('tableCell')),
      });
      return table;
    });
  };
  const removeTableRow = () => {
    if (!tableContext || tableContext.rowIndex === 0) return;
    replaceTable((table) => {
      if (table.content.length <= 1) return table;
      table.content.splice(tableContext.rowIndex, 1);
      return table;
    });
  };
  const addTableColumn = (title: string) => {
    replaceTable((table) => {
      table.content.forEach((row, index) => {
        row.content.push(makeCell(index === 0 ? 'tableHeader' : 'tableCell', index === 0 ? title : ''));
      });
      return table;
    });
  };
  const removeTableColumn = () => {
    if (!tableContext) return;
    replaceTable((table) => {
      const columns = table.content?.[0]?.content?.length ?? 1;
      if (columns <= 1) return table;
      table.content.forEach((row) => row.content.splice(tableContext.colIndex, 1));
      return table;
    });
  };
  const deleteTable = () => {
    if (!tableContext) return;
    const current = editor.state.doc.nodeAt(tableContext.tablePos);
    if (!current) return;
    editor.view.dispatch(
      editor.state.tr.delete(tableContext.tablePos, tableContext.tablePos + current.nodeSize).scrollIntoView(),
    );
    editor.commands.focus();
    setTableContext(null);
  };
  const applyInputDialog = () => {
    if (!inputDialog) return;
    const value = inputValue.trim();
    if (inputDialog.kind === 'link') {
      const current = inputDialog.currentHref;
      if (!value) {
        if (current) run(() => editor.commands.unsetMark('link'));
        setInputDialog(null);
        return;
      }
      if (!isAllowedHref(value)) {
        setInputError('Use um link http, https ou mailto válido.');
        return;
      }
      run(() => editor.commands.setMark('link', { href: value }));
      setInputDialog(null);
      return;
    }
    if (inputDialog.kind === 'footnoteTitle') {
      if (!value) {
        setInputError('Informe um título para a nota de rodapé.');
        return;
      }
      if (inputDialog.position !== undefined) {
        const node = editor.state.doc.nodeAt(inputDialog.position);
        const first = node?.firstChild;
        if (node?.type.name === 'footnote' && first) {
          const paragraph = editor.schema.nodes.paragraph.create(
            null,
            editor.schema.text(value),
          );
          editor.view.dispatch(
            editor.state.tr.replaceWith(
              inputDialog.position + 1,
              inputDialog.position + 1 + first.nodeSize,
              paragraph,
            ),
          );
        }
      } else {
        createFootnote(value);
      }
      setInputDialog(null);
      setInputError('');
      return;
    }
    if (!value) {
      setInputError('Informe uma expressão LaTeX.');
      return;
    }
    if (inputDialog.position !== undefined) {
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(inputDialog.position, undefined, { latex: value }),
      );
    } else {
      run(() => editor.commands.insertContent({ type: inputDialog.kind, attrs: { latex: value } }));
    }
    setInputDialog(null);
  };
  const openInsertTable = () => {
    setMenuOpen(false);
    setTableDialog({ mode: 'insert', columns: 3, rows: 3, headers: [], step: 'dimensions' });
  };
  const openAddTableColumn = () => {
    const columns =
      (tableContext && editor.state.doc.nodeAt(tableContext.tablePos)?.firstChild?.childCount) || 0;
    setTableDialog({ mode: 'addColumn', columns: columns + 1, rows: 1, headers: [''], step: 'column' });
  };
  const submitTableDialog = () => {
    if (!tableDialog) return;
    if (tableDialog.step === 'dimensions') {
      const columns = Math.max(1, Math.min(20, Math.floor(tableDialog.columns)));
      const rows = Math.max(1, Math.min(100, Math.floor(tableDialog.rows)));
      setTableDialog({ ...tableDialog, columns, rows, headers: Array.from({ length: columns }, () => ''), step: 'headers' });
      return;
    }
    if (tableDialog.mode === 'insert') {
      const headers = tableDialog.headers.map((header, index) => header.trim() || `Coluna ${index + 1}`);
      insertConfiguredTable(tableDialog.columns, tableDialog.rows, headers);
    } else {
      addTableColumn(tableDialog.headers[0]?.trim() || `Coluna ${tableDialog.columns}`);
    }
    setTableDialog(null);
  };
  const marks = [
    { label: 'Negrito', name: 'bold', icon: Bold },
    { label: 'Itálico', name: 'italic', icon: Italic },
    { label: 'Riscado', name: 'strike', icon: Strikethrough },
    { label: 'Código inline', name: 'code', icon: Code },
    { label: 'Comentário inline', name: 'comment', icon: MessageSquare },
  ];
  const clearableMarkNames = [
    ...marks.map((mark) => mark.name),
    'highlight',
    'favorite',
  ];
  const blocks = [
    { label: 'Lista de marcadores', name: 'bulletList', icon: List },
    { label: 'Lista numerada', name: 'orderedList', icon: ListOrdered },
    { label: 'Lista de tarefas', name: 'taskList', icon: ListTodo },
    ...([1, 2, 3, 4, 5, 6] as const).map((level) => ({
      label: `H${level}`,
      name: 'heading',
      level,
      icon: Heading,
    })),
    { label: 'Texto', name: 'paragraph', icon: Pilcrow },
    { label: 'Citação', name: 'blockquote', icon: Quote },
  ];
  const inserts = [
    { label: 'Link', icon: Link2, action: editLink },
    { label: 'Linha horizontal', icon: Minus, action: () => run(() => editor.commands.setHorizontalRule()) },
    { label: 'Bloco de código', icon: Code2, action: () => run(() => editor.commands.toggleCodeBlock()) },
    { label: 'Equação inline', icon: Sigma, action: () => openMathDialog('mathInline') },
    { label: 'Bloco de equação', icon: Sigma, action: () => openMathDialog('mathBlock') },
    { label: 'Tabela', icon: Table2, action: openInsertTable },
    { label: 'Nota de rodapé', icon: Footprints, action: insertFootnote },
    { label: 'Callout', icon: Megaphone, action: () => run(() => editor.commands.insertContent({ type: 'callout', content: [{ type: 'paragraph' }] })) },
  ];
  return (
    <div className={styles.editorShell} ref={editorShellRef}>
      <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <ContextMenuTrigger
          className={styles.contextTrigger}
          onDoubleClick={(event) => {
            const target = event.target as HTMLElement | null;
            const nodeElement = target?.closest(
              '[data-atlas-math-inline], [data-atlas-math-block]',
            );
            if (!nodeElement) return;
            const domPosition = editor.view.posAtDOM(nodeElement, 0);
            const directNode = editor.state.doc.nodeAt(domPosition);
            const nodePosition =
              directNode?.type.name === 'mathInline' || directNode?.type.name === 'mathBlock'
                ? domPosition
                : Math.max(0, domPosition - 1);
            const node = editor.state.doc.nodeAt(nodePosition);
            if (!node || (node.type.name !== 'mathInline' && node.type.name !== 'mathBlock')) return;
            event.preventDefault();
            openMathDialog(node.type.name, nodePosition);
          }}
          onContextMenuCapture={(event) => {
            const selection = editor.state.selection;
            if (!selection.empty) {
              setSavedSelection({
                from: selection.from,
                to: selection.to,
              });
              return;
            }

            const point = editor.view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            const position = point?.pos ?? selection.from;
            setSavedSelection({ from: position, to: position });
            editor.commands.setTextSelection({ from: position, to: position });
          }}
        >
          <EditorContent editor={editor} className={styles.editorSurface} />
        </ContextMenuTrigger>
        <ContextMenuContent
          className={styles.menu}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenuOpen(false);
              editor.commands.focus();
            }
          }}
          finalFocus={false}
        >
          <ContextMenuSub>
            <ContextMenuSubTrigger className={styles.menuItem}>
              <Paintbrush />
              Formatar
            </ContextMenuSubTrigger>
            <ContextMenuSubContent
              className={styles.menu}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setMenuOpen(false);
                  editor.commands.focus();
                }
              }}
            >
              <ContextMenuSub>
                <ContextMenuSubTrigger className={styles.menuItem}>
                  <Star />
                  <span>Favoritar texto</span>
                  {editor.isActive('favorite') && (
                    <Check className={styles.activeCheck} aria-label="Ativo" />
                  )}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className={styles.menu}>
                  {ATLAS_NOTES_MARK_COLORS.map((color) => (
                    <ContextMenuItem
                      key={color}
                      className={styles.menuItem}
                      onClick={() => applyFavoriteColor(color)}
                    >
                      <span
                        className={styles.colorSwatch}
                        style={{ background: MARK_COLOR_META[color].hex }}
                        aria-hidden="true"
                      />
                      <span>{MARK_COLOR_META[color].label}</span>
                      {editor.isActive('favorite', { color }) && (
                        <Check
                          className={styles.activeCheck}
                          aria-label="Ativo"
                        />
                      )}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              {marks.slice(0, 3).map(({ label, name, icon: Icon }) => (
                <ContextMenuItem
                  key={name}
                  className={styles.menuItem}
                  onClick={() =>
                    run(() => {
                      editor.chain().focus().toggleMark(name).run();
                    })
                  }
                >
                  <Icon />
                  <span>{label}</span>
                  {editor.isActive(name) && (
                    <Check
                      className={styles.activeCheck}
                      aria-label="Ativo"
                    />
                  )}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger className={styles.menuItem}>
                  <Highlighter />
                  <span>Realçar</span>
                  {editor.isActive('highlight') && (
                    <Check className={styles.activeCheck} aria-label="Ativo" />
                  )}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className={styles.menu}>
                  {ATLAS_NOTES_MARK_COLORS.map((color) => (
                    <ContextMenuItem
                      key={color}
                      className={styles.menuItem}
                      onClick={() => applyHighlightColor(color)}
                    >
                      <span
                        className={styles.colorSwatch}
                        style={{ background: MARK_COLOR_META[color].hex }}
                        aria-hidden="true"
                      />
                      <span>{MARK_COLOR_META[color].label}</span>
                      {editor.isActive('highlight', { color }) && (
                        <Check
                          className={styles.activeCheck}
                          aria-label="Ativo"
                        />
                      )}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              {marks.slice(3).map(({ label, name, icon: Icon }) => (
                <ContextMenuItem
                  key={name}
                  className={styles.menuItem}
                  onClick={() =>
                    run(() => {
                      editor.chain().focus().toggleMark(name).run();
                    })
                  }
                >
                  <Icon />
                  <span>{label}</span>
                  {editor.isActive(name) && (
                    <Check
                      className={styles.activeCheck}
                      aria-label="Ativo"
                    />
                  )}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem
                className={styles.menuItem}
                onClick={() =>
                  run(() => {
                    const chain = editor.chain();
                    clearableMarkNames.forEach((name) => chain.unsetMark(name));
                    chain.run();
                  })
                }
              >
                <Eraser />
                Limpar formatação
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger className={styles.menuItem}>
              <Pilcrow />
              Parágrafo
            </ContextMenuSubTrigger>
            <ContextMenuSubContent
              className={styles.menu}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setMenuOpen(false);
                  editor.commands.focus();
                }
              }}
            >
              {blocks.map(({ label, name, icon: Icon, ...attrs }, index) => {
                const level = 'level' in attrs ? attrs.level : undefined;
                const active =
                  editor.isActive(name, level ? { level } : undefined) &&
                  (name !== 'paragraph' ||
                    ![
                      'bulletList',
                      'orderedList',
                      'taskList',
                      'blockquote',
                    ].some((type) => editor.isActive(type)));
                return (
                  <div key={label}>
                    {(index === 3 || index === 10) && <ContextMenuSeparator />}
                    <ContextMenuItem
                      className={styles.menuItem}
                      onClick={() =>
                        run(() => {
                          const chain = editor.chain().clearNodes();
                          if (name === 'heading' && level)
                            chain.setHeading({ level });
                          else if (name === 'blockquote') chain.setBlockquote();
                          else if (name === 'bulletList')
                            chain.toggleBulletList();
                          else if (name === 'orderedList')
                            chain.toggleOrderedList();
                          else if (name === 'taskList')
                            chain.toggleList('taskList', 'taskItem');
                          else chain.setParagraph();
                          chain.run();
                        })
                      }
                    >
                      <Icon />
                      <span>{label}</span>
                      {active && (
                        <Check
                          className={styles.activeCheck}
                          aria-label="Ativo"
                        />
                      )}
                    </ContextMenuItem>
                  </div>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger className={styles.menuItem}>
              <Plus />
              Inserir
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className={styles.menu}>
              {/* oxlint-disable-next-line react(react-compiler) */}
              {inserts.map(({ label, icon: Icon, action }, index) => (
                <div key={label}>
                  {(index === 2 || index === 5) && <ContextMenuSeparator />}
                  <ContextMenuItem className={styles.menuItem} onClick={action}>
                    <Icon />
                    <span>{label}</span>
                  </ContextMenuItem>
                </div>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      {linkPopover && (
        <dialog open
          className={styles.linkPopover}
          data-atlas-link-popover
          style={{ left: linkPopover.left, top: linkPopover.top }}
        >
          <span className={styles.linkUrl} title={linkPopover.href}>{linkPopover.href}</span>
          <div className={styles.popoverActions}>
            <button
              type="button"
              onClick={() => {
                setSavedSelection({ from: linkPopover.from, to: linkPopover.to });
                setConfirmHref(linkPopover.href);
                setLinkPopover(null);
              }}
            >
              Abrir
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedSelection({ from: linkPopover.from, to: linkPopover.to });
                setInputValue(linkPopover.href);
                setInputError('');
                setInputDialog({ kind: 'link', currentHref: linkPopover.href });
                setLinkPopover(null);
              }}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedSelection({ from: linkPopover.from, to: linkPopover.to });
                run(() => editor.commands.unsetMark('link'));
                setLinkPopover(null);
              }}
            >
              Remover
            </button>
          </div>
        </dialog>
      )}
      {confirmHref && (
        <dialog open className={styles.confirmPopover} data-atlas-link-confirm>
          <strong>Você está prestes a abrir um link externo</strong>
          <span>{confirmHref}</span>
          <div className={styles.popoverActions}>
            <button type="button" onClick={() => setConfirmHref(null)}>Cancelar</button>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => {
                window.open(confirmHref, '_blank', 'noopener,noreferrer');
                setConfirmHref(null);
                editor.commands.focus();
              }}
            >
              Abrir link
            </button>
          </div>
        </dialog>
      )}
      {inputDialog && (
        <dialog open className={styles.inputPopover} data-atlas-input-popover>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyInputDialog();
            }}
          >
            <label htmlFor="atlas-editor-input">
              {inputDialog.kind === 'link'
                ? 'URL do link'
                : inputDialog.kind === 'footnoteTitle'
                  ? 'Título da nota de rodapé'
                  : 'Expressão LaTeX'}
            </label>
            <input
              id="atlas-editor-input"
              value={inputValue}
              autoFocus
              onChange={(event) => {
                setInputValue(event.target.value);
                setInputError('');
              }}
            />
            {inputError && <span className={styles.inputError}>{inputError}</span>}
            <div className={styles.inputActions}>
              <button
                type="button"
                onClick={() => {
                  setInputDialog(null);
                  setInputError('');
                  editor.commands.focus();
                }}
              >
                Cancelar
              </button>
              {inputDialog.kind === 'link' && inputDialog.currentHref && (
                <button
                  type="button"
                  onClick={() => {
                    run(() => editor.commands.unsetMark('link'));
                    setInputDialog(null);
                  }}
                >
                  Remover
                </button>
              )}
              <button type="submit" className={styles.primaryAction}>
                Aplicar
              </button>
            </div>
          </form>
        </dialog>
      )}
      {tableDialog && (
        <dialog open className={styles.inputPopover} data-atlas-table-popover>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitTableDialog();
            }}
          >
            {tableDialog.step === 'dimensions' && (
              <>
                <label htmlFor="atlas-table-columns">Quantidade de colunas</label>
                <input
                  id="atlas-table-columns"
                  type="number"
                  min={1}
                  max={20}
                  value={tableDialog.columns}
                  onChange={(event) => setTableDialog({ ...tableDialog, columns: Number(event.target.value) })}
                />
                <label htmlFor="atlas-table-rows">Linhas de dados</label>
                <input
                  id="atlas-table-rows"
                  type="number"
                  min={1}
                  max={100}
                  value={tableDialog.rows}
                  onChange={(event) => setTableDialog({ ...tableDialog, rows: Number(event.target.value) })}
                />
              </>
            )}
            {tableDialog.step === 'headers' && (
              <>
                <strong>Títulos das colunas</strong>
                {tableDialog.headers.map((header, index) => (
                  <input
                    key={index}
                    aria-label={`Título da coluna ${index + 1}`}
                    value={header}
                    placeholder={`Coluna ${index + 1}`}
                    onChange={(event) => {
                      const headers = [...tableDialog.headers];
                      headers[index] = event.target.value;
                      setTableDialog({ ...tableDialog, headers });
                    }}
                  />
                ))}
              </>
            )}
            {tableDialog.step === 'column' && (
              <>
                <label htmlFor="atlas-table-new-column">Título da nova coluna</label>
                <input
                  id="atlas-table-new-column"
                  value={tableDialog.headers[0] ?? ''}
                  onChange={(event) => setTableDialog({ ...tableDialog, headers: [event.target.value] })}
                />
              </>
            )}
            <div className={styles.inputActions}>
              <button type="button" onClick={() => setTableDialog(null)}>Cancelar</button>
              <button type="submit" className={styles.primaryAction}>
                {tableDialog.step === 'dimensions' ? 'Continuar' : 'Aplicar'}
              </button>
            </div>
          </form>
        </dialog>
      )}
      {tableContext && (
        <div
          className={styles.tableControls}
          style={{ left: tableContext.left, top: tableContext.top }}
          onMouseDown={(event) => event.preventDefault()}
          aria-label="Controles da tabela"
          role="toolbar"
          tabIndex={-1}
        >
          <button type="button" aria-label="Adicionar linha" onClick={addTableRow}><ListPlus /></button>
          <button type="button" aria-label="Remover linha" onClick={removeTableRow}><ListMinus /></button>
          <button type="button" aria-label="Adicionar coluna" onClick={openAddTableColumn}><Columns3 /></button>
          <button type="button" aria-label="Remover coluna" onClick={removeTableColumn}><Columns3 /></button>
          <button type="button" aria-label="Excluir tabela" onClick={deleteTable}><Trash2 /></button>
        </div>
      )}
      {validationError && (
        <p className={styles.validationError} role="alert">
          {validationError}
        </p>
      )}
      {listDepthNotice && (
        typeof document !== 'undefined' &&
        createPortal(
          <output
            className={styles.listDepthNotice}
            aria-live="polite"
            data-atlas-list-depth-notice
          >
            <strong>{listDepthNotice}</strong>
            <span>Não é possível criar outro subnível nesta lista.</span>
          </output>,
          document.body,
        )
      )}
    </div>
  );
}
