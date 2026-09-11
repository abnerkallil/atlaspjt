'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
      return {
        Tab: () =>
          this.editor.isActive('listItem') || this.editor.isActive('taskItem'),
        'Shift-Tab': () =>
          this.editor.isActive('listItem') || this.editor.isActive('taskItem'),
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

export function NotesEditor({
  initialContent,
  onChange,
  onValidationChange,
}: NotesEditorProps) {
  const [validationError, setValidationError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const guard = useMemo(
    () => createP0Guard((message) => setValidationError(message)),
    [],
  );
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        hardBreak: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        horizontalRule: false,
        link: false,
        listKeymap: false,
        strike: {},
        trailingNode: false,
        underline: false,
      }),
      inlineMark('highlight', 'mark'),
      inlineMark('comment', 'span'),
      inlineMark('code', 'code'),
      TaskList,
      TaskItem.configure({ nested: false }),
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

  if (!editor) {
    return <div className={styles.loading}>Preparando editor…</div>;
  }

  const run = (action: () => void) => {
    if (savedSelection.current)
      editor.commands.setTextSelection(savedSelection.current);
    editor.commands.focus();
    action();
    setMenuOpen(false);
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
  return (
    <div className={styles.editorShell}>
      <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <ContextMenuTrigger
          className={styles.contextTrigger}
          onContextMenuCapture={(event) => {
            const selection = editor.state.selection;
            if (!selection.empty) {
              savedSelection.current = {
                from: selection.from,
                to: selection.to,
              };
              return;
            }

            const point = editor.view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            const position = point?.pos ?? selection.from;
            savedSelection.current = { from: position, to: position };
            editor.commands.setTextSelection(savedSelection.current);
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
        </ContextMenuContent>
      </ContextMenu>
      {validationError && (
        <p className={styles.validationError} role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
