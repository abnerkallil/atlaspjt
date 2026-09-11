// oxlint-disable react(react-compiler)
'use client';

import { useEffect, useMemo, useState } from 'react';
import { EditorContent, Extension, Mark, useEditor } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
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
  ATLAS_NOTES_VERSION,
  canonicalizeAtlasNotesContent,
  plainTextToAtlasNotesBlocks,
  projectAtlasNotesBody,
  type AtlasNotesEnvelope,
} from '@/lib/atlas-notes-document';
import {
  AtlasAdvancedNodes,
} from './notes-editor-extensions';
import styles from './notes-editor.module.css';

export type NotesEditorSnapshot = {
  body: string;
  characterCount: number;
  content: AtlasNotesEnvelope;
};

type NotesEditorProps = {
  initialContent: AtlasNotesEnvelope;
  onChange: (snapshot: NotesEditorSnapshot) => void;
  onValidationChange: (message: string) => void;
};

function envelopeFromDocument(doc: unknown) {
  return canonicalizeAtlasNotesContent({
    format: ATLAS_NOTES_FORMAT,
    version: ATLAS_NOTES_VERSION,
    doc,
  });
}

function createP0Guard(onRejected: (message: string) => void) {
  return Extension.create({
    name: 'atlasP0Guard',
    priority: 1_000,
    addKeyboardShortcuts() {
      const moveTableCell = (backward: boolean) => {
        const { doc, selection } = this.editor.state;
        const cells: number[] = [];
        doc.descendants((node, position) => {
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            cells.push(position);
          }
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
      return {
        Tab: () => {
          if (this.editor.isActive('listItem') || this.editor.isActive('taskItem')) {
            return true;
          }
          if (this.editor.isActive('tableCell') || this.editor.isActive('tableHeader')) {
            return moveTableCell(false);
          }
          return false;
        },
        'Shift-Tab': () => {
          if (this.editor.isActive('listItem') || this.editor.isActive('taskItem')) {
            return true;
          }
          if (this.editor.isActive('tableCell') || this.editor.isActive('tableHeader')) {
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

function isAllowedHref(value: string) {
  try {
    const protocol = new URL(value.trim()).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

function newInlineId(existing: Set<string>) {
  let id = `fn-${Date.now().toString(36)}`;
  let suffix = 1;
  while (existing.has(id)) id = `fn-${Date.now().toString(36)}-${suffix++}`;
  return id;
}

export function NotesEditor({
  initialContent,
  onChange,
  onValidationChange,
}: NotesEditorProps) {
  const [validationError, setValidationError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [inputDialog, setInputDialog] = useState<{
    kind: 'link' | 'mathInline' | 'mathBlock';
    currentHref?: string;
    position?: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const guard = useMemo(
    () => createP0Guard((message) => setValidationError(message)),
    [],
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
      inlineMark('highlight', 'mark'),
      inlineMark('comment', 'span'),
      inlineMark('code', 'code'),
      AtlasLink,
      TaskList,
      TaskItem.configure({ nested: false }),
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
        click: (_view, event) => {
          const target = event.target as HTMLElement | null;
          if (!target?.closest('a[data-atlas-link]')) return false;
          event.preventDefault();
          return true;
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
    if (!inputDialog) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setInputDialog(null);
      setInputError('');
      editor?.commands.focus();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const popover = document.querySelector('[data-atlas-input-popover]');
      if (popover?.contains(event.target as Node)) return;
      setInputDialog(null);
      setInputError('');
      editor?.commands.focus();
    };
    document.addEventListener('keydown', closeOnEscape, true);
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => {
      document.removeEventListener('keydown', closeOnEscape, true);
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
    };
  }, [editor, inputDialog]);

  if (!editor) {
    return <div className={styles.loading}>Preparando editor…</div>;
  }

  const run = (action: () => void) => {
    if (savedSelection) editor.commands.setTextSelection(savedSelection);
    editor.commands.focus();
    action();
    setMenuOpen(false);
  };
  const insertLatex = (type: 'mathInline' | 'mathBlock') => {
    setMenuOpen(false);
    setInputError('');
    setInputValue('x^2');
    setInputDialog({ kind: type });
  };
  const insertTable = () => {
    run(() => {
      editor.commands.insertContent({
        type: 'table',
        content: Array.from({ length: 3 }, () => ({
          type: 'tableRow',
          content: Array.from({ length: 3 }, () => ({
            type: 'tableCell',
            content: [{ type: 'paragraph' }],
          })),
        })),
      });
    });
  };
  const insertFootnote = () => {
    const ids = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'footnote' || node.type.name === 'footnoteRef') {
        if (typeof node.attrs.id === 'string') ids.add(node.attrs.id);
      }
    });
    const id = newInlineId(ids);
    run(() => {
      editor.commands.insertContent({
        type: 'footnoteRef',
        attrs: { id },
      });
      editor.commands.insertContentAt(editor.state.doc.content.size, {
        type: 'footnote',
        attrs: { id },
        content: [{ type: 'paragraph' }],
      });
    });
  };
  const editLink = () => {
    const current = editor.getAttributes('link').href as string | undefined;
    setMenuOpen(false);
    setInputError('');
    setInputValue(current ?? 'https://');
    setInputDialog({ kind: 'link', currentHref: current });
  };
  const applyInputDialog = () => {
    if (!inputDialog) return;
    const value = inputValue.trim();
    if (inputDialog.kind === 'link') {
      const current = inputDialog.currentHref;
      const href = value;
      if (!href) {
        if (!current) {
          setInputDialog(null);
          return;
        }
        run(() => editor.commands.unsetMark('link'));
        setInputDialog(null);
        return;
      }
      if (!isAllowedHref(href)) {
        setInputError('Use um link http, https ou mailto válido.');
        return;
      }
      run(() => editor.commands.setMark('link', { href }));
      setInputDialog(null);
      return;
    }
    if (!value) {
      setInputError('Informe uma expressão LaTeX.');
      return;
    }
    run(() => {
      if (inputDialog.position !== undefined) {
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(inputDialog.position, undefined, {
            latex: value,
          }),
        );
      } else {
        editor.commands.insertContent({
          type: inputDialog.kind,
          attrs: { latex: value },
        });
      }
    });
    setInputDialog(null);
  };
  const marks = [
    { label: 'Negrito', name: 'bold', icon: Bold },
    { label: 'Itálico', name: 'italic', icon: Italic },
    { label: 'Riscado', name: 'strike', icon: Strikethrough },
    { label: 'Realce', name: 'highlight', icon: Highlighter },
    { label: 'Código inline', name: 'code', icon: Code },
    { label: 'Comentário inline', name: 'comment', icon: MessageSquare },
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
    { label: 'Equação inline', icon: Sigma, action: () => insertLatex('mathInline') },
    { label: 'Bloco de equação', icon: Sigma, action: () => insertLatex('mathBlock') },
    { label: 'Tabela', icon: Table2, action: insertTable },
    { label: 'Nota de rodapé', icon: Footprints, action: insertFootnote },
    { label: 'Callout', icon: Megaphone, action: () => run(() => editor.commands.insertContent({ type: 'callout', content: [{ type: 'paragraph' }] })) },
  ];
  return (
    <div className={styles.editorShell}>
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
              directNode?.type.name === 'mathInline' ||
              directNode?.type.name === 'mathBlock'
                ? domPosition
                : Math.max(0, domPosition - 1);
            const node = editor.state.doc.nodeAt(nodePosition);
            if (!node || (node.type.name !== 'mathInline' && node.type.name !== 'mathBlock'))
              return;
            event.preventDefault();
            setInputError('');
            setInputValue(node.attrs.latex);
            setInputDialog({
              kind: node.type.name,
              position: nodePosition,
            });
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
              {marks.map(({ label, name, icon: Icon }, index) => (
                <div key={name}>
                  {index === 4 && <ContextMenuSeparator />}
                  <ContextMenuItem
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
                </div>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem
                className={styles.menuItem}
                onClick={() =>
                  run(() => {
                    const chain = editor.chain();
                    marks.forEach((mark) => chain.unsetMark(mark.name));
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
                  <ContextMenuItem
                    className={styles.menuItem}
                    onClick={action}
                  >
                    <Icon />
                    <span>{label}</span>
                  </ContextMenuItem>
                </div>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      {inputDialog && (
        <dialog open
          className={styles.inputPopover}
          data-atlas-input-popover
          aria-label={inputDialog.kind === 'link' ? 'Inserir link' : 'Inserir equação'}
        >
          <form
          onSubmit={(event) => {
            event.preventDefault();
            applyInputDialog();
          }}
          >
          <label htmlFor="atlas-editor-input">
            {inputDialog.kind === 'link' ? 'URL do link' : 'Expressão LaTeX'}
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
      {validationError && (
        <p className={styles.validationError} role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
